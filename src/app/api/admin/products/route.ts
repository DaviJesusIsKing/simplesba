import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, parseMoney, parsePositiveInt, sanitizeText, validateImageOrPdfDataUrl } from "@/lib/security";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await prisma.product.findMany({ orderBy: { name: "asc" } }));
}
async function save(req: NextRequest, id?: string) {
  const body = await req.json();
  const name = sanitizeText(body.name, 100), description = sanitizeText(body.description, 500);
  const price = parseMoney(body.price), stock = parsePositiveInt(body.stock ?? 0, 0, 1_000_000);
  if (!name || price === null || stock === null) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const imageData = body.imageData ? validateImageOrPdfDataUrl(body.imageData) || "" : "";
  if (id) return NextResponse.json(await prisma.product.update({ where: { id }, data: { name, description, price, stock, imageData } }));
  const est = await prisma.establishment.findFirst();
  if (!est) return NextResponse.json({ error: "Estabelecimento não encontrado" }, { status: 400 });
  return NextResponse.json(await prisma.product.create({ data: { name, description, price, stock, imageData, establishmentId: est.id } }));
}
export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return await save(req); } catch (e) { console.error(e); return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 }); }
}
export async function PUT(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try { return await save(req, id); } catch (e) { console.error(e); return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 }); }
}
export async function DELETE(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try { await prisma.product.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 }); }
}
