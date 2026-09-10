import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/security";
import { expireOldPendings } from "@/lib/appointments";

export async function GET() {
  const session = await getAdminSession();
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
