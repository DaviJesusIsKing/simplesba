import { prisma } from "./prisma";

function siteBase() {
  const u = (process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
  return u || "";
}

export async function sendTelegramAlert(
  text: string,
  options?: { path?: string; buttonLabel?: string }
) {
  try {
    const est = await prisma.establishment.findFirst();
    if (!est) return { ok: false, reason: "no_est" };
    const enabled = (est as { telegramEnabled?: boolean }).telegramEnabled;
    const token = ((est as { telegramBotToken?: string }).telegramBotToken || "")
      .trim()
      .replace(/\s+/g, "");
    const chatId = ((est as { telegramChatId?: string }).telegramChatId || "").trim();
    if (!enabled || !token || !chatId) {
      return { ok: false, reason: "disabled" };
    }

    const base = siteBase();
    const path = options?.path || "/p-x7k9qm2/agendamentos";
    const buttonUrl = base ? `${base}${path}` : "";
    const label = options?.buttonLabel || "Abrir painel admin";

    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    };

    if (buttonUrl.startsWith("https://")) {
      body.reply_markup = {
        inline_keyboard: [[{ text: label, url: buttonUrl }]],
      };
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("telegram error", err);
      return { ok: false, reason: err };
    }
    return { ok: true };
  } catch (e) {
    console.error("telegram", e);
    return { ok: false, reason: "exception" };
  }
}
