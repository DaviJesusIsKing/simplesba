"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function SenhaPage() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setErr("");
    if (newPassword !== confirm) {
      setErr("A confirmação não confere com a nova senha");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setErr(data.error || "Erro ao alterar senha");
      return;
    }
    setMsg("Senha alterada com sucesso.");
    setCurrent("");
    setNew("");
    setConfirm("");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Alterar senha</h1>
      <form onSubmit={submit} className="card max-w-md space-y-4">
        {err && (
          <p className="text-sm text-red-400 bg-red-900/30 rounded-lg px-3 py-2">{err}</p>
        )}
        {msg && (
          <p className="text-sm text-green-400 bg-green-900/20 rounded-lg px-3 py-2">{msg}</p>
        )}
        <div>
          <label className="label">Senha atual</label>
          <input
            type="password"
            className="input"
            value={currentPassword}
            onChange={(e) => setCurrent(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="label">Nova senha (mín. 8 caracteres)</label>
          <input
            type="password"
            className="input"
            value={newPassword}
            onChange={(e) => setNew(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="label">Confirmar nova senha</label>
          <input
            type="password"
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={16} /> : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
