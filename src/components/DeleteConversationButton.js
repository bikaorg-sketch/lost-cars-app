'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Delete a conversation.
 * variant="icon" -> small trash icon used inside list rows (refreshes the list).
 * variant="page" -> full text button used on standalone pages (navigates to redirectTo).
 */
export default function DeleteConversationButton({
  conversationId,
  variant = 'icon',
  redirectTo,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const confirmed = confirm(
      'هل أنت متأكد من حذف المحادثة بالكامل؟\n\nسيتم حذف كل الرسائل ولا يمكن التراجع.'
    );
    if (!confirmed) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'فشل الحذف');
        setLoading(false);
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (err) {
      setError('فشل الاتصال');
      setLoading(false);
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleDelete}
        disabled={loading}
        title="حذف المحادثة"
        aria-label="حذف المحادثة"
        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        {loading ? '...' : '🗑️'}
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-sm text-red-600 hover:text-red-800 hover:underline disabled:opacity-50"
      >
        🗑️ {loading ? 'جاري الحذف...' : 'حذف المحادثة بالكامل'}
      </button>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
