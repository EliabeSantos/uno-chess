import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UNO Chess",
  description: "Xadrez 24×24 com cartas UNO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
