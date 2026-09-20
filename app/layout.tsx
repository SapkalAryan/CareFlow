import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'CareFlow - Healthcare Management Platform',
  description: 'Production-ready Doctor-Patient-Pharmacy Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 antialiased font-sans">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
