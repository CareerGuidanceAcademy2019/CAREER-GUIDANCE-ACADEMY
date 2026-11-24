import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { CgaProvider } from '@/context/CgaContext';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { CookieConsentBanner } from '@/components/layout/CookieConsentBanner';
import { GlobalNavigationLoader } from '@/components/layout/GlobalNavigationLoader';
import { SessionHeartbeat } from '@/components/auth/SessionHeartbeat';
import { UrgentAnnouncementModal } from '@/components/layout/UrgentAnnouncementModal';

const jakartaSans = Plus_Jakarta_Sans({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
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
    <html lang="en" className={`${jakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#fafaf9] text-slate-900 antialiased selection:bg-[#0056b3]/15 selection:text-[#0056b3]">
        <CgaProvider>
          {children}
          <UrgentAnnouncementModal />
          <SessionHeartbeat />
          <GlobalNavigationLoader />
          <ToastContainer />
          <CookieConsentBanner />
        </CgaProvider>
      </body>
    </html>
  );
}
