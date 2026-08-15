import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { prisma } from "@/lib/prisma";
import { themeFromEst } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Barbearia Classic",
  description: "Cortes, barba e estilo. Agende online.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let theme = themeFromEst(null);
  try {
    const est = await prisma.establishment.findFirst();
    theme = themeFromEst(est);
  } catch {
    // defaults
  }

  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased" style={theme as CSSProperties}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
