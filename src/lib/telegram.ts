import { prisma } from "./prisma";

export async function sendTelegramAlert(text: string) {
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

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
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
