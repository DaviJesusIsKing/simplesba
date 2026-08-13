"use client";
import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  active: boolean;
};

const empty = { name: "", description: "", price: "", duration: "" };

export default function ServicosPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/services");
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const body = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      duration: parseInt(form.duration, 10),
    };
    const res = await fetch(
      editId ? `/api/admin/services?id=${editId}` : "/api/admin/services",
      {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    setSaving(false);
    if (!res.ok) {
      setMsg("Erro ao salvar");
      return;
    }
    setForm(empty);
    setEditId(null);
    setMsg(editId ? "Atualizado!" : "Criado!");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este serviço?")) return;
    await fetch(`/api/admin/services?id=${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(s: Service) {
    setEditId(s.id);
    setForm({
      name: s.name,
      description: s.description,
      price: String(s.price),
      duration: String(s.duration),
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Serviços</h1>

      <form onSubmit={save} className="card mb-6 space-y-3 max-w-lg">
        <h2 className="font-semibold">{editId ? "Editar serviço" : "Novo serviço"}</h2>
        {msg && <p className="text-sm text-green-400">{msg}</p>}
        <div>
          <label className="label">Nome</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Descrição</label>
          <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Preço (R$)</label>
            <input className="input" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <div>
            <label className="label">Duração (min)</label>
            <input className="input" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : editId ? "Salvar" : <><Plus size={16} /> Adicionar</>}
          </button>
          {editId && (
            <button type="button" className="btn btn-secondary" onClick={() => { setEditId(null); setForm(empty); }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <Loader2 className="animate-spin text-[#d4a017]" />
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="card flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-neutral-400">
                  R$ {s.price.toFixed(2)} · {s.duration} min
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-secondary p-2" onClick={() => startEdit(s)} aria-label="Editar">
                  <Pencil size={16} />
                </button>
                <button className="btn btn-danger p-2" onClick={() => remove(s.id)} aria-label="Excluir">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-neutral-500">Nenhum serviço.</p>}
        </div>
      )}
    </div>
  );
}
