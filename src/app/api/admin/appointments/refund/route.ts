import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const apt = await prisma.appointment.findUnique({
    where: { id },
    select: { refundProofData: true, refundNote: true, clientName: true },
  });
  if (!apt) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json({
    refundProofData: apt.refundProofData,
    refundNote: apt.refundNote,
    clientName: apt.clientName,
  });
}
