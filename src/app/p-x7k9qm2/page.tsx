import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Calendar,
  Package,
  FileImage,
  Settings,
  ExternalLink,
  CalendarDays,
} from "lucide-react";

export const dynamic = "force-dynamic";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function AdminDashboard() {
  let products = 0;
  let appointments = 0;
  let pending = 0;
  let receipts = 0;
  let todayJobs = 0;
  let estName = "—";

  const today = todayISO();

  try {
    const [p, a, pend, rec, todayCount, est] = await Promise.all([
      prisma.product.count(),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: "pending" } }),
      prisma.appointment.count({
        where: {
          paymentMethod: "pix",
          paymentStatus: "awaiting_receipt",
          receiptData: { not: null },
        },
      }),
      prisma.appointment.count({
        where: {
          date: today,
          status: { in: ["pending", "confirmed", "done"] },
        },
      }),
      prisma.establishment.findFirst(),
    ]);
    products = p;
    appointments = a;
    pending = pend;
    receipts = rec;
    todayJobs = todayCount;
    estName = est?.name || "—";
  } catch (e) {
    console.error(e);
  }

  const cards = [
    {
      href: "/p-x7k9qm2/agendamentos",
      label: "Agendamentos",
      value: String(appointments),
      sub: `${pending} pendente(s)`,
      icon: Calendar,
    },
    {
      href: "/p-x7k9qm2/agendamentos",
      label: "Hoje",
      value: String(todayJobs),
      sub: todayJobs === 1 ? "atendimento hoje" : "atendimentos hoje",
      icon: CalendarDays,
      highlight: todayJobs > 0,
    },
    {
      href: "/p-x7k9qm2/comprovantes",
      label: "Comprovantes",
      value: String(receipts),
      sub: "para revisar",
      icon: FileImage,
      highlight: receipts > 0,
    },
    {
      href: "/p-x7k9qm2/produtos",
      label: "Produtos",
      value: String(products),
      sub: "cadastrados",
      icon: Package,
    },
  ];

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-[var(--muted-fg)] mt-1">{estName}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className={`card !p-4 sm:!p-5 flex flex-col min-h-[7.5rem] sm:min-h-[8.5rem] active:scale-[0.98] transition ${
                c.highlight ? "ring-1 ring-[var(--primary)]/50" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm text-[var(--muted-fg)]">{c.label}</span>
                <Icon size={18} className="text-[var(--primary)] shrink-0" />
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-[var(--primary)] leading-none">
                {c.value}
              </p>
              <p className="text-xs text-[var(--muted-fg)] mt-auto pt-3">{c.sub}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Link
          href="/p-x7k9qm2/agendamentos"
          className="btn btn-primary w-full !min-h-12"
        >
          <Calendar size={18} /> Meus agendamentos
        </Link>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/p-x7k9qm2/configuracoes" className="btn btn-secondary w-full">
            <Settings size={16} /> Configurações
          </Link>
          <Link href="/" className="btn btn-secondary w-full">
            <ExternalLink size={16} /> Ver site
          </Link>
        </div>
      </div>
    </div>
  );
}
