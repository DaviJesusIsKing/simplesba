export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDateBR(iso: string) {
  const [y, m, d] = (iso || "").split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function digitsOnly(value: string, max = 13) {
  return (value || "").replace(/\D/g, "").slice(0, max);
}

/** Máscara BR: (11) 99999-8888 */
export function maskPhoneBR(value: string) {
  const d = digitsOnly(value, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function whatsappHref(raw: string, text?: string) {
  let n = digitsOnly(raw, 13);
  if (!n) return "#";
  if (!n.startsWith("55")) n = `55${n}`;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${n}${q}`;
}

export function instagramHref(handle: string) {
  const h = (handle || "").replace(/^@/, "").trim();
  if (!h) return "";
  if (h.startsWith("http")) return h;
  return `https://instagram.com/${h}`;
}

export function telHref(phone: string) {
  const d = digitsOnly(phone, 13);
  return d ? `tel:+${d.startsWith("55") ? d : `55${d}`}` : "";
}
