'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

const ROLE_LABELS = {
  admin: { text: 'أدمن', cls: 'bg-amber-100 text-amber-800' },
  user: { text: 'عضو', cls: 'bg-slate-100 text-slate-700' },
};

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (status === 'loading' || !session?.user) return null;

  const { name, email, role } = session.user;
  const initial = (name || email || '?').trim()[0]?.toUpperCase() || '?';
  const roleLabel = ROLE_LABELS[role] || ROLE_LABELS.user;
  const isAdmin = role === 'admin';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-slate-100 px-1.5 py-1 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-white ${
            isAdmin ? 'bg-amber-600' : 'bg-brand-600'
          }`}
        >
          {initial}
        </span>
        <span className="hidden text-sm font-medium text-slate-800 sm:inline">
          {name?.split(' ')[0] || 'حسابي'}
        </span>
        <svg
          className={`hidden h-3 w-3 text-slate-500 transition sm:block ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 z-40 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="border-b border-slate-100 bg-gradient-to-l from-slate-50 to-white px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white ${
                  isAdmin ? 'bg-amber-600' : 'bg-brand-600'
                }`}
              >
                {initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{name}</p>
                <p className="truncate text-xs text-slate-500">{email}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${roleLabel.cls}`}>
                  {roleLabel.text}
                </span>
              </div>
            </div>
          </div>

          <nav className="py-1 text-sm">
            <MenuLink href="/profile" icon="👤" onClick={() => setOpen(false)}>
              الملف الشخصي
            </MenuLink>
            <MenuLink href="/settings" icon="⚙️" onClick={() => setOpen(false)}>
              إعدادات الحساب
            </MenuLink>
            <MenuLink href="/messages" icon="💬" onClick={() => setOpen(false)}>
              الرسائل
            </MenuLink>
            <MenuLink href="/notifications" icon="🔔" onClick={() => setOpen(false)}>
              الإشعارات
            </MenuLink>
            {isAdmin && (
              <>
                <div className="my-1 border-t border-slate-100" />
                <MenuLink href="/admin" icon="🛡️" onClick={() => setOpen(false)} highlight>
                  لوحة التحكم
                </MenuLink>
              </>
            )}
            <div className="my-1 border-t border-slate-100" />
            <button
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: '/' });
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-right text-red-600 transition hover:bg-red-50"
            >
              <span>🚪</span>
              <span>تسجيل خروج</span>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon, children, onClick, highlight }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 transition hover:bg-slate-50 ${
        highlight ? 'font-medium text-brand-700' : 'text-slate-700'
      }`}
    >
      <span>{icon}</span>
      <span>{children}</span>
    </Link>
  );
}
