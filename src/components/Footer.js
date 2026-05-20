import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <Logo size={40} />
              <span className="text-brand-700">السيارات المفقودة</span>
            </Link>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
              منصة سودانية مجانية للإبلاغ عن السيارات المسروقة والمفقودة، والبحث في قاعدة بيانات
              البلاغات، والتواصل مع الجمهور لمساعدة أصحاب السيارات في استرداد ممتلكاتهم.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-slate-900">روابط سريعة</h3>
            <ul className="space-y-2 text-sm">
              <FooterLink href="/reports/search">تصفح البلاغات</FooterLink>
              <FooterLink href="/reports/found">السيارات المستردة</FooterLink>
              <FooterLink href="/map">الخريطة</FooterLink>
              <FooterLink href="/reports/new">تسجيل بلاغ</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-slate-900">تواصل ودعم</h3>
            <ul className="space-y-2 text-sm">
              <FooterLink href="/contact">صفحة التواصل</FooterLink>
              <li className="text-slate-600">
                📧 <a href="mailto:support@lostcars.sd" className="hover:text-brand-700 hover:underline">support@lostcars.sd</a>
              </li>
              <li className="text-slate-600">
                📞 <a href="tel:+249912345678" className="font-mono hover:text-brand-700 hover:underline">+249 91 234 5678</a>
              </li>
              <li className="text-slate-600">📍 الخرطوم، السودان</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} منصة السيارات المفقودة — جميع الحقوق محفوظة.
          </p>
          <p>صُنع بحب لخدمة المجتمع السوداني 🇸🇩</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }) {
  return (
    <li>
      <Link href={href} className="text-slate-600 transition hover:text-brand-700">
        {children}
      </Link>
    </li>
  );
}
