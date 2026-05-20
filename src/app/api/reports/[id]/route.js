import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request, { params }) {
  const { id } = params;
  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      images: true,
      owner: { select: { name: true, email: true } },
      sightings: {
        orderBy: { seenAt: 'desc' },
        include: { reporter: { select: { name: true } } },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: 'البلاغ غير موجود' }, { status: 404 });
  }

  return NextResponse.json({ report });
}
