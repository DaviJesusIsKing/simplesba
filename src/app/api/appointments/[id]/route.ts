import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireOldPendings } from "@/lib/appointments";
import { verifyAppointmentAccessToken, sanitizeText } from "@/lib/security";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await expireOldPendings();
    const { id } = await ctx.params;
    const token = sanitizeText(req.nextUrl.searchParams.get("token"), 128);
    const apt = await prisma.appointment.findUnique({ where: { id }, include: { service: { select: { name: true, price: true, duration: true } } } });
    if (!apt) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (!verifyAppointmentAccessToken(apt.id, apt.clientPhone, token)) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    return NextResponse.json({
      id: apt.id, clientName: apt.clientName, date: apt.date, time: apt.time, status: apt.status,
      paymentMethod: apt.paymentMethod, paymentStatus: apt.paymentStatus, amountDue: apt.amountDue,
      rejectReason: apt.rejectReason, expiresAt: apt.expiresAt, hasReceipt: !!apt.receiptData, service: apt.service,
    });
  } catch (e) {
    console.error("appointment lookup error:", e);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
