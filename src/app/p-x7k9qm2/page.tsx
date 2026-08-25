import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Calendar,
  FileImage,
  Settings,
  ExternalLink,
  CalendarDays,
  UserPlus,
  BadgeCheck,
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

  const cards = [
    {
      href: "/p-x7k9qm2/agendamentos",
      label: "Hoje",
      value: String(todayJobs),
      sub:
        todayJobs === 0
          ? "nenhum atendimento"
          : todayJobs === 1
            ? "cliente hoje"
            : "clientes hoje",
      icon: CalendarDays,
      highlight: todayJobs > 0,
    },
    {
      href: "/p-x7k9qm2/agendamentos",
      label: "Atendimentos totais",
      value: String(appointments),
      sub: `${pending} pendente(s) no sistema`,
      icon: Calendar,
    },
    {
      href: "/p-x7k9qm2/comprovantes",
      label: "Para revisar",
      value: String(receiptsPending),
      sub: "comprovantes aguardando",
      icon: FileImage,
      highlight: receiptsPending > 0,
    },
    {
      href: "/p-x7k9qm2/comprovantes",
      label: "PIX aprovados hoje",
      value: String(receiptsPaidToday),
      sub: "pagamentos confirmados no dia",
      icon: BadgeCheck,
      highlight: receiptsPaidToday > 0,
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
              className={`card !p-4 sm:!p-5 flex flex-col min-h-[8rem] sm:min-h-[9rem] active:scale-[0.98] transition ${
                c.highlight ? "ring-1 ring-[var(--primary)]/40" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm text-[var(--muted-fg)] leading-tight">
                  {c.label}
                </span>
                <Icon size={20} className="text-[var(--primary)] shrink-0" />
              </div>
              <p className="text-4xl font-bold text-[var(--primary)] leading-none">
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
          className="btn btn-primary w-full !min-h-12 text-base"
        >
          <Calendar size={18} /> Meus agendamentos
        </Link>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/p-x7k9qm2/novo-agendamento"
            className="btn btn-secondary w-full"
          >
            <UserPlus size={16} /> Novo
          </Link>
          <Link href="/p-x7k9qm2/configuracoes" className="btn btn-secondary w-full">
            <Settings size={16} /> Config
          </Link>
        </div>
        <Link href="/" className="btn btn-secondary w-full">
          <ExternalLink size={16} /> Ver site
        </Link>
      </div>
    </div>
  );
}
