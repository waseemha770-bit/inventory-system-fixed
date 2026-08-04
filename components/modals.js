// ============================================================
// نظام إدارة المخزون السحابي - إدارة النوافذ المنبثقة (Modals)
// Enterprise Inventory System - Modal Component Logic
// ============================================================
// يعمل مع البنية الموجودة في main.css:
//   <div class="modal-overlay" id="...">
//     <div class="modal"> ... <button class="modal-close">×</button> ... </div>
//   </div>
// ============================================================

/** فتح نافذة منبثقة عبر الـ id الخاص بها */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

/** إغلاق نافذة منبثقة عبر الـ id الخاص بها، مع تصفير أي نموذج بداخلها */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('active');
  const form = modal.querySelector('form');
  if (form) form.reset();
}

/** إغلاق جميع النوافذ المنبثقة المفتوحة حالياً في الصفحة */
function closeAllModals() {
  document.querySelectorAll('.modal-overlay.active').forEach(modal => {
    modal.classList.remove('active');
  });
}

/**
 * نافذة تأكيد مخصصة (بديل لـ window.confirm الافتراضي في المتصفح)
 * الاستخدام:
 *   const ok = await confirmDialog('هل أنت متأكد من الحذف؟');
 *   if (ok) { ... }
 */
function confirmDialog(message, { title = 'تأكيد العملية', confirmText = 'تأكيد', cancelText = 'إلغاء', danger = true } = {}) {
  return new Promise(resolve => {
    // إزالة أي نافذة تأكيد سابقة معلّقة
    const existing = document.getElementById('confirm-dialog-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'confirm-dialog-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" data-action="cancel">&times;</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 14px; color: var(--text-color);">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm">${confirmText}</button>
          <button class="btn btn-outline" data-action="cancel">${cancelText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const cleanup = (result) => {
      overlay.remove();
      resolve(result);
    };

    overlay.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'confirm') cleanup(true);
      if (action === 'cancel') cleanup(false);
      if (e.target === overlay) cleanup(false); // النقر خارج الصندوق
    });
  });
}

// ------------------------------------------------------------
// سلوك عام يُفعَّل تلقائياً عند تحميل الملف في أي صفحة
// ------------------------------------------------------------

// إغلاق النافذة عند النقر على الخلفية المعتمة خارج صندوق الـ modal
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// إغلاق آخر نافذة مفتوحة بمفتاح Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const openModals = document.querySelectorAll('.modal-overlay.active');
    if (openModals.length > 0) {
      openModals[openModals.length - 1].classList.remove('active');
    }
  }
});

// إتاحتها كدوال عامة (لاستخدامها في onclick="" ضمن ملفات HTML)
window.openModal = openModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
window.confirmDialog = confirmDialog;

// ============================================================
// تصدير الدوال كوحدة ES Module
// ============================================================
export { openModal, closeModal, closeAllModals, confirmDialog };
