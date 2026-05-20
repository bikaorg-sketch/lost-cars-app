# منصة السيارات المفقودة

تطبيق ويب عربي للإبلاغ عن السيارات المسروقة/المفقودة والبحث عنها. مبني بـ Next.js 14 + Prisma + SQLite.

## المميزات

- 📝 تسجيل بلاغ سيارة مفقودة مع صور، إحداثيات، وبيانات تواصل
- 🔎 البحث برقم اللوحة، الشاسيه، الماركة، أو المدينة
- 🗺️ خريطة تفاعلية بكل البلاغات (Leaflet + OpenStreetMap)
- 👥 نظام حسابات مستخدمين مع NextAuth
- 🛡️ لوحة تحكم أدمن للموافقة على البلاغات وإدارتها
- 🌐 واجهة عربية كاملة بدعم RTL

## التشغيل

```powershell
# 1) تثبيت الـ dependencies (يتم تلقائياً إذا لم تتم بعد)
npm install

# 2) إنشاء قاعدة البيانات
npm run db:push

# 3) إضافة بيانات تجريبية + مستخدم أدمن
npm run db:seed

# 4) تشغيل خادم التطوير
npm run dev
```

افتح المتصفح على [http://localhost:3000](http://localhost:3000).

## بيانات الدخول التجريبية (بعد seed)

| الدور | البريد | كلمة المرور |
|------|--------|-------------|
| أدمن | admin@example.com | admin1234 |
| مستخدم | ahmed@example.com | user1234 |
| مستخدم | sara@example.com | user1234 |

## الهيكلية

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API endpoints
│   ├── admin/              # لوحة الأدمن (محمية)
│   ├── reports/            # صفحات البلاغات
│   ├── login, register/    # المصادقة
│   └── map/                # الخريطة
├── components/             # المكونات (Navbar, ReportCard, MapView, ...)
└── lib/                    # prisma.js + auth.js
prisma/
├── schema.prisma           # نموذج قاعدة البيانات
└── seed.js                 # سكريبت البيانات التجريبية
```

## ملاحظات التطوير

- قاعدة البيانات SQLite للسهولة. للنشر للإنتاج بدّلها لـ PostgreSQL في `prisma/schema.prisma` وأعد إنشاء الـ migration.
- **غيّر `NEXTAUTH_SECRET`** في `.env` قبل النشر.
- الصور تُرفع في `public/uploads/`. للإنتاج استخدم خدمة سحابية (S3, Cloudinary) وعدّل `src/app/api/upload/route.js`.
- الخريطة تستخدم OpenStreetMap (مجاناً، بدون API key).
