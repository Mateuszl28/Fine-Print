import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter_Tight, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', axes: ['opsz', 'SOFT'] });
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif' });
const sans = Inter_Tight({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Fine Print — read it before you sign it',
  description:
    'Snap a contract. See the traps marked on the page, what it really costs, and the letter to send. Gym, lease, phone plan, pay-over-time.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4EFE6' },
    { media: '(prefers-color-scheme: dark)', color: '#1A1815' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
