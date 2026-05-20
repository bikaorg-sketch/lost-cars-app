'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
        setLoading(false);
        return;
      }

      const signinRes = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signinRes?.error) {
        router.push('/login');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('فشل الاتصال بالخادم');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md animate-slide-up">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-success-500 to-success-700 text-2xl shadow-card-hover">
          👋
        </div>
        <h1 className="page-title">انضم لنا</h1>
        <p className="page-subtitle">أنشئ حساباً مجانياً واستفد من كل خدمات المنصة</p>
      </div>

      <div className="card">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">الاسم الكامل</label>
            <input
              type="text"
              required
              minLength={2}
              autoComplete="name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="input"
              placeholder="محمد أحمد"
            />
          </div>

          <div>
            <label className="label">البريد الإلكتروني</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="input"
              placeholder="example@email.com"
            />
            <p className="helper">سيُستخدم لتسجيل الدخول</p>
          </div>

          <div>
            <label className="label">رقم الهاتف <span className="text-slate-400">(اختياري)</span></label>
            <input
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className="input"
              placeholder="09xxxxxxxx"
            />
          </div>

          <div>
            <label className="label">كلمة المرور</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className="input"
              placeholder="على الأقل 6 أحرف"
            />
            <p className="helper">استخدم كلمة مرور قوية لحماية حسابك</p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
            {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">
            سجّل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
