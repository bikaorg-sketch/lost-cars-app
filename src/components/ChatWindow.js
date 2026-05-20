'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

const POLL_MS = 4000;

export default function ChatWindow({ conversationId, height = '500px' }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  async function load(silent = false) {
    if (!conversationId) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, { cache: 'no-store' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'فشل تحميل المحادثة');
        return;
      }
      const data = await res.json();
      setMeta({
        type: data.conversation.type,
        report: data.conversation.report,
        initiator: data.conversation.initiator,
      });
      setMessages(data.conversation.messages || []);
      setError('');
    } catch (err) {
      if (!silent) setError('فشل الاتصال بالخادم');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'فشل إرسال الرسالة');
        return;
      }
      const data = await res.json();
      setMessages((m) => [...m, data.message]);
      setBody('');
      inputRef.current?.focus();
    } catch (err) {
      setError('فشل الاتصال');
    } finally {
      setSending(false);
    }
  }

  function isMine(msg) {
    return msg.senderId === session?.user?.id;
  }

  function canDelete(msg) {
    if (msg.deletedAt) return false;
    return msg.senderId === session?.user?.id;
  }

  async function handleDelete(msgId) {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    // Optimistic update
    setMessages((m) =>
      m.map((x) => (x.id === msgId ? { ...x, deletedAt: new Date().toISOString(), body: '' } : x))
    );
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages/${msgId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'فشل الحذف');
        load(true);
      }
    } catch (err) {
      setError('فشل الاتصال');
      load(true);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white" style={{ height }}>
      <div
        className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-3 py-4"
        style={{ direction: 'ltr' }}
      >
        {loading ? (
          <p className="text-center text-sm text-slate-500" style={{ direction: 'rtl' }}>
            جاري التحميل...
          </p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500" style={{ direction: 'rtl' }}>
            لا توجد رسائل بعد. ابدأ بإرسال رسالة.
          </p>
        ) : (
          messages.map((m) => {
            const mine = isMine(m);
            const deleted = Boolean(m.deletedAt);

            if (deleted) {
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  style={{ direction: 'rtl' }}
                >
                  <div className="max-w-[75%] rounded-2xl border border-dashed border-slate-300 bg-slate-100 px-3 py-2 text-xs italic text-slate-500">
                    🗑️ تم حذف هذه الرسالة
                  </div>
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className={`group flex ${mine ? 'justify-end' : 'justify-start'}`}
                style={{ direction: 'rtl' }}
              >
                {canDelete(m) && (
                  <button
                    onClick={() => handleDelete(m.id)}
                    title="حذف الرسالة"
                    className="self-center px-1 text-slate-400 opacity-0 transition hover:text-red-600 group-hover:opacity-100"
                  >
                    🗑️
                  </button>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
                    mine
                      ? 'rounded-br-sm bg-brand-600 text-white'
                      : m.sender?.role === 'admin'
                      ? 'rounded-bl-sm bg-green-100 text-green-900'
                      : 'rounded-bl-sm bg-white text-slate-900 ring-1 ring-slate-200'
                  }`}
                >
                  {!mine && (
                    <div className="mb-0.5 text-xs font-medium opacity-70">
                      {m.sender?.name}
                      {m.sender?.role === 'admin' && ' (الدعم)'}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm">{m.body}</div>
                  <div className={`mt-1 text-[10px] ${mine ? 'opacity-70' : 'text-slate-500'}`}>
                    {new Date(m.createdAt).toLocaleTimeString('ar-SD', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <div className="border-t bg-red-50 px-3 py-1.5 text-xs text-red-700" style={{ direction: 'rtl' }}>
          {error}
        </div>
      )}

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-slate-200 bg-white p-2"
        style={{ direction: 'rtl' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="اكتب رسالة..."
          maxLength={2000}
          className="input flex-1"
          disabled={sending}
        />
        <button type="submit" disabled={sending || !body.trim()} className="btn-primary">
          {sending ? '...' : 'إرسال'}
        </button>
      </form>
    </div>
  );
}
