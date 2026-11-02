import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/AppProviders';

export const metadata: Metadata = {
  title: 'Ads Timeline & Traffic Tracker | Instant Productions',
  description:
    'TV commercial traffic and expiry tracker (Ireland West Music TV & The Michael Commins Show)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-zinc-950 text-zinc-100 min-h-screen">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

