import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Architectural Alchemist - AI Video Filter",
  description:
    "Video feed with Vertex AI pre-filtering for safe content detection",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white font-sans">
        <main className="container mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
