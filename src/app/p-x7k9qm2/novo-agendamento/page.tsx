"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, UserPlus } from "lucide-react";

type Service = { id: string; name: string; price: number; duration: number };

export default function NovoAgendamentoAdminPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"local" | "pix">("local");
  const [pixAmount, setPixAmount] = useState<"half" | "full">("half");
  const [status, setStatus] = useState<"confirmed" | "pending">("confirmed");
  const [chargePercent, setChargePercent] = useState(50);
  const [hasPix, setHasPix] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/services")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setServices(Array.isArray(d) ? d : []))
      .catch(() => setServices([]));
    fetch("/api/public/establishment")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setHasPix(!!(d.pixKey || "").trim());
        setChargePercent(Number(d.pixChargePercent) || 50);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!date || !serviceId) {
      setTimes([]);
      setTime("");
      return;
    }
    setLoadingTimes(true);
    setTime("");
    fetch(
      `/api/available-times?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(serviceId)}`
    )
      .then((r) => r.json())
      .then((d) => {
        setTimes(d.times || []);
        if (d.closed) setError(d.message || "Fechado neste dia");
        else setError("");
      })
      .catch(() => setError("Erro ao carregar horários"))
      .finally(() => setLoadingTimes(false));
  }, [date, serviceId]);

  const svc = services.find((s) => s.id === serviceId);
  const total = svc?.price ?? 0;
  const sinal = Math.round(total * chargePercent) / 100;
  const pixNow = paymentMethod === "pix" ? (pixAmount === "half" ? sinal : total) : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          date,
          time,
          clientName,
          clientPhone,
          paymentMethod,
          pixAmount,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao agendar");
        setSaving(false);
        return;
      }
      setMsg("Agendamento criado!");
      setTimeout(() => router.push("/p-x7k9qm2/agendamentos"), 800);
    } catch {
      setError("Falha de conexão");
      setSaving(false);
    }
  }

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserPlus className="text-[var(--primary)]" size={24} />
          Novo agendamento
        </h1>
        <Link href="/p-x7k9qm2/agendamentos" className="btn btn-secondary text-sm">
          Voltar à lista
        </Link>
      </div>

      <p className="text-sm text-[var(--muted-fg)] mb-4">
        Use quando o cliente ligar ou estiver no salão. Você escolhe horário e forma de pagamento.
      </p>

      <form onSubmit={submit} className="card max-w-lg space-y-4">
        {error && (
          <p className="text-sm text-red-400 bg-red-900/30 rounded-lg px-3 py-2">{error}</p>
        )}
        {msg && (
          <p className="text-sm text-green-400 bg-green-900/20 rounded-lg px-3 py-2">{msg}</p>
        )}

        <div>
          <label className="label">Cliente — nome</label>
          <input
            className="input"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            placeholder="Nome do cliente"
          />
        </div>
        <div>
          <label className="label">Telefone / WhatsApp</label>
          <input
            className="input"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            required
            placeholder="11999998888"
          />
        </div>

        <div>
          <label className="label">Serviço</label>
          <select
            className="input"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            required
          >
            <option value="">Selecione…</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — R$ {s.price.toFixed(2)} ({s.duration} min)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Data</label>
          <input
            type="date"
            className="input"
            value={date}
            min={minDate}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Horário disponível</label>
          {loadingTimes ? (
            <Loader2 className="animate-spin text-[var(--primary)]" size={20} />
          ) : (
            <div className="flex flex-wrap gap-2">
              {times.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className={time === t ? "slot-btn slot-btn-active" : "slot-btn"}
                >
                  {t}
                </button>
              ))}
              {date && serviceId && times.length === 0 && !loadingTimes && (
                <p className="text-sm text-[var(--muted-fg)]">Nenhum horário livre neste dia.</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="label">Forma de pagamento</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("local")}
              className={`rounded-lg border px-3 py-3 text-sm text-left ${
                paymentMethod === "local"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-[var(--border)]"
              }`}
            >
              <strong>Pagar na hora</strong>
              <span className="block text-xs text-[var(--muted-fg)] mt-1">
                {svc ? `Total R$ ${total.toFixed(2)}` : "No salão"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => hasPix && setPaymentMethod("pix")}
              disabled={!hasPix}
              className={`rounded-lg border px-3 py-3 text-sm text-left ${
                paymentMethod === "pix"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-[var(--border)]"
              } ${!hasPix ? "opacity-50" : ""}`}
            >
              <strong>PIX</strong>
              <span className="block text-xs text-[var(--muted-fg)] mt-1">
                {hasPix ? "Sinal ou valor cheio" : "Configure a chave PIX"}
              </span>
            </button>
          </div>
        </div>

        {paymentMethod === "pix" && svc && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPixAmount("half")}
              className={`rounded-lg border px-3 py-2 text-sm ${
                pixAmount === "half"
                  ? "border-[var(--primary)] bg-[var(--primary)]/15"
                  : "border-[var(--border)]"
              }`}
            >
              Sinal {chargePercent}% — R$ {sinal.toFixed(2)}
            </button>
            <button
              type="button"
              onClick={() => setPixAmount("full")}
              className={`rounded-lg border px-3 py-2 text-sm ${
                pixAmount === "full"
                  ? "border-[var(--primary)] bg-[var(--primary)]/15"
                  : "border-[var(--border)]"
              }`}
            >
              Cheio — R$ {total.toFixed(2)}
            </button>
            <p className="col-span-2 text-xs text-[var(--muted-fg)]">
              Cliente deve pagar agora: <strong>R$ {pixNow.toFixed(2)}</strong>
              {pixAmount === "half" && total - sinal > 0
                ? ` · resto no salão R$ ${(total - sinal).toFixed(2)}`
                : ""}
            </p>
          </div>
        )}

        <div>
          <label className="label">Status inicial</label>
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as "confirmed" | "pending")}
          >
            <option value="confirmed">Já confirmado (ex.: cliente no salão / telefone)</option>
            <option value="pending">Pendente (aguardar)</option>
          </select>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={saving || !time || !serviceId}
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : "Salvar agendamento"}
        </button>
      </form>
    </div>
  );
}
