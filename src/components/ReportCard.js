import Link from 'next/link';

const statusLabels = {
  pending: { text: 'قيد المراجعة', cls: 'badge-warning' },
  approved: { text: 'منشور', cls: 'badge-success' },
  rejected: { text: 'مرفوض', cls: 'badge-danger' },
  recovered: { text: 'تم استرداد السيارة', cls: 'badge-info' },
};

export default function ReportCard({ report, showStatus = false }) {
  const status = statusLabels[report.status] || statusLabels.pending;
  const cover = report.images?.[0]?.url;
  const identifier = report.plateNumber || report.chassisNumber;
  const identifierLabel = report.plateNumber ? 'رقم اللوحة' : 'رقم الشاسيه';

  return (
    <Link
      href={`/reports/${report.id}`}
      className="group card card-hover block overflow-hidden !p-0"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        {cover ? (
          <img
            src={cover}
            alt={`${report.brand} ${report.model}`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl opacity-60">🚗</div>
        )}
        {/* Top-right badges */}
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {showStatus && <span className={status.cls}>{status.text}</span>}
          {report.deletionRequestedAt && <span className="badge-danger">🗑️ طلب حذف</span>}
        </div>
        {/* Reward chip */}
        {report.reward && (
          <div className="absolute bottom-2 left-2 rounded-full bg-amber-400/95 px-2.5 py-0.5 text-xs font-bold text-slate-900 shadow-soft">
            💰 {report.reward.toLocaleString('ar-SD')} جنيه
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="mb-2 truncate text-base font-bold text-slate-900 group-hover:text-brand-700">
          {report.brand} {report.model}{' '}
          {report.year && <span className="font-medium text-slate-500">({report.year})</span>}
        </h3>

        <dl className="space-y-1 text-sm">
          {identifier && (
            <Row icon="🔢" label={identifierLabel}>
              <span className="font-mono font-semibold text-slate-900">{identifier}</span>
            </Row>
          )}
          <Row icon="🎨" label="اللون">
            <span className="text-slate-700">{report.color}</span>
          </Row>
          <Row icon="📍" label="الولاية">
            <span className="text-slate-700">{report.lostCity}</span>
          </Row>
          {report.lostAt && (
            <Row icon="📅" label="فُقدت في">
              <span className="text-slate-700">
                {new Date(report.lostAt).toLocaleDateString('ar-SD', { dateStyle: 'medium' })}
              </span>
            </Row>
          )}
        </dl>
      </div>
    </Link>
  );
}

function Row({ icon, label, children }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="flex items-center gap-1.5 text-slate-500">
        <span className="text-xs">{icon}</span>
        <span className="text-xs">{label}</span>
      </dt>
      <dd className="truncate text-sm">{children}</dd>
    </div>
  );
}
