"use client";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import {
  LayoutDashboard,
  Scissors,
  Package,
  Settings,
  KeyRound,
  Calendar,
  UserPlus,
  FileImage,
  LogOut,
  Loader2,
} from "lucide-react";
import { adminThemeFromEst } from "@/lib/theme";

const nav = [
  { href: "/p-x7k9qm2", label: "Dashboard", icon: LayoutDashboard },
  { href: "/p-x7k9qm2/agendamentos", label: "Agendamentos", icon: Calendar },
  { href: "/p-x7k9qm2/novo-agendamento", label: "Novo agendamento", icon: UserPlus },
  { href: "/p-x7k9qm2/comprovantes", label: "Comprovantes", icon: FileImage },
  { href: "/p-x7k9qm2/servicos", label: "Serviços", icon: Scissors },
  { href: "/p-x7k9qm2/produtos", label: "Produtos", icon: Package },
  { href: "/p-x7k9qm2/configuracoes", label: "Configurações", icon: Settings },
  { href: "/p-x7k9qm2/senha", label: "Senha", icon: KeyRound },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/p-x7k9qm2/login";
  const [theme, setTheme] = useState<CSSProperties>(
    () => adminThemeFromEst(null) as CSSProperties
  );

  useEffect(() => {
    fetch("/api/public/establishment")
      .then((r) => r.json())
      .then((d) => {
        setTheme(adminThemeFromEst(d) as CSSProperties);
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    if (status === "unauthenticated" && !isLogin) {
      router.replace("/p-x7k9qm2/login");
    }
  }, [status, isLogin, router]);

  if (isLogin) {
    return (
      <div style={theme} className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
        {children}
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div
        style={theme}
        className="min-h-screen flex items-center justify-center bg-[var(--bg)]"
      >
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div style={theme} className="min-h-screen flex bg-[var(--bg)] text-[var(--fg)]">
      <aside className="hidden md:flex w-56 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] p-4">
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
                    ? "bg-[var(--primary)] text-[var(--primary-fg)]"
                    : "text-[var(--muted-fg)] hover:bg-[var(--muted)] hover:text-[var(--fg)]"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/p-x7k9qm2/login" })}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--muted-fg)] hover:bg-[var(--muted)]"
        >
          <LogOut size={16} /> Sair
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
                <header className="md:hidden border-b border-[var(--border)] bg-[var(--sidebar)] px-2 py-2.5 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-min">
            {nav.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/p-x7k9qm2" && pathname.startsWith(item.href));
              const short =
                item.label === "Novo agendamento"
                  ? "Novo"
                  : item.label === "Configurações"
                    ? "Config"
                    : item.label === "Comprovantes"
                      ? "Comprov."
                      : item.label === "Agendamentos"
                        ? "Agenda"
                        : item.label;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2 min-w-[4.25rem] min-h-[3.25rem] text-[11px] font-medium ${
                    active
                      ? "bg-[var(--primary)] text-[var(--primary-fg)]"
                      : "text-[var(--muted-fg)] bg-[var(--muted)]/40"
                  }`}
                >
                  <Icon size={18} />
                  <span className="leading-tight text-center">{short}</span>
                </Link>
              );
            })}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto bg-[var(--bg)] text-[var(--fg)]">
          {children}
        </main>
      </div>
    </div>
  );
}
