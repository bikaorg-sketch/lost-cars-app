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
  pending:   { text: 'قيد المراجعة',     cls: 'badge-warning' },
  approved:  { text: 'منشور',             cls: 'badge-success' },
  rejected:  { text: 'مرفوض',             cls: 'badge-danger'  },
  recovered: { text: 'تم استرداد السيارة', cls: 'badge-info'    },
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
  const galleryImages = report.images?.slice(1) || [];

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {isNew && (
        <Alert tone="success">✅ تم إرسال البلاغ بنجاح! سيظهر للجمهور بعد مراجعة الإدارة.</Alert>
      )}
      {sightingSaved && (
        <Alert tone="success">✅ تم إرسال بلاغ المشاهدة وإخطار صاحب البلاغ.</Alert>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <Link href="/reports/search" className="hover:text-brand-700">البلاغات</Link>
          <span>›</span>
          <span className="text-slate-700">{report.brand} {report.model}</span>
        </div>
        <span className={status.cls}>{status.text}</span>
      </nav>

      {/* Cover image */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-100 to-slate-200 shadow-card">
        <div className="aspect-[21/8]">
          {coverImage ? (
            <img src={coverImage} alt={`${report.brand} ${report.model}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-8xl opacity-50">🚗</div>
          )}
        </div>
        {report.reward && (
          <div className="absolute bottom-3 left-3 rounded-full bg-amber-400 px-3.5 py-1.5 text-sm font-bold text-slate-900 shadow-card-hover">
            💰 مكافأة {report.reward.toLocaleString('ar-SD')} جنيه سوداني
          </div>
        )}
      </section>

      {/* Two-column dashboard layout */}
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* ASIDE (sticky on desktop) */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {/* Vehicle info */}
          <div className="card !p-4">
            <h1 className="mb-1 text-xl font-bold leading-tight">
              {report.brand} {report.model}
            </h1>
            {report.year && (
              <p className="mb-3 text-sm text-slate-500">موديل {report.year}</p>
            )}

            <dl className="space-y-2.5 text-sm">
              {report.plateNumber && (
                <InfoRow icon="🔢" label="رقم اللوحة">
                  <span className="font-mono font-bold text-brand-700">{report.plateNumber}</span>
                </InfoRow>
              )}
              {report.chassisNumber && (
                <InfoRow icon="🪪" label="رقم الشاسيه">
                  <span className="font-mono font-semibold text-slate-800">{report.chassisNumber}</span>
                </InfoRow>
              )}
              <InfoRow icon="🎨" label="اللون"><span className="text-slate-800">{report.color}</span></InfoRow>
              <InfoRow icon="📍" label="الولاية"><span className="text-slate-800">{report.lostCity}</span></InfoRow>
              {report.lostArea && (
                <InfoRow icon="🗺️" label="المحلية/الحي">
                  <span className="text-slate-800">{report.lostArea}</span>
                </InfoRow>
              )}
              {report.lostAt && (
                <InfoRow icon="📅" label="تاريخ الفقد">
                  <span className="text-slate-800">
                    {new Date(report.lostAt).toLocaleDateString('ar-SD', { dateStyle: 'medium' })}
                  </span>
                </InfoRow>
              )}
            </dl>
          </div>

          {/* Contact block - only for approved reports */}
          {report.status === 'approved' && (
            <div className="card border-brand-200/60 bg-gradient-to-bl from-brand-50/60 to-white !p-4">
              <h2 className="mb-3 text-sm font-bold text-brand-900">📞 التواصل مع المُبلِّغ</h2>
              <dl className="space-y-2 text-sm">
                <p>
                  <span className="text-slate-500">الاسم:</span>{' '}
                  <span className="font-medium text-slate-900">{report.contactName}</span>
                </p>
                <p>
                  <span className="text-slate-500">الهاتف:</span>{' '}
                  <a href={`tel:${report.contactPhone}`} className="font-mono text-brand-700 hover:underline">
                    {report.contactPhone}
                  </a>
                </p>
                {report.contactEmail && (
                  <p className="truncate">
                    <span className="text-slate-500">البريد:</span>{' '}
                    <a href={`mailto:${report.contactEmail}`} className="text-brand-700 hover:underline">
                      {report.contactEmail}
                    </a>
                  </p>
                )}
              </dl>
              <div className="mt-4 border-t border-brand-200/60 pt-3">
                <ContactOwnerButton reportId={report.id} ownerId={report.ownerId} />
              </div>
            </div>
          )}

          {/* Owner management */}
          {isOwner && (
            <div className="card !p-4">
              <h2 className="mb-1 text-sm font-bold">⚙️ إدارة البلاغ</h2>
              <p className="mb-3 text-xs text-slate-600">
                للطلب حذف البلاغ بشكل دائم.
              </p>
              <RequestDeletionButton
                reportId={report.id}
                deletionRequestedAt={report.deletionRequestedAt}
                deletionReason={report.deletionReason}
              />
            </div>
          )}

          <p className="text-center text-[11px] text-slate-400">
            نُشر بواسطة <span className="font-medium text-slate-600">{report.owner.name}</span>
            <br />
            {new Date(report.createdAt).toLocaleDateString('ar-SD', { dateStyle: 'medium' })}
          </p>
        </aside>

        {/* MAIN content */}
        <main className="space-y-5">
          {/* Description */}
          {report.description && (
            <section className="card">
              <h2 className="mb-3 text-lg font-bold">📝 وصف إضافي</h2>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{report.description}</p>
            </section>
          )}

          {/* Image gallery */}
          {galleryImages.length > 0 && (
            <section className="card">
              <h2 className="mb-3 text-lg font-bold">📸 صور إضافية</h2>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {galleryImages.map((img) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt="صورة السيارة"
                    className="aspect-video w-full rounded-xl object-cover ring-1 ring-slate-200"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Map */}
          {report.latitude && report.longitude && (
            <section className="card">
              <h2 className="mb-3 text-lg font-bold">🗺️ آخر مكان شوهدت فيه</h2>
              <MapView
                markers={[report]}
                defaultCenter={[report.latitude, report.longitude]}
                defaultZoom={13}
                height="360px"
              />
            </section>
          )}

          {/* Sightings */}
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

          {/* Mobile-only "no description placeholder" for content padding */}
          {!report.description && galleryImages.length === 0 && !(report.latitude && report.longitude) && report.status !== 'approved' && (
            <section className="empty-state lg:hidden">
              <div className="text-4xl">📋</div>
              <p>لا توجد معلومات إضافية لعرضها.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</dt>
        <dd className="mt-0.5 truncate">{children}</dd>
      </div>
    </div>
  );
}

function Alert({ tone, children }) {
  const tones = {
    success: 'border-success-200 bg-success-50 text-success-700',
    info:    'border-brand-200 bg-brand-50 text-brand-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
  };
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${tones[tone] || tones.info}`}>
      {children}
    </div>
  );
}
