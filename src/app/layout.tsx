import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Enterprise HR Management & Analytics | Sanoat Korxonasi HR Tizimi",
  description: "Enterprise HR Management, Department Tree, KPI Deduction Engine, Employee Cards, and Executive Reports for 1500+ employees.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className="dark">
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
