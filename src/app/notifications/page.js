'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const ICONS = {
  message: '💬',
  sighting: '📍',
  report_status: '📋',
  system: '🔔',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=100', { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/login?callbackUrl=/notifications');
        return;
      }
      const data = await res.json();
      setItems(data.notifications || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'authenticated') load();
  }, [status]);

  async function markAllRead() {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setItems((arr) => arr.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
  }

  async function deleteAll() {
    if (!confirm('حذف كل الإشعارات؟')) return;
    await fetch('/api/notifications?all=1', { method: 'DELETE' });
    setItems([]);
  }

  async function deleteOne(id) {
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
    setItems((arr) => arr.filter((n) => n.id !== id));
  }

  async function handleClick(n) {
    if (!n.readAt) {
      fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [n.id] }),
      });
      setItems((arr) => arr.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
    }
    if (n.link) router.push(n.link);
  }

  const unreadCount = items.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">الإشعارات</h1>
        <div className="flex gap-2 text-sm">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary text-sm">
              تعليم الكل كمقروء
            </button>
          )}
          {items.length > 0 && (
            <button onClick={deleteAll} className="text-red-600 hover:underline">
              مسح الكل
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-slate-500">جاري التحميل...</p>
      ) : items.length === 0 ? (
        <div className="card text-center">
          <div className="mb-2 text-4xl">🔕</div>
          <p className="text-slate-600">لا توجد إشعارات.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {items.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50 ${
                !n.readAt ? 'bg-brand-50/40' : ''
              }`}
            >
              <button
                onClick={() => handleClick(n)}
                className="flex flex-1 items-start gap-3 text-right"
              >
                <span className="text-xl leading-none">{ICONS[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm ${!n.readAt ? 'font-bold' : 'font-medium'}`}>
                      {n.title}
                    </p>
                    {!n.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                  </div>
                  {n.body && <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-slate-400">
                    {new Date(n.createdAt).toLocaleString('ar-SD', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </button>
              <button
                onClick={() => deleteOne(n.id)}
                title="حذف"
                className="self-center text-slate-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
