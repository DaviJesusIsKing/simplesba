import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function buildSlots(open: string, close: string, step = 30): string[] {
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  const start = oh * 60 + om;
  const end = ch * 60 + cm;
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
    if (!est) return NextResponse.json({ times: [] });

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
    return NextResponse.json({ times });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ times: [], error: "Erro" }, { status: 500 });
  }
}
