import { Scissors } from "lucide-react";

export function Footer({
  name,
  address,
  mapsUrl,
  phone,
  instagram,
}: {
  name: string;
  address: string;
  mapsUrl?: string;
  phone: string;
  instagram: string;
}) {
  return (
    <footer className="site-footer mt-16">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 sm:grid-cols-2">
        <div>
          <div
            className="flex items-center gap-2 font-semibold mb-2"
            style={{ color: "var(--primary)" }}
          >
            <Scissors size={18} /> {name}
          </div>
          <p className="text-sm" style={{ color: "var(--muted-fg)" }}>
            Qualidade, estilo e atendimento personalizado.
          </p>
        </div>
        <div className="text-sm space-y-1" style={{ color: "var(--muted-fg)" }}>
          {mapsUrl ? (
            <p>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="underline">
                Ver no Google Maps
              </a>
            </p>
          ) : (
            address && <p>{address}</p>
          )}
          <p>{phone}</p>
          {instagram && <p>@{instagram}</p>}
        </div>
      </div>
      <div
        className="border-t py-4 text-center text-xs"
        style={{ borderColor: "var(--border)", color: "var(--muted-fg)" }}
      >
        © {new Date().getFullYear()} {name}
      </div>
    </footer>
  );
}
