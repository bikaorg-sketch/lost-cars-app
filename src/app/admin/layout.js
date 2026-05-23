import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login?callbackUrl=/admin');
  }
  if (session.user.role !== 'admin') {
    return (
      <div className="card mx-auto max-w-md text-center">
        <div className="mb-3 text-5xl">🛡️</div>
        <h2 className="mb-2 text-xl font-bold text-red-600">غير مصرّح</h2>
        <p className="text-slate-600">هذه الصفحة للأدمن فقط.</p>
        <Link href="/" className="btn-primary btn-sm mt-4 inline-flex">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  // Live counts for sidebar badges
  const [pendingReports, deletionReqs, supportConvs] = await Promise.all([
    prisma.report.count({ where: { status: 'pending' } }),
    prisma.report.count({ where: { deletionRequestedAt: { not: null } } }),
    prisma.conversation.count({ where: { type: 'support' } }),
  ]);

  return (
    <div className="grid gap-5 md:grid-cols-[240px_1fr]">
      {/* Admin sidebar */}
      <aside className="space-y-3 md:sticky md:top-24 md:self-start">
        {/* Header */}
        <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-bl from-amber-50 to-white p-4 shadow-card">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-soft">
              🛡️
            </span>
            <div>
              <p className="text-xs font-medium text-amber-700">لوحة التحكم</p>
              <p className="text-sm font-bold text-amber-900">{session.user.name}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="space-y-0.5 rounded-2xl border border-slate-200/70 bg-white p-2 shadow-card">
          <SidebarLink href="/admin" icon="📊" label="نظرة عامة" />
          <SidebarLink href="/admin/reports" icon="📋" label="البلاغات" badge={pendingReports} />
          <SidebarLink
            href="/admin/reports?status=deletion_requested"
            icon="🗑️"
            label="طلبات الحذف"
            badge={deletionReqs}
            tone="red"
          />
          <SidebarLink href="/admin/messages" icon="💬" label="الرسائل" badge={supportConvs} />

          <div className="my-2 border-t border-slate-100" />

          <SidebarLink href="/" icon="🏠" label="عودة للموقع" muted />
        </nav>
      </aside>

      {/* Main content */}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function SidebarLink({ href, icon, label, badge, tone, muted }) {
  const badgeCls =
    tone === 'red'
      ? 'bg-red-600 text-white'
      : 'bg-brand-600 text-white';
  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition ${
        muted
          ? 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          : 'font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700'
      }`}
    >
      <span className="flex items-center gap-2">
        <span>{icon}</span>
        <span>{label}</span>
      </span>
      {badge != null && badge > 0 && (
        <span className={`rounded-full px-1.5 text-[10px] font-bold leading-[18px] ${badgeCls}`}>
          {badge}
        </span>
      )}
    </Link>
  );
}
