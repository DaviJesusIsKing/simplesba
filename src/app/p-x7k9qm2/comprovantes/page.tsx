"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, FileImage, MessageCircle } from "lucide-react";

type Item = {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string;
  time: string;
  status: string;
  paymentStatus: string;
  amountDue: number;
  hasReceipt: boolean;
  rejectReason?: string | null;
  createdAt: string;
  service: { name: string; price: number; duration: number };
};

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function onlyDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

function waLink(phone: string, text: string) {
  let n = onlyDigits(phone);
  if (n.length >= 10 && n.length <= 11) n = "55" + n;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export default function ComprovantesPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"review" | "waiting" | "paid" | "all">("review");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/comprovantes", { cache: "no-store" });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, []);

  const filtered = useMemo(() => {
    if (filter === "review") {
      return items.filter((i) => i.hasReceipt && i.paymentStatus === "awaiting_receipt");
    }
    if (filter === "waiting") {
      return items.filter(
        (i) =>
          (!i.hasReceipt && i.paymentStatus === "awaiting_receipt") ||
          i.paymentStatus === "rejected"
      );
    }
    if (filter === "paid") {
      return items.filter((i) => i.paymentStatus === "paid");
    }
    return items;
  }, [items, filter]);

  const counts = useMemo(
    () => ({
      review: items.filter((i) => i.hasReceipt && i.paymentStatus === "awaiting_receipt").length,
      waiting: items.filter(
        (i) =>
          (!i.hasReceipt && i.paymentStatus === "awaiting_receipt") ||
          i.paymentStatus === "rejected"
      ).length,
      paid: items.filter((i) => i.paymentStatus === "paid").length,
    }),
    [items]
  );

  async function approve(id: string) {
    await fetch(`/api/admin/appointments/payment?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    load();
  }

  async function reject(id: string) {
    const reason = prompt("Motivo da recusa:", "Comprovante ilegível ou valor incorreto");
    if (reason === null) return;
    await fetch(`/api/admin/appointments/payment?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", reason }),
    });
    load();
  }

  async function viewReceipt(id: string) {
    const r = await fetch(`/api/admin/appointments/receipt?id=${id}`);
    const j = await r.json();
    if (r.ok && j.receiptData) {
      const data = j.receiptData as string;
      const w = window.open("");
      if (!w) return;
      if (data.startsWith("data:application/pdf")) {
        w.document.write(
          `<iframe src="${data}" style="width:100%;height:100%;border:0"></iframe>`
        );
      } else {
        w.document.write(`<img src="${data}" style="max-width:100%"/>`);
      }
    } else alert(j.error || "Sem comprovante");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <FileImage className="text-[var(--primary)]" size={24} />
        Comprovantes PIX
      </h1>
      <p className="text-sm text-[var(--muted-fg)] mb-4">
        Para revisar: {counts.review} · Sem envio / recusado: {counts.waiting} · Pagos:{" "}
        {counts.paid}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            ["review", "Para revisar"],
            ["waiting", "Aguardando envio"],
            ["paid", "Aprovados"],
            ["all", "Todos PIX"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-sm border ${
              filter === key
                ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10"
                : "border-[var(--border)] text-[var(--muted-fg)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && items.length === 0 ? (
        <Loader2 className="animate-spin text-[var(--primary)]" />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div
              key={a.id}
              className={`card ${
                a.hasReceipt && a.paymentStatus === "awaiting_receipt"
                  ? "ring-1 ring-amber-500/40"
                  : ""
              }`}
            >
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-semibold">{a.clientName}</p>
                  <p className="text-sm text-[var(--primary)]">{a.clientPhone}</p>
                  <p className="text-sm mt-1">
                    {a.service.name} · {formatDateBR(a.date)} às {a.time}
                  </p>
                  <p className="text-sm text-[var(--primary)]">
                    {(() => {
                      const total = a.service.price;
                      const pix = a.amountDue ?? total;
                      if (pix < total - 0.001) {
                        return `Sinal PIX R$ ${pix.toFixed(2)} · total R$ ${total.toFixed(2)}`;
                      }
                      return `PIX total R$ ${pix.toFixed(2)}`;
                    })()}
                  </p>
                  <p className="text-xs text-[var(--muted-fg)] mt-1">
                    {a.paymentStatus === "paid" && "Pago / aprovado"}
                    {a.paymentStatus === "awaiting_receipt" &&
                      (a.hasReceipt
                        ? "Comprovante aguardando revisão"
                        : "Cliente ainda não enviou")}
                    {a.paymentStatus === "rejected" &&
                      `Recusado${a.rejectReason ? `: ${a.rejectReason}` : ""}`}
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-stretch sm:items-end">
                  {a.hasReceipt && (
                    <button
                      type="button"
                      className="btn btn-secondary text-sm"
                      onClick={() => viewReceipt(a.id)}
                    >
                      Ver comprovante
                    </button>
                  )}
                  {a.hasReceipt && a.paymentStatus === "awaiting_receipt" && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary text-sm"
                        onClick={() => approve(a.id)}
                      >
                        Aprovar
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger text-sm"
                        onClick={() => reject(a.id)}
                      >
                        Recusar
                      </button>
                    </>
                  )}
                  <a
                    href={waLink(
                      a.clientPhone,
                      a.hasReceipt
                        ? `Olá ${a.clientName}, recebemos seu comprovante do horário ${formatDateBR(a.date)} às ${a.time}.`
                        : `Olá ${a.clientName}, ainda não recebemos o comprovante PIX do horário ${formatDateBR(a.date)} às ${a.time}. Envie em Meus horários no site.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary text-sm"
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-[var(--muted-fg)]">Nada neste filtro.</p>
          )}
        </div>
      )}
    </div>
  );
}
