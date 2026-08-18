"use client";
import Link from "next/link";
import { Scissors, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header({
  name,
  showProducts = true,
}: {
  name: string;
  showProducts?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header sticky top-0 z-50 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold"
          style={{ color: "var(--primary)" }}
        >
          <Scissors size={22} />
          <span>{name}</span>
        </Link>
        <nav className="hidden gap-6 text-sm md:flex items-center">
          <a href="/agendar">Agendar</a>
          <a href="/meus-agendamentos">Meus horários</a>
          <a href="#servicos">Serviços</a>
          {showProducts && <a href="#produtos">Produtos</a>}
          <a href="#contato">Contato</a>
        </nav>
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          style={{ color: "var(--header-fg)" }}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav className="flex flex-col gap-3 border-t border-[var(--border)] px-4 py-3 md:hidden">
          <a href="/agendar" onClick={() => setOpen(false)}>
            Agendar
          </a>
          <a href="/meus-agendamentos" onClick={() => setOpen(false)}>
            Meus horários
          </a>
          <a href="#servicos" onClick={() => setOpen(false)}>
            Serviços
          </a>
          {showProducts && (
            <a href="#produtos" onClick={() => setOpen(false)}>
              Produtos
            </a>
          )}
          <a href="#contato" onClick={() => setOpen(false)}>
            Contato
          </a>
        </nav>
      )}
    </header>
  );
}
