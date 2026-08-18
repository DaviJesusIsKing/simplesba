"use client";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Scissors,
  Package,
  Settings,
  KeyRound,
  Calendar,
  FileImage,
  LogOut,
  Loader2,
} from "lucide-react";

const nav = [
  { href: "/p-x7k9qm2", label: "Dashboard", icon: LayoutDashboard },
  { href: "/p-x7k9qm2/agendamentos", label: "Agendamentos", icon: Calendar },
  { href: "/p-x7k9qm2/comprovantes", label: "Comprovantes", icon: FileImage },
  { href: "/p-x7k9qm2/servicos", label: "Serviços", icon: Scissors },
  { href: "/p-x7k9qm2/produtos", label: "Produtos", icon: Package },
  { href: "/p-x7k9qm2/configuracoes", label: "Configurações", icon: Settings },
  { href: "/p-x7k9qm2/senha", label: "Senha", icon: KeyRound },
];

const adminTheme = {
  ["--bg" as string]: "#0f0f0f",
  ["--fg" as string]: "#f5f5f5",
  ["--card" as string]: "#1a1a1a",
  ["--card-fg" as string]: "#f5f5f5",
  ["--muted" as string]: "#262626",
  ["--muted-fg" as string]: "#a3a3a3",
  ["--border" as string]: "#333333",
  ["--primary" as string]: "#d4a017",
  ["--primary-fg" as string]: "#0f0f0f",
} as React.CSSProperties;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/p-x7k9qm2/login";

  useEffect(() => {
    if (status === "unauthenticated" && !isLogin) {
      router.replace("/p-x7k9qm2/login");
    }
  }, [status, isLogin, router]);

  if (isLogin) {
    return (
      <div style={adminTheme} className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
        {children}
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div style={adminTheme} className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div style={adminTheme} className="min-h-screen flex bg-[var(--bg)] text-[var(--fg)]">
      <aside className="hidden md:flex w-56 flex-col border-r border-[var(--border)] bg-[var(--card)] p-4">
        <p className="text-[var(--primary)] font-semibold mb-6 flex items-center gap-2">
          <Scissors size={18} /> Admin
        </p>
        <nav className="flex flex-col gap-1 flex-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  active
                    ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                    : "text-[var(--muted-fg)] hover:bg-[var(--muted)]"
                }`}
              >
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 text-sm text-[var(--muted-fg)] hover:text-red-400 px-3 py-2"
        >
          <LogOut size={16} /> Sair
        </button>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-auto bg-[var(--bg)] text-[var(--fg)]">
        <div className="md:hidden flex gap-2 mb-4 overflow-x-auto pb-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm border ${
                pathname === item.href
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--muted-fg)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}
