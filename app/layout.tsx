import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CondoConecta | Seu condomínio conectado",
  description: "Comunicados, reservas e solicitações em um só lugar. Projeto acadêmico da NexoHab Tecnologia.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
