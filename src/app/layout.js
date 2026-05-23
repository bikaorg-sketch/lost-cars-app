import './globals.css';
import { Cairo, Tajawal, IBM_Plex_Sans_Arabic } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Providers from '@/components/Providers';

// Display font - Cairo for headings, buttons, UI labels
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

// Body font - Tajawal for paragraphs and long-form text
const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-tajawal',
  display: 'swap',
});

// Mono/tabular font - IBM Plex Sans Arabic for plate numbers, codes
const plex = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
  display: 'swap',
});

export const metadata = {
  title: 'منصة السيارات المفقودة',
  description: 'منصة سودانية للإبلاغ عن السيارات المسروقة والمفقودة والبحث عنها',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${tajawal.variable} ${plex.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans">
        <Providers>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl flex-1 animate-fade-in px-4 py-6 sm:py-8">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
