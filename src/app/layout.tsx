import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { prisma } from "@/lib/prisma";
import { themeFromEst } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Barbearia",
  description: "Cortes, barba e estilo. Agende online.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f0f0f",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RootLayout({ children }: { children: ReactNode }) {
  let theme = themeFromEst(null);
  try {
    const est = await prisma.establishment.findFirst({
      select: {
        primaryColor: true,
        bgColor: true,
        cardColor: true,
        name: true,
      },
    });
    theme = themeFromEst(est);
  } catch {
    // defaults
  }

  return (
    <html lang="pt-BR">
      <body
        className="min-h-screen antialiased bg-[var(--bg)] text-[var(--fg)]"
        style={theme as CSSProperties}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
