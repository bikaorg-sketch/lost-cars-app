const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 جاري إضافة البيانات التجريبية...');

  const adminPass = await bcrypt.hash('admin1234', 10);
  const userPass = await bcrypt.hash('user1234', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'مدير النظام',
      email: 'admin@example.com',
      phone: '0912345678',
      password: adminPass,
      role: 'admin',
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'ahmed@example.com' },
    update: {},
    create: {
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      phone: '0911111111',
      password: userPass,
      role: 'user',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'fatima@example.com' },
    update: {},
    create: {
      name: 'فاطمة عبدالله',
      email: 'fatima@example.com',
      phone: '0912222222',
      password: userPass,
      role: 'user',
    },
  });

  const existing = await prisma.report.count();
  if (existing > 0) {
    console.log(`⏭️  يوجد ${existing} بلاغ بالفعل، تخطّي الإضافة.`);
    return;
  }

  // مثال (1) - بلاغ بـ رقم لوحة فقط
  await prisma.report.create({
    data: {
      plateNumber: 'KRT 12345',
      brand: 'تويوتا',
      model: 'كورولا',
      year: 2018,
      color: 'أبيض',
      description: 'بها خدش بسيط في الباب الأيمن الخلفي وملصق على الزجاج الأمامي.',
      lostAt: new Date('2026-05-10T22:00:00'),
      lostCity: 'الخرطوم',
      lostArea: 'الخرطوم 2 - شارع المك نمر',
      latitude: 15.5007,
      longitude: 32.5599,
      contactName: 'أحمد محمد',
      contactPhone: '0911111111',
      contactEmail: 'ahmed@example.com',
      reward: 500000,
      status: 'approved',
      ownerId: user1.id,
    },
  });

  // مثال (2) - بلاغ بـ رقم لوحة + شاسيه
  await prisma.report.create({
    data: {
      plateNumber: 'OMD 56789',
      chassisNumber: 'KMHCT4AE5DU123456',
      brand: 'هيونداي',
      model: 'إلنترا',
      year: 2020,
      color: 'أسود',
      description: 'سيارة عمل، عليها شعار شركة.',
      lostAt: new Date('2026-05-12T08:30:00'),
      lostCity: 'الجزيرة',
      lostArea: 'ود مدني - حي المطار',
      latitude: 14.4006,
      longitude: 33.5197,
      contactName: 'فاطمة عبدالله',
      contactPhone: '0912222222',
      reward: 300000,
      status: 'approved',
      ownerId: user2.id,
    },
  });

  // مثال (3) - بلاغ بـ رقم شاسيه فقط (بدون لوحة)
  await prisma.report.create({
    data: {
      chassisNumber: 'JTDBR32E120098765',
      brand: 'نيسان',
      model: 'صني',
      year: 2015,
      color: 'فضي',
      description: 'اللوحة كانت مفكوكة وقت السرقة.',
      lostAt: new Date('2026-05-14T17:00:00'),
      lostCity: 'البحر الأحمر',
      lostArea: 'بورتسودان - حي المهندسين',
      latitude: 19.6147,
      longitude: 37.2167,
      contactName: 'أحمد محمد',
      contactPhone: '0911111111',
      status: 'approved',
      ownerId: user1.id,
    },
  });

  // مثال (4) - بلاغ قيد المراجعة
  await prisma.report.create({
    data: {
      plateNumber: 'KSL 33445',
      brand: 'كيا',
      model: 'سيراتو',
      year: 2019,
      color: 'رمادي',
      lostAt: new Date('2026-05-16T20:00:00'),
      lostCity: 'كسلا',
      lostArea: 'وسط كسلا',
      latitude: 15.4509,
      longitude: 36.4000,
      contactName: 'فاطمة عبدالله',
      contactPhone: '0912222222',
      status: 'pending',
      ownerId: user2.id,
    },
  });

  // مثال (5) - بلاغ تم العثور على السيارة (قصة نجاح)
  await prisma.report.create({
    data: {
      plateNumber: 'OMD 11223',
      brand: 'ميتسوبيشي',
      model: 'لانسر',
      year: 2017,
      color: 'أزرق',
      description: 'تم العثور عليها بعد 3 أيام بفضل بلاغ من أحد المواطنين.',
      lostAt: new Date('2026-04-20T14:00:00'),
      lostCity: 'الخرطوم',
      lostArea: 'أم درمان - السوق الشعبي',
      latitude: 15.6437,
      longitude: 32.4772,
      contactName: 'أحمد محمد',
      contactPhone: '0911111111',
      status: 'recovered',
      ownerId: user1.id,
    },
  });

  // مثال (6) - بلاغ ثاني تم استرداده
  await prisma.report.create({
    data: {
      chassisNumber: 'JN8AS5MT9DW123ABC',
      brand: 'نيسان',
      model: 'قشقاي',
      year: 2021,
      color: 'أبيض لؤلؤي',
      description: 'استُردت بفضل خريطة المنصة بعد أسبوع من الإبلاغ.',
      lostAt: new Date('2026-04-25T08:00:00'),
      lostCity: 'نهر النيل',
      lostArea: 'عطبرة',
      latitude: 17.7000,
      longitude: 33.9833,
      contactName: 'فاطمة عبدالله',
      contactPhone: '0912222222',
      status: 'recovered',
      ownerId: user2.id,
    },
  });

  console.log('✅ تم إضافة البيانات بنجاح!');
  console.log('');
  console.log('بيانات تسجيل الدخول:');
  console.log('  👤 الأدمن:   admin@example.com / admin1234');
  console.log('  👤 مستخدم:   ahmed@example.com / user1234');
  console.log('  👤 مستخدم:   fatima@example.com / user1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
