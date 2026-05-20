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
  admin: { text: 'مدير النظام', cls: 'bg-amber-100 text-amber-800 ring-1 ring-amber-500/20', grad: 'from-amber-500 to-orange-600' },
  user: { text: 'عضو نشط', cls: 'bg-brand-100 text-brand-700 ring-1 ring-brand-500/20', grad: 'from-brand-500 to-brand-700' },
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
      take: 5,
      include: {
        report: { select: { id: true, brand: true, model: true, plateNumber: true } },
      },
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
    <div className="space-y-8">
      {/* Hero header */}
      <section className="hero bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 90% 10%, rgba(255,255,255,0.18) 0px, transparent 35%), radial-gradient(circle at 10% 90%, rgba(255,255,255,0.10) 0px, transparent 35%)',
          }}
        />
        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
          <span
            className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${roleInfo.grad} text-4xl font-bold text-white shadow-card-hover ring-4 ring-white/20`}
          >
            {initial}
          </span>
          <div className="flex-1 text-center sm:text-right">
            <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-2xl font-bold sm:text-3xl">{user.name}</h1>
              <span className={`badge ${roleInfo.cls}`}>{roleInfo.text}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-slate-300 sm:justify-start">
              <span className="flex items-center gap-1.5">📧 {user.email}</span>
              <span className="flex items-center gap-1.5">
                📱 {user.phone || <span className="text-slate-400">غير محدد</span>}
              </span>
              <span className="flex items-center gap-1.5">
                📅 عضو منذ {new Date(user.createdAt).toLocaleDateString('ar-SD', { year: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
          <Link
            href="/settings"
            className="rounded-xl bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25"
          >
            ⚙️ تعديل الحساب
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon="📋" label="إجمالي البلاغات" value={reports.length} accent="text-slate-900" />
        <Stat icon="✅" label="بلاغات منشورة" value={statusCounts.approved || 0} accent="text-success-600" />
        <Stat icon="🎉" label="تم استردادها" value={statusCounts.recovered || 0} accent="text-brand-600" />
        <Stat icon="📍" label="مشاهدات قدمتها" value={sightings.length} accent="text-amber-600" />
      </section>

      {/* Reports */}
      <section>
        <div className="section-header">
          <div>
            <h2 className="section-title">📋 بلاغاتي</h2>
            <p className="text-sm text-slate-600">جميع البلاغات اللي سجّلتها</p>
          </div>
          <Link href="/reports/new" className="btn-primary btn-sm">＋ بلاغ جديد</Link>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((r) => (
              <ReportCard key={r.id} report={r} showStatus />
            ))}
          </div>
        )}
      </section>

      {/* Sightings */}
      {sightings.length > 0 && (
        <section>
          <div className="section-header">
            <h2 className="section-title">📍 آخر مشاهدات قدمتها</h2>
          </div>
          <ul className="space-y-3">
            {sightings.map((s) => (
              <li key={s.id} className="card card-hover">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/reports/${s.report?.id}`}
                      className="font-bold text-brand-700 hover:underline"
                    >
                      🚗 {s.report?.brand} {s.report?.model}
                      {s.report?.plateNumber ? ` (${s.report.plateNumber})` : ''}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-700">{s.description}</p>
                  </div>
                  <div className="shrink-0 text-left text-xs text-slate-500">
                    <div className="flex items-center gap-1">📍 {s.city}</div>
                    <div className="mt-1">{new Date(s.createdAt).toLocaleDateString('ar-SD')}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ icon, label, value, accent }) {
  return (
    <div className="stat-card text-center sm:text-right">
      <div className="mb-1 text-xl">{icon}</div>
      <div className={`stat-value ${accent}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
