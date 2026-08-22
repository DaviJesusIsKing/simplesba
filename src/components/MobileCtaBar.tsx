export function MobileCtaBar({ whatsapp }: { whatsapp: string }) {
  const wa = whatsapp.replace(/\D/g, "");
  return (
    <div className="mobile-cta-bar">
      <a href="/agendar" className="btn btn-primary">
        Agendar
      </a>
      <a
        href={`https://wa.me/${wa.startsWith("55") ? wa : "55" + wa}?text=${encodeURIComponent("Olá! Gostaria de informações.")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary"
      >
        WhatsApp
      </a>
    </div>
  );
}
