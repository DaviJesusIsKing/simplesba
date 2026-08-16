"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Trash2, MessageCircle, Bell, BellOff } from "lucide-react";

type Apt = {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string;
  time: string;
  status: string;
  expiresAt?: string | null;
  paymentMethod?: string;
  paymentStatus?: string;
  amountDue?: number;
  hasReceipt?: boolean;
  rejectReason?: string | null;
  service: { name: string; price: number; duration: number };
};

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  done: "Concluído",
  expired: "Expirado",
};

const statusColor: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  confirmed: "bg-green-500/20 text-green-300 border-green-500/40",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/40",
  done: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  expired: "bg-neutral-500/20 text-neutral-400 border-neutral-500/40",
};

function onlyDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

function waLink(phone: string, text: string) {
  let n = onlyDigits(phone);
  if (n.length >= 10 && n.length <= 11) n = "55" + n;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function todayISO() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

/** Beep simples via Web Audio (sem arquivo) */
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    o.type = "sine";
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.4);
    setTimeout(() => {
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.connect(g2);
      g2.connect(ctx.destination);
      o2.frequency.value = 1175;
      o2.type = "sine";
      g2.gain.setValueAtTime(0.15, ctx.currentTime);
      g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      o2.start(ctx.currentTime);
      o2.stop(ctx.currentTime + 0.35);
    }, 180);
  } catch {
    // ignore
  }
}

