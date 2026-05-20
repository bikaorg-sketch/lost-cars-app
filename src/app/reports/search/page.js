'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ReportCard from '@/components/ReportCard';

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

  return (
    <div className="space-y-6">
      <header className="hero bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 10% 10%, rgba(255,255,255,0.18) 0px, transparent 40%), radial-gradient(circle at 90% 90%, rgba(255,255,255,0.10) 0px, transparent 40%)',
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl">🔎 ابحث في البلاغات</h1>
          <p className="text-brand-50">
            ابحث برقم اللوحة أو الشاسيه، أو تصفّح كل البلاغات المنشورة.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 grid gap-2 rounded-2xl bg-white/10 p-2 backdrop-blur sm:grid-cols-[1fr_220px_auto]"
          >
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="rounded-xl border-0 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-soft focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="رقم اللوحة، الشاسيه، الماركة..."
            />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-xl border-0 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-soft focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="الولاية (اختياري)"
            />
            <button
              type="submit"
              className="rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-900 shadow-soft transition hover:bg-amber-300 active:scale-[0.98]"
            >
              بحث
            </button>
          </form>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-brand-100 hover:text-white hover:underline"
            >
              × مسح الفلاتر وعرض كل البلاغات
            </button>
          )}
        </div>
      </header>

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
            <p className="text-sm text-slate-500">جرّب كلمة بحث مختلفة أو ولاية أخرى.</p>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm">
            <p className="font-medium text-slate-700">
              {hasFilters ? `${results.length} نتيجة مطابقة` : `جميع البلاغات (${results.length})`}
            </p>
            <p className="text-xs text-slate-500">مرتبة من الأحدث للأقدم</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        </>
      )}
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
