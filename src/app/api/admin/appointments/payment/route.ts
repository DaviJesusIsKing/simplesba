import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  const body = await req.json();
  if (!id || !body.action) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  if (body.action === "approve") {
    const item = await prisma.appointment.update({
      where: { id },
      data: {
        paymentStatus: "paid",
        status: "confirmed",
        expiresAt: null,
        rejectReason: null,
      },
      include: { service: true },
    });
    return NextResponse.json(item);
  }

  if (body.action === "reject") {
    const item = await prisma.appointment.update({
      where: { id },
      data: {
        paymentStatus: "rejected",
        rejectReason: String(body.reason || "Comprovante inválido").slice(0, 200),
        receiptData: null,
      },
      include: { service: true },
    });
    return NextResponse.json(item);
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
