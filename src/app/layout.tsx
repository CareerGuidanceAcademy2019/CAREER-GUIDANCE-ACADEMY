import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { CgaProvider } from '@/context/CgaContext';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { CookieConsentBanner } from '@/components/layout/CookieConsentBanner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://careerguidanceacademy.in';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Career Guidance Academy (C.G.A) | Coaching in Udaipur, Tripura',
    template: '%s | Career Guidance Academy',
  },
  description:
    'Official web portal of Career Guidance Academy (C.G.A), Chanban Youth Club Rd, Udaipur, Tripura 799120. Coaching for TET, STGT, STPGT, TPSC, JRBT, Banking, SSC, Railway, and Class VII to X (TBSE & CBSE).',
  alternates: {
    canonical: './',
  },
  openGraph: {
    title: 'Career Guidance Academy (C.G.A) | Coaching in Udaipur, Tripura',
    description:
      'Premier coaching institute in Udaipur, Gomati Tripura. Offline classroom coaching and online mock test series for competitive exams and school foundations.',
    url: siteUrl,
    siteName: 'Career Guidance Academy (C.G.A)',
    locale: 'en_IN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col bg-white text-slate-900 antialiased">
        <CgaProvider>
          {children}
          <ToastContainer />
          <CookieConsentBanner />
        </CgaProvider>
      </body>
    </html>
  );
}
