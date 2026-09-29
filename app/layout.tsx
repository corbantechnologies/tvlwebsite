import type { Metadata } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tamarind Village Mombasa | Luxury Coastal Suites, Dining & Dhow Cruises',
  description: 'The quintessential coastal sanctuary overlooking Mombasa Old Harbour. Featuring luxury self-catering apartments, world-renowned seafood at Tamarind Restaurant, and unforgettable sunset cruises on the Tamarind Dhow.',
  keywords: [
    'Tamarind Village', 'Mombasa luxury apartments', 'Tamarind Restaurant',
    'Tamarind Dhow', 'Tudor Creek', 'Nyali coastal resort', 'Mombasa honeymoons'
  ],
  authors: [{ name: 'Tamarind Village Mombasa' }],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/assets/logo.png',
  },
  openGraph: {
    title: 'Tamarind Village Mombasa | Luxury Coastal Suites & Dhow Dining',
    description: 'Luxury ocean-facing suites, legendary clifftop seafood, and sunset dhow voyages over Mombasa Old Port.',
    url: 'https://tamarindvillage.co.ke',
    siteName: 'Tamarind Village',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'Tamarind Village Mombasa Pool and Harbour View',
      },
    ],
    locale: 'en_KE',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${jakarta.variable} scroll-smooth`}>
      <body className="min-h-screen bg-[#FAF6F0] text-[#1F1615] antialiased selection:bg-[#821124] selection:text-white">
        {children}
      </body>
    </html>
  );
}
