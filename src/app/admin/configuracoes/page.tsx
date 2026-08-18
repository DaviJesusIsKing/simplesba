"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

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
  phone: "",
  whatsapp: "",
  instagram: "",
  openTime: "09:00",
  closeTime: "19:00",
  openDays: "1,2,3,4,5,6",
  primaryColor: "#d4a017",
  bgColor: "#0f0f0f",
  cardColor: "#1a1a1a",
  pixKey: "",
  pixName: "",
  pixInstructions: "",
  pixChargeMode: "full",
  paymentPolicy: "both",
  hoursByDay: "{}",
  pixQrData: "",
  showProducts: true,
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/establishment")
      .then((r) => r.json())
      .then((d) => {
        if (d) {
          setForm({
            name: d.name || "",
            description: d.description || "",
            address: d.address || "",
            phone: d.phone || "",
            whatsapp: d.whatsapp || "",
            instagram: d.instagram || "",
            openTime: d.openTime || "09:00",
            closeTime: d.closeTime || "19:00",
            openDays: d.openDays || "1,2,3,4,5,6",
            primaryColor: d.primaryColor || "#d4a017",
            bgColor: d.bgColor || "#0f0f0f",
            cardColor: d.cardColor || "#1a1a1a",
            pixKey: d.pixKey || "",
            pixName: d.pixName || "",
            pixInstructions: d.pixInstructions || "",
            pixChargeMode: d.pixChargeMode || "full",
            paymentPolicy: d.paymentPolicy || "both",
            hoursByDay: d.hoursByDay || "{}",
            pixQrData: d.pixQrData || "",
            showProducts: d.showProducts !== false,
          });
        }
        setLoading(false);
      });
  }, []);

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

  if (loading) return <Loader2 className="animate-spin text-[#d4a017]" />;

  const openSet = new Set(
    form.openDays.split(",").map((d) => d.trim()).filter(Boolean)
  );

  const isLightBg =
    form.bgColor.toLowerCase().startsWith("#f") ||
    form.bgColor.toLowerCase() === "#ffffff";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      <form onSubmit={save} className="card max-w-2xl space-y-4">
        {msg && (
          <p className={`text-sm ${msg.includes("sucesso") ? "text-green-400" : "text-red-400"}`}>
            {msg}
          </p>
        )}

        <p className="text-sm font-semibold text-neutral-300 border-b border-[#333] pb-2">
          Dados do estabelecimento
        </p>
        {(
          [
            ["name", "Nome da barbearia"],
            ["description", "Descrição"],
            ["address", "Endereço"],
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
              required={key !== "instagram"}
            />
          </div>
        ))}

        <p className="text-sm font-semibold text-neutral-300 border-b border-[#333] pb-2 pt-2">
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
            return (
              <div key={d.value} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="w-20 text-[var(--muted-fg)]">{d.label}</span>
                <input
                  type="time"
                  className="input w-auto py-1"
                  value={custom.open || ""}
                  onChange={(e) => {
                    let map: Record<string, { open: string; close: string }> = {};
                    try {
                      map = JSON.parse(form.hoursByDay || "{}");
                    } catch {}
                    const open = e.target.value;
                    const close = custom.close || form.closeTime;
                    if (!open && !(custom.close || "")) {
                      delete map[d.value];
                    } else {
                      map[d.value] = { open: open || form.openTime, close };
                    }
                    set("hoursByDay", JSON.stringify(map));
                  }}
                />
                <span className="text-[var(--muted-fg)]">até</span>
                <input
                  type="time"
                  className="input w-auto py-1"
                  value={custom.close || ""}
                  onChange={(e) => {
                    let map: Record<string, { open: string; close: string }> = {};
                    try {
                      map = JSON.parse(form.hoursByDay || "{}");
                    } catch {}
                    const close = e.target.value;
                    const open = custom.open || form.openTime;
                    if (!close && !(custom.open || "")) {
                      delete map[d.value];
                    } else {
                      map[d.value] = { open, close: close || form.closeTime };
                    }
                    set("hoursByDay", JSON.stringify(map));
                  }}
                />
              </div>
            );
          })}
        </div>

        <p className="text-sm font-semibold text-neutral-300 border-b border-[#333] pb-2 pt-2">
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
          <label className="label">Cobrança no PIX antecipado</label>
          <select
            className="input"
            value={form.pixChargeMode}
            onChange={(e) => set("pixChargeMode", e.target.value)}
          >
            <option value="full">Valor cheio do serviço</option>
            <option value="half">Sinal de 50%</option>
          </select>
        </div>
        <div>
          <label className="label">O que o cliente pode escolher</label>
          <select
            className="input"
            value={form.paymentPolicy}
            onChange={(e) => set("paymentPolicy", e.target.value)}
          >
            <option value="both">Pagar antes (PIX) ou na hora</option>
            <option value="pix_only">Somente pagar antes (PIX)</option>
            <option value="local_only">Somente pagar na hora</option>
          </select>
        </div>

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

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={16} /> : "Salvar"}
        </button>
      </form>
    </div>
  );
}
