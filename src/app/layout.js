import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'منصة السيارات المفقودة',
  description: 'منصة سودانية للإبلاغ عن السيارات المسروقة والمفقودة والبحث عنها',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-screen flex-col">
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
