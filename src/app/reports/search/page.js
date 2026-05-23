'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import ReportCard from '@/components/ReportCard';

const SUDAN_STATES = [
  'الخرطوم', 'الجزيرة', 'سنار', 'النيل الأبيض', 'النيل الأزرق', 'نهر النيل',
  'الشمالية', 'كسلا', 'القضارف', 'البحر الأحمر',
  'شمال كردفان', 'جنوب كردفان', 'غرب كردفان',
  'شمال دارفور', 'جنوب دارفور', 'شرق دارفور', 'غرب دارفور', 'وسط دارفور',
];

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialCity = searchParams.get('city') || '';

  const [q, setQ] = useState(initialQ);
  const [city, setCity] = useState(initialCity);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runSearch(initialQ, initialCity);
  }, [initialQ, initialCity]);

  async function runSearch(query, cityFilter) {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (cityFilter) params.set('city', cityFilter);

    const res = await fetch(`/api/reports/search?${params.toString()}`);
    const data = await res.json();
    setResults(data.reports || []);
    setLoading(false);
  }

  const hasFilters = Boolean(q || city);

  function handleSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (city) params.set('city', city);
    router.push(`/reports/search?${params.toString()}`);
    runSearch(q, city);
  }

  function clearFilters() {
    setQ('');
    setCity('');
    router.push('/reports/search');
    runSearch('', '');
  }

  function quickCity(c) {
    setCity(c);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('city', c);
    router.push(`/reports/search?${params.toString()}`);
    runSearch(q, c);
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-700">الرئيسية</Link>
        <span>›</span>
        <span className="text-slate-700">البلاغات</span>
      </nav>

      <div className="page-header">
        <h1 className="page-title">🔎 البلاغات المنشورة</h1>
        <p className="page-subtitle">
          {loading
            ? 'جاري التحميل...'
            : hasFilters
              ? `${results.length} نتيجة مطابقة`
              : `${results.length} بلاغ نشط - تصفّح أو فلتر بالولاية`}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* ASIDE - Filters */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {/* Search form */}
          <div className="card !p-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              فلاتر البحث
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label !text-xs">كلمة البحث</label>
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="input"
                  placeholder="لوحة، شاسيه، ماركة..."
                />
              </div>
              <div>
                <label className="label !text-xs">الولاية</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input"
                >
                  <option value="">جميع الولايات</option>
                  {SUDAN_STATES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary w-full justify-center">
                🔍 بحث
              </button>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-900 hover:underline"
                >
                  × مسح الفلاتر
                </button>
              )}
            </form>
          </div>

          {/* Quick city chips */}
          <div className="card !p-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              ولايات شائعة
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {['الخرطوم', 'الجزيرة', 'نهر النيل', 'البحر الأحمر', 'كسلا'].map((c) => (
                <button
                  key={c}
                  onClick={() => quickCity(c)}
                  className={`rounded-full px-2.5 py-1 text-xs transition ${
                    city === c
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
            <p className="mb-1 font-bold">💡 نصيحة بحث</p>
            <p>
              تقدر تبحث بـ <strong>جزء من رقم اللوحة</strong> أو <strong>الشاسيه</strong>،
              ومش لازم تكتب الرقم كامل.
            </p>
          </div>
        </aside>

        {/* MAIN - Results */}
        <main>
          {loading ? (
            <div className="empty-state">
              <div className="animate-pulse text-4xl">⏳</div>
              <p>جاري التحميل...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="empty-state">
              <div className="text-5xl">🔍</div>
              <p className="font-medium text-slate-700">
                {hasFilters ? 'لم يتم العثور على نتائج مطابقة' : 'لا توجد بلاغات منشورة حالياً'}
              </p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-sm text-brand-600 hover:underline"
                >
                  ← عرض كل البلاغات
                </button>
              )}
            </div>
          ) : (
            <>
              {hasFilters && (
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500">الفلاتر:</span>
                  {q && (
                    <span className="rounded-full bg-brand-100 px-2.5 py-0.5 font-medium text-brand-700">
                      &quot;{q}&quot;
                    </span>
                  )}
                  {city && (
                    <span className="rounded-full bg-brand-100 px-2.5 py-0.5 font-medium text-brand-700">
                      📍 {city}
                    </span>
                  )}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((r) => (
                  <ReportCard key={r.id} report={r} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="empty-state">
          <div className="animate-pulse text-4xl">⏳</div>
          <p>جاري التحميل...</p>
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
