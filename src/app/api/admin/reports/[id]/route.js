import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') return null;
  return session;
}

const STATUS_NOTIFICATION = {
  approved: {
    title: '✅ تم نشر بلاغك',
    body: 'تمت الموافقة على بلاغك وهو الآن منشور للجمهور.',
  },
  rejected: {
    title: '❌ تم رفض بلاغك',
    body: 'تم رفض بلاغك. تواصل مع الدعم لمعرفة السبب.',
  },
  recovered: {
    title: '🎉 تم تأكيد استرداد سيارتك',
    body: 'تم تحديث حالة بلاغك إلى "تم العثور على السيارة". تهانينا!',
  },
};

export async function PATCH(request, { params }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'غير مصرّح' }, { status: 403 });
  }

  const { status } = await request.json();
  if (!['pending', 'approved', 'rejected', 'recovered'].includes(status)) {
    return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 });
  }

  const existing = await prisma.report.findUnique({
    where: { id: params.id },
    select: { ownerId: true, status: true, brand: true, model: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'البلاغ غير موجود' }, { status: 404 });
  }

  const report = await prisma.report.update({
    where: { id: params.id },
    data: { status },
  });

  // Notify owner if status actually changed
  if (existing.status !== status && STATUS_NOTIFICATION[status]) {
    const meta = STATUS_NOTIFICATION[status];
    await createNotification({
      userId: existing.ownerId,
      type: 'report_status',
      title: meta.title,
      body: `${meta.body} (${existing.brand} ${existing.model})`,
      link: `/reports/${params.id}`,
    });
  }

  return NextResponse.json({ report });
}

export async function DELETE(_request, { params }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'غير مصرّح' }, { status: 403 });
  }

  const report = await prisma.report.findUnique({
    where: { id: params.id },
    select: {
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

  await prisma.report.delete({ where: { id: params.id } });

  // Notify the owner that their report was deleted
  const carLabel = `${report.brand} ${report.model}${report.plateNumber ? ` (${report.plateNumber})` : ''}`;
  await createNotification({
    userId: report.ownerId,
    type: 'system',
    title: report.deletionRequestedAt
      ? '✅ تم قبول طلب الحذف'
      : '⚠️ تم حذف بلاغك من الإدارة',
    body: report.deletionRequestedAt
      ? `تمت الموافقة على حذف بلاغك: ${carLabel}`
      : `قامت الإدارة بحذف بلاغك: ${carLabel}. للاستفسار تواصل مع الدعم.`,
    link: '/contact',
  });

  return NextResponse.json({ ok: true });
}
