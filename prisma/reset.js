// Helper script to wipe all data and start fresh.
// Usage: node prisma/reset.js  (then optionally: npm run db:seed)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 جاري حذف البيانات...');
  await prisma.sighting.deleteMany({});
  await prisma.reportImage.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ تم تنظيف قاعدة البيانات. شغّل npm run db:seed لإضافة بيانات تجريبية.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
