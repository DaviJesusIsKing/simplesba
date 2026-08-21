import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendTelegramAlert } from "@/lib/telegram";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const r = await sendTelegramAlert(
    "✅ Teste da barbearia\n\nSe você recebeu esta mensagem, os alertas do Telegram estão ok."
  );
  if (!r.ok) {
    return NextResponse.json(
      { error: "Falha ao enviar. Confira token, chat id e se ativou os alertas.", detail: r.reason },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
