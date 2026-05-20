'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const POLL_MS = 15000;

const ICONS = {
  message: '💬',
  sighting: '📍',
  report_status: '📋',
  system: '🔔',
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  async function load() {
    try {
      const res = await fetch('/api/notifications?limit=10', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch {}
  }

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function markAllRead() {
    setLoading(true);
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setUnread(0);
      setItems((arr) => arr.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
    } finally {
      setLoading(false);
    }
  }

  async function handleClick(n) {
    setOpen(false);
    if (!n.readAt) {
      fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [n.id] }),
      });
      setUnread((u) => Math.max(0, u - 1));
    }
    if (n.link) router.push(n.link);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg px-2 py-2 hover:bg-slate-100"
        aria-label="الإشعارات"
        title="الإشعارات"
      >
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -left-0.5 min-w-[18px] rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-[18px] text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
            <span className="text-sm font-bold">الإشعارات</span>
            <div className="flex items-center gap-2 text-xs">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="text-brand-600 hover:underline"
                >
                  تعليم الكل كمقروء
                </button>
              )}
              <Link href="/notifications" onClick={() => setOpen(false)} className="text-slate-600 hover:underline">
                عرض الكل
              </Link>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">لا توجد إشعارات.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex w-full items-start gap-3 border-b border-slate-100 px-3 py-2.5 text-right transition last:border-0 hover:bg-slate-50 ${
                    !n.readAt ? 'bg-brand-50/40' : ''
                  }`}
                >
                  <span className="text-lg leading-none">{ICONS[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${!n.readAt ? 'font-bold' : 'font-medium'}`}>
                        {n.title}
                      </p>
                      {!n.readAt && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                      )}
                    </div>
                    {n.body && <p className="truncate text-xs text-slate-600">{n.body}</p>}
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleString('ar-SD', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
