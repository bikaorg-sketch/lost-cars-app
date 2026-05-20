import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const onlyUnread = searchParams.get('unread') === '1';

  const where = { userId: session.user.id };
  if (onlyUnread) where.readAt = null;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const all = searchParams.get('all') === '1';

  if (all) {
    await prisma.notification.deleteMany({ where: { userId: session.user.id } });
    return NextResponse.json({ ok: true });
  }
  if (id) {
    await prisma.notification.deleteMany({
      where: { id, userId: session.user.id },
    });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'حدد إشعار أو all=1' }, { status: 400 });
}
