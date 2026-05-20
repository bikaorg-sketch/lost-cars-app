import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification, truncate } from '@/lib/notifications';

export async function GET(_request, { params }) {
  const report = await prisma.report.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, ownerId: true },
  });

  if (!report) {
    return NextResponse.json({ error: 'البلاغ غير موجود' }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.id === report.ownerId;
  const isAdmin = session?.user?.role === 'admin';

  // Sightings on non-approved reports only visible to owner/admin
  if (report.status !== 'approved' && !isOwner && !isAdmin) {
    return NextResponse.json({ error: 'غير متاح' }, { status: 403 });
  }

  const sightings = await prisma.sighting.findMany({
    where: { reportId: params.id },
    orderBy: { createdAt: 'desc' },
    include: { reporter: { select: { id: true, name: true } } },
  });

  // Hide phone numbers from non-owner/non-admin viewers
  const sanitized = sightings.map((s) => {
    if (!isOwner && !isAdmin) {
      return { ...s, contactPhone: null };
    }
    return s;
  });

  return NextResponse.json({ sightings: sanitized });
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  }

  const report = await prisma.report.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, ownerId: true, brand: true, model: true },
  });

  if (!report) {
    return NextResponse.json({ error: 'البلاغ غير موجود' }, { status: 404 });
  }

  if (report.status !== 'approved') {
    return NextResponse.json(
      { error: 'يمكن الإبلاغ عن مشاهدة للبلاغات المنشورة فقط' },
      { status: 400 }
    );
  }

  if (report.ownerId === session.user.id) {
    return NextResponse.json(
      { error: 'لا يمكنك الإبلاغ عن مشاهدة على بلاغك الخاص' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const {
      description,
      city,
      area,
      latitude,
      longitude,
      contactPhone,
      seenAt,
    } = body;

    if (!description || !city) {
      return NextResponse.json(
        { error: 'الوصف والولاية مطلوبان' },
        { status: 400 }
      );
    }

    const sighting = await prisma.sighting.create({
      data: {
        reportId: report.id,
        reporterId: session.user.id,
        description: description.trim(),
        city: city.trim(),
        area: area?.trim() || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        contactPhone: contactPhone?.trim() || null,
        seenAt: seenAt ? new Date(seenAt) : null,
      },
    });

    // Notify the report owner
    await createNotification({
      userId: report.ownerId,
      type: 'sighting',
      title: `📍 بلاغ مشاهدة جديد على سيارتك ${report.brand} ${report.model}`,
      body: truncate(description, 100),
      link: `/reports/${report.id}#sightings`,
    });

    return NextResponse.json({ sighting }, { status: 201 });
  } catch (err) {
    console.error('create sighting error:', err);
    return NextResponse.json({ error: 'فشل حفظ المشاهدة' }, { status: 500 });
  }
}
