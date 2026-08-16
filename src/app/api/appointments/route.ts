import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serviceId, date, time, clientName, clientPhone } = body;

    if (!serviceId || !date || !time || !clientName || !clientPhone) {
      return NextResponse.json({ error: "Preencha todos os campos" }, { status: 400 });
    }

    const est = await prisma.establishment.findFirst();
    if (!est) {
      return NextResponse.json({ error: "Estabelecimento não encontrado" }, { status: 400 });
    }

    const service = await prisma.service.findUnique({
      where: { id: String(serviceId) },
    });
    if (!service || !service.active) {
      return NextResponse.json({ error: "Serviço inválido ou inativo" }, { status: 400 });
    }

    const dateStr = String(date).slice(0, 10);
    const timeStr = normTime(String(time));
    const duration = service.duration > 0 ? service.duration : 30;
    const start = toMinutes(timeStr);
    const end = start + duration;
    const closeMin = toMinutes(est.closeTime || "19:00");
    const openMin = toMinutes(est.openTime || "09:00");

    if (start < openMin) {
      return NextResponse.json({ error: "Horário antes da abertura" }, { status: 400 });
    }
    if (end > closeMin) {
      return NextResponse.json(
        { error: "Esse serviço não cabe neste horário (passa do fechamento)" },
        { status: 400 }
      );
    }

    const [y, mo, d] = dateStr.split("-").map(Number);
    if (!y || !mo || !d) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }
    const weekday = new Date(y, mo - 1, d).getDay();
    const openDays = (est.openDays || "0,1,2,3,4,5,6")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    if (openDays.length > 0 && !openDays.includes(String(weekday))) {
      return NextResponse.json({ error: "Barbearia fechada neste dia" }, { status: 400 });
    }

    const existing = await prisma.appointment.findMany({
      where: {
        establishmentId: est.id,
        date: dateStr,
        status: { not: "cancelled" },
      },
      include: { service: { select: { duration: true } } },
    });

    for (const e of existing) {
      const bStart = toMinutes(e.time);
      const bDur =
        e.service && e.service.duration > 0 ? e.service.duration : 30;
      const bEnd = bStart + bDur;
      if (overlaps(start, end, bStart, bEnd)) {
        return NextResponse.json(
          { error: "Horário conflita com outro agendamento. Escolha outro." },
          { status: 409 }
        );
      }
    }

    const apt = await prisma.appointment.create({
      data: {
        clientName: String(clientName).trim().slice(0, 120),
        clientPhone: String(clientPhone).trim().slice(0, 30),
        date: dateStr,
        time: timeStr,
        status: "pending",
        serviceId: service.id,
        establishmentId: est.id,
      },
      include: { service: true },
    });

    return NextResponse.json({ ok: true, appointment: apt });
  } catch (e: unknown) {
    console.error("appointment create error:", e);
    const err = e as { code?: string; message?: string; meta?: unknown };
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Horário já ocupado. Escolha outro." },
        { status: 409 }
      );
    }
    if (err?.code === "P2003") {
      return NextResponse.json(
        { error: "Serviço ou estabelecimento inválido (FK)" },
        { status: 400 }
      );
    }
    if (err?.message?.includes("does not exist") || err?.code === "P2021") {
      return NextResponse.json(
        {
          error:
            "Tabela Appointment não existe no Neon. No PC rode: npx prisma db push",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        error: err?.message
          ? `Erro: ${err.message}`
          : "Erro ao agendar",
      },
      { status: 500 }
    );
  }
}
