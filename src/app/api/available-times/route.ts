import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireOldPendings } from "@/lib/appointments";
import { brazilNow } from "@/lib/brazil-time";

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

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

type DayHours = { open: string; close: string; open2?: string; close2?: string };

function resolveWindows(
  est: { openTime: string; closeTime: string; hoursByDay?: string | null },
  weekday: number
): DayHours[] {
  const fallback: DayHours = {
    open: est.openTime || "09:00",
    close: est.closeTime || "19:00",
  };
  try {
    const map = JSON.parse(est.hoursByDay || "{}") as Record<string, DayHours>;
    const custom = map[String(weekday)];
    if (custom?.open && custom?.close) {
      const windows: DayHours[] = [{ open: custom.open, close: custom.close }];
      if (custom.open2 && custom.close2) {
        windows.push({ open: custom.open2, close: custom.close2 });
      }
      return windows;
    }
  } catch {
    // ignore
  }
  return [fallback];
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

    const weekday = new Date(`${date}T12:00:00-03:00`).getUTCDay();

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

    const windows = resolveWindows(est, weekday);
    const all = windows.flatMap((w) => buildSlots(w.open, w.close, 30));
    const uniqueAll = [...new Set(all)].sort();

    let duration = 30;
    if (serviceId) {
      const svc = await prisma.service.findFirst({
        where: { id: serviceId, active: true },
      });
      if (svc?.duration && svc.duration > 0) duration = svc.duration;
    }

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

    const br = brazilNow();
    const todayStr = br.dateStr;
    const nowMin = br.nowMin;

    const lunchOn = !!(est as { lunchEnabled?: boolean }).lunchEnabled;
    const lunchStartMin = toMinutes((est as { lunchStart?: string }).lunchStart || "12:00");
    const lunchEndMin = toMinutes((est as { lunchEnd?: string }).lunchEnd || "13:00");

    const times = uniqueAll.filter((slot) => {
      const start = toMinutes(slot);
      const end = start + duration;
      const inWindow = windows.some((w) => {
        const openM = toMinutes(w.open);
        const closeM = toMinutes(w.close);
        return start >= openM && end <= closeM;
      });
      if (!inWindow) return false;
      if (date === todayStr && start <= nowMin) return false;
      // horário de almoço
      if (lunchOn && lunchEndMin > lunchStartMin) {
        if (overlaps(start, end, lunchStartMin, lunchEndMin)) return false;
      }
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
      openTime: normTime(windows[0]?.open || "09:00"),
      closeTime: normTime(windows[windows.length - 1]?.close || "19:00"),
      weekday,
    });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Erro";
    return NextResponse.json({ times: [], error: msg }, { status: 500 });
  }
}
