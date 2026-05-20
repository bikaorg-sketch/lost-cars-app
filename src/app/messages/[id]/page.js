import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessConversation } from '@/lib/chat';
import ChatWindow from '@/components/ChatWindow';

export const dynamic = 'force-dynamic';

export default async function ConversationPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/messages/${params.id}`);
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
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
    },
  });

  if (!conversation) notFound();

  const allowed = await canAccessConversation(conversation, session.user);
  if (!allowed) {
    return (
      <div className="card text-center">
        <h2 className="mb-2 text-xl font-bold text-red-600">غير مصرّح</h2>
        <p className="text-slate-600">لا تملك صلاحية عرض هذه المحادثة.</p>
      </div>
    );
  }

  let title = 'محادثة';
  let subtitle = '';
  if (conversation.type === 'support') {
    title = '💬 دعم المنصة';
    subtitle = 'محادثة مع فريق الدعم';
  } else if (conversation.type === 'report' && conversation.report) {
    const r = conversation.report;
    const identifier = r.plateNumber || r.chassisNumber || '';
    title = `🚗 ${r.brand} ${r.model}${identifier ? ` (${identifier})` : ''}`;
    const isOwner = r.ownerId === session.user.id;
    subtitle = isOwner
      ? `استفسار من: ${conversation.initiator?.name}`
      : `صاحب البلاغ: ${r.owner?.name}`;
  }

  return (
    <div className="space-y-3">
      <Link href="/messages" className="inline-block text-sm text-brand-600 hover:underline">
        ← العودة للرسائل
      </Link>

      <div className="card !p-4">
        <h1 className="text-lg font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
        {conversation.report && (
          <Link
            href={`/reports/${conversation.report.id}`}
            className="mt-1 inline-block text-xs text-brand-600 hover:underline"
          >
            عرض البلاغ ←
          </Link>
        )}
      </div>

      <ChatWindow conversationId={conversation.id} height="60vh" />
    </div>
  );
}
