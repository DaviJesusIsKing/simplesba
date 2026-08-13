"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const defaults = {
  name: "",
  description: "",
  address: "",
  phone: "",
  whatsapp: "",
  instagram: "",
  openTime: "09:00",
  closeTime: "19:00",
  primaryColor: "#d4a017",
  bgColor: "#0f0f0f",
  cardColor: "#1a1a1a",
};

export default function ConfigPage() {
  const [form, setForm] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

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
            primaryColor: d.primaryColor || "#d4a017",
            bgColor: d.bgColor || "#0f0f0f",
            cardColor: d.cardColor || "#1a1a1a",
          });
        }
        setLoading(false);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/establishment", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setMsg(res.ok ? "Salvo com sucesso! Atualize a página inicial para ver as cores." : "Erro ao salvar");
  }

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  if (loading) return <Loader2 className="animate-spin text-[#d4a017]" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      <form onSubmit={save} className="card max-w-lg space-y-4">
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
            ["openTime", "Abre às"],
            ["closeTime", "Fecha às"],
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
          Cores do site
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Cor principal</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-[#333] bg-transparent"
              />
              <input
                className="input"
                value={form.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Fundo do site</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.bgColor}
                onChange={(e) => set("bgColor", e.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-[#333] bg-transparent"
              />
              <input
                className="input"
                value={form.bgColor}
                onChange={(e) => set("bgColor", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Cor dos cards</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.cardColor}
                onChange={(e) => set("cardColor", e.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-[#333] bg-transparent"
              />
              <input
                className="input"
                value={form.cardColor}
                onChange={(e) => set("cardColor", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div
          className="rounded-lg p-4 border border-[#333]"
          style={{ background: form.bgColor }}
        >
          <p className="text-xs text-neutral-400 mb-2">Prévia</p>
          <div
            className="rounded-lg p-3 mb-2"
            style={{ background: form.cardColor, border: "1px solid #333" }}
          >
            <p style={{ color: form.primaryColor }} className="font-semibold">
              Título de exemplo
            </p>
            <p className="text-sm text-neutral-400">Texto do card</p>
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
