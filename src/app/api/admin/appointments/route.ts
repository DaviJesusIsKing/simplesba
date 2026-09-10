import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireOldPendings, lockAppointmentDay, reservationDeadline } from "@/lib/appointments";
import { sendTelegramAlert } from "@/lib/telegram";
import { getAdminSession, isValidDateISO, isValidTime, sanitizeText, validateImageOrPdfDataUrl } from "@/lib/security";
import { brazilNow } from "@/lib/brazil-time";

function toMinutes(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) { return aStart < bEnd && bStart < aEnd; }

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await expireOldPendings();
  const items = await prisma.appointment.findMany({ orderBy: [{ date: "desc" }, { time: "asc" }], include: { service: true }, take: 100 });
  return NextResponse.json(items.map(({ receiptData, refundProofData, ...rest }) => ({ ...rest, hasReceipt: !!receiptData, hasRefundProof: !!refundProofData })));
}

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const serviceId = sanitizeText(body.serviceId, 100);
    const date = sanitizeText(body.date, 10);
    const time = sanitizeText(body.time, 5);
    const clientName = sanitizeText(body.clientName, 120);
    const clientPhone = sanitizeText(body.clientPhone, 30);
    if (!serviceId || !isValidDateISO(date) || !isValidTime(time) || !clientName || !clientPhone) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    const phoneDigits = clientPhone.replace(/\D/g, "");
    if (phoneDigits.length < 8 || phoneDigits.length > 15) return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
    if (date < brazilNow().dateStr) return NextResponse.json({ error: "Não é possível agendar no passado" }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      await expireOldPendings(tx);
      const est = await tx.establishment.findFirst();
      if (!est) throw new Error("Estabelecimento não encontrado");
      const service = await tx.service.findFirst({ where: { id: serviceId, establishmentId: est.id, active: true } });
      if (!service) throw new Error("Serviço inválido");
      const weekday = new Date(`${date}T12:00:00-03:00`).getUTCDay();
      const openDays = (est.openDays || "1,2,3,4,5,6").split(",").map((x) => x.trim()).filter(Boolean);
      if (openDays.length && !openDays.includes(String(weekday))) throw new Error("Barbearia fechada neste dia");
      const start = toMinutes(time);
      const duration = service.duration > 0 ? service.duration : 30;
      const end = start + duration;
      let open = est.openTime || "09:00", close = est.closeTime || "19:00";
      try {
        const custom = (JSON.parse(est.hoursByDay || "{}") as Record<string, { open?: string; close?: string }>)[String(weekday)];
        if (custom?.open && custom?.close) { open = custom.open; close = custom.close; }
      } catch {}
      if (start < toMinutes(open) || end > toMinutes(close)) throw new Error("Esse serviço não cabe neste horário");
      if (date === brazilNow().dateStr && start <= brazilNow().nowMin) throw new Error("Escolha um horário futuro");
      if (est.lunchEnabled) {
        const ls = toMinutes(est.lunchStart || "12:00"), le = toMinutes(est.lunchEnd || "13:00");
        if (le > ls && overlaps(start, end, ls, le)) throw new Error("Horário de almoço");
      }
      const existing = await (async () => {
        await lockAppointmentDay(tx, est.id, date);
        return tx.appointment.findMany({ where: { establishmentId: est.id, date, status: { in: ["pending", "confirmed", "done"] } }, include: { service: { select: { duration: true } } } });
      })();
      for (const e of existing) {
        const bStart = toMinutes(e.time), bEnd = bStart + (e.service.duration > 0 ? e.service.duration : 30);
        if (overlaps(start, end, bStart, bEnd)) throw new Error("Horário conflita com outro agendamento");
      }
      let method = body.paymentMethod === "pix" ? "pix" : "local";
      if (est.paymentPolicy === "pix_only") method = "pix";
      if (est.paymentPolicy === "local_only") method = "local";
      const pct = Math.min(100, Math.max(1, est.pixChargePercent || 50));
      const amountDue = method === "pix" && est.pixChargeMode === "half" && body.pixAmount === "half"
        ? Math.round(service.price * pct) / 100 : service.price;
      const st = body.status === "pending" ? "pending" : "confirmed";
      const apt = await tx.appointment.create({ data: {
        clientName, clientPhone, clientPhoneDigits: phoneDigits, date, time, status: st,
        paymentMethod: method, paymentStatus: method === "pix" ? "awaiting_receipt" : "unpaid",
        amountDue: Math.round(amountDue * 100) / 100, expiresAt: st === "pending" ? reservationDeadline() : null,
        serviceId: service.id, establishmentId: est.id,
      }, include: { service: true } });
      return apt;
    }, { isolationLevel: "Serializable", maxWait: 5000, timeout: 10000 });

    void sendTelegramAlert(`Agendamento pelo barbeiro\n\n${result.clientName}\n${result.clientPhone}\n${result.service.name}\n${result.date} às ${result.time}\nStatus: ${result.status}`, { path: "/p-x7k9qm2/agendamentos", buttonLabel: "Abrir agendamentos" });
    return NextResponse.json({ ok: true, appointment: result });
  } catch (e) {
    console.error("admin appointment create error:", e);
    const message = e instanceof Error ? e.message : "Erro ao criar agendamento";
    return NextResponse.json({ error: message.includes("conflita") ? "Horário já ocupado" : message }, { status: message.includes("conflita") ? 409 : 400 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = req.nextUrl.searchParams.get("id");
    const body = await req.json();
    const nextStatus = sanitizeText(body.status, 20);
    if (!id || !["pending", "confirmed", "cancelled", "done"].includes(nextStatus)) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    const current = await prisma.appointment.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    const validTransitions: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["done", "cancelled"],
      done: [], cancelled: [], expired: [],
    };
    if (current.status !== nextStatus && !validTransitions[current.status]?.includes(nextStatus)) return NextResponse.json({ error: `Transição inválida: ${current.status} → ${nextStatus}` }, { status: 409 });

    const data: { status: string; expiresAt?: null; refundProofData?: string | null; refundNote?: string | null } = { status: nextStatus };
    if (nextStatus === "confirmed" || nextStatus === "done" || nextStatus === "cancelled") data.expiresAt = null;
    if (nextStatus === "cancelled") {
      if (body.refundProofData) {
        const proof = validateImageOrPdfDataUrl(body.refundProofData);
        if (!proof) return NextResponse.json({ error: "Comprovante de reembolso inválido" }, { status: 400 });
        data.refundProofData = proof;
      }
      if (body.refundNote != null) data.refundNote = sanitizeText(body.refundNote, 300);
    }
    const item = await prisma.appointment.update({ where: { id }, data, include: { service: true } });
    return NextResponse.json(item);
  } catch (e) {
    console.error("admin appointment update error:", e);
    return NextResponse.json({ error: "Erro ao atualizar agendamento" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
