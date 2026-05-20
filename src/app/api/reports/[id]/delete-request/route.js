import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification, truncate } from '@/lib/notifications';

// User: submit a deletion request on their own report.
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  }

  const report = await prisma.report.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      ownerId: true,
      brand: true,
      model: true,
      plateNumber: true,
      deletionRequestedAt: true,
    },
  });

  if (!report) {
    return NextResponse.json({ error: 'البلاغ غير موجود' }, { status: 404 });
  }

  if (report.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'لا يمكنك طلب حذف بلاغ غير ملكك' }, { status: 403 });
  }

  if (report.deletionRequestedAt) {
    return NextResponse.json(
      { error: 'يوجد طلب حذف مفتوح بالفعل على هذا البلاغ' },
      { status: 409 }
    );
  }

  const { reason } = await request.json().catch(() => ({}));
  const cleanReason = typeof reason === 'string' ? reason.trim() : '';

  const updated = await prisma.report.update({
    where: { id: report.id },
    data: {
      deletionRequestedAt: new Date(),
      deletionReason: cleanReason || null,
    },
    select: { id: true, deletionRequestedAt: true, deletionReason: true },
  });

  // Notify all admins
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true },
  });

  const carLabel = `${report.brand} ${report.model}${report.plateNumber ? ` (${report.plateNumber})` : ''}`;
  await Promise.all(
    admins.map((a) =>
      createNotification({
        userId: a.id,
        type: 'system',
        title: `🗑️ طلب حذف بلاغ من ${session.user.name}`,
        body: cleanReason
          ? `${carLabel} - السبب: ${truncate(cleanReason, 80)}`
          : carLabel,
        link: `/admin/reports?status=deletion_requested`,
      })
    )
  );

  return NextResponse.json({ report: updated }, { status: 201 });
}

// User: cancel an open deletion request.
export async function DELETE(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  }

  const report = await prisma.report.findUnique({
    where: { id: params.id },
    select: { ownerId: true, deletionRequestedAt: true },
  });

  if (!report) {
    return NextResponse.json({ error: 'البلاغ غير موجود' }, { status: 404 });
  }

  if (report.ownerId !== session.user.id && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرّح' }, { status: 403 });
  }

  if (!report.deletionRequestedAt) {
    return NextResponse.json(
      { error: 'لا يوجد طلب حذف لإلغائه' },
      { status: 400 }
    );
  }

  await prisma.report.update({
    where: { id: params.id },
    data: { deletionRequestedAt: null, deletionReason: null },
  });

  return NextResponse.json({ ok: true });
}
