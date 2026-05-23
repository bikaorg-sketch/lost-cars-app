# 🚀 دليل النشر — Vercel + Neon Postgres

دليل سريع لنشر المشروع على الإنترنت **مجاناً**.

## نظرة عامة

- **قاعدة البيانات**: [Neon](https://neon.tech) — PostgreSQL مجاني
- **الاستضافة**: [Vercel](https://vercel.com) — يدعم Next.js رسمياً
- **GitHub**: لربط النشر التلقائي عند كل push

---

## 1️⃣ إنشاء قاعدة بيانات Neon

1. روح على [console.neon.tech](https://console.neon.tech) واعمل **Sign up** (يمكنك استخدام حساب GitHub)
2. اضغط **New Project**
3. اختر:
   - **Name**: `lost-cars-app`
   - **Region**: أقرب منطقة (مثلاً Europe / Frankfurt)
   - **Postgres version**: 16 (الافتراضي)
4. بعد الإنشاء، انسخ الـ **Connection String** (يبدأ بـ `postgresql://`)
5. احفظه — هتستخدمه في الخطوة التالية

---

## 2️⃣ توليد NEXTAUTH_SECRET

افتح PowerShell أو CMD واعمل:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

سيظهر نص مثل: `xK7p2mN9...` — انسخه.

---

## 3️⃣ النشر على Vercel

1. روح على [vercel.com](https://vercel.com) واعمل **Sign up** بحساب GitHub
2. اضغط **Add New → Project**
3. اختر مستودع `lost-cars-app` من قائمة GitHub
4. في صفحة الإعدادات، توسيع **Environment Variables** وأضف:

   | المتغير | القيمة |
   |---------|--------|
   | `DATABASE_URL` | connection string من Neon |
   | `NEXTAUTH_SECRET` | النص اللي ولّدته في الخطوة 2 |
   | `NEXTAUTH_URL` | `https://YOUR-APP-NAME.vercel.app` (هتعرفها بعد النشر، حدّثها بعدين) |

5. اضغط **Deploy**

سينتظر Vercel حوالي 2-3 دقائق ثم سيعطيك رابطاً مثل `https://lost-cars-app-xyz.vercel.app`.

---

## 4️⃣ تحديث NEXTAUTH_URL (مرة واحدة بعد النشر الأول)

1. خد الرابط اللي أعطاك Vercel
2. روح **Project → Settings → Environment Variables**
3. عدّل `NEXTAUTH_URL` ليطابق الرابط
4. روح **Deployments → آخر deployment → ⋯ → Redeploy**

---

## 5️⃣ إضافة بيانات تجريبية (اختياري)

بعد النشر، الـ DB فاضي. لإضافة المستخدمين والبلاغات التجريبية:

محلياً، حدّث `.env` ليستخدم `DATABASE_URL` بتاع Neon، ثم:

```powershell
npm run db:push    # ينشئ الجداول
npm run db:seed    # يضيف admin@example.com وغيره
```

ثم رجّع `.env` المحلي للقيمة المحلية لو محتاج.

---

## 🔁 التحديثات المستقبلية

أي `git push` لـ `main` على GitHub → Vercel **يُحدّث الموقع تلقائياً** خلال دقيقتين.

---

## ⚠️ ملاحظة حول رفع الصور

في النشر الحالي، رفع الصور (`public/uploads/`) **لن يعمل على Vercel** لأن الـ filesystem غير دائم.
لتفعيله مستقبلاً، استخدم خدمة مثل [Vercel Blob](https://vercel.com/storage/blob) أو Cloudinary.
بقية ميزات التطبيق (بلاغات بدون صور، البحث، الرسائل، الإشعارات، الخريطة) تشتغل بدون مشاكل.

---

## ❓ مشاكل شائعة

**"Module not found: @prisma/client"**
- الـ `postinstall` script لازم يشتغل. Vercel يشغّل `npm install` ثم `postinstall` تلقائياً.

**"Authentication failed" عند تسجيل الدخول**
- `NEXTAUTH_SECRET` لازم يكون قيمة عشوائية قوية (32 حرف على الأقل).
- `NEXTAUTH_URL` يجب أن يطابق رابط Vercel بالضبط (بدون trailing slash).

**"Can't reach database server"**
- تأكد إن `DATABASE_URL` من Neon ويحتوي `?sslmode=require` في آخره.
