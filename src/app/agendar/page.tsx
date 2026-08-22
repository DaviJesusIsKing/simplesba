"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";

type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
};

export default function AgendarPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState<{
    serviceName: string;
    date: string;
    time: string;
    name: string;
  } | null>(null);
  const [closedDay, setClosedDay] = useState(false);
  const [timesError, setTimesError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"local" | "pix">("local");
  const [policy, setPolicy] = useState("both");
  const [hasPix, setHasPix] = useState(false);
  const [chargeMode, setChargeMode] = useState("full");
  const [chargePercent, setChargePercent] = useState(50);
  const [pixAmount, setPixAmount] = useState<"half" | "full">("half");

  useEffect(() => {
    fetch("/api/admin/services")
      .then(() => fetch("/api/services").catch(() => null))
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (Array.isArray(d)) setServices(d);
      })
      .catch(() => {});
    fetch("/api/public/establishment")
      .then((r) => r.json())
      .then((d) => {
        const pol = d.paymentPolicy || "both";
        setPolicy(pol);
        setHasPix(!!(d.pixKey || "").trim());
        setChargeMode(d.pixChargeMode || "full");
        setChargePercent(Number(d.pixChargePercent) || 50);
        if (pol === "pix_only") setPaymentMethod("pix");
        if (pol === "local_only") setPaymentMethod("local");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!date) {
      setTimes([]);
      setTime("");
      return;
    }
    setLoadingTimes(true);
    setTime("");
    setClosedDay(false);
    setTimesError("");
    const q = new URLSearchParams({ date });
    if (serviceId) q.set("serviceId", serviceId);
    fetch(`/api/available-times?${q.toString()}`)
      .then(async (r) => {
        const d = await r.json();
        setTimes(d.times || []);
        setClosedDay(!!d.closed);
        if (d.error) setTimesError(d.error);
        if (d.message && d.closed) setTimesError(d.message);
      })
      .catch(() => setTimesError("Erro ao carregar horários"))
      .finally(() => setLoadingTimes(false));
  }, [date, serviceId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, date, time, clientName, clientPhone, paymentMethod, pixAmount }),
      });
      const data = await res.json().catch(() => ({}));
      setSaving(false);
      if (!res.ok) {
        setError(data.error || data.message || `Erro ao agendar (${res.status})`);
        return;
      }
      const id = data.appointment?.id || data.id;
      if (id) {
        router.push(`/agendamento/sucesso?id=${id}`);
        return;
      }
      const svc = services.find((s) => s.id === serviceId);
      setSummary({
        serviceName: svc?.name || "Serviço",
        date,
        time,
        name: clientName,
      });
      setDone(true);
    } catch {
      setSaving(false);
      setError("Falha de conexão ao agendar. Tente de novo.");
    }
  }

  const minDate = new Date().toISOString().slice(0, 10);

  if (done) {
    const d = summary?.date || date;
    const tm = summary?.time || time;
    const nm = summary?.name || clientName;
    const sn = summary?.serviceName || "Serviço";
    const [yy, mm, dd] = d.split("-");
    const dateBr = yy && mm && dd ? `${dd}/${mm}/${yy}` : d;

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg)] text-[var(--fg)]">
        <div className="card max-w-md w-full text-center space-y-4">
          <CheckCircle className="mx-auto text-green-400" size={48} />
          <h1 className="text-xl font-bold">Pedido recebido!</h1>
          <p className="text-[var(--muted-fg)] text-sm">
            Obrigado, <strong className="text-[var(--fg)]">{nm}</strong>. Seu agendamento foi registrado e aguarda confirmação da barbearia.
          </p>
          <div className="text-left rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4 text-sm space-y-2">
            <p><span className="text-[var(--muted-fg)]">Serviço:</span> {sn}</p>
            <p><span className="text-[var(--muted-fg)]">Data:</span> {dateBr}</p>
            <p><span className="text-[var(--muted-fg)]">Horário:</span> {tm}</p>
            <p className="text-amber-300 text-xs pt-1">Status: aguardando confirmação</p>
          </div>
          <p className="text-xs text-[var(--muted-fg)]">
            Você pode receber a confirmação pelo WhatsApp informado.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/" className="btn btn-primary">
              Voltar ao início
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setDone(false);
                setSummary(null);
                setServiceId("");
                setDate("");
                setTime("");
                setClientName("");
                setClientPhone("");
              }}
            >
              Novo agendamento
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:py-10 pb-28 bg-[var(--bg)] text-[var(--fg)]">
      <div className="mx-auto max-w-lg w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--muted-fg)] hover:text-[var(--primary)] mb-6">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <h1 className="text-2xl font-bold mb-6">Agendar horário</h1>
        <form onSubmit={submit} className="card space-y-4">
          {error && (
            <p className="text-sm text-red-400 bg-red-900/30 rounded-lg px-3 py-2">{error}</p>
          )}
          <div>
            <label className="label">Serviço</label>
            <select
              className="input"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              required
            >
              <option value="">Selecione...</option>
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
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Horário</label>
            {loadingTimes ? (
              <Loader2 className="animate-spin text-[var(--primary)]" size={20} />
            ) : (
              <div className="flex flex-wrap gap-2">
                {closedDay && date && (
                  <p className="text-sm text-amber-400">Fechado neste dia da semana. Escolha outro dia.</p>
                )}
                {!closedDay && times.length === 0 && date && (
                  <p className="text-sm text-[var(--muted-fg)]">Nenhum horário disponível neste dia.</p>
                )}
                {times.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTime(t)}
                    className={`rounded-lg px-3 py-1.5 text-sm border ${
                      time === t
                        ? "slot-btn slot-btn-active"
                        : "slot-btn"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="label">Seu nome</label>
            <input
              className="input"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">WhatsApp / Telefone</label>
            <input
              className="input"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="11999998888"
              required
            />
          </div>
          {/* Pagamento */}
          {policy === "local_only" ? (
            <p className="text-sm text-[var(--muted-fg)]">
              Pagamento apenas no salão, na hora do atendimento.
            </p>
          ) : (
            <div className="space-y-3">
              <label className="label">Como deseja pagar?</label>

              {policy !== "pix_only" && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod("local")}
                  className={`w-full rounded-lg border px-3 py-3 text-sm text-left ${
                    paymentMethod === "local"
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-[var(--border)]"
                  }`}
                >
                  <strong>Pagar na hora (no salão)</strong>
                  <span className="block text-xs text-[var(--muted-fg)] mt-1">
                    {serviceId
                      ? `Total no dia: R$ ${(services.find((s) => s.id === serviceId)?.price ?? 0).toFixed(2)}`
                      : "Paga o valor cheio no salão"}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => hasPix && setPaymentMethod("pix")}
                disabled={!hasPix}
                className={`w-full rounded-lg border px-3 py-3 text-sm text-left ${
                  paymentMethod === "pix"
                    ? "border-[var(--primary)] bg-[var(--primary)]/10"
                    : "border-[var(--border)]"
                } ${!hasPix ? "opacity-50" : ""}`}
              >
                <strong>Pagar antecipado no PIX</strong>
                <span className="block text-xs text-[var(--muted-fg)] mt-1">
                  {hasPix
                    ? "Escolha abaixo: sinal ou valor cheio"
                    : "PIX ainda não configurado pelo estabelecimento"}
                </span>
              </button>

              {paymentMethod === "pix" && hasPix && serviceId && (() => {
                const total = services.find((s) => s.id === serviceId)?.price ?? 0;
                const sinal = Math.round(total * chargePercent) / 100;
                const resto = Math.round((total - sinal) * 100) / 100;
                return (
                  <div className="space-y-2 pl-1">
                    <p className="text-sm font-medium">Quanto pagar no PIX agora?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPixAmount("half")}
                        className={`rounded-lg border px-3 py-3 text-sm text-left ${
                          pixAmount === "half"
                            ? "border-[var(--primary)] bg-[var(--primary)]/15"
                            : "border-[var(--border)]"
                        }`}
                      >
                        <strong>Sinal de {chargePercent}%</strong>
                        <span className="block text-lg font-bold text-[var(--primary)] mt-1">
                          R$ {sinal.toFixed(2)}
                        </span>
                        <span className="block text-xs text-[var(--muted-fg)] mt-1">
                          Restante no salão: R$ {resto.toFixed(2)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPixAmount("full")}
                        className={`rounded-lg border px-3 py-3 text-sm text-left ${
                          pixAmount === "full"
                            ? "border-[var(--primary)] bg-[var(--primary)]/15"
                            : "border-[var(--border)]"
                        }`}
                      >
                        <strong>Valor cheio</strong>
                        <span className="block text-lg font-bold text-[var(--primary)] mt-1">
                          R$ {total.toFixed(2)}
                        </span>
                        <span className="block text-xs text-[var(--muted-fg)] mt-1">
                          Nada a pagar no salão (só o serviço já quitado)
                        </span>
                      </button>
                    </div>
                    <div className="rounded-lg border-2 border-[var(--primary)]/50 bg-[var(--primary)]/10 p-3 text-sm space-y-2">
                      <p className="text-[var(--muted-fg)]">Você vai pagar agora:</p>
                      <p className="text-2xl font-bold">
                        R${" "}
                        {(pixAmount === "half" ? sinal : total).toFixed(2)}
                      </p>
                      <div className="text-xs space-y-1.5 border-t border-[var(--border)] pt-2 text-[var(--muted-fg)]">
                        <p className="font-medium text-[var(--fg)]">Como funciona:</p>
                        <p>1. Confirme o agendamento nesta tela.</p>
                        <p>2. Na próxima página: copie a chave ou leia o QR e pague o PIX.</p>
                        <p>3. Envie o comprovante (foto ou PDF) na própria página.</p>
                        <p className="text-amber-300 font-medium">
                          Se a aba fechar: abra <strong>Meus horários</strong> no menu,
                          digite o mesmo WhatsApp e envie o comprovante por lá.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="sticky bottom-3 z-10 pt-2 sm:static">
            <button
              type="submit"
              className="btn btn-primary w-full shadow-lg shadow-black/30"
              disabled={saving || !time || !serviceId}
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : "Confirmar agendamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
