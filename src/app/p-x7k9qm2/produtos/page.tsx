"use client";
import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { ImagePicker } from "@/components/ImagePicker";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageData?: string;
  active: boolean;
};

const empty = { name: "", description: "", price: "", stock: "", imageData: "" };

export default function ProdutosPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    setItems(await res.json());
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
      stock: parseInt(form.stock, 10),
      imageData: form.imageData || "",
    };
    const res = await fetch(
      editId ? `/api/admin/products?id=${editId}` : "/api/admin/products",
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
    if (!confirm("Excluir este produto?")) return;
    await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(p: Product) {
    setEditId(p.id);
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      stock: String(p.stock),
      imageData: p.imageData || "",
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Produtos</h1>
      <form onSubmit={save} className="card mb-6 space-y-3 max-w-lg">
        <h2 className="font-semibold">{editId ? "Editar produto" : "Novo produto"}</h2>
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
            <label className="label">Estoque</label>
            <input className="input" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
          </div>
        </div>
        <ImagePicker
          label="Foto do produto"
          value={form.imageData}
          onChange={(imageData) => setForm({ ...form, imageData })}
        />
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
          {items.map((p) => (
            <div key={p.id} className="card flex items-center justify-between gap-3">
              {p.imageData ? (
                <img src={p.imageData} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-[var(--muted-fg)]">
                  R$ {p.price.toFixed(2)} · Estoque: {p.stock}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-secondary p-2" onClick={() => startEdit(p)}>
                  <Pencil size={16} />
                </button>
                <button className="btn btn-danger p-2" onClick={() => remove(p.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-[var(--muted-fg)]">Nenhum produto.</p>}
        </div>
      )}
    </div>
  );
}
