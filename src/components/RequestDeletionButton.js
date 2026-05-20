'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RequestDeletionButton({ reportId, deletionRequestedAt, deletionReason }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const alreadyRequested = Boolean(deletionRequestedAt);

  async function submitRequest(e) {
    e.preventDefault();
    setError('');
    if (!confirm('هل أنت متأكد من تقديم طلب حذف البلاغ؟ سيتم مراجعته من قبل الإدارة.')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/delete-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'فشل تقديم الطلب');
        setLoading(false);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError('فشل الاتصال');
      setLoading(false);
    }
  }

  async function cancelRequest() {
    if (!confirm('إلغاء طلب حذف البلاغ؟')) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/reports/${reportId}/delete-request`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'فشل الإلغاء');
        setLoading(false);
        return;
      }
      router.refresh();
    } catch (err) {
      setError('فشل الاتصال');
      setLoading(false);
    }
  }

  if (alreadyRequested) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
        <p className="font-medium text-amber-900">
          ⏳ تم تقديم طلب حذف هذا البلاغ
        </p>
        <p className="mt-1 text-amber-800">
          بتاريخ: {new Date(deletionRequestedAt).toLocaleDateString('ar-SD', { dateStyle: 'medium' })}
        </p>
        {deletionReason && (
          <p className="mt-2 text-amber-800">
            <span className="font-medium">السبب:</span> {deletionReason}
          </p>
        )}
        <p className="mt-2 text-xs text-amber-700">الإدارة تراجع الطلب وسيتم إشعارك بالنتيجة.</p>
        <button
          onClick={cancelRequest}
          disabled={loading}
          className="mt-3 text-sm font-medium text-amber-900 hover:underline disabled:opacity-50"
        >
          ← إلغاء طلب الحذف
        </button>
        {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-red-600 hover:text-red-800 hover:underline"
      >
        🗑️ طلب حذف هذا البلاغ
      </button>
    );
  }

  return (
    <form onSubmit={submitRequest} className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <h3 className="font-bold text-red-900">طلب حذف البلاغ</h3>
      <p className="text-sm text-red-800">
        سيُراجع طلبك من قبل الإدارة. اذكر السبب لتسريع المراجعة.
      </p>
      <div>
        <label className="mb-1 block text-sm font-medium text-red-900">السبب (اختياري)</label>
        <textarea
          rows={3}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input"
          placeholder="مثلاً: تم استرداد السيارة بشكل غير رسمي، الإبلاغ خطأ..."
        />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-danger text-sm">
          {loading ? 'جاري الإرسال...' : 'تأكيد طلب الحذف'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setReason('');
            setError('');
          }}
          className="btn-secondary text-sm"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
