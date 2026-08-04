# دليل الإعداد الشامل لنظام إدارة المخزون السحابي

## نظام إدارة المخزون السحابي (Enterprise Inventory System)

---

## الجزء الأول: إعداد Firebase (الخطة المجانية - Spark Plan)

### الخطوة 1: إنشاء مشروع Firebase

1. اذهب إلى: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. اضغط على **"Add project"** (إضافة مشروع)
3. أدخل اسم المشروع (مثال: `inventory-system-2025`)
4. يمكنك تعطيل Google Analytics (غير مطلوب)
5. اضغط **"Create project"**

### الخطوة 2: الحصول على مفاتيح التكوين

1. من القائمة الجانبية، اضغط على ⚙️ (الإعدادات) > **Project settings**
2. في قسم **"Your apps"**, اضغط على أيقونة الويب `</>`
3. أدخل اسم التطبيق (مثال: `Inventory System`)
4. اضغط **"Register app"**
5. **انسخ بيانات التكوين** (firebaseConfig) التي ستظهر

### الخطوة 3: تفعيل الخدمات المطلوبة

#### أ. Firebase Authentication (تسجيل الدخول)
1. من القائمة الجانبية: **Authentication** > **Get started**
2. اضغط على تبويب **"Sign-in method"**
3. فعّل **Email/Password**
4. اضغط **"Save"**

#### ب. Firestore Database (قاعدة البيانات)
1. من القائمة الجانبية: **Firestore Database** > **Create database**
2. اختر **"Start in production mode"** (وضع الإنتاج)
3. اختر أقرب خادم إليك (مثال: `eur3` أو `us-central1`)
4. اضغط **"Done"**

#### ج. Firebase Hosting (اختياري - للاستضافة المجانية)
1. من القائمة الجانبية: **Hosting** > **Get started**
2. اتبع التعليمات لنشر المشروع

### الخطوة 4: إضافة قواعد الأمان

1. من القائمة الجانبية: **Firestore Database** > **Rules**
2. احذف القواعد الافتراضية والصق محتوى ملف `firebase-rules/firestore.rules`
3. اضغط **"Publish"**

### الخطوة 5: تطبيق مفاتيح Firebase في الكود

**افتح ملف:** `firebase/firebase-config.js`

**استبدل القيم التالية:**

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**بالقيم التي حصلت عليها من Firebase Console** (انظر الخطوة 2).

---

## الجزء الثاني: خطة Firebase المجانية (Spark Plan)

### ما تحصل عليه مجاناً:

| الخدمة | الحد المجاني | ملاحظات |
|--------|-------------|---------|
| **Firestore Database** | 50,000 قراءة/يوم | كافية لمشروع متوسط |
| | 20,000 كتابة/يوم | كافية لمشروع متوسط |
| | 20,000 حذف/يوم | كافية لمشروع متوسط |
| | 1 GB تخزين | حوالي 10,000 مستند |
| | 10 GB نقل/شهر | - |
| **Authentication** | 50,000 مستخدم نشط/شهر | بدون حد لعمليات الدخول |
| **Hosting** | 1 GB تخزين | SSL مجاني |
| | 10 GB نقل/شهر | - |
| **Cloud Functions** | 125,000 استدعاء/يوم | مجاني |

### نصائح للبقاء في الخطة المجانية:

1. **لا تستخدم Firebase Storage** - تم استبداله بتخزين الصور كـ Base64
2. **استخدم IndexedDB** - مفعّل تلقائياً للعمل بدون إنترنت
3. **اجلب البيانات بحكمة** - استخدم `limit()` عند الحاجة
4. **لا تفعل Realtime Listeners** بشكل مفرط - استخدم `onSnapshot` عند الحاجة فقط

---

## الجزء الثالث: تشغيل المشروع محلياً

### الطريقة 1: خادم بسيط (Python)

```bash
cd inventory-system
python3 -m http.server 8080
```

ثم افتح: `http://localhost:8080`

### الطريقة 2: خادم Node.js

```bash
cd inventory-system
npx serve -p 8080
```

### الطريقة 3: Firebase Hosting (نشر مجاني)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## الجزء الرابع: هيكل قاعدة البيانات (Firestore Collections)

### مجموعة `products` (المنتجات)
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `code` | String | كود المنتج (PRD-XXXXXX) |
| `name` | String | اسم المنتج |
| `category` | String | الفئة |
| `unit` | String | الوحدة (قطعة، كرتون...) |
| `currentQuantity` | Number | الكمية الحالية |
| `minQuantity` | Number | الحد الأدنى |
| `maxQuantity` | Number | الحد الأقصى |
| `costPrice` | Number | سعر الشراء |
| `salePrice` | Number | سعر البيع |
| `location` | String | الموقع |
| `image` | String | صورة Base64 (اختياري) |
| `lastUpdated` | String | تاريخ آخر تحديث |
| `createdAt` | Timestamp | تاريخ الإنشاء |

