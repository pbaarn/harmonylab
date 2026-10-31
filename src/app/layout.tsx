import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HarmonyLab — Top-Note Piano Voicings & Reharmonizer',
  description:
    'A modern piano chord voicing and reharmonization tool indexed by melody soprano top note. Rich Jazz, Neo-Soul, and R&B chords.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col font-sans antialiased bg-[#FAF9F5] text-slate-800">
        {children}
      </body>
    </html>
  );
}
