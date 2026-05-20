'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError('البريد أو كلمة المرور غير صحيحة');
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md animate-slide-up">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl shadow-card-hover">
          🔐
        </div>
        <h1 className="page-title">مرحباً بعودتك</h1>
        <p className="page-subtitle">سجّل دخولك للوصول لحسابك</p>
      </div>

      <div className="card">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="label">كلمة المرور</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
            {loading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          <span>أو</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          ليس لديك حساب؟{' '}
          <Link href="/register" className="font-semibold text-brand-700 hover:underline">
            أنشئ حساباً جديداً
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-center text-slate-500">جاري التحميل...</p>}>
      <LoginInner />
    </Suspense>
  );
}
