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
  Calendar,
  LogOut,
  Loader2,
} from "lucide-react";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/agendamentos", label: "Agendamentos", icon: Calendar },
  { href: "/admin/servicos", label: "Serviços", icon: Scissors },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (status === "unauthenticated" && !isLogin) {
      router.replace("/admin/login");
    }
  }, [status, isLogin, router]);

  if (isLogin) return <>{children}</>;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#d4a017]" size={32} />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-56 flex-col border-r border-[#333] bg-[#1a1a1a] p-4">
        <p className="text-[#d4a017] font-semibold mb-6 flex items-center gap-2">
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
                  active ? "bg-[#d4a017]/15 text-[#d4a017]" : "text-neutral-400 hover:bg-[#262626]"
                }`}
              >
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-red-400 px-3 py-2"
        >
          <LogOut size={16} /> Sair
        </button>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="md:hidden flex gap-2 mb-4 overflow-x-auto pb-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm border ${
                pathname === item.href
                  ? "border-[#d4a017] text-[#d4a017]"
                  : "border-[#333] text-neutral-400"
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