export default function AgendamentosPage() {
  const [items, setItems] = useState<Apt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "today" | "pending" | "upcoming">("pending");
  const [soundOn, setSoundOn] = useState(false);
  const [newFlash, setNewFlash] = useState(false);
  const knownPending = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    const res = await fetch("/api/admin/appointments", { cache: "no-store" });
    if (res.ok) {
      const data: Apt[] = await res.json();
      const pendingIds = data.filter((i) => i.status === "pending").map((i) => i.id);

      if (!firstLoad.current && soundOn) {
        const isNew = pendingIds.some((id) => !knownPending.current.has(id));
        if (isNew) {
          playAlertSound();
          setNewFlash(true);
          setTimeout(() => setNewFlash(false), 3000);
        }
      }
      firstLoad.current = false;
      knownPending.current = new Set(pendingIds);
      setItems(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const iv = setInterval(() => load(true), 8000);
    return () => clearInterval(iv);
  }, [soundOn]);

  async function setStatus(id: string, status: string) {
    await fetch(`/api/admin/appointments?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load(true);
  }

  async function remove(id: string) {
    if (!confirm("Excluir este agendamento?")) return;
    await fetch(`/api/admin/appointments?id=${id}`, { method: "DELETE" });
    load(true);
  }

  const today = todayISO();

  const filtered = useMemo(() => {
    let list = [...items];
    if (filter === "pending") list = list.filter((i) => i.status === "pending");
    if (filter === "today") list = list.filter((i) => i.date === today);
    if (filter === "upcoming") {
      list = list.filter(
        (i) =>
          i.date >= today &&
          i.status !== "cancelled" &&
          i.status !== "done" &&
          i.status !== "expired"
      );
    }
    list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
    return list;
  }, [items, filter, today]);

  const pending = items.filter((i) => i.status === "pending").length;
  const todayCount = items.filter(
    (i) => i.date === today && i.status !== "cancelled" && i.status !== "expired"
  ).length;

  function remainingLabel(expiresAt?: string | null) {
    if (!expiresAt) return null;
    const left = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    if (left <= 0) return "Expirando…";
    return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")} restantes`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="text-2xl font-bold">Agendamentos</h1>
        <button
          type="button"
          onClick={() => {
            const next = !soundOn;
            setSoundOn(next);
            if (next) playAlertSound();
          }}
          className={`btn text-sm ${soundOn ? "btn-primary" : "btn-secondary"}`}
        >
          {soundOn ? <Bell size={16} /> : <BellOff size={16} />}
          {soundOn ? "Alertas ON" : "Ativar alertas"}
        </button>
      </div>

      {newFlash && (
        <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-900/40 px-4 py-2 text-sm text-amber-200">
          Novo agendamento pendente!
        </div>
      )}

      <p className="text-sm text-[var(--muted-fg)] mb-4">
        Total: {items.length} · Pendentes: {pending} · Hoje: {todayCount}
        {soundOn && " · Atualiza a cada 8s"}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            ["pending", "Pendentes"],
            ["today", "Hoje"],
            ["upcoming", "Próximos"],
            ["all", "Todos"],
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
          {filtered.map((a) => {
            const msgConfirm = `Olá ${a.clientName}! Seu horário está *confirmado* ✅\n\n📌 Serviço: ${a.service.name}\n📅 Data: ${formatDateBR(a.date)}\n⏰ Horário: ${a.time}\n\nTe esperamos!`;
            const msgCancel = `Olá ${a.clientName}, precisamos *cancelar* seu horário de ${a.service.name} em ${formatDateBR(a.date)} às ${a.time}. Responda esta mensagem ou escolha outro horário no site.`;
            const left = a.status === "pending" ? remainingLabel(a.expiresAt) : null;

            return (
              <div
                key={a.id}
                className={`card ${a.status === "pending" ? "ring-1 ring-amber-500/30" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold">{a.clientName}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[a.status] || ""}`}
                      >
                        {statusLabel[a.status] || a.status}
                      </span>
                      {left && (
                        <span className="text-xs text-amber-300">{left}</span>
                      )}
                    </div>
                    <a
                      href={waLink(a.clientPhone, `Olá ${a.clientName}!`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--primary)] hover:underline"
                    >
                      {a.clientPhone}
                    </a>
                    <p className="text-sm mt-1">
                      {a.service.name} · {formatDateBR(a.date)} às {a.time}
                      {a.service.duration ? ` · ${a.service.duration} min` : ""}
                    </p>
                    <p className="text-sm text-[var(--primary)]">
                      R$ {a.service.price.toFixed(2)}
                    </p>
                    {a.paymentMethod === "pix" && (
                      <p className="text-xs text-amber-300 mt-1">
                        PIX ·{" "}
                        {a.paymentStatus === "paid"
                          ? "Pago"
                          : a.paymentStatus === "rejected"
                            ? "Comprovante recusado"
                            : a.hasReceipt
                              ? "Comprovante enviado"
                              : "Aguardando comprovante"}
                        {typeof a.amountDue === "number" ? ` · R$ ${a.amountDue.toFixed(2)}` : ""}
                      </p>
                    )}
                    {a.paymentMethod === "local" && (
                      <p className="text-xs text-[var(--muted-fg)] mt-1">Pagamento na hora</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 items-stretch sm:items-end">
                    <select
                      className="input w-auto text-sm py-1.5"
                      value={a.status === "expired" ? "cancelled" : a.status}
                      onChange={(e) => setStatus(a.id, e.target.value)}
                      disabled={a.status === "expired"}
                    >
                      <option value="pending">{statusLabel.pending}</option>
                      <option value="confirmed">{statusLabel.confirmed}</option>
                      <option value="done">{statusLabel.done}</option>
                      <option value="cancelled">{statusLabel.cancelled}</option>
                    </select>

                    {a.hasReceipt && a.paymentStatus !== "paid" && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-secondary text-sm py-1.5 px-3"
                          onClick={async () => {
                            const r = await fetch(`/api/admin/appointments/receipt?id=${a.id}`);
                            const j = await r.json();
                            if (r.ok && j.receiptData) {
                              const w = window.open("");
                              if (w) {
                                w.document.write(`<img src="${j.receiptData}" style="max-width:100%"/>`);
                              }
                            } else alert(j.error || "Sem comprovante");
                          }}
                        >
                          Ver comprovante
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary text-sm py-1.5 px-3"
                          onClick={async () => {
                            await fetch(`/api/admin/appointments/payment?id=${a.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "approve" }),
                            });
                            load(true);
                          }}
                        >
                          Aprovar PIX
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger text-sm py-1.5 px-3"
                          onClick={async () => {
                            const reason = prompt("Motivo da recusa:", "Comprovante ilegível ou valor incorreto");
                            if (reason === null) return;
                            await fetch(`/api/admin/appointments/payment?id=${a.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "reject", reason }),
                            });
                            load(true);
                          }}
                        >
                          Recusar
                        </button>
                      </div>
                    )}
                    {a.status !== "expired" && (
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={waLink(a.clientPhone, msgConfirm)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            if (a.status === "pending") setStatus(a.id, "confirmed");
                          }}
                          className="btn btn-primary text-sm py-1.5 px-3"
                        >
                          <MessageCircle size={16} /> Confirmar no WhatsApp
                        </a>
                        <a
                          href={waLink(a.clientPhone, msgCancel)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary text-sm py-1.5 px-3"
                        >
                          Avisar cancelamento
                        </a>
                        <button
                          className="btn btn-danger p-2"
                          onClick={() => remove(a.id)}
                          aria-label="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-[var(--muted-fg)]">Nenhum agendamento neste filtro.</p>
          )}
        </div>
      )}
    </div>
  );
}
