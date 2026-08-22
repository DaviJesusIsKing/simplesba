import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expireOldPendings, reservationDeadline } from "@/lib/appointments";
import { sendTelegramAlert } from "@/lib/telegram";

async function guard() {
  return getServerSession(authOptions);
}

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

export async function GET() {
  if (!(await guard())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await expireOldPendings();
  const items = await prisma.appointment.findMany({
    orderBy: [{ date: "desc" }, { time: "asc" }],
    include: { service: true },
    take: 100,
  });
  return NextResponse.json(
    items.map(({ receiptData, refundProofData, ...rest }) => ({
      ...rest,
      hasReceipt: !!receiptData,
      hasRefundProof: !!refundProofData,
    }))
  );
}

/** Admin cria agendamento para um cliente */
export async function POST(req: NextRequest) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await expireOldPendings();
    const body = await req.json();
    const {
      serviceId,
      date,
      time,
      clientName,
      clientPhone,
      paymentMethod,
      pixAmount,
      status,
    } = body;

    if (!serviceId || !date || !time || !clientName || !clientPhone) {
      return NextResponse.json(
        { error: "Preencha serviço, data, horário, nome e telefone" },
        { status: 400 }
      );
    }

    const est = await prisma.establishment.findFirst();
    if (!est) {
      return NextResponse.json({ error: "Estabelecimento não encontrado" }, { status: 400 });
    }

    const service = await prisma.service.findUnique({
      where: { id: String(serviceId) },
    });
    if (!service || !service.active) {
      return NextResponse.json({ error: "Serviço inválido" }, { status: 400 });
    }

    const dateStr = String(date).slice(0, 10);
    const timeStr = normTime(String(time));
    const duration = service.duration > 0 ? service.duration : 30;
    const start = toMinutes(timeStr);
    const end = start + duration;

    let method = String(paymentMethod || "local");
    if (method !== "pix" && method !== "local") method = "local";

    const pct = Math.min(
      100,
      Math.max(1, (est as { pixChargePercent?: number }).pixChargePercent ?? 50)
    );
    let amountDue = service.price;
    if (method === "pix") {
      const choice = String(pixAmount || "full");
      if (choice === "half") {
        amountDue = Math.round(service.price * pct) / 100;
      }
    }
    amountDue = Math.round(amountDue * 100) / 100;

    // conflito de horário
    const existing = await prisma.appointment.findMany({
      where: {
        establishmentId: est.id,
        date: dateStr,
        status: { in: ["pending", "confirmed", "done"] },
      },
      include: { service: { select: { duration: true } } },
    });
    for (const e of existing) {
      const bStart = toMinutes(e.time);
      const bDur = e.service && e.service.duration > 0 ? e.service.duration : 30;
      const bEnd = bStart + bDur;
      if (overlaps(start, end, bStart, bEnd)) {
        return NextResponse.json(
          { error: "Horário conflita com outro agendamento" },
          { status: 409 }
        );
      }
    }

    let st = String(status || "confirmed");
    if (!["pending", "confirmed"].includes(st)) st = "confirmed";

    const paymentStatus =
      method === "pix"
        ? st === "confirmed"
          ? "awaiting_receipt"
          : "awaiting_receipt"
        : "unpaid";

    const apt = await prisma.appointment.create({
      data: {
        clientName: String(clientName).trim().slice(0, 120),
        clientPhone: String(clientPhone).trim().slice(0, 30),
        date: dateStr,
        time: timeStr,
        status: st,
        paymentMethod: method,
        paymentStatus: method === "pix" ? "awaiting_receipt" : "unpaid",
        amountDue,
        expiresAt: st === "pending" ? reservationDeadline() : null,
        serviceId: service.id,
        establishmentId: est.id,
      },
      include: { service: true },
    });

    const payLabel =
      method === "pix" ? `PIX R$ ${amountDue.toFixed(2)}` : "Pagar na hora";
    void sendTelegramAlert(
      `📋 Agendamento pelo barbeiro\n\n👤 ${apt.clientName}\n📞 ${apt.clientPhone}\n✂️ ${apt.service.name}\n📆 ${dateStr} às ${timeStr}\n💰 ${payLabel}\n📌 Status: ${st}`,
      { path: "/p-x7k9qm2/agendamentos", buttonLabel: "Abrir agendamentos" }
    );

    return NextResponse.json({ ok: true, appointment: apt });
  } catch (e: unknown) {
    console.error(e);
    const err = e as { message?: string };
    return NextResponse.json(
      { error: err?.message || "Erro ao criar agendamento" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  const body = await req.json();
  if (!id || !body.status) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const allowed = ["pending", "confirmed", "cancelled", "done"];
  if (!allowed.includes(body.status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }
  const data: {
    status: string;
    expiresAt?: null;
    refundProofData?: string | null;
    refundNote?: string | null;
  } = { status: body.status };
  if (body.status === "confirmed" || body.status === "done") {
    data.expiresAt = null;
  }
  if (body.status === "cancelled") {
    if (body.refundProofData) {
      const raw = String(body.refundProofData);
      if (raw.length > 1_800_000) {
        return NextResponse.json({ error: "Arquivo de reembolso muito grande" }, { status: 400 });
      }
      const ok =
        raw.startsWith("data:image/") || raw.startsWith("data:application/pdf");
      if (!ok) {
        return NextResponse.json(
          { error: "Reembolso: envie imagem ou PDF" },
          { status: 400 }
        );
      }
      data.refundProofData = raw;
    }
    if (body.refundNote != null) {
      data.refundNote = String(body.refundNote).slice(0, 300);
    }
  }
  const item = await prisma.appointment.update({
    where: { id },
    data,
    include: { service: true },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
