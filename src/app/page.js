import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ReportCard from '@/components/ReportCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [recentReports, totalReports, recoveredCount, totalUsers] = await Promise.all([
    prisma.report.findMany({
      where: { status: 'approved' },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { images: true },
    }),
    prisma.report.count({ where: { status: 'approved' } }),
    prisma.report.count({ where: { status: 'recovered' } }),
    prisma.user.count(),
  ]);

  void totalReports; // count is shown only in the stats grid below; not in the hero chip.

  return (
    <div className="space-y-14">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-6 py-14 text-white shadow-card-hover sm:px-12 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.15) 0px, transparent 40%), radial-gradient(circle at 85% 80%, rgba(255,255,255,0.12) 0px, transparent 40%)',
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-medium backdrop-blur">
            <span>🇸🇩</span>
            <span>منصة سودانية موثوقة</span>
          </div>

          <h1 className="font-display mb-3 text-4xl font-bold leading-[1.15] tracking-tight sm:text-6xl">
            ابحث عن سيارتك المفقودة
          </h1>

          <p className="mx-auto mb-2 inline-block bg-gradient-to-l from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-lg font-medium tracking-wide text-transparent sm:text-2xl">
            بأقل وقت وأكبر فرصة
          </p>

          <p className="mx-auto mb-8 mt-5 max-w-xl text-sm leading-relaxed text-brand-50/90 sm:text-base">
            سجّل بلاغك، تواصل مع المجتمع السوداني، وزيد فرصتك في استرداد سيارتك بفضل المشاهدات والإبلاغات.
          </p>

          <form
            action="/reports/search"
            method="GET"
            className="mx-auto flex max-w-2xl flex-col gap-2 rounded-2xl bg-white/10 p-2 backdrop-blur sm:flex-row"
          >
            <input
              type="text"
              name="q"
              placeholder="ابحث برقم اللوحة، الشاسيه، أو الموديل..."
              className="flex-1 rounded-xl border-0 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-soft focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-900 shadow-soft transition hover:bg-amber-300 active:scale-[0.98]"
            >
              🔎 بحث
            </button>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
            <Link
              href="/reports/new"
              className="rounded-full bg-white/15 px-4 py-2 font-medium backdrop-blur transition hover:bg-white/25"
            >
              ＋ تسجيل بلاغ
            </Link>
            <Link
              href="/reports/found"
              className="rounded-full bg-white/15 px-4 py-2 font-medium backdrop-blur transition hover:bg-white/25"
            >
              ✅ السيارات المستردة
            </Link>
            <Link
              href="/map"
              className="rounded-full bg-white/15 px-4 py-2 font-medium backdrop-blur transition hover:bg-white/25"
            >
              🗺️ عرض الخريطة
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="بلاغ نشط" value={totalReports} accent="text-brand-700" icon="📋" />
        <StatCard
          label="سيارة تم استردادها"
          value={recoveredCount}
          accent="text-success-600"
          icon="✅"
          href="/reports/found"
        />
        <StatCard label="عضو في المنصة" value={totalUsers} accent="text-amber-600" icon="👥" />
        <StatCard label="مجاناً للجميع" value="100%" accent="text-purple-600" icon="🎁" />
      </section>

      {/* RECENT REPORTS */}
      <section>
        <div className="section-header">
          <div>
            <h2 className="section-title">أحدث البلاغات</h2>
            <p className="text-sm text-slate-600">آخر السيارات اللي تم الإبلاغ عنها</p>
          </div>
          <Link href="/reports/search" className="text-sm font-medium text-brand-700 hover:underline">
            عرض الكل ←
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <div className="empty-state">
            <div className="text-4xl">🔍</div>
            <p>لا توجد بلاغات منشورة حالياً.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentReports.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section>
        <div className="section-header">
          <h2 className="section-title">كيف تعمل المنصة؟</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Step
            number="1"
            icon="📝"
            title="سجّل بلاغك"
            text="أدخل بيانات سيارتك مع الصور والمكان وزمن الفقد، يتم مراجعة البلاغ ونشره."
          />
          <Step
            number="2"
            icon="📣"
            title="انشر بين الناس"
            text="شارك رابط البلاغ. أعضاء المنصة يبلّغوك بأي مشاهدة مشبوهة لسيارتك."
          />
          <Step
            number="3"
            icon="🎉"
            title="استرد سيارتك"
            text="عند العثور عليها، حدّث الحالة لـ 'تم الاسترداد' لمساعدة الآخرين."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="overflow-hidden rounded-3xl border border-brand-200/60 bg-gradient-to-l from-brand-50 to-white p-8 text-center sm:p-12">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">جاهز تسجل بلاغك؟</h2>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          خطوة واحدة منك ومجتمع كامل مستعد لمساعدتك.
        </p>
        <Link href="/reports/new" className="btn-primary btn-lg mt-5 inline-flex">
          ابدأ الآن ←
        </Link>
      </section>
    </div>
  );
}

function StatCard({ label, value, accent, icon, href }) {
  const inner = (
    <>
      <div className="mb-1 text-2xl">{icon}</div>
      <div className={`stat-value ${accent}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="stat-card text-center hover:-translate-y-0.5">
        {inner}
      </Link>
    );
  }
  return <div className="stat-card text-center">{inner}</div>;
}

function Step({ number, icon, title, text }) {
  return (
    <div className="relative card card-hover">
      <span className="absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
        {number}
      </span>
      <div className="mb-3 text-3xl">{icon}</div>
      <h3 className="mb-2 text-lg font-bold">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-600">{text}</p>
    </div>
  );
}
