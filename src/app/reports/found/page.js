import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ReportCard from '@/components/ReportCard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'السيارات التي تم العثور عليها - منصة السيارات المفقودة',
  description: 'قائمة بالسيارات التي تم استردادها بفضل البلاغات والتعاون.',
};

export default async function FoundReportsPage() {
  const reports = await prisma.report.findMany({
    where: { status: 'recovered' },
    orderBy: { updatedAt: 'desc' },
    include: { images: true },
  });

  const totalRecovered = reports.length;
  const totalApproved = await prisma.report.count({ where: { status: 'approved' } });
  const recoveryRate =
    totalApproved + totalRecovered > 0
      ? Math.round((totalRecovered / (totalApproved + totalRecovered)) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-l from-green-600 to-emerald-700 px-6 py-10 text-white shadow-lg sm:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 text-5xl">✅</div>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
            السيارات التي تم العثور عليها
          </h1>
          <p className="text-lg text-green-50">
            قصص نجاح المنصة — سيارات تم استردادها بفضل تعاون الجمهور وسرعة الإبلاغ.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{totalRecovered}</div>
          <div className="text-sm text-slate-600">سيارة تم العثور عليها</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-brand-600">{totalApproved}</div>
          <div className="text-sm text-slate-600">بلاغ نشط حالياً</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-amber-600">{recoveryRate}%</div>
          <div className="text-sm text-slate-600">معدل الاسترداد</div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">آخر السيارات التي تم استردادها</h2>
          <Link href="/reports/search" className="text-sm text-brand-600 hover:underline">
            البحث في البلاغات النشطة ←
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="card text-center">
            <div className="mb-2 text-4xl">🔍</div>
            <h3 className="mb-1 font-bold">لا توجد سيارات تم العثور عليها بعد</h3>
            <p className="text-sm text-slate-600">
              ستظهر هنا قصص النجاح فور استرداد أي سيارة. ساعدنا بالإبلاغ عن السيارات المشبوهة.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((r) => (
              <div key={r.id} className="relative">
                <div className="absolute -top-2 left-3 z-10 rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white shadow">
                  ✓ تم العثور عليها
                </div>
                <ReportCard report={r} />
                <div className="mt-1 text-center text-xs text-slate-500">
                  تم الاسترداد في: {new Date(r.updatedAt).toLocaleDateString('ar-SD')}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card bg-slate-50">
        <h3 className="mb-2 font-bold">شارك في إنجاح المنصة</h3>
        <p className="mb-4 text-sm text-slate-600">
          كل سيارة مفقودة تعود لصاحبها بفضل عيون الجمهور. لو شفت سيارة مشبوهة، أبلغ عنها.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/reports/search" className="btn-primary text-sm">
            تصفّح البلاغات النشطة
          </Link>
          <Link href="/map" className="btn-secondary text-sm">
            عرض الخريطة
          </Link>
        </div>
      </section>
    </div>
  );
}
