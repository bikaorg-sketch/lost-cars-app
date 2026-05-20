'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';


const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-xl bg-slate-100" />,
});

const SUDAN_STATES = [
  'الخرطوم', 'الجزيرة', 'سنار', 'النيل الأبيض', 'النيل الأزرق', 'نهر النيل',
  'الشمالية', 'كسلا', 'القضارف', 'البحر الأحمر',
  'شمال كردفان', 'جنوب كردفان', 'غرب كردفان',
  'شمال دارفور', 'جنوب دارفور', 'شرق دارفور', 'غرب دارفور', 'وسط دارفور',
];

export default function NewReportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [form, setForm] = useState({
    plateNumber: '',
    chassisNumber: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    description: '',
    lostAt: '',
    lostCity: '',
    lostArea: '',
    latitude: null,
    longitude: null,
    contactName: session?.user?.name || '',
    contactPhone: '',
    contactEmail: session?.user?.email || '',
    reward: '',
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [duplicateReportId, setDuplicateReportId] = useState(null);
  const [loading, setLoading] = useState(false);

  if (status === 'loading') return <p className="text-center">جاري التحميل...</p>;

  if (status === 'unauthenticated') {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card">
          <h2 className="mb-3 text-xl font-bold">يجب تسجيل الدخول</h2>
          <p className="mb-4 text-slate-600">سجل الدخول أولاً لتتمكن من تسجيل بلاغ.</p>
          <Link href={`/login?callbackUrl=/reports/new`} className="btn-primary">
            دخول
          </Link>
        </div>
      </div>
    );
  }

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function uploadImages() {
    if (files.length === 0) return [];
    const fd = new FormData();
    for (const f of files) fd.append('files', f);

    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'فشل رفع الصور');
    }
    const data = await res.json();
    return data.urls;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setDuplicateReportId(null);

    if (!form.plateNumber.trim() && !form.chassisNumber.trim()) {
      setError('يجب إدخال رقم اللوحة أو رقم الشاسيه (واحد منهما على الأقل)');
      return;
    }

    setLoading(true);

    try {
      const imageUrls = await uploadImages();

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, images: imageUrls }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
        if (res.status === 409 && data.existingReportId) {
          setDuplicateReportId(data.existingReportId);
        }
        setLoading(false);
        return;
      }

      router.push(`/reports/${data.report.id}?new=1`);
    } catch (err) {
      setError(err.message || 'فشل إرسال البلاغ');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold">تسجيل بلاغ سيارة مفقودة</h1>
      <p className="mb-6 text-slate-600">
        ادخل التفاصيل بدقة لتزيد فرصة الوصول إلى سيارتك. سيتم مراجعة البلاغ قبل النشر.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{error}</p>
          {duplicateReportId && (
            <Link
              href={`/reports/${duplicateReportId}`}
              className="mt-2 inline-block font-medium text-red-900 underline hover:text-red-700"
            >
              عرض البلاغ الموجود ←
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="card">
          <h2 className="mb-4 text-lg font-bold">بيانات السيارة</h2>
          <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            💡 يجب إدخال <strong>رقم اللوحة</strong> أو <strong>رقم الشاسيه</strong> (واحد منهما على الأقل).
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">رقم اللوحة</label>
              <input
                type="text"
                value={form.plateNumber}
                onChange={(e) => update('plateNumber', e.target.value)}
                className="input font-mono"
                placeholder="مثال: KRT 12345"
              />
            </div>
            <div>
              <label className="label">رقم الشاسيه</label>
              <input
                type="text"
                value={form.chassisNumber}
                onChange={(e) => update('chassisNumber', e.target.value)}
                className="input font-mono"
                placeholder="17 رقم/حرف"
              />
            </div>
            <div>
              <label className="label">الماركة *</label>
              <input
                type="text"
                required
                value={form.brand}
                onChange={(e) => update('brand', e.target.value)}
                className="input"
                placeholder="تويوتا، هيونداي..."
              />
            </div>
            <div>
              <label className="label">الموديل *</label>
              <input
                type="text"
                required
                value={form.model}
                onChange={(e) => update('model', e.target.value)}
                className="input"
                placeholder="كورولا، إلنترا..."
              />
            </div>
            <div>
              <label className="label">سنة الصنع</label>
              <input
                type="number"
                min="1950"
                max={new Date().getFullYear() + 1}
                value={form.year}
                onChange={(e) => update('year', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">اللون *</label>
              <input
                type="text"
                required
                value={form.color}
                onChange={(e) => update('color', e.target.value)}
                className="input"
                placeholder="أبيض، أسود..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">وصف إضافي (علامات مميزة، إكسسوارات، إلخ)</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                className="input"
              />
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="mb-4 text-lg font-bold">مكان وزمان الفقد</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">تاريخ الفقد (اختياري)</label>
              <input
                type="date"
                value={form.lostAt}
                onChange={(e) => update('lostAt', e.target.value)}
                className="input"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="label">الولاية *</label>
              <select
                required
                value={form.lostCity}
                onChange={(e) => update('lostCity', e.target.value)}
                className="input"
              >
                <option value="">-- اختر الولاية --</option>
                {SUDAN_STATES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">المحلية/الحي/الشارع</label>
              <input
                type="text"
                value={form.lostArea}
                onChange={(e) => update('lostArea', e.target.value)}
                className="input"
                placeholder="بحري، الخرطوم 2، شارع المك نمر..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">حدّد الموقع على الخريطة</label>
              <LocationPicker
                onChange={(lat, lng) => {
                  update('latitude', lat);
                  update('longitude', lng);
                }}
              />
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="mb-4 text-lg font-bold">صور السيارة</h2>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setFiles(Array.from(e.target.files))}
            className="block w-full text-sm file:ml-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-brand-700 hover:file:bg-brand-100"
          />
          <p className="mt-2 text-xs text-slate-500">JPG, PNG, WebP - حد أقصى 5MB لكل صورة</p>
          {files.length > 0 && (
            <p className="mt-2 text-sm text-slate-700">تم اختيار {files.length} صورة</p>
          )}
        </section>

        <section className="card">
          <h2 className="mb-4 text-lg font-bold">بيانات التواصل</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">الاسم *</label>
              <input
                type="text"
                required
                value={form.contactName}
                onChange={(e) => update('contactName', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">رقم الهاتف *</label>
              <input
                type="tel"
                required
                value={form.contactPhone}
                onChange={(e) => update('contactPhone', e.target.value)}
                className="input"
                placeholder="09xxxxxxxx أو +24991xxxxxxx"
              />
            </div>
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => update('contactEmail', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">قيمة المكافأة (اختياري)</label>
              <input
                type="number"
                min="0"
                value={form.reward}
                onChange={(e) => update('reward', e.target.value)}
                className="input"
                placeholder="بالجنيه السوداني"
              />
            </div>
          </div>
        </section>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg">
          {loading ? 'جاري الإرسال...' : 'إرسال البلاغ'}
        </button>
      </form>
    </div>
  );
}
