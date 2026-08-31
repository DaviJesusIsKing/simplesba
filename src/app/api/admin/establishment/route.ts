import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function guard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const est = await prisma.establishment.findFirst();
  return NextResponse.json(est);
}

export async function PUT(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const data = {
    name: body.name,
    description: body.description,
    address: body.address ?? "",
    mapsUrl: String(body.mapsUrl ?? "").trim(),
    phone: body.phone,
    whatsapp: body.whatsapp,
    instagram: body.instagram || "",
    openTime: body.openTime,
    closeTime: body.closeTime,
    lunchEnabled: !!body.lunchEnabled,
    lunchStart: body.lunchStart || "12:00",
    lunchEnd: body.lunchEnd || "13:00",
    openDays: body.openDays || "1,2,3,4,5,6",
    primaryColor: body.primaryColor || "#d4a017",
    bgColor: body.bgColor || "#0f0f0f",
    cardColor: body.cardColor || "#1a1a1a",
    pixKey: body.pixKey ?? "",
    pixName: body.pixName ?? "",
    pixInstructions: body.pixInstructions ?? "",
    pixChargeMode: body.pixChargeMode || "full",
    pixChargePercent: Math.min(100, Math.max(1, Number(body.pixChargePercent) || 50)),
    paymentPolicy: body.paymentPolicy || "both",
    hoursByDay: body.hoursByDay || "{}",
    pixQrData: body.pixQrData ?? "",
    showProducts: body.showProducts !== false,
    telegramEnabled: !!body.telegramEnabled,
    telegramBotToken: String(body.telegramBotToken ?? "").replace(/\s+/g, ""),
    telegramChatId: String(body.telegramChatId ?? "").trim(),
    bannerImage: body.bannerImage ?? "",
  };
  const existing = await prisma.establishment.findFirst();
  if (!existing) {
    const created = await prisma.establishment.create({ data });
    return NextResponse.json(created);
  }
  const updated = await prisma.establishment.update({
    where: { id: existing.id },
    data,
  });
  return NextResponse.json(updated);
}
