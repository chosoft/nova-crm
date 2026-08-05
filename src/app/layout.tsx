import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nova CRM - Gestión de Relaciones",
  description: "Sistema de gestión de empresas y universidades para Nova",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
