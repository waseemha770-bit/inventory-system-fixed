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
} from '../../firebase/firebase-config.js'; // ✅ تم إصلاح المسار هنا

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
  Admin: {
    canAdd: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canManageUsers: true,
    canViewReports: true
  },
  Editor: {
    canAdd: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canManageUsers: false,
    canViewReports: true
  },
  Viewer: {
    canAdd: false,
    canEdit: false,
    canDelete: false,
    canExport: true,
    canManageUsers: false,
    canViewReports: true
  }
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
// التحقق من الجلسة وتوجيه المستخدم
// ============================================================
function checkAuth(required = true) {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        AppState.currentUser = user;
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            AppState.currentRole = userDoc.data().role || 'Viewer';
          } else {
            AppState.currentRole = 'Viewer';
          }
          resolve(user);
        } catch (err) {
          console.error('خطأ في جلب بيانات المستخدم:', err);
          AppState.currentRole = 'Viewer';
          resolve(user);
        }
      } else {
        AppState.currentUser = null;
        AppState.currentRole = null;
        if (required) {
          window.location.href = '/login.html';
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
    window.location.href = '/login.html';
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
    showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
  }
}

// ============================================================
// القائمة الجانبية - حالة الطي (Mobile) ✅ تمت إضافتها هنا
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
    // ✅ تم معالجة بيانات القائمة الجانبية بشكل مباشر دون استدعاء ملف خارجي
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
// تهيئة نموذج إضافة/تعديل
// ============================================================
function initFormModal(modalId, formId, collectionName, idPrefix) {
  const modal = document.getElementById(modalId);
  const form = document.getElementById(formId);
  const addBtn = document.getElementById(`add-${idPrefix.toLowerCase()}`);

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const idField = form.querySelector('[id*="id"], [name*="id"], [name*="code"]');
      if (idField && idPrefix) {
        idField.value = generateAutoId(idPrefix);
      }
      modal.classList.add('active');
    });
  }

  const closeBtn = modal?.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      form.reset();
    });
  }

  return { modal, form };
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
      (errorMessage) => {
      }
    ).catch((err) => {
      console.error('خطأ في تشغيل الماسح:', err);
      showToast('تعذر تشغيل الكاميرا', 'error');
    });
  });

  return scanner;
}

// ============================================================
// التصدير إلى ملف
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
        console.log('✅ تم تفعيل PWA ServiceWorker بنجاح', registration.scope);
      })
      .catch(err => {
        console.warn('⚠️ فشل تفعيل PWA ServiceWorker (طبيعي إذا كنت تعمل محلياً):', err);
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
