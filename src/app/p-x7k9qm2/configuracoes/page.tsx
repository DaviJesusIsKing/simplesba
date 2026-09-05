"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ImagePicker } from "@/components/ImagePicker";

const DAYS = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda" },
  { value: "2", label: "Terça" },
  { value: "3", label: "Quarta" },
  { value: "4", label: "Quinta" },
  { value: "5", label: "Sexta" },
  { value: "6", label: "Sábado" },
];

const defaults = {
  name: "",
  description: "",
  address: "",
  mapsUrl: "",
  phone: "",
  whatsapp: "",
  instagram: "",
  openTime: "09:00",
  closeTime: "19:00",
  lunchEnabled: false,
  lunchStart: "12:00",
  lunchEnd: "13:00",
  openDays: "1,2,3,4,5,6",
  primaryColor: "#d4a017",
  bgColor: "#0f0f0f",
  cardColor: "#1a1a1a",
  pixKey: "",
  pixName: "",
  pixInstructions: "",
  pixChargeMode: "full",
  pixChargePercent: "50",
  paymentPolicy: "both",
  hoursByDay: "{}",
  pixQrData: "",
  showProducts: true,
  bannerImage: "",
  telegramEnabled: false,
  telegramBotToken: "",
  telegramChatId: "",
};

const PRESETS = [
  {
    id: "classic",
    name: "Barbearia clássica",
    desc: "Preto + dourado",
    primaryColor: "#d4a017",
    bgColor: "#0f0f0f",
    cardColor: "#1a1a1a",
  },
  {
    id: "rose",
    name: "Salão rosa",
    desc: "Rosa suave + fundo escuro",
    primaryColor: "#e8a0bf",
    bgColor: "#1a1216",
    cardColor: "#2a1f24",
  },
  {
    id: "pink-light",
    name: "Salão claro",
    desc: "Rosa + fundo claro",
    primaryColor: "#db2777",
    bgColor: "#fdf2f8",
    cardColor: "#ffffff",
  },
  {
    id: "blue",
    name: "Moderno azul",
    desc: "Azul + escuro",
    primaryColor: "#3b82f6",
    bgColor: "#0b1220",
    cardColor: "#152033",
  },
  {
    id: "green",
    name: "Fresh verde",
    desc: "Verde + escuro",
    primaryColor: "#22c55e",
    bgColor: "#0c1410",
    cardColor: "#15241c",
  },
  {
    id: "purple",
    name: "Premium roxo",
    desc: "Roxo + escuro",
    primaryColor: "#a855f7",
    bgColor: "#12081a",
    cardColor: "#1f1229",
  },
  {
    id: "silver",
    name: "Minimal prata",
    desc: "Prata + preto",
    primaryColor: "#c0c0c0",
    bgColor: "#0a0a0a",
    cardColor: "#171717",
  },
  {
    id: "copper",
    name: "Cobre quente",
    desc: "Cobre + marrom escuro",
    primaryColor: "#c97b4a",
    bgColor: "#140f0c",
    cardColor: "#241c16",
  },
];

