"use client";
import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

type Apt = {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string;
  time: string;
  status: string;
  service: { name: string; price: number };
};

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  done: "Concluído",
};

export default function AgendamentosPage() {
  const [items, setItems] = useState<Apt[]>([]);
  const [loading, setLoading] = useState(true);

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

  const pending = items.filter((i) => i.status === "pending").length;
  const confirmed = items.filter((i) => i.status === "confirmed").length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Agendamentos</h1>
      <p className="text-sm text-neutral-400 mb-6">
        Total: {items.length} · Pendentes: {pending} · Confirmados: {confirmed}
      </p>

      {loading ? (
        <Loader2 className="animate-spin text-[var(--primary)]" />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{a.clientName}</p>
                  <p className="text-sm text-neutral-400">{a.clientPhone}</p>
                  <p className="text-sm mt-1">
                    {a.service.name} · {a.date} às {a.time}
                  </p>
                  <p className="text-sm text-[var(--primary)]">
                    R$ {a.service.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
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
                  <button className="btn btn-danger p-2" onClick={() => remove(a.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-neutral-500">Nenhum agendamento ainda.</p>
          )}
        </div>
      )}
    </div>
  );
}
