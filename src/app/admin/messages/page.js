import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import DeleteConversationButton from '@/components/DeleteConversationButton';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage() {
  const conversations = await prisma.conversation.findMany({
    include: {
      initiator: { select: { id: true, name: true, email: true } },
      report: {
        select: { id: true, brand: true, model: true, plateNumber: true, chassisNumber: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const support = conversations.filter((c) => c.type === 'support');
  const report = conversations.filter((c) => c.type === 'report');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">الرسائل والمحادثات</h1>

      <section>
        <h2 className="mb-2 text-lg font-bold">💬 محادثات الدعم ({support.length})</h2>
        {support.length === 0 ? (
          <p className="card text-center text-slate-500">لا توجد محادثات دعم.</p>
        ) : (
          <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {support.map((c) => {
              const last = c.messages[0];
              return (
                <div
                  key={c.id}
                  className="flex items-start gap-2 px-3 py-3 transition hover:bg-slate-50"
                >
                  <Link href={`/messages/${c.id}`} className="flex flex-1 items-start gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{c.initiator?.name}</p>
                      <p className="text-xs text-slate-500">{c.initiator?.email}</p>
                      {last && (
                        <p className="mt-1 truncate text-sm text-slate-600">
                          {last.deletedAt ? (
                            <span className="italic text-slate-400">🗑️ تم حذف الرسالة</span>
                          ) : (
                            last.body
                          )}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-left text-xs text-slate-500">
                      <div>{c._count.messages} رسالة</div>
                      <div>{new Date(c.updatedAt).toLocaleDateString('ar-SD')}</div>
                    </div>
                  </Link>
                  <DeleteConversationButton conversationId={c.id} variant="icon" />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">🚗 محادثات على بلاغات ({report.length})</h2>
        {report.length === 0 ? (
          <p className="card text-center text-slate-500">لا توجد محادثات على بلاغات.</p>
        ) : (
          <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {report.map((c) => {
              const last = c.messages[0];
              const r = c.report;
              const identifier = r?.plateNumber || r?.chassisNumber || '';
              return (
                <div
                  key={c.id}
                  className="flex items-start gap-2 px-3 py-3 transition hover:bg-slate-50"
                >
                  <Link href={`/messages/${c.id}`} className="flex flex-1 items-start gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {r?.brand} {r?.model}{identifier ? ` (${identifier})` : ''}
                      </p>
                      <p className="text-xs text-slate-500">المُستفسِر: {c.initiator?.name}</p>
                      {last && (
                        <p className="mt-1 truncate text-sm text-slate-600">
                          {last.deletedAt ? (
                            <span className="italic text-slate-400">🗑️ تم حذف الرسالة</span>
                          ) : (
                            last.body
                          )}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-left text-xs text-slate-500">
                      <div>{c._count.messages} رسالة</div>
                      <div>{new Date(c.updatedAt).toLocaleDateString('ar-SD')}</div>
                    </div>
                  </Link>
                  <DeleteConversationButton conversationId={c.id} variant="icon" />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
