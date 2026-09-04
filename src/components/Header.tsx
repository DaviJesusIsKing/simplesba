"use client";
import Link from "next/link";
import { Scissors, Menu, X, CalendarClock } from "lucide-react";
import { useState } from "react";

export function Header({
  name,
  showProducts = true,
}: {
  name: string;
  showProducts?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const linkClass =
    "block rounded-xl px-4 py-3.5 text-base active:bg-[var(--muted)]";

  return (
    <header className="site-header sticky top-0 z-50 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 font-semibold"
          style={{ color: "var(--primary)" }}
        >
          <Scissors size={22} className="shrink-0" />
          <span className="truncate text-base sm:text-lg">{name}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a href="/agendar">Agendar</a>
          <a href="/meus-agendamentos">Meus horários</a>
          <a href="#servicos">Serviços</a>
          {showProducts && <a href="#produtos">Produtos</a>}
          <a href="#faq">FAQ</a>
          <a href="#contato">Contato</a>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/meus-agendamentos"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)]"
            aria-label="Meus horários"
            style={{ color: "var(--header-fg)" }}
          >
            <CalendarClock size={20} />
          </Link>
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)]"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            style={{ color: "var(--header-fg)" }}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-[var(--border)] px-3 py-3 md:hidden">
          <a href="/agendar" className={`${linkClass} bg-[var(--primary)] text-[var(--primary-fg)] font-semibold`} onClick={() => setOpen(false)}>
            Agendar horário
          </a>
          <a href="/meus-agendamentos" className={linkClass} onClick={() => setOpen(false)}>
            Meus horários
          </a>
          <a href="#servicos" className={linkClass} onClick={() => setOpen(false)}>
            Serviços
          </a>
          {showProducts && (
            <a href="#produtos" className={linkClass} onClick={() => setOpen(false)}>
              Produtos
            </a>
          )}
          <a href="#faq" className={linkClass} onClick={() => setOpen(false)}>
            FAQ
          </a>
          <a href="#contato" className={linkClass} onClick={() => setOpen(false)}>
            Contato
          </a>
        </nav>
      )}
    </header>
  );
}
