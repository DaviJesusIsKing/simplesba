/** Notificação nativa do Chrome/navegador (aba em segundo plano também). */

export async function ensureAdminNotifications(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;

  if (Notification.permission === "granted") {
    await registerSw();
    return true;
  }
  if (Notification.permission === "denied") return false;

  const r = await Notification.requestPermission();
  if (r === "granted") {
    await registerSw();
    return true;
  }
  return false;
}

async function registerSw() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw-admin.js");
  } catch {
    // ignore
  }
}

export async function notifyAdmin(title: string, body: string, url?: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const opts: NotificationOptions = {
    body,
    icon: "/favicon.ico",
    tag: "barbearia-admin-" + Date.now(),
    requireInteraction: true,
    data: { url: url || "/p-x7k9qm2/agendamentos" },
  };

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg?.showNotification) {
      await reg.showNotification(title, opts);
      return;
    }
  } catch {
    // fallback
  }
  try {
    new Notification(title, opts);
  } catch {
    // ignore
  }
}
