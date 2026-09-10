import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, sanitizeText } from "@/lib/security";

export async function PATCH(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = req.nextUrl.searchParams.get("id"), body = await req.json(), action = sanitizeText(body.action, 20);
    if (!id || !["approve", "reject"].includes(action)) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    const apt = await prisma.appointment.findUnique({ where: { id } });
    if (!apt) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    if (apt.paymentMethod !== "pix") return NextResponse.json({ error: "Este agendamento não usa PIX" }, { status: 400 });
    if (action === "approve") {
      if (apt.status !== "pending") return NextResponse.json({ error: "Agendamento não está pendente" }, { status: 409 });
      const item = await prisma.appointment.update({ where: { id }, data: { paymentStatus: "paid", status: "confirmed", expiresAt: null, rejectReason: null }, include: { service: true } });
      return NextResponse.json(item);
    }
    if (apt.status === "expired" || apt.status === "cancelled") return NextResponse.json({ error: "Este agendamento não aceita revisão de comprovante" }, { status: 409 });
    const item = await prisma.appointment.update({ where: { id }, data: { paymentStatus: "rejected", rejectReason: sanitizeText(body.reason || "Comprovante inválido", 200), receiptData: null }, include: { service: true } });
    return NextResponse.json(item);
  } catch (e) {
    console.error("payment update error:", e);
    return NextResponse.json({ error: "Erro ao atualizar pagamento" }, { status: 500 });
  }
}
