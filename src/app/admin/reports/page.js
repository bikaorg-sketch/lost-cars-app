'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

const statusLabels = {
  pending: { text: 'قيد المراجعة', cls: 'bg-yellow-100 text-yellow-800' },
  approved: { text: 'منشور', cls: 'bg-green-100 text-green-800' },
  rejected: { text: 'مرفوض', cls: 'bg-red-100 text-red-800' },
  recovered: { text: 'تم الاسترداد', cls: 'bg-blue-100 text-blue-800' },
};

function AdminReportsInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const activeStatus = sp.get('status') || 'pending';

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelCount, setPendingDelCount] = useState(0);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/reports?status=${activeStatus}&limit=100`);
    const data = await res.json();
    setReports(data.reports || []);
    setLoading(false);
  }

  async function loadDeletionCount() {
    const res = await fetch('/api/reports?status=deletion_requested&limit=100');
    const data = await res.json();
    setPendingDelCount((data.reports || []).length);
  }

  useEffect(() => {
    load();
    loadDeletionCount();
  }, [activeStatus]);

  async function updateStatus(id, status) {
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { load(); loadDeletionCount(); }
  }

  async function remove(id, withRequest = false) {
    const msg = withRequest
      ? 'تأكيد قبول طلب الحذف؟ سيتم حذف البلاغ نهائياً.'
      : 'متأكد من حذف هذا البلاغ نهائياً؟';
    if (!confirm(msg)) return;
    const res = await fetch(`/api/admin/reports/${id}`, { method: 'DELETE' });
    if (res.ok) { load(); loadDeletionCount(); }
  }

  async function rejectDeletionRequest(id) {
    if (!confirm('رفض طلب الحذف؟ سيبقى البلاغ كما هو.')) return;
    const res = await fetch(`/api/reports/${id}/delete-request`, { method: 'DELETE' });
    if (res.ok) { load(); loadDeletionCount(); }
  }

  const tabs = [
    { key: 'pending', label: 'قيد المراجعة' },
    { key: 'approved', label: 'منشورة' },
    { key: 'rejected', label: 'مرفوضة' },
    { key: 'recovered', label: 'تم استردادها' },
    {
      key: 'deletion_requested',
      label: '🗑️ طلبات الحذف',
      badge: pendingDelCount > 0 ? pendingDelCount : null,
    },
    { key: 'all', label: 'الكل' },
  ];

  const isDeletionTab = activeStatus === 'deletion_requested';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">إدارة البلاغات</h1>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => router.push(`/admin/reports?status=${t.key}`)}
            className={`-mb-px flex items-center gap-1 border-b-2 px-3 py-2 text-sm font-medium transition ${
              activeStatus === t.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{t.label}</span>
            {t.badge != null && (
              <span className="rounded-full bg-red-600 px-1.5 text-[10px] font-bold leading-4 text-white">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-slate-500">جاري التحميل...</p>
      ) : reports.length === 0 ? (
        <div className="card text-center text-slate-500">لا توجد بلاغات.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-right">السيارة</th>
                <th className="px-3 py-2 text-right">اللوحة/الشاسيه</th>
                <th className="px-3 py-2 text-right">الولاية</th>
                <th className="px-3 py-2 text-right">صاحب البلاغ</th>
                <th className="px-3 py-2 text-right">الحالة</th>
                <th className="px-3 py-2 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((r) => {
                const s = statusLabels[r.status] || statusLabels.pending;
                const hasDeletionRequest = Boolean(r.deletionRequestedAt);
                return (
                  <tr key={r.id} className={hasDeletionRequest ? 'bg-red-50/50' : ''}>
                    <td className="px-3 py-2">
                      <Link href={`/reports/${r.id}`} className="font-medium text-brand-700 hover:underline">
                        {r.brand} {r.model}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString('ar-SD')}
                      </div>
                      {isDeletionTab && r.deletionReason && (
                        <div className="mt-1 max-w-xs text-xs text-red-700">
                          <span className="font-medium">السبب:</span> {r.deletionReason}
                        </div>
                      )}
                      {!isDeletionTab && hasDeletionRequest && (
                        <span className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-800">
                          🗑️ طلب حذف
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {r.plateNumber || (
                        <span className="text-xs text-slate-500">شاسيه: {r.chassisNumber}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{r.lostCity}</td>
                    <td className="px-3 py-2">{r.owner?.name}</td>
                    <td className="px-3 py-2">
                      <span className={`badge ${s.cls}`}>{s.text}</span>
                      {isDeletionTab && (
                        <div className="mt-1 text-[10px] text-slate-500">
                          طُلب في: {new Date(r.deletionRequestedAt).toLocaleDateString('ar-SD')}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {isDeletionTab ? (
                          <>
                            <button
                              onClick={() => remove(r.id, true)}
                              className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                            >
                              قبول الحذف
                            </button>
                            <button
                              onClick={() => rejectDeletionRequest(r.id)}
                              className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                            >
                              رفض الطلب
                            </button>
                          </>
                        ) : (
                          <>
                            {r.status !== 'approved' && (
                              <button
                                onClick={() => updateStatus(r.id, 'approved')}
                                className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-200"
                              >
                                نشر
                              </button>
                            )}
                            {r.status !== 'rejected' && (
                              <button
                                onClick={() => updateStatus(r.id, 'rejected')}
                                className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
                              >
                                رفض
                              </button>
                            )}
                            {r.status === 'approved' && (
                              <button
                                onClick={() => updateStatus(r.id, 'recovered')}
                                className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200"
                              >
                                تم الاسترداد
                              </button>
                            )}
                            <button
                              onClick={() => remove(r.id)}
                              className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                            >
                              حذف
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<p>جاري التحميل...</p>}>
      <AdminReportsInner />
    </Suspense>
  );
}
