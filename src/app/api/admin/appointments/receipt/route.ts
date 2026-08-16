import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id" }, { status: 400 });
  const apt = await prisma.appointment.findUnique({
    where: { id },
    select: { receiptData: true, receiptNote: true },
  });
  if (!apt?.receiptData) {
    return NextResponse.json({ error: "Sem comprovante" }, { status: 404 });
  }
  return NextResponse.json({
    receiptData: apt.receiptData,
    receiptNote: apt.receiptNote,
  });
}
