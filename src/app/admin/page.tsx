import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [services, products, est] = await Promise.all([
    prisma.service.count(),
    prisma.product.count(),
    prisma.establishment.findFirst(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="card">
          <p className="text-sm text-neutral-400">Serviços</p>
          <p className="text-3xl font-bold text-[#d4a017]">{services}</p>
        </div>
        <div className="card">
          <p className="text-sm text-neutral-400">Produtos</p>
          <p className="text-3xl font-bold text-[#d4a017]">{products}</p>
        </div>
        <div className="card">
          <p className="text-sm text-neutral-400">Estabelecimento</p>
          <p className="text-lg font-semibold">{est?.name || "—"}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/servicos" className="btn btn-primary">Gerenciar serviços</Link>
        <Link href="/admin/produtos" className="btn btn-secondary">Gerenciar produtos</Link>
        <Link href="/admin/configuracoes" className="btn btn-secondary">Configurações</Link>
        <Link href="/" className="btn btn-secondary">Ver site</Link>
      </div>
    </div>
  );
}
