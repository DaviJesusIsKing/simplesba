const DAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

type HoursSpec = { open?: string; close?: string };

export function weekdayHoursList(est: {
  openDays?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  hoursByDay?: string | null;
}): { day: string; hours: string; closed: boolean }[] {
  let extra: Record<string, HoursSpec> = {};
  try {
    extra = JSON.parse(est.hoursByDay || "{}") || {};
  } catch {
    extra = {};
  }

  const openSet = new Set(
    (est.openDays || "1,2,3,4,5,6")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map((d) => {
    const closed = !openSet.has(String(d));
    const spec = extra[String(d)];
    const open = spec?.open || est.openTime || "09:00";
    const close = spec?.close || est.closeTime || "19:00";
    return {
      day: DAY_LABELS[d],
      hours: closed ? "Fechado" : `${open} – ${close}`,
      closed,
    };
  });
}
