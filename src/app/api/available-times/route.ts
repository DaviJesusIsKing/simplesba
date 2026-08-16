import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireOldPendings } from "@/lib/appointments";

function normTime(t: string): string {
  const parts = String(t).trim().split(":");
  const h = String(parseInt(parts[0] || "0", 10)).padStart(2, "0");
  const m = String(parseInt(parts[1] || "0", 10)).padStart(2, "0");
  return `${h}:${m}`;
}

function toMinutes(t: string): number {
  const [h, m] = normTime(t).split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(m: number): string {
  const hh = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function buildSlots(open: string, close: string, step = 30): string[] {
  const start = toMinutes(open);
  let end = toMinutes(close);
  if (end <= start) end = start + 8 * 60;
  const slots: string[] = [];
  for (let m = start; m + step <= end; m += step) {
    slots.push(fromMinutes(m));
  }
  return slots;
}

/** Dois intervalos [aStart,aEnd) e [bStart,bEnd) se sobrepõem */
function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get("date");
    const serviceId = req.nextUrl.searchParams.get("serviceId");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Data inválida", times: [] }, { status: 400 });
    }

    await expireOldPendings();
    const est = await prisma.establishment.findFirst();
    if (!est) {
      return NextResponse.json({
        times: [],
        closed: true,
        message: "Estabelecimento não configurado",
      });
    }

    const [y, mo, d] = date.split("-").map(Number);
    const weekday = new Date(y, mo - 1, d).getDay();

    let openDays = (est.openDays || "0,1,2,3,4,5,6")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    if (openDays.length === 0) {
      openDays = ["0", "1", "2", "3", "4", "5", "6"];
    }

    if (!openDays.includes(String(weekday))) {
      return NextResponse.json({
        times: [],
        closed: true,
        message: "Fechado neste dia da semana",
      });
    }

    const openTime = est.openTime || "09:00";
    const closeTime = est.closeTime || "19:00";
    const closeMin = toMinutes(closeTime);
    const all = buildSlots(openTime, closeTime, 30);

    // duração do serviço selecionado (padrão 30)
    let duration = 30;
    if (serviceId) {
      const svc = await prisma.service.findFirst({
        where: { id: serviceId, active: true },
      });
      if (svc?.duration && svc.duration > 0) duration = svc.duration;
    }

    // agendamentos do dia (com duração de cada serviço)
    let booked: { time: string; duration: number }[] = [];
    try {
      const rows = await prisma.appointment.findMany({
        where: {
          establishmentId: est.id,
          date,
          status: { in: ["pending", "confirmed", "done"] },
        },
        include: { service: { select: { duration: true } } },
      });
      booked = rows.map((r) => ({
        time: normTime(r.time),
        duration: r.service?.duration && r.service.duration > 0 ? r.service.duration : 30,
      }));
    } catch (err) {
      console.error("appointment query:", err);
    }

    // agora (servidor) — bloqueia horários já passados no dia de hoje
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const times = all.filter((slot) => {
      const start = toMinutes(slot);
      const end = start + duration;
      // não pode passar do horário de fechamento
      if (end > closeMin) return false;
      // no dia de hoje, não oferece horário que já passou (margem 0 min)
      if (date === todayStr && start <= nowMin) return false;
      // não pode cruzar com nenhum agendamento existente
      for (const b of booked) {
        const bStart = toMinutes(b.time);
        const bEnd = bStart + b.duration;
        if (overlaps(start, end, bStart, bEnd)) return false;
      }
      return true;
    });

    return NextResponse.json({
      times,
      closed: false,
      duration,
      openTime: normTime(openTime),
      closeTime: normTime(closeTime),
      weekday,
    });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Erro";
    return NextResponse.json({ times: [], error: msg }, { status: 500 });
  }
}
