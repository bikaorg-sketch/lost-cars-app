'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/settings');
    }
  }, [status, router]);

  if (status !== 'authenticated') {
    return <p className="text-center text-slate-500">جاري التحميل...</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">إعدادات الحساب</h1>
        <Link href="/profile" className="text-sm text-brand-600 hover:underline">
          ← العودة للملف الشخصي
        </Link>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <TabButton active={tab === 'profile'} onClick={() => setTab('profile')}>
          👤 بيانات الحساب
        </TabButton>
        <TabButton active={tab === 'password'} onClick={() => setTab('password')}>
          🔒 كلمة المرور
        </TabButton>
      </div>

      {tab === 'profile' ? <ProfileForm session={session} update={update} /> : <PasswordForm />}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
        active ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-600 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );
}

function ProfileForm({ session, update }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setForm({
            name: d.user.name || '',
            email: d.user.email || '',
            phone: d.user.phone || '',
          });
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل التحديث');
        setLoading(false);
        return;
      }
      setSuccess('✓ تم حفظ البيانات بنجاح');
      // Refresh session so navbar reflects new name/email
      if (update) {
        await update({ name: data.user.name, email: data.user.email });
      }
      setLoading(false);
    } catch (err) {
      setError('فشل الاتصال');
      setLoading(false);
    }
  }

  if (!loaded) return <p className="text-center text-slate-500">جاري تحميل البيانات...</p>;

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <p className="text-sm text-slate-600">
        عدّل بياناتك الشخصية أدناه. هذه البيانات تُستخدم لتعريفك في التطبيق وللتواصل معك.
      </p>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
      {success && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{success}</div>
      )}

      <div>
        <label className="label">الاسم الكامل</label>
        <input
          type="text"
          required
          minLength={2}
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className="input"
        />
      </div>

      <div>
        <label className="label">البريد الإلكتروني</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          className="input"
        />
        <p className="mt-1 text-xs text-slate-500">
          البريد يُستخدم لتسجيل الدخول. يجب أن يكون فريداً.
        </p>
      </div>

      <div>
        <label className="label">رقم الهاتف</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          className="input"
          placeholder="09xxxxxxxx"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'جاري الحفظ...' : '💾 حفظ التغييرات'}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword !== form.confirmPassword) {
      setError('كلمتا المرور الجديدتان غير متطابقتين');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب 6 أحرف على الأقل');
      return;
    }
    if (form.currentPassword === form.newPassword) {
      setError('كلمة المرور الجديدة يجب أن تختلف عن الحالية');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل التحديث');
        setLoading(false);
        return;
      }
      setSuccess('✓ تم تغيير كلمة المرور بنجاح');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setLoading(false);
    } catch (err) {
      setError('فشل الاتصال');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <p className="text-sm text-slate-600">
        غيّر كلمة المرور بشكل دوري لحماية حسابك. لن تتأثر جلستك الحالية.
      </p>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
      {success && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{success}</div>
      )}

      <div>
        <label className="label">كلمة المرور الحالية</label>
        <input
          type="password"
          required
          value={form.currentPassword}
          onChange={(e) => set('currentPassword', e.target.value)}
          className="input"
          autoComplete="current-password"
        />
      </div>

      <div>
        <label className="label">كلمة المرور الجديدة</label>
        <input
          type="password"
          required
          minLength={6}
          value={form.newPassword}
          onChange={(e) => set('newPassword', e.target.value)}
          className="input"
          autoComplete="new-password"
        />
        <p className="mt-1 text-xs text-slate-500">6 أحرف على الأقل.</p>
      </div>

      <div>
        <label className="label">تأكيد كلمة المرور الجديدة</label>
        <input
          type="password"
          required
          minLength={6}
          value={form.confirmPassword}
          onChange={(e) => set('confirmPassword', e.target.value)}
          className="input"
          autoComplete="new-password"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'جاري التحديث...' : '🔒 تغيير كلمة المرور'}
      </button>
    </form>
  );
}
