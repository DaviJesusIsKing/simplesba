import { Scissors } from "lucide-react";

export function Footer({
  name,
  address,
  phone,
  instagram,
}: {
  name: string;
  address: string;
  phone: string;
  instagram: string;
}) {
  return (
    <footer className="border-t border-[#333] bg-[#1a1a1a] mt-16">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 sm:grid-cols-2">
        <div>
          <div className="flex items-center gap-2 text-[var(--primary)] font-semibold mb-2">
            <Scissors size={18} /> {name}
          </div>
          <p className="text-sm text-neutral-400">Qualidade, estilo e atendimento personalizado.</p>
        </div>
        <div className="text-sm text-neutral-400 space-y-1">
          <p>{address}</p>
          <p>{phone}</p>
          {instagram && <p>@{instagram}</p>}
        </div>
      </div>
      <div className="border-t border-[#333] py-4 text-center text-xs text-neutral-600">
        © {new Date().getFullYear()} {name}
      </div>
    </footer>
  );
}
