import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  let services = 0;
  let products = 0;
  let appointments = 0;
  let pending = 0;
  let receipts = 0;
  let estName = "—";

  try {
    const [s, p, a, pend, rec, est] = await Promise.all([
      prisma.service.count(),
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
      prisma.establishment.findFirst(),
    ]);
    services = s;
    products = p;
    appointments = a;
    pending = pend;
    receipts = rec;
    estName = est?.name || "—";
  } catch (e) {
    console.error(e);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card">
          <p className="text-sm text-neutral-400">Agendamentos</p>
          <p className="text-3xl font-bold text-[#d4a017]">{appointments}</p>
          <p className="text-xs text-neutral-500 mt-1">{pending} pendente(s)</p>
        </div>
        <div className="card">
          <p className="text-sm text-neutral-400">Serviços</p>
          <p className="text-3xl font-bold text-[#d4a017]">{services}</p>
        </div>
        <div className="card">
          <p className="text-sm text-neutral-400">Produtos</p>
          <p className="text-3xl font-bold text-[#d4a017]">{products}</p>
        </div>
        <div className="card">
          <p className="text-sm text-[var(--muted-fg)]">Comprovantes</p>
          <p className="text-3xl font-bold text-[#d4a017]">{receipts}</p>
          <p className="text-xs text-[var(--muted-fg)] mt-1">para revisar</p>
        </div>
        <div className="card">
          <p className="text-sm text-[var(--muted-fg)]">Estabelecimento</p>
          <p className="text-lg font-semibold">{estName}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/p-x7k9qm2/comprovantes" className="btn btn-primary">
          Ver comprovantes
        </Link>
        <Link href="/p-x7k9qm2/agendamentos" className="btn btn-secondary">
          Agendamentos
        </Link>
        <Link href="/p-x7k9qm2/servicos" className="btn btn-secondary">
          Serviços
        </Link>
        <Link href="/p-x7k9qm2/produtos" className="btn btn-secondary">
          Produtos
        </Link>
        <Link href="/p-x7k9qm2/configuracoes" className="btn btn-secondary">
          Configurações
        </Link>
        <Link href="/" className="btn btn-secondary">
          Ver site
        </Link>
      </div>
    </div>
  );
}
