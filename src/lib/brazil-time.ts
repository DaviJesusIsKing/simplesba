/** Horário do Brasil (o Amplify roda em UTC). */
const TZ = "America/Sao_Paulo";

export function brazilNow(d = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value])
  );

  const year = parts.year;
  const month = parts.month;
  const day = parts.day;
  const hours = Number(parts.hour);
  const minutes = Number(parts.minute);
  const dateStr = `${year}-${month}-${day}`;

  // 0=Dom … 6=Sáb a partir da data civil em São Paulo
  const weekday = new Date(`${dateStr}T12:00:00-03:00`).getUTCDay();

  return {
    dateStr,
    hours,
    minutes,
    nowMin: hours * 60 + minutes,
    weekday,
  };
}

export function brazilTodayISO() {
  return brazilNow().dateStr;
}
