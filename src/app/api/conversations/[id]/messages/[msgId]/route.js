import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  }

  const message = await prisma.message.findUnique({
    where: { id: params.msgId },
    select: { id: true, senderId: true, conversationId: true, deletedAt: true },
  });

  if (!message) {
    return NextResponse.json({ error: 'الرسالة غير موجودة' }, { status: 404 });
  }

  if (message.conversationId !== params.id) {
    return NextResponse.json({ error: 'الرسالة لا تنتمي لهذه المحادثة' }, { status: 400 });
  }

  if (message.senderId !== session.user.id) {
    return NextResponse.json(
      { error: 'يمكن حذف الرسالة من قِبَل صاحبها فقط' },
      { status: 403 }
    );
  }

  if (message.deletedAt) {
    return NextResponse.json({ error: 'الرسالة محذوفة بالفعل' }, { status: 409 });
  }

  const updated = await prisma.message.update({
    where: { id: params.msgId },
    data: {
      deletedAt: new Date(),
      body: '',
    },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json({ message: updated });
}
