import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const current = String(body.currentPassword || "");
  const next = String(body.newPassword || "");

  if (next.length < 8) {
    return NextResponse.json(
      { error: "A nova senha precisa ter no mínimo 8 caracteres" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const ok = await bcrypt.compare(current, user.password);
  if (!ok) {
    return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
  }

  const hash = await bcrypt.hash(next, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash },
  });

  return NextResponse.json({ ok: true });
}
