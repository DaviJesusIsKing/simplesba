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
  MoreHorizontal,
  ExternalLink,
  X,
} from "lucide-react";
import { adminThemeFromEst } from "@/lib/theme";

const nav = [
  { href: "/p-x7k9qm2", label: "Início", icon: LayoutDashboard },
  { href: "/p-x7k9qm2/agendamentos", label: "Agenda", icon: Calendar },
  { href: "/p-x7k9qm2/comprovantes", label: "PIX", icon: FileImage },
  { href: "/p-x7k9qm2/servicos", label: "Cortes", icon: Scissors },
];

const moreNav = [
  { href: "/p-x7k9qm2/novo-agendamento", label: "Novo agendamento", icon: UserPlus },
  { href: "/p-x7k9qm2/produtos", label: "Produtos", icon: Package },
  { href: "/p-x7k9qm2/configuracoes", label: "Configurações", icon: Settings },
  { href: "/p-x7k9qm2/senha", label: "Senha", icon: KeyRound },
];

const desktopNav = [...nav, ...moreNav];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/p-x7k9qm2/login";
  const [moreOpen, setMoreOpen] = useState(false);
  const [theme, setTheme] = useState<CSSProperties>(
    () => adminThemeFromEst(null) as CSSProperties
  );

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("admin-theme");
      if (cached) setTheme(JSON.parse(cached) as CSSProperties);
    } catch {}
    fetch("/api/public/establishment")
      .then((r) => r.json())
      .then((d) => {
        const next = adminThemeFromEst(d) as CSSProperties;
        setTheme(next);
        try {
          sessionStorage.setItem("admin-theme", JSON.stringify(next));
        } catch {}
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    setMoreOpen(false);
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

  const moreActive = moreNav.some(
    (item) => pathname === item.href || pathname.startsWith(item.href)
  );

  return (
    <div style={theme} className="min-h-screen flex bg-[var(--bg)] text-[var(--fg)]">
      <aside className="hidden md:flex w-60 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] p-4">
        <p className="text-[var(--primary)] font-semibold mb-6 flex items-center gap-2 px-1">
          <Scissors size={18} /> Painel
        </p>
        <nav className="flex flex-col gap-1 flex-1">
          {desktopNav.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/p-x7k9qm2" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${
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
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--muted-fg)] hover:bg-[var(--muted)]"
        >
          <LogOut size={16} /> Sair
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="admin-page flex-1 p-4 md:p-8 overflow-auto bg-[var(--bg)] text-[var(--fg)]">
          {children}
        </main>

        {moreOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/55" onClick={() => setMoreOpen(false)}>
            <div
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-[var(--card)] border-t border-[var(--border)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold">Mais opções</p>
                <button type="button" className="h-10 w-10 rounded-xl bg-[var(--muted)] flex items-center justify-center" onClick={() => setMoreOpen(false)} aria-label="Fechar">
                  <X size={18} />
                </button>
              </div>
              <div className="grid gap-2">
                {moreNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-2xl bg-[var(--muted)] px-4 py-3.5 text-sm font-medium"
                    >
                      <Icon size={18} className="text-[var(--primary)]" />
                      {item.label}
                    </Link>
                  );
                })}
                <Link href="/" className="flex items-center gap-3 rounded-2xl bg-[var(--muted)] px-4 py-3.5 text-sm font-medium">
                  <ExternalLink size={18} className="text-[var(--primary)]" />
                  Ver site
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/p-x7k9qm2/login" })}
                  className="flex items-center gap-3 rounded-2xl bg-[var(--muted)] px-4 py-3.5 text-sm font-medium text-left"
                >
                  <LogOut size={18} />
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}

        <nav className="admin-bottom-nav">
          {nav.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/p-x7k9qm2" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[3.25rem] rounded-xl text-[11px] font-semibold ${
                  active ? "text-[var(--primary)]" : "text-[var(--muted-fg)]"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[3.25rem] rounded-xl text-[11px] font-semibold ${
              moreActive ? "text-[var(--primary)]" : "text-[var(--muted-fg)]"
            }`}
          >
            <MoreHorizontal size={22} />
            Mais
          </button>
        </nav>
      </div>
    </div>
  );
}
