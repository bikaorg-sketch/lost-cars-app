'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function ContactOwnerButton({ reportId, ownerId }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (status === 'loading') return null;

  if (!session) {
    return (
      <Link
        href={`/login?callbackUrl=/reports/${reportId}`}
        className="btn-primary"
      >
        💬 سجّل الدخول للتواصل
      </Link>
    );
  }

  if (session.user.id === ownerId) {
    return (
      <p className="text-sm text-slate-500">هذا بلاغك. ستظهر استفسارات الآخرين في صندوق الرسائل.</p>
    );
  }

  async function startChat() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'report', reportId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل بدء المحادثة');
        setLoading(false);
        return;
      }
      router.push(`/messages/${data.conversation.id}`);
    } catch (err) {
      setError('فشل الاتصال');
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={startChat} disabled={loading} className="btn-primary">
        💬 {loading ? 'جاري الفتح...' : 'تواصل عبر الدردشة'}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
