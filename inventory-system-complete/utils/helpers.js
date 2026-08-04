// ============================================================
// نظام إدارة المخزون السحابي - أدوات مساعدة عامة
// Enterprise Inventory System - Shared Helper Utilities
// ============================================================
// دوال مستقلة (لا تعتمد على Firebase) يمكن استيرادها في أي صفحة:
//   import { formatCurrency, formatDate, debounce } from '../utils/helpers.js';
// ============================================================

// ------------------------------------------------------------
// تنسيق الأرقام والعملات
// ------------------------------------------------------------

/** تنسيق رقم كعملة (مثال: 1500.5 -> "1,500.50 ر.س") */
function formatCurrency(amount, currency = 'ر.س') {
  const value = parseFloat(amount) || 0;
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${formatted} ${currency}`;
}

/** تنسيق رقم بفواصل الآلاف بدون خانات عشرية (مثال: 15000 -> "15,000") */
function formatNumber(num) {
  const value = parseFloat(num) || 0;
  return value.toLocaleString('en-US');
}

// ------------------------------------------------------------
// تنسيق التواريخ
// ------------------------------------------------------------

/** تنسيق تاريخ (YYYY-MM-DD أو Date) لعرضه بالعربية، مثال: "4 أغسطس 2026" */
function formatDate(date, options = {}) {
  if (!date) return '-';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric', ...options
  });
}

/** تاريخ اليوم بصيغة YYYY-MM-DD (نفس صيغة حقول input type="date") */
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/** تحويل Firestore Timestamp إلى نص تاريخ عربي */
function formatTimestamp(timestamp) {
  if (!timestamp || !timestamp.seconds) return '-';
  return formatDate(new Date(timestamp.seconds * 1000));
}

/** الوقت النسبي (منذ كم من الوقت)، مثال: "منذ 5 دقائق" */
function timeAgo(date) {
  if (!date) return '-';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';

  const seconds = Math.floor((new Date() - d) / 1000);
  const units = [
    { label: 'سنة', secs: 31536000 },
    { label: 'شهر', secs: 2592000 },
    { label: 'يوم', secs: 86400 },
    { label: 'ساعة', secs: 3600 },
    { label: 'دقيقة', secs: 60 }
  ];

  for (const unit of units) {
    const value = Math.floor(seconds / unit.secs);
    if (value >= 1) return `منذ ${value} ${unit.label}${value > 1 ? '' : ''}`;
  }
  return 'الآن';
}

// ------------------------------------------------------------
// التحقق من صحة المدخلات (Validation)
// ------------------------------------------------------------

/** التحقق من صحة صيغة البريد الإلكتروني */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

/** التحقق من صحة رقم الهاتف (أرقام، ويسمح بـ + في البداية، 7-15 رقم) */
function isValidPhone(phone) {
  return /^\+?[0-9]{7,15}$/.test(String(phone || '').trim());
}

/** التأكد من أن جميع الحقول المطلوبة معبأة، وإرجاع أول حقل ناقص */
function validateRequired(fields) {
  for (const [label, value] of Object.entries(fields)) {
    if (value === null || value === undefined || String(value).trim() === '') {
      return { valid: false, missing: label };
    }
  }
  return { valid: true, missing: null };
}

// ------------------------------------------------------------
// أدوات النصوص
// ------------------------------------------------------------

/** اقتطاع نص طويل وإضافة "..." */
function truncateText(text, maxLength = 50) {
  const str = String(text || '');
  return str.length > maxLength ? str.slice(0, maxLength).trim() + '...' : str;
}

/** تحويل نص خام إلى HTML آمن (لمنع XSS عند إدراج بيانات المستخدم في الجدول) */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text ?? '');
  return div.innerHTML;
}

// ------------------------------------------------------------
// أدوات التحكم بالأداء (Performance)
// ------------------------------------------------------------

/** تأخير تنفيذ دالة حتى يتوقف المستخدم عن الكتابة (مفيد لحقول البحث) */
function debounce(fn, wait = 300) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/** تحديد عدد مرات تنفيذ دالة خلال فترة زمنية */
function throttle(fn, wait = 300) {
  let waiting = false;
  return function (...args) {
    if (waiting) return;
    fn.apply(this, args);
    waiting = true;
    setTimeout(() => { waiting = false; }, wait);
  };
}

// ------------------------------------------------------------
// أدوات المصفوفات (Arrays)
// ------------------------------------------------------------

/** ترتيب مصفوفة حسب حقل معين */
function sortBy(array, field, direction = 'asc') {
  const sorted = [...array].sort((a, b) => {
    const valA = a[field] ?? '';
    const valB = b[field] ?? '';
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}

/** تجميع عناصر مصفوفة حسب حقل معين */
function groupBy(array, field) {
  return array.reduce((groups, item) => {
    const key = item[field] ?? 'بدون تصنيف';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
}

/** جمع قيم حقل رقمي في مصفوفة */
function sumBy(array, field) {
  return array.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
}

// ------------------------------------------------------------
// أدوات متفرقة
// ------------------------------------------------------------

/** توليد معرف عشوائي مختصر (بدون بادئة)، مفيد لأسماء الملفات المؤقتة ونحوها */
function generateShortId(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/** نسخ نص إلى الحافظة، ويعيد true/false حسب النجاح */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('تعذر النسخ إلى الحافظة:', err);
    return false;
  }
}

/** طباعة عنصر HTML محدد فقط (فاتورة، تقرير...) في نافذة طباعة منفصلة */
function printElement(elementId, title = 'طباعة') {
  const el = document.getElementById(elementId);
  if (!el) return;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Tajawal', Arial, sans-serif; padding: 20px; direction: rtl; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: right; font-size: 13px; }
        th { background-color: #f1f5f9; }
      </style>
    </head>
    <body>${el.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

// ============================================================
// تصدير الدوال للاستخدام في باقي الملفات
// ============================================================
export {
  formatCurrency,
  formatNumber,
  formatDate,
  todayISO,
  formatTimestamp,
  timeAgo,
  isValidEmail,
  isValidPhone,
  validateRequired,
  truncateText,
  escapeHtml,
  debounce,
  throttle,
  sortBy,
  groupBy,
  sumBy,
  generateShortId,
  copyToClipboard,
  printElement
};
