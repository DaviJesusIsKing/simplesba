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
  imageData?: string | null;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageData?: string | null;
};

type Est = {
  name: string;
  description: string;
  address: string;
  mapsUrl?: string | null;
  phone: string;
  whatsapp: string;
  instagram: string;
  openTime: string;
  closeTime: string;
  primaryColor?: string;
  bgColor?: string;
  cardColor?: string;
  showProducts?: boolean;
  bannerImage?: string | null;
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
      <Header name={name} showProducts={est?.showProducts !== false} />

      {error && (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <div className="rounded-2xl border border-amber-600/50 bg-amber-900/30 px-4 py-3 text-sm text-amber-200">
            {error}
          </div>
        </div>
      )}

      <section className="relative overflow-hidden">
        {est?.bannerImage ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${est.bannerImage})` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[color-mix(in_srgb,var(--bg)_50%,transparent)] to-[var(--bg)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24 text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-primary">
            BARBEARIA
          </p>
          <h1 className="mb-4 text-[2.15rem] font-bold leading-[1.12] sm:text-5xl">
            {name}
          </h1>
          <p className="mx-auto mb-8 max-w-md text-[1.05rem] text-muted">
            {est?.description || "Cortes masculinos, barba e cuidados pessoais."}
          </p>
          <div className="hero-btns flex flex-wrap justify-center gap-3">
            <a href="/agendar" className="btn btn-primary text-base">
              Agendar horário
            </a>
            <a href="#servicos" className="btn btn-secondary">
              Ver cortes
            </a>
          </div>
        </div>
      </section>

      <section id="servicos" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold">
          <Scissors className="text-primary" size={22} /> Cortes
        </h2>
        <p className="mb-6 text-sm text-muted">Toque no corte para agendar.</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <a
              key={s.id}
              href={`/agendar?servico=${s.id}`}
              className="card overflow-hidden !p-0 block active:scale-[0.99] transition"
            >
              {s.imageData ? (
                <div className="cut-photo-wrap">
                  <img src={s.imageData} alt={s.name} className="cut-photo" />
                </div>
              ) : (
                <div className="cut-photo-wrap text-muted text-sm bg-[var(--muted)]">
                  Sem foto
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold leading-snug">{s.name}</h3>
                  <span className="shrink-0 font-semibold text-primary">
                    R$ {s.price.toFixed(2)}
                  </span>
                </div>
                <p className="mt-1.5 mb-3 text-sm leading-relaxed text-muted">
                  {s.description}
                </p>
                <p className="text-xs text-muted">{s.duration} min · Agendar</p>
              </div>
            </a>
          ))}
          {services.length === 0 && (
            <p className="text-muted">Nenhum serviço cadastrado.</p>
          )}
        </div>
      </section>

      {est?.showProducts !== false && (
        <section id="produtos" className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="mb-6 text-2xl font-bold">Produtos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <div key={p.id} className="card overflow-hidden !p-0">
                {p.imageData ? (
                  <div className="cut-photo-wrap cut-photo-wrap-sm">
                    <img src={p.imageData} alt={p.name} className="cut-photo" />
                  </div>
                ) : null}
                <div className="p-4">
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="mt-1 mb-3 text-sm text-muted">{p.description}</p>
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
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-muted">Nenhum produto cadastrado.</p>
            )}
          </div>
        </section>
      )}

      <section id="faq" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-2 text-2xl font-bold">Dúvidas</h2>
        <p className="text-sm text-muted mb-6">Agendamento e pagamento.</p>
        <div className="space-y-3">
          {[
            {
              q: "Como agendar?",
              a: "Toque no corte, escolha o dia e o horário, coloque seu nome e WhatsApp.",
            },
            {
              q: "Posso pagar no PIX?",
              a: "Sim, se a barbearia liberar. Dá para mandar um sinal ou o valor cheio e enviar o comprovante no site.",
            },
            {
              q: "Fechei a página sem mandar o comprovante.",
              a: "Entre em Meus horários, use o mesmo telefone e envie de novo.",
            },
            {
              q: "Posso cancelar?",
              a: "Chame no WhatsApp o quanto antes para liberar o horário.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="card group open:ring-1 open:ring-[var(--primary)]/30"
            >
              <summary className="cursor-pointer font-medium list-none flex justify-between gap-3 items-center">
                {item.q}
                <span className="text-primary text-lg leading-none">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted border-t border-[var(--border)] pt-3">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section id="contato" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-5 text-2xl font-bold">Onde estamos</h2>
        <div className="grid gap-3">
          {est?.mapsUrl ? (
            <a
              href={est.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex gap-3 items-center !py-4"
            >
              <MapPin className="shrink-0 text-primary" size={22} />
              <div>
                <p className="text-sm font-medium">Como chegar</p>
                <p className="text-sm text-primary">Abrir no Google Maps</p>
              </div>
            </a>
          ) : (
            <div className="card flex gap-3 items-center !py-4">
              <MapPin className="shrink-0 text-primary" size={22} />
              <div>
                <p className="text-sm font-medium">Local</p>
                <p className="text-sm text-muted">{est?.address || "—"}</p>
              </div>
            </div>
          )}
          <div className="card flex gap-3 items-center !py-4">
            <Clock className="shrink-0 text-primary" size={22} />
            <div>
              <p className="text-sm font-medium">Horário</p>
              <p className="text-sm text-muted">
                {est?.openTime || "09:00"} – {est?.closeTime || "19:00"}
              </p>
            </div>
          </div>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="card flex gap-3 items-center !py-4">
            <Phone className="shrink-0 text-primary" size={22} />
            <div>
              <p className="text-sm font-medium">WhatsApp</p>
              <p className="text-sm text-primary">{est?.phone || "Chamar agora"}</p>
            </div>
          </a>
          {est?.instagram && (
            <a
              href={`https://instagram.com/${est.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex gap-3 items-center !py-4"
            >
              <Instagram className="shrink-0 text-primary" size={22} />
              <div>
                <p className="text-sm font-medium">Instagram</p>
                <p className="text-sm text-muted">@{est.instagram}</p>
              </div>
            </a>
          )}
        </div>
      </section>

      <Footer
        name={name}
        address={est?.address || ""}
        mapsUrl={est?.mapsUrl || ""}
        phone={est?.phone || ""}
        instagram={est?.instagram || ""}
      />
    </div>
  );
}
