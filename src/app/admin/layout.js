import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login?callbackUrl=/admin');
  }
  if (session.user.role !== 'admin') {
    return (
      <div className="card mx-auto max-w-md text-center">
        <h2 className="mb-2 text-xl font-bold text-red-600">غير مصرّح</h2>
        <p className="text-slate-600">هذه الصفحة للأدمن فقط.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="card h-fit">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          لوحة التحكم
        </h2>
        <nav className="space-y-1 text-sm">
          <Link href="/admin" className="block rounded-lg px-3 py-2 hover:bg-slate-100">
            نظرة عامة
          </Link>
          <Link href="/admin/reports" className="block rounded-lg px-3 py-2 hover:bg-slate-100">
            البلاغات
          </Link>
          <Link href="/admin/messages" className="block rounded-lg px-3 py-2 hover:bg-slate-100">
            الرسائل
          </Link>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
