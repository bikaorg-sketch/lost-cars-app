'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function SightingsList({ reportId, isOwner }) {
  const { data: session } = useSession();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/sightings`, { cache: 'no-store' });
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data = await res.json();
      setItems(data.sightings || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  async function deleteOne(id) {
    if (!confirm('حذف هذه المشاهدة؟')) return;
    const res = await fetch(`/api/sightings/${id}`, { method: 'DELETE' });
    if (res.ok) setItems((arr) => arr.filter((s) => s.id !== id));
  }

  if (loading) return <p className="text-sm text-slate-500">جاري تحميل المشاهدات...</p>;

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        لا توجد بلاغات مشاهدة بعد. شجّع الناس على المساعدة بمشاركة البلاغ.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((s) => {
        const canDelete =
          session?.user?.role === 'admin' ||
          session?.user?.id === s.reporterId ||
          isOwner;
        return (
          <li key={s.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <div className="mb-1 flex items-start justify-between gap-2">
              <div>
                <span className="font-medium text-slate-900">
                  📍 {s.city}{s.area ? ` - ${s.area}` : ''}
                </span>
                {s.reporter?.name && (
                  <span className="mr-2 text-xs text-slate-500">بواسطة: {s.reporter.name}</span>
                )}
              </div>
              {canDelete && (
                <button
                  onClick={() => deleteOne(s.id)}
                  title="حذف"
                  className="text-slate-400 hover:text-red-600"
                >
                  🗑️
                </button>
              )}
            </div>
            <p className="whitespace-pre-wrap text-slate-700">{s.description}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              {s.seenAt && (
                <span>👁️ شوهدت في: {new Date(s.seenAt).toLocaleDateString('ar-SD')}</span>
              )}
              <span>
                ⏰ {new Date(s.createdAt).toLocaleDateString('ar-SD', { dateStyle: 'medium' })}
              </span>
              {s.contactPhone && isOwner && (
                <span>
                  📞{' '}
                  <a href={`tel:${s.contactPhone}`} className="font-mono text-brand-700 hover:underline">
                    {s.contactPhone}
                  </a>
                </span>
              )}
              {s.latitude && s.longitude && (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${s.latitude}&mlon=${s.longitude}#map=15/${s.latitude}/${s.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  عرض الموقع على الخريطة ↗
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
