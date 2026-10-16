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

export const metadata: Metadata = {
  title: 'Career Guidance Academy (C.G.A) | Premier Coaching in Udaipur, Tripura',
  description:
    'Official web portal of Career Guidance Academy (C.G.A), Chanban Youth Club Rd, Udaipur, Tripura 799114. Coaching for TET, STGT, STPGT, TPSC, JRBT, Banking, SSC, Railway, and Class VII to X (TBSE & CBSE).',
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
