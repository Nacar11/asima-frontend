import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

/*
 * Fonts loaded via next/font — embedded at build time, zero FOUT,
 * one HTTP request saved per font. CSS variables are picked up by
 * tailwind.config.ts's fontFamily extension.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'asima',
  description: 'Employee time management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-white font-sans text-neutral-950 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