export default function ConfigPage() {
  const [form, setForm] = useState(defaults);
  const [loading, setLoading] = useState(false);
  const [loadingHint, setLoadingHint] = useState(true);
  const [tab, setTab] = useState("salao");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingHint(true);
    fetch("/api/admin/establishment")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d) return;
        setForm((prev) => ({
          ...prev,
          name: d.name || "",
          description: d.description || "",
          address: d.address || "",
          mapsUrl: d.mapsUrl || "",
          phone: d.phone || "",
          whatsapp: d.whatsapp || "",
          instagram: d.instagram || "",
          openTime: d.openTime || "09:00",
          closeTime: d.closeTime || "19:00",
          lunchEnabled: !!d.lunchEnabled,
          lunchStart: d.lunchStart || "12:00",
          lunchEnd: d.lunchEnd || "13:00",
          openDays: d.openDays || "1,2,3,4,5,6",
          primaryColor: d.primaryColor || "#d4a017",
          bgColor: d.bgColor || "#0f0f0f",
          cardColor: d.cardColor || "#1a1a1a",
          pixKey: d.pixKey || "",
          pixName: d.pixName || "",
          pixInstructions: d.pixInstructions || "",
          pixChargeMode: d.pixChargeMode || "full",
          pixChargePercent: String(d.pixChargePercent ?? 50),
          paymentPolicy: d.paymentPolicy || "both",
          hoursByDay: d.hoursByDay || "{}",
          showProducts: d.showProducts !== false,
          telegramEnabled: !!d.telegramEnabled,
          telegramBotToken: d.telegramBotToken || "",
          telegramChatId: d.telegramChatId || "",
        }));
      })
      .finally(() => {
        if (!cancelled) setLoadingHint(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (tab !== "visual" && tab !== "pix") return;
    if (form.bannerImage || form.pixQrData) return;
    fetch("/api/admin/establishment?full=1")
      .then((r) => r.json())
      .then((d) => {
        if (!d) return;
        setForm((prev) => ({
          ...prev,
          pixQrData: prev.pixQrData || d.pixQrData || "",
          bannerImage: prev.bannerImage || d.bannerImage || "",
        }));
      })
      .catch(() => {});
  }, [tab]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.openDays || form.openDays.split(",").filter(Boolean).length === 0) {
      setMsg("Selecione pelo menos um dia de atendimento");
      return;
    }
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/establishment", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setMsg(res.ok ? "Salvo com sucesso!" : "Erro ao salvar");
  }

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (["primaryColor", "bgColor", "cardColor"].includes(key)) {
      setSelectedPreset(null);
    }
  }

  function toggleDay(day: string) {
    const setDays = new Set(
      form.openDays.split(",").map((d) => d.trim()).filter(Boolean)
    );
    if (setDays.has(day)) setDays.delete(day);
    else setDays.add(day);
    const ordered = DAYS.map((d) => d.value).filter((v) => setDays.has(v));
    setForm((f) => ({ ...f, openDays: ordered.join(",") }));
  }

  function applyPreset(preset: (typeof PRESETS)[0]) {
    setForm((f) => ({
      ...f,
      primaryColor: preset.primaryColor,
      bgColor: preset.bgColor,
      cardColor: preset.cardColor,
    }));
    setSelectedPreset(preset.id);
  }


  const openSet = new Set(
    form.openDays.split(",").map((d) => d.trim()).filter(Boolean)
  );

  const isLightBg =
    form.bgColor.toLowerCase().startsWith("#f") ||
    form.bgColor.toLowerCase() === "#ffffff";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Configurações</h1>
      <p className="text-sm text-[var(--muted-fg)] mb-4">
        Escolha uma aba. Salve no final de cada mudança.
        {loadingHint ? " Carregando dados..." : ""}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        {(
          [
            ["salao", "Salão"],
            ["horas", "Horários"],
            ["pix", "PIX"],
            ["avisos", "Avisos"],
            ["visual", "Visual"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-xl px-3 py-2 text-sm font-medium border ${
              tab === id
                ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-fg)]"
                : "border-[var(--border)] text-[var(--muted-fg)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <form onSubmit={save} className="card max-w-2xl space-y-4">
        {msg && (
          <p className={`text-sm ${msg.includes("sucesso") ? "text-green-400" : "text-red-400"}`}>
            {msg}
          </p>
        )}

        {tab === "salao" && (
        <div className="space-y-4">
        <p className="text-sm font-semibold text-[var(--fg)]">
          Dados do salão
        </p>
        <p className="text-xs text-[var(--muted-fg)] -mt-2">Nome, WhatsApp e link do Google Maps que aparecem no site.</p>
        {(
          [
            ["name", "Nome da barbearia"],
            ["description", "Descrição"],
            ["mapsUrl", "Link do Google Maps"],
            ["phone", "Telefone"],
            ["whatsapp", "WhatsApp (ex: 5511999998888)"],
            ["instagram", "Instagram (sem @)"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label className="label">{label}</label>
            <input
              className="input"
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              required={key !== "instagram" && key !== "mapsUrl"}
              placeholder={
                key === "mapsUrl"
                  ? "https://maps.google.com/... ou https://maps.app.goo.gl/..."
                  : ""
              }
            />
            {key === "mapsUrl" && (
              <p className="text-xs text-[var(--muted-fg)] mt-1">
                No Google Maps: compartilhe o local → copiar link → cola aqui.
              </p>
            )}
          </div>
        ))}

        </div>
        )}

        {tab === "horas" && (
        <div className="space-y-4">
        <p className="text-sm font-semibold text-[var(--fg)]">
          Dias e horários de atendimento
        </p>
        <p className="text-xs text-neutral-500 -mt-2">
          Marque os dias em que a barbearia atende. Nos outros dias o cliente não consegue agendar.
        </p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const active = openSet.has(d.value);
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`rounded-lg px-3 py-2 text-sm border transition ${
                  active
                    ? "border-[#d4a017] bg-[#d4a017]/15 text-[#d4a017]"
                    : "border-[#333] text-neutral-500 hover:border-neutral-500"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Horário padrão — abre às</label>
            <input
              className="input"
              type="time"
              value={form.openTime}
              onChange={(e) => set("openTime", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Horário padrão — fecha às</label>
            <input
              className="input"
              type="time"
              value={form.closeTime}
              onChange={(e) => set("closeTime", e.target.value)}
              required
            />
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          Horário especial por dia (opcional). Ex: sábado só de 08:00 às 12:00.
          Deixe vazio para usar o horário padrão.
        </p>
        <div className="space-y-2">
          {DAYS.filter((d) => openSet.has(d.value)).map((d) => {
            let custom: { open?: string; close?: string } = {};
            try {
              custom = JSON.parse(form.hoursByDay || "{}")[d.value] || {};
            } catch {}
            const patchDay = (next: Partial<{ open: string; close: string; open2: string; close2: string }>) => {
              let map: Record<string, { open?: string; close?: string; open2?: string; close2?: string }> = {};
              try {
                map = JSON.parse(form.hoursByDay || "{}");
              } catch {}
              const merged = { ...custom, ...next };
              if (!merged.open && !merged.close && !merged.open2 && !merged.close2) {
                delete map[d.value];
              } else {
                map[d.value] = merged;
              }
              set("hoursByDay", JSON.stringify(map));
            };
            return (
              <div key={d.value} className="rounded-xl border border-[var(--border)] p-3 space-y-2 text-sm">
                <span className="text-[var(--muted-fg)] font-medium">{d.label}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[var(--muted-fg)] w-14">1º</span>
                  <input type="time" className="input w-auto py-1" value={custom.open || ""} onChange={(e) => patchDay({ open: e.target.value })} />
                  <span className="text-[var(--muted-fg)]">até</span>
                  <input type="time" className="input w-auto py-1" value={custom.close || ""} onChange={(e) => patchDay({ close: e.target.value })} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[var(--muted-fg)] w-14">2º</span>
                  <input type="time" className="input w-auto py-1" value={(custom as { open2?: string }).open2 || ""} onChange={(e) => patchDay({ open2: e.target.value })} />
                  <span className="text-[var(--muted-fg)]">até</span>
                  <input type="time" className="input w-auto py-1" value={(custom as { close2?: string }).close2 || ""} onChange={(e) => patchDay({ close2: e.target.value })} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-[var(--border)] p-3 space-y-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.lunchEnabled}
              onChange={(e) =>
                setForm((f) => ({ ...f, lunchEnabled: e.target.checked }))
              }
            />
            Ativar horário de almoço (não agenda nesse intervalo)
          </label>
          {form.lunchEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Almoço começa</label>
                <input
                  type="time"
                  className="input"
                  value={form.lunchStart}
                  onChange={(e) => set("lunchStart", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Almoço termina</label>
                <input
                  type="time"
                  className="input"
                  value={form.lunchEnd}
                  onChange={(e) => set("lunchEnd", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        </div>
        )}

        {tab === "pix" && (
        <div className="space-y-4">
        <p className="text-sm font-semibold text-[var(--fg)]">
          PIX e pagamentos
        </p>
        <p className="text-xs text-neutral-500 -mt-2">
          O cliente usa esta chave para pagar antes. Só PIX — sem cartão.
        </p>
        <div>
          <label className="label">Chave PIX</label>
          <input
            className="input"
            value={form.pixKey}
            onChange={(e) => set("pixKey", e.target.value)}
            placeholder="email, telefone, CPF/CNPJ ou chave aleatória"
          />
        </div>
        <div>
          <label className="label">QR Code PIX (imagem do app do banco)</label>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-[var(--muted-fg)] mb-2"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 900_000) {
                setMsg("QR Code muito grande (máx ~900KB)");
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                setForm((f) => ({ ...f, pixQrData: String(reader.result || "") }));
              };
              reader.readAsDataURL(file);
            }}
          />
          {form.pixQrData && (
            <div className="flex items-start gap-3">
              <img
                src={form.pixQrData}
                alt="QR PIX"
                className="h-28 w-28 rounded-lg border border-[var(--border)] object-contain bg-white p-1"
              />
              <button
                type="button"
                className="btn btn-secondary text-sm"
                onClick={() => set("pixQrData", "")}
              >
                Remover QR
              </button>
            </div>
          )}
        </div>
        <div>
          <label className="label">Mostrar produtos no site</label>
          <select
            className="input"
            value={form.showProducts ? "yes" : "no"}
            onChange={(e) =>
              setForm((f) => ({ ...f, showProducts: e.target.value === "yes" }))
            }
          >
            <option value="yes">Sim — exibir seção Produtos</option>
            <option value="no">Não — ocultar produtos</option>
          </select>
        </div>
        <div>
          <label className="label">Nome do recebedor (como no banco)</label>
          <input
            className="input"
            value={form.pixName}
            onChange={(e) => set("pixName", e.target.value)}
            placeholder="Nome completo ou da empresa"
          />
        </div>
        <div>
          <label className="label">Instruções (opcional)</label>
          <textarea
            className="input min-h-[80px]"
            value={form.pixInstructions}
            onChange={(e) => set("pixInstructions", e.target.value)}
            placeholder="Ex: Envie o comprovante em até 15 minutos com o nome completo."
          />
        </div>
        <div>
          <label className="label">O que cobrar no PIX antecipado</label>
          <select
            className="input"
            value={form.pixChargeMode}
            onChange={(e) => set("pixChargeMode", e.target.value)}
          >
            <option value="full">Valor total do serviço</option>
            <option value="half">Só um sinal (entrada)</option>
          </select>
          <p className="text-xs text-[var(--muted-fg)] mt-1">
            O percentual do sinal é usado quando o cliente escolhe pagar só a entrada no PIX.
            No agendamento ele também pode optar pelo valor cheio.
          </p>
        </div>
        <div>
          <label className="label">Percentual do sinal (opção do cliente) (%)</label>
          <input
            className="input"
            type="number"
            min={1}
            max={100}
            value={form.pixChargePercent}
            onChange={(e) => set("pixChargePercent", e.target.value)}
          />
          <p className="text-xs text-[var(--muted-fg)] mt-1">
            Ex.: 50. Serviço R$ 80 → se escolher sinal: R$ 40 no PIX + R$ 40 no salão.
            Se escolher valor cheio: R$ 80 no PIX.
          </p>
        </div>
        <div>
          <label className="label">O que o cliente pode escolher</label>
          <select
            className="input"
            value={form.paymentPolicy}
            onChange={(e) => set("paymentPolicy", e.target.value)}
          >
            <option value="both">Pagar antes (PIX) ou na hora</option>
            <option value="pix_only">Somente PIX antecipado (cliente escolhe sinal % ou valor cheio)</option>
            <option value="local_only">Somente pagar na hora</option>
          </select>
        </div>

        </div>
        )}

        {tab === "avisos" && (
        <div className="space-y-4">
        <p className="text-sm font-semibold text-[var(--fg)]">
          Alertas no Telegram
        </p>
        <p className="text-xs text-[var(--muted-fg)] -mt-2">
          Receba no celular: novo agendamento e comprovante PIX. Crie um bot com @BotFather,
          copie o token. Depois fale com o bot e descubra seu Chat ID com @userinfobot.
        </p>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!form.telegramEnabled}
            onChange={(e) =>
              setForm((f) => ({ ...f, telegramEnabled: e.target.checked }))
            }
          />
          Ativar alertas no Telegram
        </label>
        <div>
          <label className="label">Token do bot</label>
          <input
            className="input"
            value={form.telegramBotToken}
            onChange={(e) => set("telegramBotToken", e.target.value)}
            placeholder="123456:ABC-DEF..."
            autoComplete="off"
          />
        </div>
        <div>
          <label className="label">Chat ID (seu usuário)</label>
          <input
            className="input"
            value={form.telegramChatId}
            onChange={(e) => set("telegramChatId", e.target.value)}
            placeholder="Ex: 712345678"
          />
        </div>
        <button
          type="button"
          className="btn btn-secondary text-sm"
          onClick={async () => {
            setMsg("");
            const res = await fetch("/api/admin/telegram-test", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                telegramBotToken: String(form.telegramBotToken || "").replace(/\s+/g, ""),
                telegramChatId: String(form.telegramChatId || "").trim(),
              }),
            });
            const j = await res.json().catch(() => ({}));
            if (!res.ok) setMsg(j.error || "Falha no teste do Telegram");
            else setMsg("Mensagem de teste enviada! Confira o Telegram.");
          }}
        >
          Enviar mensagem de teste
        </button>

        </div>
        )}

        {tab === "visual" && (
        <div className="space-y-4">
        <ImagePicker
          label="Foto de capa do site (banner)"
          value={form.bannerImage}
          onChange={(bannerImage) => setForm((f) => ({ ...f, bannerImage }))}
          hint="Foto da fachada ou de um corte. Aparece no topo da home."
        />
        <p className="text-sm font-semibold text-neutral-300 border-b border-[#333] pb-2 pt-2">
          Visual do site — presets
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className={`rounded-xl border p-3 text-left transition ${
                selectedPreset === p.id
                  ? "border-[#d4a017] ring-1 ring-[#d4a017]"
                  : "border-[#333] hover:border-neutral-500"
              }`}
            >
              <div className="h-10 rounded-lg mb-2 flex overflow-hidden border border-[#333]">
                <div className="w-1/3" style={{ background: p.bgColor }} />
                <div className="w-1/3" style={{ background: p.cardColor }} />
                <div className="w-1/3" style={{ background: p.primaryColor }} />
              </div>
              <p className="text-sm font-medium">{p.name}</p>
              <p className="text-xs text-neutral-500">{p.desc}</p>
            </button>
          ))}
        </div>

        <p className="text-sm font-semibold text-neutral-300 border-b border-[#333] pb-2 pt-2">
          Ajuste fino de cores (opcional)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(
            [
              ["primaryColor", "Cor principal"],
              ["bgColor", "Fundo do site"],
              ["cardColor", "Cor dos cards"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border border-[#333] bg-transparent"
                />
                <input
                  className="input"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          className="rounded-lg p-4 border border-[#333]"
          style={{ background: form.bgColor, color: isLightBg ? "#111" : "#f5f5f5" }}
        >
          <p className="text-xs opacity-60 mb-2">Prévia</p>
          <div
            className="rounded-lg p-3 mb-2 border"
            style={{
              background: form.cardColor,
              borderColor: isLightBg ? "#e5e5e5" : "#333",
            }}
          >
            <p style={{ color: form.primaryColor }} className="font-semibold">
              Título de exemplo
            </p>
            <p className="text-sm opacity-70">Texto do card</p>
          </div>
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: form.primaryColor, color: "#0f0f0f" }}
          >
            Botão de exemplo
          </button>
        </div>

        </div>
        )}

        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={16} /> : "Salvar esta aba"}
        </button>
      </form>
    </div>
  );
}
