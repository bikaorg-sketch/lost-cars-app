import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ReportCard from '@/components/ReportCard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'الملف الشخصي - منصة السيارات المفقودة',
};

const ROLE_META = {
  admin: { text: 'مدير النظام', cls: 'bg-amber-100 text-amber-800 ring-amber-500/20', grad: 'from-amber-500 to-orange-600' },
  user:  { text: 'عضو نشط',     cls: 'bg-brand-100 text-brand-700 ring-brand-500/20',   grad: 'from-brand-500 to-brand-700'   },
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/profile');
  }

  const [user, reports, sightings, stats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    }),
    prisma.report.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: { images: true },
    }),
    prisma.sighting.findMany({
      where: { reporterId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { report: { select: { id: true, brand: true, model: true, plateNumber: true } } },
    }),
    prisma.report.groupBy({
      by: ['status'],
      where: { ownerId: session.user.id },
      _count: { status: true },
    }),
  ]);

  if (!user) redirect('/login');

  const roleInfo = ROLE_META[user.role] || ROLE_META.user;
  const initial = (user.name || '?').trim()[0]?.toUpperCase() || '?';
  const statusCounts = stats.reduce((acc, s) => {
    acc[s.status] = s._count.status;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-700">الرئيسية</Link>
        <span>›</span>
        <span className="text-slate-700">حسابي</span>
      </nav>

      {/* Two-column dashboard layout */}
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* ASIDE - profile + stats */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {/* Profile card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card">
            {/* Cover gradient */}
            <div className={`relative h-24 bg-gradient-to-br ${roleInfo.grad}`}>
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0px, transparent 50%)',
                }}
              />
            </div>
            {/* Avatar overlapping cover */}
            <div className="px-5 pb-5">
              <span
                className={`relative -mt-12 mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${roleInfo.grad} text-3xl font-bold text-white shadow-card-hover ring-4 ring-white`}
              >
                {initial}
              </span>
              <h1 className="text-lg font-bold leading-tight">{user.name}</h1>
              <span className={`badge mt-1 ${roleInfo.cls} ring-1`}>{roleInfo.text}</span>

              <dl className="mt-4 space-y-2 text-sm">
                <Info icon="📧" label="البريد"><span className="break-all">{user.email}</span></Info>
                <Info icon="📱" label="الهاتف">
                  {user.phone || <span className="text-slate-400">غير محدد</span>}
                </Info>
                <Info icon="📅" label="عضو منذ">
                  {new Date(user.createdAt).toLocaleDateString('ar-SD', { year: 'numeric', month: 'long' })}
                </Info>
              </dl>

              <Link href="/settings" className="btn-secondary mt-4 w-full justify-center text-sm">
                ⚙️ تعديل الحساب
              </Link>
            </div>
          </div>

          {/* Stats card */}
          <div className="card !p-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">إحصائيات</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="بلاغات" value={reports.length} accent="text-slate-900" />
              <StatTile label="منشورة" value={statusCounts.approved || 0} accent="text-success-600" />
              <StatTile label="مستردة" value={statusCounts.recovered || 0} accent="text-brand-600" />
              <StatTile label="مشاهدات" value={sightings.length} accent="text-amber-600" />
            </div>
          </div>

          {/* Quick actions */}
          <div className="card !p-3">
            <Link href="/reports/new" className="btn-primary w-full justify-center text-sm">
              ＋ تسجيل بلاغ جديد
            </Link>
          </div>
        </aside>

        {/* MAIN content */}
        <main className="space-y-5">
          {/* Reports section */}
          <section>
            <div className="section-header">
              <div>
                <h2 className="section-title">📋 بلاغاتي</h2>
                <p className="text-sm text-slate-600">جميع البلاغات اللي سجّلتها ({reports.length})</p>
              </div>
            </div>

            {reports.length === 0 ? (
              <div className="empty-state">
                <div className="text-5xl">📭</div>
                <p className="font-medium text-slate-700">لم تنشر أي بلاغ بعد</p>
                <Link href="/reports/new" className="btn-primary btn-sm mt-2">
                  ابدأ ببلاغ جديد ←
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {reports.map((r) => (
                  <ReportCard key={r.id} report={r} showStatus />
                ))}
              </div>
            )}
          </section>

          {/* Sightings section */}
          {sightings.length > 0 && (
            <section>
              <div className="section-header">
                <h2 className="section-title">📍 آخر مشاهداتي</h2>
              </div>
              <ul className="space-y-3">
                {sightings.map((s) => (
                  <li key={s.id} className="card card-hover !p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/reports/${s.report?.id}`}
                          className="text-sm font-bold text-brand-700 hover:underline"
                        >
                          🚗 {s.report?.brand} {s.report?.model}
                          {s.report?.plateNumber ? ` (${s.report.plateNumber})` : ''}
                        </Link>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-700">{s.description}</p>
                      </div>
                      <div className="shrink-0 text-left text-xs text-slate-500">
                        <div>📍 {s.city}</div>
                        <div className="mt-1">{new Date(s.createdAt).toLocaleDateString('ar-SD')}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function Info({ icon, label, children }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
        <dd className="text-sm text-slate-800">{children}</dd>
      </div>
    </div>
  );
}

function StatTile({ label, value, accent }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-center">
      <div className={`text-2xl font-bold leading-none ${accent}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-600">{label}</div>
    </div>
  );
}
