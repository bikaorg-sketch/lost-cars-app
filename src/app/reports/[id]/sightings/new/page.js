'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-xl bg-slate-100" />,
});

const SUDAN_STATES = [
  'الخرطوم', 'الجزيرة', 'سنار', 'النيل الأبيض', 'النيل الأزرق', 'نهر النيل',
  'الشمالية', 'كسلا', 'القضارف', 'البحر الأحمر',
  'شمال كردفان', 'جنوب كردفان', 'غرب كردفان',
  'شمال دارفور', 'جنوب دارفور', 'شرق دارفور', 'غرب دارفور', 'وسط دارفور',
];

export default function NewSightingPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id;
  const { status } = useSession();

  const [report, setReport] = useState(null);
  const [form, setForm] = useState({
    description: '',
    city: '',
    area: '',
    latitude: null,
    longitude: null,
    contactPhone: '',
    seenAt: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/reports/${reportId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.report && setReport(d.report))
      .catch(() => {});
  }, [reportId]);

  if (status === 'loading') return <p className="text-center">جاري التحميل...</p>;

  if (status === 'unauthenticated') {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card">
          <h2 className="mb-3 text-xl font-bold">يجب تسجيل الدخول</h2>
          <Link href={`/login?callbackUrl=/reports/${reportId}/sightings/new`} className="btn-primary">
            دخول
          </Link>
        </div>
      </div>
    );
  }

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/sightings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل الإرسال');
        setLoading(false);
        return;
      }
      router.push(`/reports/${reportId}?sighting=1`);
    } catch (err) {
      setError('فشل الاتصال');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/reports/${reportId}`} className="text-sm text-brand-600 hover:underline">
        ← العودة للبلاغ
      </Link>

      <h1 className="mt-2 mb-1 text-2xl font-bold">الإبلاغ عن مشاهدة</h1>
      {report && (
        <p className="mb-4 text-slate-600">
          سيارة: {report.brand} {report.model}
          {report.plateNumber && ` (${report.plateNumber})`}
        </p>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card space-y-4">
          <div>
            <label className="label">وصف ما شاهدته *</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="input"
              placeholder="مثلاً: شفت السيارة متوقفة قدام بقالة في شارع..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">الولاية *</label>
              <select
                required
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                className="input"
              >
                <option value="">-- اختر الولاية --</option>
                {SUDAN_STATES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">المحلية/الحي/الشارع</label>
              <input
                type="text"
                value={form.area}
                onChange={(e) => update('area', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">تاريخ المشاهدة (اختياري)</label>
              <input
                type="date"
                value={form.seenAt}
                onChange={(e) => update('seenAt', e.target.value)}
                className="input"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="label">هاتفك (اختياري - لو ودك يتواصل معك صاحب البلاغ)</label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => update('contactPhone', e.target.value)}
                className="input"
                placeholder="09xxxxxxxx"
              />
            </div>
          </div>

          <div>
            <label className="label">حدّد المكان على الخريطة (اختياري)</label>
            <LocationPicker
              onChange={(lat, lng) => {
                update('latitude', lat);
                update('longitude', lng);
              }}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'جاري الإرسال...' : '📍 إرسال بلاغ المشاهدة'}
        </button>

        <p className="text-center text-xs text-slate-500">
          سيتم إخطار صاحب البلاغ فور إرسال المشاهدة.
        </p>
      </form>
    </div>
  );
}
