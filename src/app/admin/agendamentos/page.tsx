"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Trash2, MessageCircle } from "lucide-react";

type Apt = {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string;
  time: string;
  status: string;
  service: { name: string; price: number; duration: number };
};

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  done: "Concluído",
};

const statusColor: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  confirmed: "bg-green-500/20 text-green-300 border-green-500/40",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/40",
  done: "bg-blue-500/20 text-blue-300 border-blue-500/40",
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

export default function AgendamentosPage() {
  const [items, setItems] = useState<Apt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "today" | "pending" | "upcoming">("pending");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/appointments");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    await fetch(`/api/admin/appointments?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este agendamento?")) return;
    await fetch(`/api/admin/appointments?id=${id}`, { method: "DELETE" });
    load();
  }

  const today = todayISO();

  const filtered = useMemo(() => {
    let list = [...items];
    if (filter === "pending") list = list.filter((i) => i.status === "pending");
    if (filter === "today") list = list.filter((i) => i.date === today);
    if (filter === "upcoming") {
      list = list.filter(
        (i) => i.date >= today && i.status !== "cancelled" && i.status !== "done"
      );
    }
    list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
    return list;
  }, [items, filter, today]);

  const pending = items.filter((i) => i.status === "pending").length;
  const todayCount = items.filter((i) => i.date === today && i.status !== "cancelled").length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Agendamentos</h1>
      <p className="text-sm text-[var(--muted-fg)] mb-4">
        Total: {items.length} · Pendentes: {pending} · Hoje: {todayCount}
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

      {loading ? (
        <Loader2 className="animate-spin text-[var(--primary)]" />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const msgConfirm = `Olá ${a.clientName}! Seu horário está *confirmado* ✅\n\n📌 Serviço: ${a.service.name}\n📅 Data: ${formatDateBR(a.date)}\n⏰ Horário: ${a.time}\n\nTe esperamos!`;
            const msgCancel = `Olá ${a.clientName}, infelizmente precisamos *cancelar* seu horário de ${a.service.name} em ${formatDateBR(a.date)} às ${a.time}. Por favor, escolha outro horário no site ou responda esta mensagem.`;

            return (
              <div key={a.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold">{a.clientName}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[a.status] || ""}`}
                      >
                        {statusLabel[a.status] || a.status}
                      </span>
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
                  </div>

                  <div className="flex flex-col gap-2 items-stretch sm:items-end">
                    <select
                      className="input w-auto text-sm py-1.5"
                      value={a.status}
                      onChange={(e) => setStatus(a.id, e.target.value)}
                    >
                      <option value="pending">{statusLabel.pending}</option>
                      <option value="confirmed">{statusLabel.confirmed}</option>
                      <option value="done">{statusLabel.done}</option>
                      <option value="cancelled">{statusLabel.cancelled}</option>
                    </select>

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
