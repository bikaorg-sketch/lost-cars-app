import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [total, pending, approved, recovered, users, deletionRequests, supportConvs] = await Promise.all([
    prisma.report.count(),
    prisma.report.count({ where: { status: 'pending' } }),
    prisma.report.count({ where: { status: 'approved' } }),
    prisma.report.count({ where: { status: 'recovered' } }),
    prisma.user.count(),
    prisma.report.count({ where: { deletionRequestedAt: { not: null } } }),
    prisma.conversation.count({ where: { type: 'support' } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">🛡️ لوحة التحكم</h1>
        <p className="page-subtitle">نظرة عامة على نشاط المنصة</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon="📋" label="إجمالي البلاغات" value={total} accent="text-slate-900" />
        <Stat icon="⏳" label="قيد المراجعة" value={pending} accent="text-amber-600" href="/admin/reports?status=pending" />
        <Stat icon="✅" label="منشورة" value={approved} accent="text-success-600" href="/admin/reports?status=approved" />
        <Stat icon="🎉" label="تم استردادها" value={recovered} accent="text-brand-600" href="/admin/reports?status=recovered" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/reports?status=deletion_requested"
          className="card card-hover relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-red-600">طلبات حذف معلّقة</div>
              <div className="mt-1 text-3xl font-bold text-red-700">{deletionRequests}</div>
              <div className="mt-2 text-xs text-slate-500">يحتاج مراجعتك ←</div>
            </div>
            <div className="text-3xl">🗑️</div>
          </div>
        </Link>

        <Link href="/admin/messages" className="card card-hover">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-brand-600">محادثات دعم</div>
              <div className="mt-1 text-3xl font-bold text-brand-700">{supportConvs}</div>
              <div className="mt-2 text-xs text-slate-500">عرض الرسائل ←</div>
            </div>
            <div className="text-3xl">💬</div>
          </div>
        </Link>

        <div className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-slate-600">مستخدمين</div>
              <div className="mt-1 text-3xl font-bold text-slate-900">{users}</div>
              <div className="mt-2 text-xs text-slate-500">إجمالي مسجّلين</div>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold">⚡ إجراءات سريعة</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <QuickAction
            href="/admin/reports?status=pending"
            icon="⏳"
            title="مراجعة البلاغات الجديدة"
            count={pending}
          />
          <QuickAction
            href="/admin/reports?status=deletion_requested"
            icon="🗑️"
            title="مراجعة طلبات الحذف"
            count={deletionRequests}
          />
          <QuickAction href="/admin/messages" icon="💬" title="محادثات الدعم" count={supportConvs} />
          <QuickAction href="/admin/reports" icon="📋" title="كل البلاغات" />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent, href }) {
  const body = (
    <>
      <div className="flex items-start justify-between">
        <div className="text-xl">{icon}</div>
      </div>
      <div className={`stat-value mt-1 ${accent}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="stat-card hover:-translate-y-0.5">
        {body}
      </Link>
    );
  }
  return <div className="stat-card">{body}</div>;
}

function QuickAction({ href, icon, title, count }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-brand-300 hover:bg-brand-50"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="font-medium text-slate-800">{title}</span>
      </div>
      {count != null && count > 0 && (
        <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{count}</span>
      )}
    </Link>
  );
}
