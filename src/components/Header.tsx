"use client";
import Link from "next/link";
import { Scissors, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-[#333] bg-[#0f0f0f]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-[var(--primary)]">
          <Scissors size={22} />
          <span>{name}</span>
        </Link>
        <nav className="hidden gap-6 text-sm md:flex">
          <a href="#servicos" className="hover:text-[var(--primary)]">Serviços</a>
          <a href="#produtos" className="hover:text-[var(--primary)]">Produtos</a>
          <a href="#contato" className="hover:text-[var(--primary)]">Contato</a>
          <Link href="/admin" className="text-neutral-500 hover:text-[var(--primary)]">Admin</Link>
        </nav>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav className="flex flex-col gap-3 border-t border-[#333] px-4 py-3 md:hidden">
          <a href="#servicos" onClick={() => setOpen(false)}>Serviços</a>
          <a href="#produtos" onClick={() => setOpen(false)}>Produtos</a>
          <a href="#contato" onClick={() => setOpen(false)}>Contato</a>
          <Link href="/admin" onClick={() => setOpen(false)}>Admin</Link>
        </nav>
      )}
    </header>
  );
}