### مجموعة `movements` (الحركات)
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `movementId` | String | رقم الحركة (MOV-XXXXXX) |
| `date` | String | التاريخ |
| `productCode` | String | كود المنتج |
| `productName` | String | اسم المنتج |
| `type` | String | النوع (وارد/صادر/تحويل) |
| `quantity` | Number | الكمية |
| `price` | Number | السعر |
| `totalValue` | Number | إجمالي القيمة |
| `contact` | String | المورد/العميل |
| `invoiceNo` | String | رقم الفاتورة |
| `notes` | String | ملاحظات |
| `createdAt` | Timestamp | تاريخ الإنشاء |

### مجموعة `contacts` (الموردين والعملاء)
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `contactNumber` | String | الرقم (CNT-XXXXXX) |
| `name` | String | الاسم |
| `type` | String | النوع (مورد/عميل) |
| `phone` | String | رقم الهاتف |
| `email` | String | البريد الإلكتروني |
| `address` | String | العنوان |
| `firstDealDate` | String | تاريخ أول تعامل |
| `status` | String | الحالة (نشط/متوقف) |
| `notes` | String | ملاحظات |
| `createdAt` | Timestamp | تاريخ الإنشاء |

### مجموعة `returns` (المرتجعات)
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `returnId` | String | رقم المرتجع (RET-XXXXXX) |
| `returnDate` | String | تاريخ المرتجع |
| `type` | String | النوع (مرتجع عميل/مورد) |
| `productCode` | String | كود المنتج |
| `productName` | String | اسم المنتج |
| `quantity` | Number | الكمية المرتجعة |
| `reason` | String | سبب المرتجع |
| `contact` | String | العميل/المورد |
| `originalInvoice` | String | رقم الفاتورة الأصلية |
| `returnValue` | Number | قيمة المرتجع |
| `status` | String | الحالة (معالج/قيد المعالجة/مرفوض) |
| `notes` | String | ملاحظات |
| `createdAt` | Timestamp | تاريخ الإنشاء |

### مجموعة `accounts` (الآجل والديون)
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `accountNumber` | String | رقم الحساب (ACC-XXXXXX) |
| `contact` | String | العميل/المورد |
| `type` | String | النوع (آجل مورد/عميل) |
| `invoiceNo` | String | رقم الفاتورة |
| `invoiceDate` | String | تاريخ الفاتورة |
| `totalAmount` | Number | إجمالي المبلغ |
| `paidAmount` | Number | المبلغ المدفوع |
| `remainingAmount` | Number | المبلغ المتبقي |
| `dueDate` | String | تاريخ الاستحقاق |
| `delayDays` | Number | أيام التأخير |
| `status` | String | الحالة (ساري/متأخر/مسدد) |
| `notes` | String | ملاحظات |
| `createdAt` | Timestamp | تاريخ الإنشاء |

### مجموعة `users` (المستخدمين)
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `name` | String | الاسم الكامل |
| `email` | String | البريد الإلكتروني |
| `role` | String | الدور (Admin/Editor/Viewer) |
| `createdAt` | Timestamp | تاريخ الإنشاء |

---

## الجزء الخامس: هيكل ملفات المشروع

```
inventory-system/
├── index.html                    # صفحة التوجيه الرئيسية
├── login.html                    # تسجيل الدخول
├── dashboard.html                # لوحة التحكم
├── firebase/
│   └── firebase-config.js        # إعدادات Firebase (ضع مفاتيحك هنا)
├── firebase-rules/
│   └── firestore.rules           # قواعد أمان قاعدة البيانات
├── assets/
│   ├── css/
│   │   └── main.css              # ملف التنسيقات الموحد
│   └── js/
│       └── app-init.js           # المنطق العام والتحقق من الجلسات
├── pages/
│   ├── products.html             # المخزون الحالي
│   ├── movements.html            # حركات المخزون
│   ├── contacts.html             # الموردين والعملاء
│   ├── returns.html              # المرتجعات
│   ├── accounts.html             # الآجل والديون
│   ├── reports.html              # التقارير التحليلية
│   └── users.html                # إدارة المستخدمين
└── setup-guide.md                # هذا الدليل
```

---

## الجزء السادس: نظام الصلاحيات (RBAC)

| الصلاحية | Admin | Editor | Viewer |
|-----------|-------|--------|--------|
| إضافة سجلات | ✅ | ✅ | ❌ |
| تعديل سجلات | ✅ | ✅ | ❌ |
| حذف سجلات | ✅ | ❌ | ❌ |
| تصدير التقارير | ✅ | ✅ | ✅ |
| إدارة المستخدمين | ✅ | ❌ | ❌ |
| عرض التقارير | ✅ | ✅ | ✅ |

---

## الجزء السابع: الميزات التقنية

1. **العمل بدون إنترنت (Offline-First):** عبر IndexedDB - البيانات تُخزن محلياً وتتزامن عند العودة
2. **مؤشر حالة الاتصال:** شريط علوي يظهر حالة الاتصال تلقائياً
3. **توليد المعرفات التلقائي:** PRD-XXXXXX, MOV-XXXXXX, ACC-XXXXXX
4. **ماسح الباركود:** دمج Html5Qrcode (جاهز للتفعيل)
5. **ضغط الصور محلياً:** تحويل إلى Base64 وتقليل الحجم (بدون Firebase Storage)
6. **تصدير Excel:** عبر مكتبة SheetJS (XLSX)
7. **تصميم متجاوب:** يعمل على جميع الأجهزة
