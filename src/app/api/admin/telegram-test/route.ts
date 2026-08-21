import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    telegramBotToken?: string;
    telegramChatId?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const est = await prisma.establishment.findFirst();
  const token = String(body.telegramBotToken || est?.telegramBotToken || "")
    .trim()
    .replace(/\s+/g, "");
  const chatId = String(body.telegramChatId || est?.telegramChatId || "")
    .trim()
    .replace(/\s+/g, "");

  if (!token || !chatId) {
    return NextResponse.json(
      {
        error:
          "Token ou Chat ID vazios. Preencha os dois campos, clique em Salvar e teste de novo.",
      },
      { status: 400 }
    );
  }

  if (!token.includes(":")) {
    return NextResponse.json(
      {
        error:
          "Token inválido. Deve parecer com 123456:AAH.... (copie do @BotFather).",
      },
      { status: 400 }
    );
  }

  if (!/^-?\d+$/.test(chatId)) {
    return NextResponse.json(
      {
        error:
          "Chat ID inválido. Use só números (ex.: 6440319738), o Id do @userinfobot.",
      },
      { status: 400 }
    );
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "✅ Teste da barbearia\n\nSe você recebeu esta mensagem, os alertas do Telegram estão ok.",
        disable_web_page_preview: true,
      }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      description?: string;
    };

    if (!res.ok || !data.ok) {
      const desc = data.description || "erro desconhecido";
      let tip = desc;
      if (/chat not found/i.test(desc)) {
        tip =
          "Chat não encontrado. Abra seu bot no Telegram, clique em Start/Iniciar e envie 'oi'. Confira o Chat ID no @userinfobot.";
      } else if (/unauthorized/i.test(desc)) {
        tip =
          "Token inválido ou revogado. Gere um token novo no @BotFather e cole sem espaços.";
      } else if (/bot was blocked/i.test(desc)) {
        tip = "Você bloqueou o bot. Desbloqueie e dê Start de novo.";
      }
      return NextResponse.json({ error: tip, detail: desc }, { status: 400 });
    }

    // grava no banco se o teste funcionou (opcional)
    if (est) {
      await prisma.establishment.update({
        where: { id: est.id },
        data: {
          telegramEnabled: true,
          telegramBotToken: token,
          telegramChatId: chatId,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Falha de rede ao falar com o Telegram." },
      { status: 500 }
    );
  }
}
