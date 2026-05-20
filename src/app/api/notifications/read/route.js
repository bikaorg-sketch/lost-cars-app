import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  }

  const { ids, all } = await request.json().catch(() => ({}));

  if (all) {
    const r = await prisma.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ updated: r.count });
  }

  if (Array.isArray(ids) && ids.length > 0) {
    const r = await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ updated: r.count });
  }

  return NextResponse.json({ error: 'أرسل ids أو all=true' }, { status: 400 });
}
