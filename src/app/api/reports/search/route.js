import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const city = (searchParams.get('city') || '').trim();

  const where = {
    status: 'approved',
    AND: [],
  };

  if (q) {
    where.AND.push({
      OR: [
        { plateNumber: { contains: q } },
        { chassisNumber: { contains: q } },
        { brand: { contains: q } },
        { model: { contains: q } },
      ],
    });
  }

  if (city) {
    where.AND.push({ lostCity: { contains: city } });
  }

  const reports = await prisma.report.findMany({
    where,
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: { images: true },
  });

  return NextResponse.json({ reports });
}
