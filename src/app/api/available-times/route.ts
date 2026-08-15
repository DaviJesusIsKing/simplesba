import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normTime(t: string): string {
  const parts = String(t).trim().split(":");
  const h = String(parseInt(parts[0] || "0", 10)).padStart(2, "0");
  const m = String(parseInt(parts[1] || "0", 10)).padStart(2, "0");
  return `${h}:${m}`;
}

function buildSlots(open: string, close: string, step = 30): string[] {
  const o = normTime(open);
  const c = normTime(close);
  const [oh, om] = o.split(":").map(Number);
  const [ch, cm] = c.split(":").map(Number);
  let start = oh * 60 + om;
  let end = ch * 60 + cm;
  if (end <= start) end = start + 8 * 60; // fallback 8h window
  const slots: string[] = [];
  for (let m = start; m + step <= end; m += step) {
    const hh = Math.floor(m / 60) % 24;
    const mm = m % 60;
    slots.push(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }
  return slots;
}

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Data inválida", times: [] }, { status: 400 });
    }

    const est = await prisma.establishment.findFirst();
    if (!est) {
      return NextResponse.json({ times: [], closed: true, message: "Estabelecimento não configurado" });
    }

    const [y, mo, d] = date.split("-").map(Number);
    const weekday = new Date(y, mo - 1, d).getDay(); // 0=Dom

    let openDays = (est.openDays || "0,1,2,3,4,5,6")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    // se vazio, libera todos os dias
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
    const all = buildSlots(openTime, closeTime, 30);

    let taken: { time: string }[] = [];
    try {
      taken = await prisma.appointment.findMany({
        where: {
          establishmentId: est.id,
          date,
          NOT: { status: "cancelled" },
        },
        select: { time: true },
      });
    } catch (err) {
      // tabela ainda não existe → ignora ocupados
      console.error("appointment query:", err);
    }

    const takenSet = new Set(taken.map((t) => normTime(t.time)));
    const times = all.filter((t) => !takenSet.has(t));

    return NextResponse.json({
      times,
      closed: false,
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
