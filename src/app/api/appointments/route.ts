import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const service = await prisma.service.findFirst({
      where: { id: serviceId, active: true },
    });
    if (!service) {
      return NextResponse.json({ error: "Serviço inválido" }, { status: 400 });
    }

    const exists = await prisma.appointment.findFirst({
      where: {
        establishmentId: est.id,
        date,
        time,
        status: { not: "cancelled" },
      },
    });
    if (exists) {
      return NextResponse.json({ error: "Horário já ocupado. Escolha outro." }, { status: 409 });
    }

    const apt = await prisma.appointment.create({
      data: {
        clientName: String(clientName).trim(),
        clientPhone: String(clientPhone).trim(),
        date,
        time,
        status: "pending",
        serviceId,
        establishmentId: est.id,
      },
      include: { service: true },
    });

    return NextResponse.json(apt);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao agendar" }, { status: 500 });
  }
}
