import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ads Timeline & Traffic Tracker | Instant Productions',
  description: 'System zarządzania i monitorowania czasu emisji reklam TV (Ireland West Music TV & Broadcast Commercials)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="dark">
      <body className="antialiased bg-zinc-950 text-zinc-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
