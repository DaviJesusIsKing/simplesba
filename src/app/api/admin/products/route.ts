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
  const items = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const est = await prisma.establishment.findFirst();
  if (!est) return NextResponse.json({ error: "No establishment" }, { status: 400 });
  const stock = Math.max(0, body.stock ?? 0);
  const item = await prisma.product.create({
    data: {
      name: body.name,
      description: body.description,
      price: body.price,
      stock,
      establishmentId: est.id,
    },
  });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const body = await req.json();
  const stock = Math.max(0, body.stock ?? 0);
  const item = await prisma.product.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      price: body.price,
      stock,
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
