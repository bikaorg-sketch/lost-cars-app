import Link from 'next/link';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ContactOwnerButton from '@/components/ContactOwnerButton';
import SightingsList from '@/components/SightingsList';
import RequestDeletionButton from '@/components/RequestDeletionButton';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const statusMeta = {
  pending: { text: 'قيد المراجعة', cls: 'badge-warning' },
  approved: { text: 'منشور', cls: 'badge-success' },
  rejected: { text: 'مرفوض', cls: 'badge-danger' },
  recovered: { text: 'تم استرداد السيارة', cls: 'badge-info' },
};

export const dynamicParams = true;

export default async function ReportDetailPage({ params, searchParams }) {
  const [report, session] = await Promise.all([
    prisma.report.findUnique({
      where: { id: params.id },
      include: {
        images: true,
        owner: { select: { name: true } },
      },
    }),
    getServerSession(authOptions),
  ]);

  if (!report) notFound();

  const status = statusMeta[report.status] || statusMeta.pending;
  const isNew = searchParams?.new === '1';
  const sightingSaved = searchParams?.sighting === '1';
  const isOwner = session?.user?.id === report.ownerId;
  const canReportSighting = report.status === 'approved' && session?.user && !isOwner;
  const coverImage = report.images?.[0]?.url;

  return (
    <article className="mx-auto max-w-4xl space-y-6">
      {isNew && (
        <Alert tone="success">
          ✅ تم إرسال البلاغ بنجاح! سيظهر للجمهور بعد مراجعة الإدارة.
        </Alert>
      )}
      {sightingSaved && (
        <Alert tone="success">✅ تم إرسال بلاغ المشاهدة وإخطار صاحب البلاغ.</Alert>
      )}

      <div className="flex items-center justify-between text-sm">
        <Link href="/reports/search" className="text-brand-700 hover:underline">
          ← العودة للبحث
        </Link>
        <span className={status.cls}>{status.text}</span>
      </div>

      {/* HERO HEADER WITH IMAGE */}
      <header className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card">
        <div className="relative aspect-[21/9] bg-gradient-to-br from-slate-100 to-slate-200">
          {coverImage ? (
            <img src={coverImage} alt="صورة السيارة" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-7xl opacity-60">🚗</div>
          )}
          {report.reward && (
            <div className="absolute bottom-3 left-3 rounded-full bg-amber-400 px-3 py-1 text-sm font-bold text-slate-900 shadow-card-hover">
              💰 مكافأة {report.reward.toLocaleString('ar-SD')} جنيه
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6">
          <h1 className="text-2xl font-bold sm:text-3xl">
            {report.brand} {report.model}{' '}
            {report.year && <span className="text-slate-500">({report.year})</span>}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {report.plateNumber && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-mono font-semibold text-brand-700 ring-1 ring-brand-500/20">
                <span className="text-xs font-sans text-brand-600">لوحة:</span>
                {report.plateNumber}
              </span>
            )}
            {report.chassisNumber && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-mono font-semibold text-slate-700 ring-1 ring-slate-500/20">
                <span className="text-xs font-sans text-slate-600">شاسيه:</span>
                {report.chassisNumber}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-500/20">
              🎨 {report.color}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-500/20">
              📍 {report.lostCity}
            </span>
          </div>
        </div>
      </header>

      {/* ADDITIONAL IMAGES */}
      {report.images?.length > 1 && (
        <section className="grid gap-3 sm:grid-cols-3">
          {report.images.slice(1).map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt="صورة السيارة"
              className="aspect-video w-full rounded-xl object-cover shadow-soft"
            />
          ))}
        </section>
      )}

      {/* DETAILS */}
      <section className="card">
        <h2 className="mb-4 text-lg font-bold">📝 التفاصيل</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          {report.lostArea && <DetailRow icon="🗺️" label="المحلية/الحي" value={report.lostArea} />}
          {report.lostAt && (
            <DetailRow
              icon="📅"
              label="تاريخ الفقد"
              value={new Date(report.lostAt).toLocaleDateString('ar-SD', { dateStyle: 'long' })}
            />
          )}
        </dl>
        {report.description && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="mb-1.5 text-sm font-medium text-slate-500">وصف إضافي</div>
            <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{report.description}</p>
          </div>
        )}
      </section>

      {/* MAP */}
      {report.latitude && report.longitude && (
        <section className="card">
          <h2 className="mb-4 text-lg font-bold">🗺️ آخر مكان شوهدت فيه</h2>
          <MapView
            markers={[report]}
            defaultCenter={[report.latitude, report.longitude]}
            defaultZoom={13}
            height="360px"
          />
        </section>
      )}

      {/* CONTACT */}
      {report.status === 'approved' && (
        <section className="card border-brand-200/60 bg-gradient-to-bl from-brand-50/60 to-white">
          <h2 className="mb-4 text-lg font-bold text-brand-900">📞 التواصل مع صاحب البلاغ</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            <ContactRow icon="👤" label="الاسم">
              <span className="font-medium text-slate-900">{report.contactName}</span>
            </ContactRow>
            <ContactRow icon="📱" label="الهاتف">
              <a href={`tel:${report.contactPhone}`} className="font-mono text-brand-700 hover:underline">
                {report.contactPhone}
              </a>
            </ContactRow>
            {report.contactEmail && (
              <ContactRow icon="📧" label="البريد">
                <a href={`mailto:${report.contactEmail}`} className="text-brand-700 hover:underline">
                  {report.contactEmail}
                </a>
              </ContactRow>
            )}
          </dl>
          <div className="mt-5 border-t border-brand-200/60 pt-4">
            <ContactOwnerButton reportId={report.id} ownerId={report.ownerId} />
          </div>
        </section>
      )}

      {/* SIGHTINGS */}
      {report.status === 'approved' && (
        <section id="sightings" className="card">
          <div className="section-header">
            <h2 className="text-lg font-bold">📍 بلاغات المشاهدة</h2>
            {canReportSighting && (
              <Link href={`/reports/${report.id}/sightings/new`} className="btn-secondary btn-sm">
                ＋ أبلغ عن مشاهدة
              </Link>
            )}
          </div>
          {canReportSighting && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              💡 شفت السيارة دي في مكان ما؟ ساعد صاحبها بإرسال بلاغ مشاهدة.
            </div>
          )}
          <SightingsList reportId={report.id} isOwner={isOwner} />
        </section>
      )}

      {/* OWNER MANAGEMENT */}
      {isOwner && (
        <section className="card">
          <h2 className="mb-2 text-base font-bold">⚙️ إدارة البلاغ</h2>
          <p className="mb-4 text-sm text-slate-600">
            لو ما عاد محتاج هذا البلاغ (مثلاً تم استرداد السيارة بشكل غير رسمي)، تقدر تطلب حذفه.
            الإدارة ستراجع الطلب وتعتمده.
          </p>
          <RequestDeletionButton
            reportId={report.id}
            deletionRequestedAt={report.deletionRequestedAt}
            deletionReason={report.deletionReason}
          />
        </section>
      )}

      <p className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
        تم النشر بواسطة: <span className="font-medium">{report.owner.name}</span> •{' '}
        {new Date(report.createdAt).toLocaleDateString('ar-SD')}
      </p>
    </article>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-base">{icon}</span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium text-slate-500">{label}</dt>
        <dd className="truncate text-sm font-medium text-slate-900">{value}</dd>
      </div>
    </div>
  );
}

function ContactRow({ icon, label, children }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base">{icon}</span>
      <div>
        <div className="text-xs font-medium text-brand-700">{label}</div>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

function Alert({ tone, children }) {
  const tones = {
    success: 'border-success-200 bg-success-50 text-success-700',
    info: 'border-brand-200 bg-brand-50 text-brand-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
  };
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${tones[tone] || tones.info}`}>
      {children}
    </div>
  );
}
