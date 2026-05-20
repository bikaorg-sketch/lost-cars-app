import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  }

  const sighting = await prisma.sighting.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      reporterId: true,
      report: { select: { ownerId: true } },
    },
  });

  if (!sighting) {
    return NextResponse.json({ error: 'المشاهدة غير موجودة' }, { status: 404 });
  }

  const canDelete =
    session.user.role === 'admin' ||
    sighting.reporterId === session.user.id ||
    sighting.report?.ownerId === session.user.id;

  if (!canDelete) {
    return NextResponse.json({ error: 'لا تملك صلاحية الحذف' }, { status: 403 });
  }

  await prisma.sighting.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
