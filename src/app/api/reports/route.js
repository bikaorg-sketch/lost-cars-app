import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'approved';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  let where;
  if (status === 'all') {
    where = {};
  } else if (status === 'deletion_requested') {
    where = { deletionRequestedAt: { not: null } };
  } else {
    where = { status };
  }

  const reports = await prisma.report.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      images: true,
      owner: { select: { name: true } },
    },
  });

  return NextResponse.json({ reports });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      plateNumber,
      chassisNumber,
      brand,
      model,
      year,
      color,
      description,
      lostAt,
      lostCity,
      lostArea,
      latitude,
      longitude,
      contactName,
      contactPhone,
      contactEmail,
      reward,
      images = [],
    } = body;

    const normalize = (s) => {
      if (!s) return null;
      const n = s.trim().toUpperCase().replace(/\s+/g, ' ');
      return n || null;
    };

    const cleanPlate = normalize(plateNumber);
    const cleanChassis = normalize(chassisNumber);

    if (!cleanPlate && !cleanChassis) {
      return NextResponse.json(
        { error: 'يجب إدخال رقم اللوحة أو رقم الشاسيه (واحد منهما على الأقل)' },
        { status: 400 }
      );
    }

    if (!brand || !model || !color || !lostCity || !contactName || !contactPhone) {
      return NextResponse.json(
        { error: 'يرجى ملء جميع الحقول المطلوبة' },
        { status: 400 }
      );
    }

    const duplicateOr = [];
    if (cleanPlate) duplicateOr.push({ plateNumber: cleanPlate });
    if (cleanChassis) duplicateOr.push({ chassisNumber: cleanChassis });

    const existing = await prisma.report.findFirst({
      where: {
        status: { in: ['pending', 'approved'] },
        OR: duplicateOr,
      },
      select: { id: true, plateNumber: true, chassisNumber: true, status: true },
    });

    if (existing) {
      const matchedBy =
        cleanPlate && existing.plateNumber === cleanPlate ? 'plate' : 'chassis';
      const errorMsg =
        matchedBy === 'plate'
          ? `يوجد بلاغ نشط بالفعل بنفس رقم اللوحة (${existing.plateNumber}). إذا كانت نفس السيارة، يمكنك مراجعة البلاغ الموجود.`
          : `يوجد بلاغ نشط بالفعل بنفس رقم الشاسيه. إذا كانت نفس السيارة، يمكنك مراجعة البلاغ الموجود.`;

      return NextResponse.json(
        {
          error: errorMsg,
          existingReportId: existing.id,
          matchedBy,
        },
        { status: 409 }
      );
    }

    const report = await prisma.report.create({
      data: {
        plateNumber: cleanPlate,
        chassisNumber: cleanChassis,
        brand: brand.trim(),
        model: model.trim(),
        year: year ? parseInt(year) : null,
        color: color.trim(),
        description: description?.trim() || null,
        lostAt: lostAt ? new Date(lostAt) : null,
        lostCity: lostCity.trim(),
        lostArea: lostArea?.trim() || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail?.trim() || null,
        reward: reward ? parseFloat(reward) : null,
        ownerId: session.user.id,
        status: 'pending',
        images: {
          create: images.map((url) => ({ url })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'يوجد بلاغ بنفس البيانات بالفعل.' },
        { status: 409 }
      );
    }
    console.error('create report error:', err);
    return NextResponse.json({ error: 'حدث خطأ أثناء حفظ البلاغ' }, { status: 500 });
  }
}
