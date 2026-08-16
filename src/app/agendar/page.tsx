"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";

type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
};

export default function AgendarPage() {
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
  const [closedDay, setClosedDay] = useState(false);
  const [timesError, setTimesError] = useState("");

  useEffect(() => {
    fetch("/api/admin/services")
      .then(() => fetch("/api/services").catch(() => null))
      .catch(() => null);
  }, []);

  useEffect(() => {
    // public services via prisma page - load from a simple public endpoint
    fetch("/api/services")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (Array.isArray(d)) setServices(d);
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
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId, date, time, clientName, clientPhone }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Erro ao agendar");
      return;
    }
    setDone(true);
  }

  const minDate = new Date().toISOString().slice(0, 10);

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center space-y-4">
          <CheckCircle className="mx-auto text-green-400" size={48} />
          <h1 className="text-xl font-bold">Agendamento enviado!</h1>
          <p className="text-[var(--muted-fg)] text-sm">
            {clientName}, seu horário em {date} às {time} foi registrado.
            Aguarde a confirmação da barbearia.
          </p>
          <Link href="/" className="btn btn-primary inline-flex">
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-lg">
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
                        ? "border-[var(--primary)] bg-[var(--primary)] text-black"
                        : "border-[var(--border)] text-[var(--fg)] hover:border-[var(--primary)]"
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
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={saving || !time || !serviceId}
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : "Confirmar agendamento"}
          </button>
        </form>
      </div>
    </div>
  );
}
