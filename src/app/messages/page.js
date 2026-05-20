import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DeleteConversationButton from '@/components/DeleteConversationButton';

export const dynamic = 'force-dynamic';

export default async function MessagesInboxPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/messages');
  }

  const userId = session.user.id;

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { initiatorId: userId },
        { report: { ownerId: userId } },
      ],
    },
    include: {
      initiator: { select: { id: true, name: true } },
      report: {
        select: {
          id: true,
          brand: true,
          model: true,
          plateNumber: true,
          chassisNumber: true,
          ownerId: true,
          owner: { select: { id: true, name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const withUnread = await Promise.all(
    conversations.map(async (c) => {
      const unread = await prisma.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: userId },
          readAt: null,
        },
      });
      return { ...c, unread };
    })
  );

  function getLabel(c) {
    if (c.type === 'support') return '💬 دعم المنصة';
    if (c.type === 'report' && c.report) {
      const identifier = c.report.plateNumber || c.report.chassisNumber || '';
      const car = `${c.report.brand} ${c.report.model}`;
      const isMyReport = c.report.ownerId === userId;
      return `🚗 ${car}${identifier ? ` (${identifier})` : ''}${isMyReport ? ' — استفسار على بلاغك' : ''}`;
    }
    return 'محادثة';
  }

  function getOtherParty(c) {
    if (c.type === 'support') return 'فريق الدعم';
    if (c.type === 'report') {
      const isInitiator = c.initiatorId === userId;
      return isInitiator
        ? `صاحب البلاغ: ${c.report?.owner?.name}`
        : `المُستفسِر: ${c.initiator?.name}`;
    }
    return '';
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">صندوق الرسائل</h1>
        <Link href="/contact" className="text-sm text-brand-600 hover:underline">
          تواصل مع الدعم ←
        </Link>
      </div>

      {withUnread.length === 0 ? (
        <div className="card text-center text-slate-500">
          <div className="mb-2 text-3xl">📭</div>
          <p>لا توجد محادثات بعد.</p>
          <Link href="/contact" className="mt-2 inline-block text-brand-600 hover:underline">
            ابدأ محادثة مع الدعم
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {withUnread.map((c) => {
            const last = c.messages[0];
            return (
              <div
                key={c.id}
                className="flex items-start gap-2 px-3 py-3 transition hover:bg-slate-50"
              >
                <Link
                  href={`/messages/${c.id}`}
                  className="flex flex-1 items-start gap-3 min-w-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium text-slate-900">{getLabel(c)}</p>
                      {last && (
                        <span className="shrink-0 text-xs text-slate-500">
                          {new Date(last.createdAt).toLocaleDateString('ar-SD', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{getOtherParty(c)}</p>
                    {last && (
                      <p className="mt-1 truncate text-sm text-slate-600">
                        {last.senderId === userId && 'أنت: '}
                        {last.deletedAt ? (
                          <span className="italic text-slate-400">🗑️ تم حذف الرسالة</span>
                        ) : (
                          last.body
                        )}
                      </p>
                    )}
                  </div>
                  {c.unread > 0 && (
                    <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </Link>
                <DeleteConversationButton conversationId={c.id} variant="icon" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
