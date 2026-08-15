import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serviceId, date, time, clientName, clientPhone } = body;

    if (!serviceId || !date || !time || !clientName || !clientPhone) {
      return NextResponse.json(
        { error: "Preencha todos os campos" },
        { status: 400 }
      );
    }

    const est = await prisma.establishment.findFirst();
    if (!est) {
      return NextResponse.json(
        { error: "Estabelecimento não encontrado" },
        { status: 400 }
      );
    }

    const service = await prisma.service.findFirst({
      where: { id: String(serviceId), active: true },
    });
    if (!service) {
      return NextResponse.json({ error: "Serviço inválido" }, { status: 400 });
    }

    // valida dia da semana
    const [y, mo, d] = String(date).split("-").map(Number);
    if (!y || !mo || !d) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }
    const weekday = new Date(y, mo - 1, d).getDay();
    const openDays = (est.openDays || "0,1,2,3,4,5,6")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    if (openDays.length > 0 && !openDays.includes(String(weekday))) {
      return NextResponse.json(
        { error: "Barbearia fechada neste dia" },
        { status: 400 }
      );
    }

    const dateStr = String(date).slice(0, 10);
    const timeStr = String(time).slice(0, 5);

    const exists = await prisma.appointment.findFirst({
      where: {
        establishmentId: est.id,
        date: dateStr,
        time: timeStr,
        NOT: { status: "cancelled" },
      },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Horário já ocupado. Escolha outro." },
        { status: 409 }
      );
    }

    const apt = await prisma.appointment.create({
      data: {
        clientName: String(clientName).trim(),
        clientPhone: String(clientPhone).trim(),
        date: dateStr,
        time: timeStr,
        status: "pending",
        serviceId: service.id,
        establishmentId: est.id,
      },
      include: { service: true },
    });

    return NextResponse.json(apt);
  } catch (e: unknown) {
    console.error("appointment create error:", e);
    const err = e as { code?: string; message?: string };
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Horário já ocupado. Escolha outro." },
        { status: 409 }
      );
    }
    // tabela não existe
    if (err?.message?.includes("does not exist") || err?.code === "P2021") {
      return NextResponse.json(
        {
          error:
            "Tabela de agendamentos não existe no banco. Rode: npx prisma db push",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        error: err?.message
          ? `Erro ao agendar: ${err.message}`
          : "Erro ao agendar",
      },
      { status: 500 }
    );
  }
}
