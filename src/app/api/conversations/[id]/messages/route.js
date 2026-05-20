import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessConversation } from '@/lib/chat';
import { createNotification, truncate } from '@/lib/notifications';

const MAX_BODY = 2000;

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { report: { select: { ownerId: true } } },
  });

  if (!conversation) {
    return NextResponse.json({ error: 'المحادثة غير موجودة' }, { status: 404 });
  }

  const allowed = await canAccessConversation(conversation, session.user);
  if (!allowed) {
    return NextResponse.json({ error: 'غير مصرّح' }, { status: 403 });
  }

  const { body } = await request.json();
  const trimmed = (body || '').trim();
  if (!trimmed) {
    return NextResponse.json({ error: 'الرسالة فارغة' }, { status: 400 });
  }
  if (trimmed.length > MAX_BODY) {
    return NextResponse.json({ error: `الرسالة طويلة جداً (الحد ${MAX_BODY} حرف)` }, { status: 400 });
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: session.user.id,
        body: trimmed,
      },
      include: { sender: { select: { id: true, name: true, role: true } } },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    }),
  ]);

  // Determine recipient(s) and create notifications
  const senderName = session.user.name || 'مستخدم';
  const link = `/messages/${conversation.id}`;
  const title = `💬 رسالة جديدة من ${senderName}`;
  const bodyPreview = truncate(trimmed, 100);

  if (conversation.type === 'support') {
    // If sender is admin, notify the initiator. Else notify all admins.
    if (session.user.role === 'admin') {
      if (conversation.initiatorId !== session.user.id) {
        await createNotification({
          userId: conversation.initiatorId,
          type: 'message',
          title: '💬 رد من فريق الدعم',
          body: bodyPreview,
          link,
        });
      }
    } else {
      const admins = await prisma.user.findMany({
        where: { role: 'admin' },
        select: { id: true },
      });
      await Promise.all(
        admins.map((a) =>
          createNotification({
            userId: a.id,
            type: 'message',
            title,
            body: bodyPreview,
            link,
          })
        )
      );
    }
  } else if (conversation.type === 'report') {
    const recipientId =
      conversation.initiatorId === session.user.id
        ? conversation.report?.ownerId
        : conversation.initiatorId;
    if (recipientId && recipientId !== session.user.id) {
      await createNotification({
        userId: recipientId,
        type: 'message',
        title,
        body: bodyPreview,
        link,
      });
    }
  }

  return NextResponse.json({ message }, { status: 201 });
}
