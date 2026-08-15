import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Scissors, MapPin, Clock, Phone, Instagram } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
};

type Est = {
  name: string;
  description: string;
  address: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  openTime: string;
  closeTime: string;
  primaryColor?: string;
  bgColor?: string;
  cardColor?: string;
} | null;

async function loadData(): Promise<{
  est: Est;
  services: Service[];
  products: Product[];
  error?: string;
}> {
  try {
    const est = await prisma.establishment.findFirst();
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return { est, services, products };
  } catch (e) {
    console.error("DB error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return {
      est: null,
      services: [],
      products: [],
      error: `Erro no banco: ${msg}`,
    };
  }
}

export default async function HomePage() {
  const { est, services, products, error } = await loadData();

  const name = est?.name || "Barbearia Classic";
  const whatsapp = est?.whatsapp || "5511999998888";
  const waLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    "Olá! Gostaria de agendar um horário."
  )}`;



  return (
    <div>
      <Header name={name} />

      {error && (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <div className="rounded-lg border border-amber-600/50 bg-amber-900/30 px-4 py-3 text-sm text-amber-200">
            {error}
          </div>
        </div>
      )}

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[color-mix(in_srgb,var(--primary)_10%,transparent)] to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="mb-3 text-sm font-medium tracking-wide text-primary">
            ESTILO & QUALIDADE
          </p>
          <h1 className="mb-4 text-4xl font-bold sm:text-5xl">{name}</h1>
          <p className="mx-auto mb-8 max-w-xl text-muted">
            {est?.description ||
              "Cortes masculinos, barba e cuidados pessoais."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="/agendar" className="btn btn-primary">
              Agendar horário
            </a>
            <a href="#servicos" className="btn btn-secondary">
              Ver serviços
            </a>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section id="servicos" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
          <Scissors className="text-primary" size={24} /> Serviços
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.id} className="card">
              <h3 className="text-lg font-semibold">{s.name}</h3>
              <p className="mt-1 mb-3 text-sm text-muted">
                {s.description}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-primary">
                  R$ {s.price.toFixed(2)}
                </span>
                <span className="text-muted">{s.duration} min</span>
              </div>
              <a
                href="/agendar"
                className="btn btn-primary mt-4 w-full text-sm"
              >
                Agendar
              </a>
            </div>
          ))}
          {services.length === 0 && (
            <p className="text-muted">Nenhum serviço cadastrado.</p>
          )}
        </div>
      </section>

      <section id="produtos" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">Produtos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} className="card">
              <h3 className="font-semibold">{p.name}</h3>
              <p className="mt-1 mb-3 text-sm text-muted">
                {p.description}
              </p>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-primary">
                  R$ {p.price.toFixed(2)}
                </span>
                <span className="text-muted">Estoque: {p.stock}</span>
              </div>
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                  `Olá! Quero comprar: ${p.name}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary w-full text-sm"
              >
                Comprar no WhatsApp
              </a>
            </div>
          ))}
          {products.length === 0 && (
            <p className="text-muted">Nenhum produto cadastrado.</p>
          )}
        </div>
      </section>

      <section id="contato" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">Informações</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card flex gap-3">
            <MapPin className="shrink-0 text-primary" size={20} />
            <div>
              <p className="text-sm font-medium">Endereço</p>
              <p className="text-sm text-muted">
                {est?.address || "—"}
              </p>
            </div>
          </div>
          <div className="card flex gap-3">
            <Clock className="shrink-0 text-primary" size={20} />
            <div>
              <p className="text-sm font-medium">Horário</p>
              <p className="text-sm text-muted">
                {est?.openTime || "09:00"} – {est?.closeTime || "19:00"}
              </p>
            </div>
          </div>
          <div className="card flex gap-3">
            <Phone className="shrink-0 text-primary" size={20} />
            <div>
              <p className="text-sm font-medium">Telefone</p>
              <p className="text-sm text-muted">{est?.phone || "—"}</p>
            </div>
          </div>
          {est?.instagram && (
            <div className="card flex gap-3">
              <Instagram className="shrink-0 text-primary" size={20} />
              <div>
                <p className="text-sm font-medium">Instagram</p>
                <p className="text-sm text-muted">@{est.instagram}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer
        name={name}
        address={est?.address || ""}
        phone={est?.phone || ""}
        instagram={est?.instagram || ""}
      />
    </div>
  );
}
