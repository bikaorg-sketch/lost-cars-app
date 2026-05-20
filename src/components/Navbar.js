'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';
import Logo from './Logo';

const NAV_LINKS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/reports/search', label: 'البلاغات' },
  { href: '/reports/found', label: 'تم العثور عليها', accent: 'green' },
  { href: '/map', label: 'الخريطة' },
  { href: '/contact', label: 'تواصل' },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2.5 text-lg font-bold text-slate-900">
          <span className="transition group-hover:scale-105 group-hover:drop-shadow-md">
            <Logo size={40} />
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-base text-brand-700">السيارات المفقودة</span>
            <span className="text-[10px] font-medium text-slate-500">منصة سودانية للبلاغات</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 text-sm md:flex">
          {NAV_LINKS.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            const accent =
              link.accent === 'green'
                ? active
                  ? 'bg-success-100 text-success-700'
                  : 'text-success-700 hover:bg-success-50'
                : active
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-700 hover:bg-slate-100';
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 font-medium transition ${accent}`}
              >
                {link.label}
              </Link>
            );
          })}
          {session && (
            <Link
              href="/reports/new"
              className={`mr-1 rounded-lg px-3 py-1.5 font-medium transition ${
                pathname.startsWith('/reports/new')
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              ＋ تسجيل بلاغ
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {status === 'loading' ? null : session ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                دخول
              </Link>
              <Link href="/register" className="btn-primary btn-sm">
                إنشاء حساب
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav links - shown below header on small screens */}
      <div className="border-t border-slate-200/70 md:hidden">
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 py-2 text-xs">
          {NAV_LINKS.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-lg px-2.5 py-1 transition ${
                  active ? 'bg-brand-50 font-medium text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {session && (
            <Link
              href="/reports/new"
              className="shrink-0 rounded-lg bg-brand-600 px-2.5 py-1 font-medium text-white"
            >
              ＋ بلاغ
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
