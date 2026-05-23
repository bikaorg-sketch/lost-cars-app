// Idempotent seed: safe to run multiple times.
// - Users use upsert (key: email)
// - Reports are skipped only if a report with the same plate/chassis already exists
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function ensureReport(data) {
  const where = data.plateNumber
    ? { plateNumber: data.plateNumber }
    : { chassisNumber: data.chassisNumber };

  const existing = await prisma.report.findFirst({ where });
  if (existing) {
    console.log(`  ⏭️  موجود مسبقاً: ${data.brand} ${data.model}`);
    return existing;
  }

  await prisma.report.create({ data });
  console.log(`  ✅ تم إنشاء: ${data.brand} ${data.model}`);
}

async function main() {
  console.log('🌱 جاري إضافة/تحديث البيانات التجريبية...\n');

  const adminPass = await bcrypt.hash('admin1234', 10);
  const userPass = await bcrypt.hash('user1234', 10);

  // === Users ===
  console.log('👥 المستخدمون:');
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
  console.log(`  ✅ admin: ${admin.email}`);

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
  console.log(`  ✅ user1: ${user1.email}`);

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
  console.log(`  ✅ user2: ${user2.email}`);

  // === Reports ===
  console.log('\n🚗 البلاغات:');

  await ensureReport({
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
  });

  await ensureReport({
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
  });

  await ensureReport({
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
  });

  await ensureReport({
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
  });

  // Recovered sample 1
  await ensureReport({
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
  });

  // Recovered sample 2
  await ensureReport({
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
  });

  // === Summary ===
  console.log('\n📊 ملخّص قاعدة البيانات:');
  const counts = await prisma.report.groupBy({
    by: ['status'],
    _count: { status: true },
  });
  for (const c of counts) {
    console.log(`  ${c.status}: ${c._count.status}`);
  }
  const totalUsers = await prisma.user.count();
  console.log(`  مستخدمين: ${totalUsers}`);

  console.log('\n✅ خلصت!');
  console.log('\nبيانات تسجيل الدخول:');
  console.log('  👤 الأدمن:   admin@example.com / admin1234');
  console.log('  👤 مستخدم:   ahmed@example.com / user1234');
  console.log('  👤 مستخدم:   fatima@example.com / user1234');
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
