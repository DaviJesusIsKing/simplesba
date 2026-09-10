import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireOldPendings } from "@/lib/appointments";
import { sendTelegramAlert } from "@/lib/telegram";
import { validateImageOrPdfDataUrl, verifyAppointmentAccessToken, sanitizeText } from "@/lib/security";

const MAX_CHARS = 1_800_000;

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 2_500_000) return NextResponse.json({ error: "Arquivo muito grande" }, { status: 413 });

    const body = await req.json();
    const appointmentId = sanitizeText(body.appointmentId, 100);
    const receiptData = body.receiptData;
    const accessToken = sanitizeText(body.accessToken, 128);
    if (!appointmentId || !receiptData || !accessToken) return NextResponse.json({ error: "Comprovante ou autorização ausente" }, { status: 400 });

    const data = validateImageOrPdfDataUrl(receiptData, MAX_CHARS);
    if (!data) return NextResponse.json({ error: "Arquivo inválido. Envie JPG, PNG, WEBP, GIF ou PDF válido." }, { status: 400 });

    await expireOldPendings();
    const apt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!apt) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    if (!verifyAppointmentAccessToken(apt.id, apt.clientPhone, accessToken)) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    if (apt.status === "expired" || apt.status === "cancelled" || apt.paymentMethod !== "pix") {
      return NextResponse.json({ error: "Este agendamento não aceita mais comprovante" }, { status: 400 });
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { receiptData: data, receiptNote: body.note ? sanitizeText(body.note, 200) : null, paymentStatus: "awaiting_receipt", rejectReason: null },
      include: { service: { select: { name: true } } },
    });

    void sendTelegramAlert(
      `COMPROVANTE PIX\n\n${updated.clientName}\n${updated.service.name}\nR$ ${updated.amountDue.toFixed(2)}\n${updated.date} às ${updated.time}\n\nAprove ou recuse no painel.`,
      { path: "/p-x7k9qm2/comprovantes", buttonLabel: "Abrir comprovantes" }
    );

    return NextResponse.json({ ok: true, appointment: { id: updated.id, status: updated.status, paymentStatus: updated.paymentStatus, amountDue: updated.amountDue, service: updated.service } });
  } catch (e) {
    console.error("receipt upload error:", e);
    return NextResponse.json({ error: "Erro ao enviar comprovante" }, { status: 500 });
  }
}
