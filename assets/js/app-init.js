// ============================================================
// نظام إدارة المخزون السحابي - المنطق العام للتطبيق
// Enterprise Inventory System - App Initialization
// ============================================================

import {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot
} from '../../firebase/firebase-config.js'; // مسار الاستدعاء الصحيح

// ============================================================
// حالة التطبيق العامة
// ============================================================
const AppState = {
  currentUser: null,
  currentRole: null,
  currentPage: '',
  isOnline: navigator.onLine,
  loading: false
};

// ============================================================
// توليد معرفات تلقائية (Auto-ID Generator)
// ============================================================
function generateAutoId(prefix) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${id}`;
}

// ============================================================
// التحقق من حالة الاتصال
// ============================================================
function updateConnectionStatus() {
  const statusEl = document.getElementById('connection-status');
  if (!statusEl) return;

  if (navigator.onLine) {
    statusEl.textContent = '✅ متصل بالإنترنت - البيانات متزامنة مع الخادم';
    statusEl.className = 'connection-status online';
    setTimeout(() => {
      statusEl.className = 'connection-status';
    }, 4000);
  } else {
    statusEl.textContent = '⚠️ غير متصل بالإنترنت - العمل في وضع غير متصل (Offline)';
    statusEl.className = 'connection-status offline';
  }
  AppState.isOnline = navigator.onLine;
}

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

// ============================================================
// نظام الإشعارات (Toast Notifications)
// ============================================================
function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// ============================================================
// نظام الصلاحيات (RBAC)
// ============================================================
const RolePermissions = {
  Admin: { canAdd: true, canEdit: true, canDelete: true, canExport: true, canManageUsers: true, canViewReports: true },
  Editor: { canAdd: true, canEdit: true, canDelete: false, canExport: true, canManageUsers: false, canViewReports: true },
  Viewer: { canAdd: false, canEdit: false, canDelete: false, canExport: true, canManageUsers: false, canViewReports: true }
};

function checkPermission(permission) {
  if (!AppState.currentRole) return false;
  const role = RolePermissions[AppState.currentRole];
  return role ? role[permission] : false;
}

function applyPermissions() {
  document.querySelectorAll('[data-permission="add"]').forEach(el => {
    el.style.display = checkPermission('canAdd') ? '' : 'none';
  });
  document.querySelectorAll('[data-permission="edit"]').forEach(el => {
    el.style.display = checkPermission('canEdit') ? '' : 'none';
  });
  document.querySelectorAll('[data-permission="delete"]').forEach(el => {
    el.style.display = checkPermission('canDelete') ? '' : 'none';
  });
  document.querySelectorAll('[data-permission="export"]').forEach(el => {
    el.style.display = checkPermission('canExport') ? '' : 'none';
  });
  document.querySelectorAll('[data-permission="users"]').forEach(el => {
    el.style.display = checkPermission('canManageUsers') ? '' : 'none';
  });
}

// ============================================================
// 🌟 التحقق من الجلسة وتوجيه المستخدم (نظام جدار الحماية الأمني)
// ============================================================
function checkAuth(required = true) {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        AppState.currentUser = user;
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            AppState.currentRole = userDoc.data().role || 'Viewer';
          } else {
            // التهيئة الذكية: المدير الأول
            const usersSnapshot = await getDocs(query(collection(db, 'users'), limit(1)));
            let newRole = 'Viewer';
            let newName = 'مستخدم جديد';

            if (usersSnapshot.empty) {
              newRole = 'Admin';
              newName = 'مدير النظام';
              console.log('🌟 تم اكتشاف أول دخول: جاري تهيئة حساب المدير...');
            }

            await setDoc(userRef, {
              email: user.email,
              role: newRole,
              name: newName,
              createdAt: serverTimestamp()
            });

            AppState.currentRole = newRole;
            showToast(`تم التسجيل بنجاح بصلاحية: ${newRole === 'Admin' ? 'مدير عام' : 'مستخدم'}`, 'success');
          }
          
          // ✅ إعطاء الضوء الأخضر: إظهار الواجهة الآن لأن المستخدم موثوق
          document.body.style.visibility = 'visible';
          document.body.style.opacity = '1';
          
          resolve(user);
        } catch (err) {
          console.error('خطأ في التحقق من المستخدم أو إنشاء حسابه:', err);
          AppState.currentRole = 'Viewer';
          
          // إظهار الواجهة حتى لا تتعلق الشاشة إذا حدث خطأ في الشبكة
          document.body.style.visibility = 'visible';
          document.body.style.opacity = '1';
          
          resolve(user);
        }
      } else {
        AppState.currentUser = null;
        AppState.currentRole = null;
        if (required) {
          // ❌ طرد المستخدم فوراً لصفحة الدخول (بدون ترك أثر في سجل التصفح)
          window.location.replace('/login.html');
        } else {
          // إذا كانت الصفحة عامة لا تتطلب الدخول
          document.body.style.visibility = 'visible';
          document.body.style.opacity = '1';
        }
        resolve(null);
      }
    });
  });
}

// ============================================================
// تسجيل الخروج
// ============================================================
async function handleLogout() {
  try {
    await signOut(auth);
    window.location.replace('/login.html'); // استخدام replace لمنع الرجوع للواجهة
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
    showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
  }
}

// ============================================================
// القائمة الجانبية (مدمجة هنا)
// ============================================================
function initSidebar() {
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  document.addEventListener('click', (e) => {
    if (sidebar && sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  const currentPath = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    if (link.getAttribute('href') === `/${currentPath}` ||
        link.getAttribute('href') === currentPath ||
        link.getAttribute('href') === `../${currentPath}`) {
      link.classList.add('active');
    }
  });
}

// ============================================================
// تهيئة الصفحة الرئيسية
// ============================================================
async function initApp() {
  updateConnectionStatus();

  if (!navigator.onLine) {
    updateConnectionStatus();
  }

  initSidebar();

  const user = await checkAuth(true);
  if (user) {
    if (document.getElementById('user-name')) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      document.getElementById('user-name').textContent = userData.name || user.email;
      document.getElementById('user-role').textContent = AppState.currentRole === 'Admin' ? 'مدير النظام' : (AppState.currentRole === 'Editor' ? 'محرر' : 'عارض');
      document.getElementById('user-avatar').textContent = (userData.name || user.email || 'U').charAt(0).toUpperCase();
    }
    applyPermissions();
  }
}

// ============================================================
// 🌟 مدير النوافذ الذكي الشامل (الحل الجذري للأزرار الميتة)
// ============================================================
document.addEventListener('click', (e) => {
  // 1. فتح النوافذ
  const targetBtn = e.target.closest('[id^="add-"], .btn-add, [data-action="open-modal"]');
  if (targetBtn) {
    e.preventDefault();
    let prefix = targetBtn.id ? targetBtn.id.replace('add-', '') : '';
    let modal = document.getElementById(`${prefix}-modal`) || 
                document.getElementById(`modal-${prefix}`) || 
                document.getElementById(`${prefix}Modal`) ||
                document.querySelector('.modal');
    
    if (modal) {
      modal.classList.add('active');
      const form = modal.querySelector('form');
      if (form) {
        const idField = form.querySelector('[id*="id"], [name*="id"], [name*="code"]');
        if (idField && !idField.value && prefix) {
          idField.value = generateAutoId(prefix.toUpperCase().slice(0, 3));
        }
      }
    }
  }

  // 2. إغلاق النوافذ
  if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal') || e.target.dataset.dismiss === 'modal') {
    const modal = e.target.closest('.modal');
    if (modal) {
      modal.classList.remove('active');
      const form = modal.querySelector('form');
      if (form) form.reset();
    }
  }
});

// دالة احتياطية للحفاظ على التوافقية مع الأكواد القديمة
function initFormModal(modalId, formId, collectionName, idPrefix) {
  return { 
    modal: document.getElementById(modalId), 
    form: document.getElementById(formId) 
  };
}

// ============================================================
// تحميل البيانات من Firestore
// ============================================================
async function loadCollection(collectionName, orderByField = 'createdAt', orderDir = 'desc') {
  try {
    const q = query(
      collection(db, collectionName),
      orderBy(orderByField, orderDir)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`خطأ في تحميل ${collectionName}:`, error);
    showToast(`خطأ في تحميل البيانات: ${error.message}`, 'error');
    return [];
  }
}

// ============================================================
// حذف سجل
// ============================================================
async function deleteDocument(collectionName, docId, itemName) {
  if (!confirm(`هل أنت متأكد من حذف "${itemName}"؟`)) return;

  try {
    await deleteDoc(doc(db, collectionName, docId));
    showToast('تم الحذف بنجاح', 'success');
    if (window.location.pathname.includes(collectionName)) {
      location.reload();
    }
  } catch (error) {
    console.error('خطأ في الحذف:', error);
    showToast('حدث خطأ أثناء الحذف', 'error');
  }
}

// ============================================================
// ماسح الباركود (Barcode Scanner)
// ============================================================
function initBarcodeScanner(inputFieldId) {
  if (typeof Html5Qrcode === 'undefined') {
    console.warn('مكتبة Html5Qrcode غير محملة');
    return null;
  }

  const scanner = new Html5Qrcode("barcode-reader");
  const inputField = document.getElementById(inputFieldId);

  document.getElementById('btn-scan')?.addEventListener('click', () => {
    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        if (inputField) {
          inputField.value = decodedText;
          inputField.dispatchEvent(new Event('change'));
        }
        scanner.stop();
        document.getElementById('barcode-reader-modal')?.classList.remove('active');
      },
      (errorMessage) => {}
    ).catch((err) => {
      console.error('خطأ في تشغيل الماسح:', err);
      showToast('تعذر تشغيل الكاميرا', 'error');
    });
  });

  return scanner;
}

// ============================================================
// التصدير إلى CSV
// ============================================================
function exportTableToCSV(tableId, filename) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const rows = table.querySelectorAll('tr');
  const csv = [];

  rows.forEach(row => {
    const cols = row.querySelectorAll('td, th');
    const rowData = [];
    cols.forEach(col => {
      rowData.push('"' + col.textContent.replace(/"/g, '""') + '"');
    });
    csv.push(rowData.join(','));
  });

  const csvContent = '\uFEFF' + csv.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ============================================================
// تصدير الأدوات للاستخدام العام
// ============================================================
window.generateAutoId = generateAutoId;
window.checkPermission = checkPermission;
window.applyPermissions = applyPermissions;
window.handleLogout = handleLogout;
window.initApp = initApp;
window.initFormModal = initFormModal;
window.loadCollection = loadCollection;
window.deleteDocument = deleteDocument;
window.initBarcodeScanner = initBarcodeScanner;
window.exportTableToCSV = exportTableToCSV;
window.showToast = showToast;
window.RolePermissions = RolePermissions;

export {
  generateAutoId,
  checkPermission,
  applyPermissions,
  handleLogout,
  initApp,
  initFormModal,
  loadCollection,
  deleteDocument,
  initBarcodeScanner,
  exportTableToCSV,
  showToast,
  RolePermissions
};

// ============================================================
// تفعيل تطبيق الويب التقدمي (PWA Service Worker)
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✅ تم تفعيل PWA ServiceWorker بنجاح');
      })
      .catch(err => {
        console.warn('⚠️ فشل تفعيل PWA ServiceWorker:', err);
      });
  });
}

// ============================================================
// تشغيل التطبيق عند تحميل الصفحة
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  if (typeof initApp === 'function') {
    initApp();
  }
});
