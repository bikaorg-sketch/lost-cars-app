import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: { select: { reports: true, sightings: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, phone } = body;

    const data = {};
    if (typeof name === 'string') {
      const trimmed = name.trim();
      if (trimmed.length < 2) {
        return NextResponse.json({ error: 'الاسم قصير جداً' }, { status: 400 });
      }
      data.name = trimmed;
    }
    if (typeof email === 'string') {
      const normalized = email.toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        return NextResponse.json({ error: 'البريد غير صالح' }, { status: 400 });
      }
      // Check uniqueness
      const existing = await prisma.user.findUnique({ where: { email: normalized } });
      if (existing && existing.id !== session.user.id) {
        return NextResponse.json({ error: 'هذا البريد مستخدم بالفعل' }, { status: 409 });
      }
      data.email = normalized;
    }
    if (typeof phone === 'string') {
      data.phone = phone.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error('update me error:', err);
    return NextResponse.json({ error: 'فشل تحديث البيانات' }, { status: 500 });
  }
}
