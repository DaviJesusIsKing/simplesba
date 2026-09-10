import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, parseMoney, parsePositiveInt, sanitizeText, validateImageOrPdfDataUrl } from "@/lib/security";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await prisma.service.findMany({ orderBy: { name: "asc" } }));
}
export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const name = sanitizeText(body.name, 100), description = sanitizeText(body.description, 500);
    const price = parseMoney(body.price), duration = parsePositiveInt(body.duration, 5, 480);
    if (!name || price === null || duration === null) return NextResponse.json({ error: "Nome, preço ou duração inválidos" }, { status: 400 });
    const est = await prisma.establishment.findFirst();
    if (!est) return NextResponse.json({ error: "Estabelecimento não encontrado" }, { status: 400 });
    const imageData = body.imageData ? validateImageOrPdfDataUrl(body.imageData) || "" : "";
    const item = await prisma.service.create({ data: { name, description, price, duration, imageData, establishmentId: est.id } });
    return NextResponse.json(item);
  } catch (e) { console.error(e); return NextResponse.json({ error: "Erro ao criar serviço" }, { status: 500 }); }
}
export async function PUT(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = req.nextUrl.searchParams.get("id"), body = await req.json();
    const name = sanitizeText(body.name, 100), description = sanitizeText(body.description, 500);
    const price = parseMoney(body.price), duration = parsePositiveInt(body.duration, 5, 480);
    if (!id || !name || price === null || duration === null) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    const imageData = body.imageData ? validateImageOrPdfDataUrl(body.imageData) || "" : "";
    const item = await prisma.service.update({ where: { id }, data: { name, description, price, duration, imageData } });
    return NextResponse.json(item);
  } catch (e) { console.error(e); return NextResponse.json({ error: "Erro ao atualizar serviço" }, { status: 500 }); }
}
export async function DELETE(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try { await prisma.service.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Não foi possível excluir o serviço. Pode haver agendamentos vinculados." }, { status: 409 }); }
}
