"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Trash2, MessageCircle, Bell, BellOff } from "lucide-react";
import { ensureAdminNotifications, notifyAdmin } from "@/lib/admin-notify";

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
  hasRefundProof?: boolean;
  refundNote?: string | null;
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
      const wasFirst = firstLoad.current;

      if (!wasFirst && soundOn) {
        const newPending = data.filter(
          (i) => i.status === "pending" && !knownPending.current.has(i.id)
        );
        if (newPending.length > 0) {
          playAlertSound();
          setNewFlash(true);
          setTimeout(() => setNewFlash(false), 4000);
          const a = newPending[0];
          const extra =
            newPending.length > 1 ? ` (+${newPending.length - 1})` : "";
          void notifyAdmin(
            "Novo agendamento",
            `${a.clientName} marcou ${a.service.name} em ${a.date} às ${a.time}${extra}`,
            "/p-x7k9qm2/agendamentos"
          );
        }
        for (const i of data) {
          const key = "rcpt-" + i.id;
          if (
            i.hasReceipt &&
            i.paymentStatus === "awaiting_receipt" &&
            !knownPending.current.has(key)
          ) {
            playAlertSound();
            void notifyAdmin(
              "Comprovante PIX",
              `${i.clientName} enviou comprovante — ${i.service.name}`,
              "/p-x7k9qm2/comprovantes"
            );
          }
        }
      }

      firstLoad.current = false;
      const next = new Set<string>();
      for (const i of data) {
        if (i.status === "pending") next.add(i.id);
        if (i.hasReceipt && i.paymentStatus === "awaiting_receipt") {
          next.add("rcpt-" + i.id);
        }
      }
      knownPending.current = next;
      setItems(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const iv = setInterval(() => load(true), 8000);
    return () => clearInterval(iv);
  }, [soundOn]);

  // Lembrete sonoro enquanto houver pendentes (tipo notificação)
  useEffect(() => {
    if (!soundOn) return;
    const iv = setInterval(() => {
      const hasPending = items.some((i) => i.status === "pending");
      if (hasPending) playAlertSound();
    }, 20000);
    return () => clearInterval(iv);
  }, [soundOn, items]);

  const [cancelId, setCancelId] = useState<string | null>(null);
  const [refundNote, setRefundNote] = useState("");
  const [refundData, setRefundData] = useState("");
  const [cancelSaving, setCancelSaving] = useState(false);

  async function setStatus(
    id: string,
    status: string,
    extra?: { refundProofData?: string; refundNote?: string }
  ) {
    await fetch(`/api/admin/appointments?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extra }),
    });
    load(true);
  }

  function onStatusChange(id: string, next: string, apt: Apt) {
    if (next === "cancelled") {
      setCancelId(id);
      setRefundNote("");
      setRefundData("");
      return;
    }
    void setStatus(id, next);
  }

  async function confirmCancel() {
    if (!cancelId) return;
    setCancelSaving(true);
    await setStatus(cancelId, "cancelled", {
      refundProofData: refundData || undefined,
      refundNote: refundNote || undefined,
    });
    setCancelSaving(false);
    setCancelId(null);
  }

  async function viewRefund(id: string) {
    const r = await fetch(`/api/admin/appointments/refund?id=${id}`);
    const j = await r.json();
    if (r.ok && j.refundProofData) {
      const data = j.refundProofData as string;
      const w = window.open("");
      if (!w) return;
      if (data.startsWith("data:application/pdf")) {
        w.document.write(
          `<iframe src="${data}" style="width:100%;height:100%;border:0"></iframe>`
        );
      } else {
        w.document.write(`<img src="${data}" style="max-width:100%"/>`);
      }
    } else alert(j.error || "Sem comprovante de reembolso");
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
        <Link href="/p-x7k9qm2/novo-agendamento" className="btn btn-primary text-sm">
          + Novo agendamento
        </Link>
        <button
          type="button"
          onClick={async () => {
            if (!soundOn) {
              const ok = await ensureAdminNotifications();
              if (!ok) {
                alert(
                  "Permita notificações do site no Chrome (ícone do cadeado na barra de endereço) para receber avisos de novos agendamentos."
                );
              }
              setSoundOn(true);
              playAlertSound();
              void notifyAdmin(
                "Alertas ativados",
                "Você será avisado de novos agendamentos e comprovantes.",
                "/p-x7k9qm2/agendamentos"
              );
            } else {
              setSoundOn(false);
            }
          }}
          className={`btn text-sm ${soundOn ? "btn-primary" : "btn-secondary"}`}
        >
          {soundOn ? <Bell size={16} /> : <BellOff size={16} />}
          {soundOn ? "Alertas ON (som + Chrome)" : "Ativar alertas (som + Chrome)"}
        </button>
      </div>

      {newFlash && (
        <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-900/40 px-4 py-2 text-sm text-amber-200">
          Novo agendamento pendente!
        </div>
      )}

      <p className="text-sm text-[var(--muted-fg)] mb-4">
        Total: {items.length} · Pendentes: {pending} · Hoje: {todayCount}
        {soundOn && " · Alertas ativos (Chrome + som). Pode minimizar a aba; não feche o Chrome."}
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
                    {a.status === "cancelled" && a.hasRefundProof && (
                      <button
                        type="button"
                        className="text-xs text-[var(--primary)] underline mt-1"
                        onClick={() => viewRefund(a.id)}
                      >
                        Ver comprovante de reembolso
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 items-stretch sm:items-end">
                    <select
                      className="input w-auto text-sm py-1.5"
                      value={a.status === "expired" ? "cancelled" : a.status}
                      onChange={(e) => onStatusChange(a.id, e.target.value, a)}
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
                              const data = j.receiptData as string;
                              const w = window.open("");
                              if (w) {
                                if (data.startsWith("data:application/pdf")) {
                                  w.document.write(
                                    `<iframe src="${data}" style="width:100%;height:100%;border:0"></iframe>`
                                  );
                                } else {
                                  w.document.write(
                                    `<img src="${data}" style="max-width:100%"/>`
                                  );
                                }
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

      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-md space-y-3 shadow-xl">
            <h2 className="text-lg font-semibold">Cancelar agendamento</h2>
            <p className="text-sm text-[var(--muted-fg)]">
              Se o cliente já pagou no PIX, anexe o comprovante do reembolso para
              ficar organizado no histórico.
            </p>
            <div>
              <label className="label">Observação (opcional)</label>
              <input
                className="input"
                value={refundNote}
                onChange={(e) => setRefundNote(e.target.value)}
                placeholder="Ex.: reembolsado via PIX em 22/08"
              />
            </div>
            <div>
              <label className="label">Foto/PDF do reembolso (opcional)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="block w-full text-sm text-[var(--muted-fg)]"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 1_200_000) {
                    alert("Arquivo grande demais (~1,2 MB)");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => setRefundData(String(reader.result || ""));
                  reader.readAsDataURL(file);
                }}
              />
              {refundData && (
                <p className="text-xs text-green-400 mt-1">Arquivo anexado</p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="btn btn-secondary flex-1"
                onClick={() => setCancelId(null)}
                disabled={cancelSaving}
              >
                Voltar
              </button>
              <button
                type="button"
                className="btn btn-danger flex-1"
                onClick={() => void confirmCancel()}
                disabled={cancelSaving}
              >
                {cancelSaving ? "Salvando…" : "Confirmar cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
