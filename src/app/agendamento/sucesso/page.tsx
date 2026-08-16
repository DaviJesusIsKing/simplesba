"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2, Clock, XCircle, Copy, Check } from "lucide-react";

const statusLabel: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  done: "Concluído",
  expired: "Não confirmado a tempo",
};

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function Content() {
  const params = useSearchParams();
  const id = params.get("id");
  const [data, setData] = useState<{
    id: string;
    clientName: string;
    date: string;
    time: string;
    status: string;
    paymentMethod?: string;
    paymentStatus?: string;
    amountDue?: number;
    rejectReason?: string | null;
    expiresAt?: string | null;
    service: { name: string; price: number; duration: number };
  } | null>(null);
  const [pix, setPix] = useState({
    pixKey: "",
    pixName: "",
    pixInstructions: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!id);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  async function load() {
    if (!id) return;
    try {
      const r = await fetch(`/api/appointments/${id}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Não encontrado");
      setData(j);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch("/api/public/establishment")
      .then((r) => r.json())
      .then((d) =>
        setPix({
          pixKey: d.pixKey || "",
          pixName: d.pixName || "",
          pixInstructions: d.pixInstructions || "",
        })
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    load();
    const iv = setInterval(load, 4000);
    return () => clearInterval(iv);
  }, [id]);

  useEffect(() => {
    if (!data?.expiresAt || data.status !== "pending") {
      setSecondsLeft(null);
      return;
    }
    const tick = () => {
      const left = Math.max(
        0,
        Math.floor((new Date(data.expiresAt!).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(left);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [data?.expiresAt, data?.status]);

  async function copyPix() {
    if (!pix.pixKey) return;
    try {
      await navigator.clipboard.writeText(pix.pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setUploadMsg("Não foi possível copiar. Selecione a chave e copie manualmente.");
    }
  }

  async function onFile(file: File | null) {
    if (!file || !id) return;
    if (!file.type.startsWith("image/")) {
      setUploadMsg("Envie uma imagem JPG ou PNG");
      return;
    }
    if (file.size > 900_000) {
      setUploadMsg("Imagem grande demais (máx. ~900KB). Tire um print menor.");
      return;
    }
    setUploading(true);
    setUploadMsg("");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch("/api/appointments/receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId: id, receiptData: reader.result }),
        });
        const j = await res.json();
        if (!res.ok) {
          setUploadMsg(j.error || "Erro no envio");
        } else {
          setUploadMsg("Comprovante enviado! Aguarde a aprovação.");
          load();
        }
      } catch {
        setUploadMsg("Falha de conexão");
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
      </div>
    );
  }

  const isPending = data?.status === "pending";
  const isConfirmed = data?.status === "confirmed";
  const isExpired = data?.status === "expired";
  const isCancelled = data?.status === "cancelled";
  const isPix = data?.paymentMethod === "pix";
  const needReceipt =
    isPix &&
    isPending &&
    (data?.paymentStatus === "awaiting_receipt" || data?.paymentStatus === "rejected");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="card max-w-md w-full text-center space-y-4">
        {isConfirmed && <CheckCircle className="mx-auto text-green-400" size={48} />}
        {isPending && <Clock className="mx-auto text-amber-400" size={48} />}
        {(isExpired || isCancelled) && (
          <XCircle className="mx-auto text-red-400" size={48} />
        )}

        <h1 className="text-xl font-bold">
          {isConfirmed
            ? "Horário confirmado!"
            : isExpired
              ? "Reserva expirada"
              : isCancelled
                ? "Horário cancelado"
                : isPix
                  ? "Pague o PIX e envie o comprovante"
                  : "Aguardando confirmação"}
        </h1>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {data && (
          <>
            <p className="text-sm text-[var(--muted-fg)]">
              Olá, <strong className="text-[var(--fg)]">{data.clientName}</strong>
            </p>
            <div className="text-left rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4 text-sm space-y-2">
              <p>
                <span className="text-[var(--muted-fg)]">Serviço:</span> {data.service.name}
              </p>
              <p>
                <span className="text-[var(--muted-fg)]">Data:</span> {formatDateBR(data.date)}
              </p>
              <p>
                <span className="text-[var(--muted-fg)]">Horário:</span> {data.time}
              </p>
              <p>
                <span className="text-[var(--muted-fg)]">Pagamento:</span>{" "}
                {isPix ? "PIX antecipado" : "Na hora, no salão"}
              </p>
              {isPix && (
                <p>
                  <span className="text-[var(--muted-fg)]">Valor PIX:</span> R${" "}
                  {(data.amountDue ?? data.service.price).toFixed(2)}
                </p>
              )}
              <p className="text-xs pt-1 text-amber-300">
                Status: {statusLabel[data.status] || data.status}
                {data.paymentStatus === "paid" && " · Pago"}
                {data.paymentStatus === "rejected" && " · Comprovante recusado"}
              </p>
              {data.rejectReason && (
                <p className="text-xs text-red-300">Motivo: {data.rejectReason}</p>
              )}
            </div>

            {isPix && needReceipt && pix.pixKey && (
              <div className="text-left rounded-lg border border-[var(--primary)]/40 bg-[var(--muted)] p-4 space-y-3">
                <p className="text-sm font-semibold">Pagamento PIX</p>
                {pix.pixName && (
                  <p className="text-xs text-[var(--muted-fg)]">Recebedor: {pix.pixName}</p>
                )}
                <div className="flex gap-2">
                  <input className="input text-sm" readOnly value={pix.pixKey} />
                  <button type="button" className="btn btn-primary shrink-0" onClick={copyPix}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
                {pix.pixInstructions && (
                  <p className="text-xs text-[var(--muted-fg)]">{pix.pixInstructions}</p>
                )}
                <div>
                  <label className="label">Enviar comprovante (imagem)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-[var(--muted-fg)]"
                    disabled={uploading}
                    onChange={(e) => onFile(e.target.files?.[0] || null)}
                  />
                </div>
                {uploading && <p className="text-xs text-amber-300">Enviando…</p>}
                {uploadMsg && <p className="text-xs text-[var(--primary)]">{uploadMsg}</p>}
              </div>
            )}

            {isPending && secondsLeft !== null && (
              <p className="text-sm text-amber-300">
                Tempo da reserva:{" "}
                <strong>
                  {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
                </strong>
              </p>
            )}

            {isConfirmed && (
              <p className="text-sm text-green-400">Tudo certo! Te esperamos no horário.</p>
            )}
            {isExpired && (
              <p className="text-sm text-[var(--muted-fg)]">
                Não confirmado a tempo. Escolha outro horário.
              </p>
            )}
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/" className="btn btn-primary">
            Início
          </Link>
          <Link href="/meus-agendamentos" className="btn btn-secondary">
            Meus horários
          </Link>
          {(isExpired || isCancelled) && (
            <Link href="/agendar" className="btn btn-secondary">
              Agendar de novo
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SucessoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}
