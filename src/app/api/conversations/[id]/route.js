import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessConversation } from '@/lib/chat';

export async function GET(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
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
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: 'المحادثة غير موجودة' }, { status: 404 });
  }

  const allowed = await canAccessConversation(conversation, session.user);
  if (!allowed) {
    return NextResponse.json({ error: 'غير مصرّح' }, { status: 403 });
  }

  // Mark incoming messages as read
  await prisma.message.updateMany({
    where: {
      conversationId: conversation.id,
      senderId: { not: session.user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ conversation });
}

export async function DELETE(_request, { params }) {
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

  // Cascading delete: removes all messages via onDelete: Cascade
  await prisma.conversation.delete({ where: { id: conversation.id } });

  return NextResponse.json({ ok: true });
}
