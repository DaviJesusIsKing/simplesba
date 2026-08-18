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
  paymentMethod?: string;
  paymentStatus?: string;
  amountDue?: number;
  hasReceipt?: boolean;
  rejectReason?: string | null;
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
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function search(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError("");
    setMsg("");
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

  function canUpload(a: Item) {
    if (a.paymentMethod !== "pix") return false;
    if (a.status === "expired" || a.status === "cancelled") return false;
    if (a.paymentStatus === "paid") return false;
    return true; // awaiting_receipt or rejected — obrigatório enviar
  }

  async function onFile(id: string, file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg("Envie uma imagem JPG ou PNG");
      return;
    }
    if (file.size > 900_000) {
      setMsg("Imagem grande demais (máx. ~900KB)");
      return;
    }
    setUploadingId(id);
    setMsg("");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch("/api/appointments/receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId: id, receiptData: reader.result }),
        });
        const j = await res.json();
        if (!res.ok) setMsg(j.error || "Erro no envio");
        else {
          setMsg("Comprovante enviado! Aguarde a aprovação do admin.");
          search();
        }
      } catch {
        setMsg("Falha de conexão");
      }
      setUploadingId(null);
    };
    reader.readAsDataURL(file);
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
          Digite o telefone do agendamento. Se escolheu PIX e fechou a página, envie o
          comprovante aqui.
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
          {msg && <p className="text-sm text-[var(--primary)]">{msg}</p>}
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
            <div key={a.id} className="card space-y-2">
              <p className="font-semibold">{a.service.name}</p>
              <p className="text-sm text-[var(--muted-fg)]">
                {formatDateBR(a.date)} às {a.time} · {a.service.duration} min
              </p>
              <p className="text-sm text-[var(--primary)]">
                R$ {a.service.price.toFixed(2)}
                {a.paymentMethod === "pix" && typeof a.amountDue === "number"
                  ? ` · PIX R$ ${a.amountDue.toFixed(2)}`
                  : ""}
              </p>
              <p className={`text-sm ${statusColor[a.status] || ""}`}>
                {statusLabel[a.status] || a.status}
              </p>
              {a.paymentMethod === "pix" && (
                <p className="text-xs text-amber-300">
                  {a.paymentStatus === "paid" && "Pagamento aprovado"}
                  {a.paymentStatus === "awaiting_receipt" &&
                    (a.hasReceipt
                      ? "Comprovante enviado — aguardando admin"
                      : "Obrigatório: envie o comprovante PIX")}
                  {a.paymentStatus === "rejected" &&
                    `Comprovante recusado${a.rejectReason ? `: ${a.rejectReason}` : ""} — envie de novo`}
                </p>
              )}
              {a.paymentMethod === "local" && (
                <p className="text-xs text-[var(--muted-fg)]">Pagamento na hora, no salão</p>
              )}

              {canUpload(a) && (
                <div className="pt-2 border-t border-[var(--border)]">
                  <label className="label">Enviar comprovante (imagem)</label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingId === a.id}
                    className="block w-full text-sm text-[var(--muted-fg)]"
                    onChange={(e) => onFile(a.id, e.target.files?.[0] || null)}
                  />
                  {uploadingId === a.id && (
                    <p className="text-xs text-amber-300 mt-1">Enviando…</p>
                  )}
                </div>
              )}

              <Link
                href={`/agendamento/sucesso?id=${a.id}`}
                className="text-xs text-[var(--muted-fg)] hover:text-[var(--primary)] inline-block"
              >
                Ver detalhes / PIX →
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
