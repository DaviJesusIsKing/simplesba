import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const est = await prisma.establishment.findFirst();
    if (!est) return NextResponse.json({});
    return NextResponse.json({
      name: est.name,
      whatsapp: est.whatsapp,
      pixKey: est.pixKey || "",
      pixName: est.pixName || "",
      pixInstructions: est.pixInstructions || "",
      pixChargeMode: est.pixChargeMode || "full",
      pixChargePercent: est.pixChargePercent ?? 50,
      paymentPolicy: est.paymentPolicy || "both",
      pixQrData: est.pixQrData || "",
      showProducts: est.showProducts !== false,
      openTime: est.openTime,
      closeTime: est.closeTime,
    });
  } catch {
    return NextResponse.json({});
  }
}
