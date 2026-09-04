import type { ComponentType } from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Calendar,
  FileImage,
  Settings,
  ExternalLink,
  CalendarDays,
  BadgeCheck,
  Scissors,
  UserPlus,
} from "lucide-react";

export const dynamic = "force-dynamic";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function AdminDashboard() {
  let appointments = 0;
  let pending = 0;
  let receiptsPending = 0;
  let receiptsPaidToday = 0;
  let todayJobs = 0;
  let estName = "—";

  const today = todayISO();

  try {
    const [a, pend, rec, paidToday, todayCount, est] = await Promise.all([
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
          paymentStatus: "paid",
        },
      }),
      prisma.appointment.count({
        where: {
          date: today,
          status: { in: ["pending", "confirmed"] },
        },
      }),
      prisma.establishment.findFirst(),
    ]);
    appointments = a;
    pending = pend;
    receiptsPending = rec;
    receiptsPaidToday = paidToday;
    todayJobs = todayCount;
    estName = est?.name || "—";
  } catch (e) {
    console.error(e);
  }

  const cards: {
    href: string;
    label: string;
    value: string;
    sub: string;
    icon: ComponentType<{ size?: number; className?: string }>;
    highlight?: boolean;
  }[] = [
    {
      href: "/p-x7k9qm2/agendamentos",
      label: "Hoje",
      value: String(todayJobs),
      sub: todayJobs === 1 ? "cliente hoje" : "clientes hoje",
      icon: CalendarDays,
      highlight: todayJobs > 0,
    },
    {
      href: "/p-x7k9qm2/agendamentos",
      label: "Total",
      value: String(appointments),
      sub: `${pending} esperando confirmação`,
      icon: Calendar,
    },
    {
      href: "/p-x7k9qm2/comprovantes",
      label: "PIX para ver",
      value: String(receiptsPending),
      sub: "comprovantes",
      icon: FileImage,
      highlight: receiptsPending > 0,
    },
    {
      href: "/p-x7k9qm2/comprovantes",
      label: "PIX ok hoje",
      value: String(receiptsPaidToday),
      sub: "pagamentos do dia",
      icon: BadgeCheck,
      highlight: receiptsPaidToday > 0,
    },
  ];

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Início</h1>
        <p className="text-sm text-[var(--muted-fg)] mt-1">{estName}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className={`card !p-4 flex flex-col min-h-[7.5rem] active:scale-[0.98] transition ${
                c.highlight ? "ring-1 ring-[var(--primary)]/40" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm text-[var(--muted-fg)] leading-tight">
                  {c.label}
                </span>
                <Icon size={18} className="text-[var(--primary)] shrink-0" />
              </div>
              <p className="text-3xl font-bold text-[var(--primary)] leading-none">
                {c.value}
              </p>
              <p className="text-xs text-[var(--muted-fg)] mt-auto pt-3">{c.sub}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-3">
        <Link href="/p-x7k9qm2/agendamentos" className="btn btn-primary w-full">
          <Calendar size={18} /> Ver agenda
        </Link>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/p-x7k9qm2/novo-agendamento" className="btn btn-secondary w-full">
            <UserPlus size={16} /> Marcar cliente
          </Link>
          <Link href="/p-x7k9qm2/servicos" className="btn btn-secondary w-full">
            <Scissors size={16} /> Cortes
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/p-x7k9qm2/configuracoes" className="btn btn-secondary w-full">
            <Settings size={16} /> Config
          </Link>
          <Link href="/" className="btn btn-secondary w-full">
            <ExternalLink size={16} /> Ver site
          </Link>
        </div>
      </div>
    </div>
  );
}
