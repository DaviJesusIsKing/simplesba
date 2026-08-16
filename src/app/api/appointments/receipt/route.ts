import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireOldPendings } from "@/lib/appointments";

const MAX_CHARS = 1_200_000; // ~1MB base64

export async function POST(req: NextRequest) {
  try {
    await expireOldPendings();
    const body = await req.json();
    const { appointmentId, receiptData, note } = body;
    if (!appointmentId || !receiptData) {
      return NextResponse.json({ error: "Comprovante obrigatório" }, { status: 400 });
    }
    if (String(receiptData).length > MAX_CHARS) {
      return NextResponse.json(
        { error: "Imagem muito grande. Use outra com menos de ~800KB." },
        { status: 400 }
      );
    }
    if (!String(receiptData).startsWith("data:image/")) {
      return NextResponse.json({ error: "Envie uma imagem (JPG/PNG)" }, { status: 400 });
    }

    const apt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!apt) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    if (apt.status === "expired" || apt.status === "cancelled") {
      return NextResponse.json({ error: "Este agendamento não aceita mais comprovante" }, { status: 400 });
    }
    if (apt.paymentMethod !== "pix") {
      return NextResponse.json({ error: "Este agendamento é pagamento na hora" }, { status: 400 });
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        receiptData: String(receiptData),
        receiptNote: note ? String(note).slice(0, 200) : null,
        paymentStatus: "awaiting_receipt",
        rejectReason: null,
      },
      include: { service: { select: { name: true, price: true, duration: true } } },
    });

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
