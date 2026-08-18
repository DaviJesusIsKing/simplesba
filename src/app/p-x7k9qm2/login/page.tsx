"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scissors, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@barbearia.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email ou senha incorretos");
      return;
    }
    router.push("/p-x7k9qm2");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4">
        <div className="text-center">
          <Scissors className="mx-auto text-[#d4a017] mb-2" size={32} />
          <h1 className="text-xl font-bold">Área Admin</h1>
          <p className="text-sm text-neutral-400">Entre para gerenciar a barbearia</p>
        </div>
        {error && (
          <p className="text-sm text-red-400 bg-red-900/30 rounded-lg px-3 py-2">{error}</p>
        )}
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Senha</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Entrar"}
        </button>
      </form>
    </div>
  );
}
