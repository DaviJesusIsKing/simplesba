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
  const token = params.get("token");
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
    pixQrData: "",
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
      const r = await fetch(`/api/appointments/${id}?token=${encodeURIComponent(token || "")}`, { cache: "no-store" });
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
          pixQrData: d.pixQrData || "",
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
    const iv = setInterval(load, 2500);
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
    const okType =
      file.type.startsWith("image/") || file.type === "application/pdf";
    if (!okType) {
      setUploadMsg("Envie imagem (JPG/PNG) ou PDF");
      return;
    }
    if (file.size > 1_200_000) {
      setUploadMsg("Arquivo grande demais (máx. ~1,2 MB).");
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
          body: JSON.stringify({ appointmentId: id, accessToken: token, receiptData: reader.result }),
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
      </div>
    );
  }

  const isPending = data?.status === "pending";
  const isConfirmed = data?.status === "confirmed";
  const isExpired = data?.status === "expired";
  const isCancelled = data?.status === "cancelled";
  const isPix = data?.paymentMethod === "pix";
  const isPaid = data?.paymentStatus === "paid";
  const needReceipt =
    isPix &&
    isPending &&
    (data?.paymentStatus === "awaiting_receipt" || data?.paymentStatus === "rejected");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6 sm:py-10 pb-8 bg-[var(--bg)] text-[var(--fg)]">
      <div className="card max-w-md w-full text-center space-y-4">
        <div
          className={`rounded-2xl px-4 py-4 ${
            isConfirmed
              ? "bg-green-500/15 border border-green-500/40"
              : isCancelled || isExpired
                ? "bg-red-500/15 border border-red-500/40"
                : "bg-amber-500/15 border border-amber-500/40"
          }`}
        >
          {isConfirmed && <CheckCircle className="mx-auto text-green-400" size={40} />}
          {isPending && <Clock className="mx-auto text-amber-300" size={40} />}
          {(isExpired || isCancelled) && (
            <XCircle className="mx-auto text-red-400" size={40} />
          )}
          <p className="mt-2 text-xs uppercase tracking-wide text-[var(--muted-fg)]">
            Status
          </p>
          <h1 className="text-xl font-bold leading-tight">
            {isConfirmed
              ? "Confirmado"
              : isExpired
                ? "Expirado"
                : isCancelled
                  ? "Cancelado"
                  : "Pendente"}
          </h1>
          <p className="text-sm text-[var(--muted-fg)] mt-1">
            {isConfirmed
              ? "A barbearia aceitou seu horário."
              : isExpired
                ? "A reserva passou do tempo."
                : isCancelled
                  ? "A barbearia cancelou este horário."
                  : isPix
                    ? "Pague o PIX e envie o comprovante. Depois aguarde a confirmação."
                    : "Aguardando a barbearia confirmar."}
          </p>
        </div>

        {isCancelled && (
          <div className="rounded-xl border-2 border-red-500/50 bg-red-500/15 p-4 text-left space-y-2">
            <p className="text-red-300 font-semibold text-base">
              Este horário foi cancelado
            </p>
            <p className="text-sm text-[var(--muted-fg)]">
              A barbearia cancelou seu agendamento. Se você já pagou um sinal no PIX,
              fale pelo WhatsApp do salão sobre o reembolso. Você pode marcar outro
              horário quando quiser.
            </p>
          </div>
        )}

        {isConfirmed && !isCancelled && (
          <div className="rounded-xl border-2 border-green-500/50 bg-green-500/15 p-4 text-left space-y-2">
            <p className="text-green-300 font-semibold text-base">
              Seu horário está agendado
            </p>
            <p className="text-sm text-[var(--muted-fg)]">
              A barbearia confirmou seu atendimento. Guarde data e horário e
              compareça no horário marcado. Qualquer imprevisto, fale pelo WhatsApp
              do salão.
            </p>
            {data && (
              <p className="text-sm text-green-200/90 font-medium">
                {data.service.name} · {formatDateBR(data.date)} às {data.time}
              </p>
            )}
          </div>
        )}

        {isPending && !isPix && (
          <p className="text-sm text-amber-200/90">
            Deixe esta página aberta. Assim que a barbearia confirmar, a tela
            fica verde automaticamente.
          </p>
        )}
        {isPending && isPix && (
          <p className="text-xs text-[var(--muted-fg)]">
            Depois do pagamento, a barbearia ainda precisa confirmar. Se você
            permanecer nesta página, verá a confirmação em verde na hora.
          </p>
        )}

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
              {isPix && (() => {
                const total = data.service.price;
                const pix = data.amountDue ?? total;
                const resto = Math.round((total - pix) * 100) / 100;
                const isSinal = pix < total - 0.001;
                return (
                  <>
                    <p>
                      <span className="text-[var(--muted-fg)]">Valor do serviço:</span> R${" "}
                      {total.toFixed(2)}
                    </p>
                    <p>
                      <span className="text-[var(--muted-fg)]">
                        {isSinal ? "Sinal (PIX agora):" : "PIX (valor total):"}
                      </span>{" "}
                      <strong className="text-[var(--primary)]">R$ {pix.toFixed(2)}</strong>
                    </p>
                    {isSinal && (
                      <p>
                        <span className="text-[var(--muted-fg)]">Restante no salão:</span> R${" "}
                        {resto.toFixed(2)}
                      </p>
                    )}
                  </>
                );
              })()}
              <p className="text-xs pt-1 text-amber-300">
                Status: {statusLabel[data.status] || data.status}
                {data.paymentStatus === "paid" && " · Pago"}
                {data.paymentStatus === "rejected" && " · Comprovante recusado"}
              </p>
              {data.rejectReason && (
                <p className="text-xs text-red-300">Motivo: {data.rejectReason}</p>
              )}
            </div>

            {isPix && needReceipt && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-left space-y-1.5">
                <p className="font-semibold text-amber-200">Importante</p>
                <p className="text-[var(--muted-fg)] text-xs">
                  Pague o PIX e envie o comprovante nesta página. A reserva pode expirar se demorar.
                </p>
                <p className="text-amber-200 text-xs">
                  Se a aba fechar: vá em <strong>Meus horários (comprovante)</strong>, digite o mesmo WhatsApp
                  do agendamento e envie o comprovante por lá.
                </p>
              </div>
            )}

            {isPix && needReceipt && pix.pixKey && (
              <div className="text-left rounded-lg border border-[var(--primary)]/40 bg-[var(--muted)] p-4 space-y-3">
                <p className="text-sm font-semibold">Pagar e enviar comprovante</p>
                <ol className="text-xs text-[var(--muted-fg)] list-decimal pl-4 space-y-1">
                  <li>Copie a chave ou leia o QR no app do banco.</li>
                  <li>Pague o valor indicado (exatamente).</li>
                  <li>Envie o print ou PDF do comprovante no botão abaixo.</li>
                  <li>Aguarde a confirmação da barbearia (o status atualiza aqui).</li>
                </ol>
                {pix.pixName && (
                  <p className="text-xs text-[var(--muted-fg)]">Recebedor: {pix.pixName}</p>
                )}
                {pix.pixQrData && (
                  <div className="flex justify-center">
                    <img
                      src={pix.pixQrData}
                      alt="QR Code PIX"
                      className="h-40 w-40 rounded-lg border border-[var(--border)] object-contain bg-white p-2"
                    />
                  </div>
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
                <div className="rounded-xl border-2 border-dashed border-[var(--primary)] bg-[var(--primary)]/10 p-4 text-center space-y-3">
                  <p className="font-semibold text-[var(--primary)]">
                    Enviar comprovante agora
                  </p>
                  <p className="text-xs text-[var(--muted-fg)]">
                    Envie print do PIX (JPG/PNG) ou o PDF do comprovante
                  </p>
                  <label className="btn btn-primary w-full cursor-pointer">
                    {uploading ? "Enviando…" : "Escolher imagem ou PDF"}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => onFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {uploadMsg && (
                    <p className="text-sm text-[var(--primary)]">{uploadMsg}</p>
                  )}
                </div>
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
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}
