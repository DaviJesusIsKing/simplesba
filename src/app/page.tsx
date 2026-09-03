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
    <div >
      <Header name={name} showProducts={est?.showProducts !== false} />

      {error && (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <div className="rounded-lg border border-amber-600/50 bg-amber-900/30 px-4 py-3 text-sm text-amber-200">
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-[color-mix(in_srgb,var(--bg)_55%,transparent)] to-[var(--bg)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20 text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-primary sm:text-sm">
            ESTILO & QUALIDADE
          </p>
          <h1 className="mb-4 text-[2rem] font-bold leading-[1.15] sm:text-5xl">{name}</h1>
          <p className="mx-auto mb-8 max-w-xl text-muted">
            {est?.description ||
              "Cortes masculinos, barba e cuidados pessoais."}
          </p>
          <div className="hero-btns flex flex-wrap justify-center gap-3">
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
        <h2 className="mb-2 flex items-center gap-2 text-2xl font-bold">
          <Scissors className="text-primary" size={24} /> Serviços
        </h2>
        <p className="mb-5 text-sm text-muted">Escolha o corte e agende neste card.</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.id} className="card overflow-hidden !p-0">
              {s.imageData ? (
                <img
                  src={s.imageData}
                  alt={s.name}
                  className="h-48 w-full object-cover sm:h-40"
                />
              ) : (
                <div className="h-32 w-full bg-[var(--muted)] flex items-center justify-center text-[var(--muted-fg)] text-sm sm:h-28">
                  Sem foto
                </div>
              )}
              <div className="p-4">
              <h3 className="text-xl font-semibold leading-snug">{s.name}</h3>
              <p className="mt-1.5 mb-4 text-[15px] leading-relaxed text-muted">
                {s.description}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-primary">
                  R$ {s.price.toFixed(2)}
                </span>
                <span className="text-muted">{s.duration} min</span>
              </div>
              <a
                href={`/agendar?servico=${s.id}`}
                className="btn btn-primary mt-4 w-full text-base"
              >
                Agendar este
              </a>
              </div>
            </div>
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
                <img
                  src={p.imageData}
                  alt={p.name}
                  className="h-32 w-full object-cover"
                />
              ) : null}
              <div className="p-4">
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
            </div>
          ))}
          {products.length === 0 && (
            <p className="text-muted">Nenhum produto cadastrado.</p>
          )}
        </div>
      </section>
      )}


      <section id="faq" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-2 text-2xl font-bold">Perguntas frequentes</h2>
        <p className="text-sm text-[var(--muted-fg)] mb-6">
          Dúvidas comuns sobre agendamento e pagamento.
        </p>
        <div className="space-y-3">
          {[
            {
              q: "Como faço para agendar?",
              a: "Clique em Agendar horário, escolha o serviço, o dia e um horário livre. Informe seu nome e WhatsApp e confirme.",
            },
            {
              q: "Posso pagar pelo PIX?",
              a: "Sim, se a barbearia liberar. Você pode pagar um sinal (por exemplo 50%) ou o valor cheio no PIX e enviar o comprovante no site. Também pode existir a opção de pagar só na hora, no salão.",
            },
            {
              q: "Enviei o comprovante e fechei a página. E agora?",
              a: "Entre em Meus horários, digite o mesmo telefone do agendamento e envie o comprovante de novo, se precisar.",
            },
            {
              q: "Quanto tempo tenho para confirmar o pagamento?",
              a: "O horário fica reservado por cerca de 15 minutos. Se o pagamento/comprovante não for resolvido a tempo, a reserva pode expirar e o horário liberar.",
            },
            {
              q: "Posso cancelar ou remarcar?",
              a: "Fale pelo WhatsApp da barbearia o quanto antes. Assim liberam o horário para outra pessoa e tentam encaixar outro dia para você.",
            },
            {
              q: "Criança ou corte diferente do site?",
              a: "Se não encontrar o serviço, chame no WhatsApp. Muitas vezes dá para combinar no salão.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="card group open:ring-1 open:ring-[var(--primary)]/30"
            >
              <summary className="cursor-pointer font-medium list-none flex justify-between gap-3 items-center">
                {item.q}
                <span className="text-[var(--primary)] text-lg leading-none">+</span>
              </summary>
              <p className="mt-3 text-sm text-[var(--muted-fg)] border-t border-[var(--border)] pt-3">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section id="contato" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">Informações</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card flex gap-3">
            <MapPin className="shrink-0 text-primary" size={20} />
            <div>
              <p className="text-sm font-medium">Local</p>
              {est?.mapsUrl ? (
                <a
                  href={est.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline"
                >
                  Abrir no Google Maps
                </a>
              ) : (
                <p className="text-sm text-muted">{est?.address || "—"}</p>
              )}
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
        mapsUrl={est?.mapsUrl || ""}
        phone={est?.phone || ""}
        instagram={est?.instagram || ""}
      />
    </div>
  );
}
