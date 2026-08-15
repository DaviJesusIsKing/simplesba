import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function buildSlots(open: string, close: string, step = 30): string[] {
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  const start = oh * 60 + (om || 0);
  const end = ch * 60 + (cm || 0);
  const slots: string[] = [];
  for (let m = start; m + step <= end; m += step) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return slots;
}

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get("date");
    if (!date) {
      return NextResponse.json({ error: "Data obrigatória" }, { status: 400 });
    }

    const est = await prisma.establishment.findFirst();
    if (!est) return NextResponse.json({ times: [], closed: true });

    // date is YYYY-MM-DD — get weekday in local interpretation
    const [y, m, d] = date.split("-").map(Number);
    const weekday = new Date(y, m - 1, d).getDay(); // 0=Dom ... 6=Sáb
    const openDays = (est.openDays || "1,2,3,4,5,6")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    if (!openDays.includes(String(weekday))) {
      return NextResponse.json({
        times: [],
        closed: true,
        message: "Barbearia fechada neste dia da semana",
      });
    }

    const all = buildSlots(est.openTime || "09:00", est.closeTime || "19:00");
    const taken = await prisma.appointment.findMany({
      where: {
        establishmentId: est.id,
        date,
        status: { not: "cancelled" },
      },
      select: { time: true },
    });
    const takenSet = new Set(taken.map((t) => t.time));
    const times = all.filter((t) => !takenSet.has(t));
    return NextResponse.json({ times, closed: false });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ times: [], error: "Erro" }, { status: 500 });
  }
}
