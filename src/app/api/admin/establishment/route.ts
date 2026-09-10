import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, isValidHexColor, isValidTime, parsePositiveInt, sanitizeText, validateImageOrPdfDataUrl } from "@/lib/security";

const defaults = { openDays: "1,2,3,4,5,6", openTime: "09:00", closeTime: "19:00", lunchStart: "12:00", lunchEnd: "13:00" };

export async function GET(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const est = await prisma.establishment.findFirst();
  if (!est) return NextResponse.json(null);
  if (req.nextUrl.searchParams.get("full") === "1") return NextResponse.json({ pixQrData: est.pixQrData, bannerImage: est.bannerImage });
  const { bannerImage, pixQrData, telegramBotToken, ...rest } = est;
  return NextResponse.json({ ...rest, telegramBotToken: "", hasBanner: bannerImage.length > 20, hasQr: pixQrData.length > 20 });
}

export async function PUT(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const existing = await prisma.establishment.findFirst();
    const openTime = sanitizeText(body.openTime || defaults.openTime, 5), closeTime = sanitizeText(body.closeTime || defaults.closeTime, 5);
    const lunchStart = sanitizeText(body.lunchStart || defaults.lunchStart, 5), lunchEnd = sanitizeText(body.lunchEnd || defaults.lunchEnd, 5);
    if (!isValidTime(openTime) || !isValidTime(closeTime) || !isValidTime(lunchStart) || !isValidTime(lunchEnd)) return NextResponse.json({ error: "Horários inválidos" }, { status: 400 });
    const pixChargePercent = parsePositiveInt(body.pixChargePercent ?? 50, 1, 100);
    if (pixChargePercent === null) return NextResponse.json({ error: "Percentual PIX inválido" }, { status: 400 });
    const colors = [body.primaryColor, body.bgColor, body.cardColor];
    if (colors.some((c) => !isValidHexColor(c))) return NextResponse.json({ error: "Cor inválida" }, { status: 400 });
    const paymentPolicy = ["both", "pix_only", "local_only"].includes(body.paymentPolicy) ? body.paymentPolicy : "both";
    const pixChargeMode = body.pixChargeMode === "half" ? "half" : "full";
    const openDays = sanitizeText(body.openDays || defaults.openDays, 20).split(",").map((x: string) => x.trim()).filter((x: string) => /^[0-6]$/.test(x));
    if (!openDays.length) return NextResponse.json({ error: "Selecione pelo menos um dia" }, { status: 400 });
    const imageData = (value: unknown) => value ? validateImageOrPdfDataUrl(value, 3_000_000) || "" : "";
    const tokenInput = String(body.telegramBotToken || "").replace(/\s+/g, "");
    const data = {
      name: sanitizeText(body.name, 120), description: sanitizeText(body.description, 1000), address: sanitizeText(body.address, 300), mapsUrl: sanitizeText(body.mapsUrl, 500),
      phone: sanitizeText(body.phone, 40), whatsapp: sanitizeText(body.whatsapp, 30), instagram: sanitizeText(body.instagram, 120), openDays: [...new Set(openDays)].join(","),
      openTime, closeTime, lunchEnabled: !!body.lunchEnabled, lunchStart, lunchEnd,
      primaryColor: body.primaryColor, bgColor: body.bgColor, cardColor: body.cardColor,
      pixKey: sanitizeText(body.pixKey, 200), pixName: sanitizeText(body.pixName, 120), pixInstructions: sanitizeText(body.pixInstructions, 500),
      pixChargeMode, pixChargePercent, paymentPolicy, hoursByDay: sanitizeText(body.hoursByDay, 2000), pixQrData: imageData(body.pixQrData) || existing?.pixQrData || "", showProducts: body.showProducts !== false,
      telegramEnabled: !!body.telegramEnabled, telegramBotToken: tokenInput || existing?.telegramBotToken || "", telegramChatId: sanitizeText(body.telegramChatId, 100), bannerImage: imageData(body.bannerImage) || existing?.bannerImage || "",
    };
    if (!data.name) return NextResponse.json({ error: "Nome do estabelecimento é obrigatório" }, { status: 400 });
    const item = existing ? await prisma.establishment.update({ where: { id: existing.id }, data }) : await prisma.establishment.create({ data: { ...data, id: "main" } });
    return NextResponse.json({ ...item, telegramBotToken: "" });
  } catch (e) {
    console.error("establishment update error:", e);
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 });
  }
}
