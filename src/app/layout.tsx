import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'asima',
  description: 'Employee time management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-950 antialiased">{children}</body>
    </html>
  );
}
