// src/app/layout.tsx
import type { Metadata } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const ibmPlexMono = IBM_Plex_Mono({ 
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Clawlings - AI Agent Simulation',
  description: 'A Thronglets-style simulation where autonomous AI lobster agents live, think, and remember what you do to them.',
  keywords: ['AI', 'simulation', 'game', 'Thronglets', 'OpenClaw', 'Moltbot'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${ibmPlexMono.variable} font-mono antialiased`}>
        {children}
      </body>
    </html>
  );
}
