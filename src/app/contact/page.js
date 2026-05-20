import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrCreateConversation } from '@/lib/chat';
import ChatWindow from '@/components/ChatWindow';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'تواصل معنا - منصة السيارات المفقودة',
};

export default async function ContactPage() {
  const session = await getServerSession(authOptions);
  let supportConv = null;

  if (session?.user?.id) {
    try {
      supportConv = await getOrCreateConversation({
        type: 'support',
        currentUser: session.user,
      });
    } catch (err) {
      console.error('contact page: failed to create support conv', err);
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-gradient-to-l from-brand-600 to-brand-700 px-6 py-8 text-white shadow-lg">
        <h1 className="mb-2 text-3xl font-bold">تواصل معنا</h1>
        <p className="text-brand-50">
          فريق الدعم متاح لمساعدتك في أي استفسار حول البلاغات أو المنصة.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <section>
          <div className="card mb-4">
            <h2 className="mb-3 text-lg font-bold">💬 دردشة مباشرة مع الدعم</h2>
            {!session ? (
              <div className="rounded-lg bg-slate-50 px-4 py-6 text-center">
                <p className="mb-3 text-slate-700">سجّل الدخول لبدء محادثة مع فريق الدعم.</p>
                <div className="flex justify-center gap-2">
                  <Link href="/login?callbackUrl=/contact" className="btn-primary">دخول</Link>
                  <Link href="/register" className="btn-secondary">إنشاء حساب</Link>
                </div>
              </div>
            ) : supportConv ? (
              <ChatWindow conversationId={supportConv.id} height="500px" />
            ) : (
              <p className="text-red-700">تعذّر فتح محادثة الدعم. حاول التحديث.</p>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card">
            <h3 className="mb-3 text-base font-bold">معلومات التواصل</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <div className="text-xs text-slate-500">البريد الإلكتروني</div>
                <a href="mailto:support@lostcars.sd" className="font-medium text-brand-700 hover:underline">
                  support@lostcars.sd
                </a>
              </li>
              <li>
                <div className="text-xs text-slate-500">الهاتف</div>
                <a href="tel:+249912345678" className="font-medium text-brand-700 hover:underline">
                  +249 91 234 5678
                </a>
              </li>
              <li>
                <div className="text-xs text-slate-500">العنوان</div>
                <div>الخرطوم - السودان</div>
              </li>
              <li>
                <div className="text-xs text-slate-500">أوقات العمل</div>
                <div>السبت - الخميس · 8 صباحاً - 6 مساءً</div>
              </li>
            </ul>
          </div>

          <div className="card">
            <h3 className="mb-3 text-base font-bold">أسئلة شائعة</h3>
            <details className="mb-2 border-b border-slate-100 pb-2">
              <summary className="cursor-pointer text-sm font-medium">كيف أسجّل بلاغ؟</summary>
              <p className="mt-2 text-sm text-slate-600">
                سجّل دخولك ثم اضغط "تسجيل بلاغ" واملأ البيانات. سيتم نشر البلاغ بعد المراجعة.
              </p>
            </details>
            <details className="mb-2 border-b border-slate-100 pb-2">
              <summary className="cursor-pointer text-sm font-medium">ما الفرق بين رقم اللوحة والشاسيه؟</summary>
              <p className="mt-2 text-sm text-slate-600">
                رقم اللوحة قابل للتغيير، أما رقم الشاسيه فيُعرّف السيارة بشكل دائم. يكفي إدخال واحد منهما.
              </p>
            </details>
            <details className="mb-2 border-b border-slate-100 pb-2">
              <summary className="cursor-pointer text-sm font-medium">كم تستغرق مراجعة البلاغ؟</summary>
              <p className="mt-2 text-sm text-slate-600">
                عادةً خلال 24 ساعة. للبلاغات العاجلة تواصل مع الدعم.
              </p>
            </details>
            <details>
              <summary className="cursor-pointer text-sm font-medium">شفت سيارة من البلاغات، كيف أبلّغ؟</summary>
              <p className="mt-2 text-sm text-slate-600">
                افتح صفحة البلاغ واضغط "تواصل مع صاحب البلاغ" للدردشة مباشرة معه.
              </p>
            </details>
          </div>
        </aside>
      </div>
    </div>
  );
}
