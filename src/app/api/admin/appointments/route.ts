import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function guard() {
  return getServerSession(authOptions);
}

export async function GET() {
  if (!(await guard())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await prisma.appointment.findMany({
    orderBy: [{ date: "desc" }, { time: "asc" }],
    include: { service: true },
    take: 100,
  });
  return NextResponse.json(items);
}

export async function PATCH(req: NextRequest) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  const body = await req.json();
  if (!id || !body.status) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const allowed = ["pending", "confirmed", "cancelled", "done"];
  if (!allowed.includes(body.status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }
  const item = await prisma.appointment.update({
    where: { id },
    data: { status: body.status },
    include: { service: true },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
