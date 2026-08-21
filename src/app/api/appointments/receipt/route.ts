import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireOldPendings } from "@/lib/appointments";
import { sendTelegramAlert } from "@/lib/telegram";

const MAX_CHARS = 1_800_000; // ~1.3MB base64

function isAllowedReceipt(data: string) {
  return (
    data.startsWith("data:image/jpeg") ||
    data.startsWith("data:image/jpg") ||
    data.startsWith("data:image/png") ||
    data.startsWith("data:image/webp") ||
    data.startsWith("data:image/gif") ||
    data.startsWith("data:application/pdf")
  );
}

export async function POST(req: NextRequest) {
  try {
    await expireOldPendings();
    const body = await req.json();
    const { appointmentId, receiptData, note } = body;
    if (!appointmentId || !receiptData) {
      return NextResponse.json({ error: "Comprovante obrigatório" }, { status: 400 });
    }
    const data = String(receiptData);
    if (data.length > MAX_CHARS) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Use imagem ou PDF menor (~1MB)." },
        { status: 400 }
      );
    }
    if (!isAllowedReceipt(data)) {
      return NextResponse.json(
        { error: "Envie imagem (JPG, PNG, WEBP) ou documento PDF" },
        { status: 400 }
      );
    }

    const apt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!apt) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    if (apt.status === "expired" || apt.status === "cancelled") {
      return NextResponse.json(
        { error: "Este agendamento não aceita mais comprovante" },
        { status: 400 }
      );
    }
    if (apt.paymentMethod !== "pix") {
      return NextResponse.json({ error: "Este agendamento é pagamento na hora" }, { status: 400 });
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        receiptData: data,
        receiptNote: note ? String(note).slice(0, 200) : null,
        paymentStatus: "awaiting_receipt",
        rejectReason: null,
      },
      include: { service: { select: { name: true, price: true, duration: true } } },
    });

        void sendTelegramAlert(
      `📎 COMPROVANTE PIX\n\n👤 ${updated.clientName}\n✂️ ${updated.service.name}\n💰 R$ ${updated.amountDue.toFixed(2)}\n📆 ${updated.date} às ${updated.time}\n\nAprove ou recuse no painel.`,
      { path: "/p-x7k9qm2/comprovantes", buttonLabel: "Abrir comprovantes" }
    );

    return NextResponse.json({
      ok: true,
      appointment: {
        id: updated.id,
        status: updated.status,
        paymentStatus: updated.paymentStatus,
        amountDue: updated.amountDue,
        service: updated.service,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao enviar comprovante" }, { status: 500 });
  }
}
