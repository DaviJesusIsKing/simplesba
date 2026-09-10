import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireOldPendings, lockAppointmentDay, reservationDeadline } from "@/lib/appointments";
import { sendTelegramAlert } from "@/lib/telegram";
import { appointmentAccessToken, isValidDateISO, isValidTime, sanitizeText } from "@/lib/security";
import { brazilNow } from "@/lib/brazil-time";

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}
function getWeekday(dateStr: string) {
  return new Date(`${dateStr}T12:00:00-03:00`).getUTCDay();
}
function getDayHours(est: { openTime: string; closeTime: string; hoursByDay: string | null }, weekday: number) {
  let open = est.openTime || "09:00";
  let close = est.closeTime || "19:00";
  try {
    const map = JSON.parse(est.hoursByDay || "{}") as Record<string, { open?: string; close?: string }>;
    const custom = map[String(weekday)];
    if (custom?.open && custom?.close && isValidTime(custom.open) && isValidTime(custom.close)) {
      open = custom.open;
      close = custom.close;
    }
  } catch {}
  return { open, close };
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
      return NextResponse.json({ error: "NEXTAUTH_SECRET não configurado corretamente" }, { status: 500 });
    }
    const body = await req.json();
    const serviceId = sanitizeText(body.serviceId, 100);
    const date = sanitizeText(body.date, 10);
    const time = sanitizeText(body.time, 5);
    const clientName = sanitizeText(body.clientName, 120);
    const clientPhone = sanitizeText(body.clientPhone, 30);

    if (!serviceId || !isValidDateISO(date) || !isValidTime(time) || !clientName || !clientPhone) {
      return NextResponse.json({ error: "Dados de agendamento inválidos" }, { status: 400 });
    }
    const phoneDigits = clientPhone.replace(/\D/g, "");
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      return NextResponse.json({ error: "Informe um telefone válido" }, { status: 400 });
    }

    const today = brazilNow();
    if (date < today.dateStr) return NextResponse.json({ error: "Não é possível agendar no passado" }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      await expireOldPendings(tx);
      const est = await tx.establishment.findFirst();
      if (!est) throw new Error("Estabelecimento não encontrado");

      const policy = est.paymentPolicy || "both";
      let method = String(body.paymentMethod || "local");
      if (policy === "pix_only") method = "pix";
      if (policy === "local_only") method = "local";
      if (method !== "pix" && method !== "local") method = "local";
      if (method === "pix" && !est.pixKey.trim()) throw new Error("PIX ainda não configurado pelo estabelecimento");

      const service = await tx.service.findFirst({ where: { id: serviceId, establishmentId: est.id, active: true } });
      if (!service) throw new Error("Serviço inválido ou inativo");

      const weekday = getWeekday(date);
      const openDays = (est.openDays || "1,2,3,4,5,6").split(",").map((x) => x.trim()).filter(Boolean);
      if (openDays.length && !openDays.includes(String(weekday))) throw new Error("Barbearia fechada neste dia");

      const { open, close } = getDayHours(est, weekday);
      const start = toMinutes(time);
      const duration = service.duration > 0 ? service.duration : 30;
      const end = start + duration;
      const openMin = toMinutes(open);
      const closeMin = toMinutes(close);
      if (start < openMin || end > closeMin) throw new Error("Esse serviço não cabe neste horário");

      if (date === today.dateStr && start <= today.nowMin) throw new Error("Escolha um horário futuro");

      if (est.lunchEnabled) {
        const ls = toMinutes(est.lunchStart || "12:00");
        const le = toMinutes(est.lunchEnd || "13:00");
        if (le > ls && overlaps(start, end, ls, le)) throw new Error("Horário de almoço. Escolha outro horário.");
      }

      // Critical section: all availability checks + create share one DB lock.
      await lockAppointmentDay(tx, est.id, date);
      const existing = await tx.appointment.findMany({
        where: { establishmentId: est.id, date, status: { in: ["pending", "confirmed", "done"] } },
        include: { service: { select: { duration: true } } },
      });
      for (const e of existing) {
        const bStart = toMinutes(e.time);
        const bEnd = bStart + (e.service.duration > 0 ? e.service.duration : 30);
        if (overlaps(start, end, bStart, bEnd)) throw new Error("Horário conflita com outro agendamento");
      }

      const pct = Math.min(100, Math.max(1, est.pixChargePercent || 50));
      const choice = String(body.pixAmount || "full");
      let amountDue = service.price;
      if (method === "pix" && est.pixChargeMode === "half" && choice === "half") {
        amountDue = Math.round(service.price * pct) / 100;
      }
      amountDue = Math.round(amountDue * 100) / 100;

      const apt = await tx.appointment.create({
        data: {
          clientName,
          clientPhone,
          clientPhoneDigits: phoneDigits,
          date,
          time,
          status: "pending",
          paymentMethod: method,
          paymentStatus: method === "pix" ? "awaiting_receipt" : "unpaid",
          amountDue,
          expiresAt: reservationDeadline(),
          serviceId: service.id,
          establishmentId: est.id,
        },
        include: { service: true },
      });
      return { apt, est };
    }, { isolationLevel: "Serializable", maxWait: 5000, timeout: 10000 });

    const accessToken = appointmentAccessToken(result.apt.id, result.apt.clientPhone);
    const payLabel = result.apt.paymentMethod === "pix" ? `PIX R$ ${result.apt.amountDue.toFixed(2)}` : "Pagar na hora";
    void sendTelegramAlert(
      `NOVO AGENDAMENTO\n\n${result.apt.clientName}\n${result.apt.clientPhone}\n${result.apt.service.name}\n${result.apt.date} às ${result.apt.time}\n${payLabel}\n\nAbra o painel para confirmar.`,
      { path: "/p-x7k9qm2/agendamentos", buttonLabel: "Abrir agendamentos" }
    );

    return NextResponse.json({ ok: true, appointment: { ...result.apt, accessToken } });
  } catch (e: unknown) {
    console.error("appointment create error:", e);
    const message = e instanceof Error ? e.message : "Erro ao agendar";
    if (message.includes("conflita") || message.includes("Horário já ocupado")) {
      return NextResponse.json({ error: "Horário já ocupado. Escolha outro." }, { status: 409 });
    }
    if (message.includes("não configurado") || message.includes("inválido") || message.includes("fechada") || message.includes("passado") || message.includes("futuro") || message.includes("almoço") || message.includes("cabe")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao agendar" }, { status: 500 });
  }
}
