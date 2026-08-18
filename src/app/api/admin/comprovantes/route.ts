import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expireOldPendings } from "@/lib/appointments";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await expireOldPendings();

  const items = await prisma.appointment.findMany({
    where: {
      paymentMethod: "pix",
      OR: [
        { paymentStatus: "awaiting_receipt" },
        { paymentStatus: "rejected" },
        { paymentStatus: "paid" },
      ],
    },
    orderBy: [{ createdAt: "desc" }],
    include: { service: true },
    take: 150,
  });

  return NextResponse.json(
    items.map(({ receiptData, ...rest }) => ({
      ...rest,
      hasReceipt: !!receiptData,
    }))
  );
}
