"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Calendar } from "lucide-react";

type Item = {
  id: string;
  clientName: string;
  date: string;
  time: string;
  status: string;
  service: { name: string; price: number; duration: number };
};

const statusLabel: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  done: "Concluído",
  expired: "Não confirmado a tempo",
};

const statusColor: Record<string, string> = {
  pending: "text-amber-300",
  confirmed: "text-green-400",
  cancelled: "text-red-400",
  done: "text-blue-300",
  expired: "text-neutral-400",
};

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export default function MeusAgendamentosPage() {
  const [phone, setPhone] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/my-appointments?phone=${encodeURIComponent(phone)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro na busca");
        setItems([]);
      } else {
        setItems(data.items || []);
      }
    } catch {
      setError("Falha de conexão");
      setItems([]);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted-fg)] hover:text-[var(--primary)] mb-6"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>

        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Calendar className="text-[var(--primary)]" size={24} />
          Meus agendamentos
        </h1>
        <p className="text-sm text-[var(--muted-fg)] mb-6">
          Digite o WhatsApp/telefone usado no agendamento para ver o status.
        </p>

        <form onSubmit={search} className="card space-y-3 mb-6">
          <div>
            <label className="label">Telefone / WhatsApp</label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="11999998888"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 bg-red-900/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Consultar"}
          </button>
        </form>

        {searched && !loading && items.length === 0 && !error && (
          <p className="text-sm text-[var(--muted-fg)] text-center">
            Nenhum agendamento encontrado para este número.
          </p>
        )}

        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="card">
              <p className="font-semibold">{a.service.name}</p>
              <p className="text-sm text-[var(--muted-fg)]">
                {formatDateBR(a.date)} às {a.time} · {a.service.duration} min
              </p>
              <p className="text-sm text-[var(--primary)]">
                R$ {a.service.price.toFixed(2)}
              </p>
              <p className={`text-sm mt-2 ${statusColor[a.status] || ""}`}>
                {statusLabel[a.status] || a.status}
              </p>
              <Link
                href={`/agendamento/sucesso?id=${a.id}`}
                className="text-xs text-[var(--muted-fg)] hover:text-[var(--primary)] mt-2 inline-block"
              >
                Ver detalhes →
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/agendar" className="btn btn-secondary">
            Agendar novo horário
          </Link>
        </div>
      </div>
    </div>
  );
}
