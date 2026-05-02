import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NHL Live Betting Dashboard',
  description: 'NHL odds, edges, and pick tracker dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
