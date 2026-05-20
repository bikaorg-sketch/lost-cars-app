import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrCreateConversation } from '@/lib/chat';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
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
        select: { id: true, body: true, senderId: true, createdAt: true, readAt: true },
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

  return NextResponse.json({ conversations: withUnread });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  }

  try {
    const { type, reportId } = await request.json();
    if (!['support', 'report'].includes(type)) {
      return NextResponse.json({ error: 'نوع المحادثة غير صالح' }, { status: 400 });
    }

    const conv = await getOrCreateConversation({
      type,
      reportId,
      currentUser: session.user,
    });

    return NextResponse.json({ conversation: conv });
  } catch (err) {
    if (err.message === 'OWN_REPORT') {
      return NextResponse.json(
        { error: 'لا يمكنك بدء محادثة على بلاغك الخاص' },
        { status: 400 }
      );
    }
    if (err.message === 'report not found') {
      return NextResponse.json({ error: 'البلاغ غير موجود' }, { status: 404 });
    }
    console.error('create conversation error:', err);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
