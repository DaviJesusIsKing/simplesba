import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const est = await prisma.establishment.findFirst();
    if (!est) return NextResponse.json({});
    return NextResponse.json({
      name: est.name,
      primaryColor: est.primaryColor,
      bgColor: est.bgColor,
      cardColor: est.cardColor,
      whatsapp: est.whatsapp,
      pixKey: est.pixKey || "",
      pixName: est.pixName || "",
      pixInstructions: est.pixInstructions || "",
      pixChargeMode: est.pixChargeMode || "full",
      pixChargePercent: est.pixChargePercent ?? 50,
      paymentPolicy: est.paymentPolicy || "both",
      pixQrData: est.pixQrData || "",
      showProducts: est.showProducts !== false,
      mapsUrl: est.mapsUrl || "",
      address: est.address || "",
      openTime: est.openTime,
      closeTime: est.closeTime,
    });
  } catch {
    return NextResponse.json({});
  }
}
