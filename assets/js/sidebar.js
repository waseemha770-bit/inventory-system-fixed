// ============================================================
// نظام إدارة المخزون السحابي - القائمة الجانبية
// Enterprise Inventory System - Sidebar Component Logic
// ============================================================

/**
 * تهيئة القائمة الجانبية: زر الفتح/الإغلاق على الجوال،
 * الإغلاق التلقائي عند النقر خارجها أو اختيار رابط أو ضغط Escape،
 * وتفعيل الرابط المطابق للصفحة الحالية.
 */
function initSidebar() {
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');

  if (!sidebar) return;

  // فتح/إغلاق القائمة (عرض الجوال)
  if (toggle) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });
  }

  // إغلاق القائمة عند النقر خارجها
  document.addEventListener('click', (e) => {
    if (
      sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) &&
      !(toggle && toggle.contains(e.target))
    ) {
      sidebar.classList.remove('open');
    }
  });

  // إغلاق القائمة تلقائياً بعد اختيار أي رابط (تجربة أفضل على الجوال)
  sidebar.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', () => {
      sidebar.classList.remove('open');
    });
  });

  // إغلاق القائمة بمفتاح Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }
  });

  highlightActiveLink();
}

/** تفعيل الرابط المطابق للصفحة الحالية في القائمة الجانبية */
function highlightActiveLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const linkPath = href.split('/').pop();
    link.classList.toggle('active', linkPath === currentPath);
  });
}

/** تحديث اسم المستخدم ودوره وحرف الأفاتار في أسفل القائمة الجانبية */
function updateSidebarUser({ name, email, role }) {
  const nameEl = document.getElementById('user-name');
  const roleEl = document.getElementById('user-role');
  const avatarEl = document.getElementById('user-avatar');

  const displayName = name || email || 'مستخدم';
  const roleLabels = { Admin: 'مدير النظام', Editor: 'محرر', Viewer: 'عارض' };

  if (nameEl) nameEl.textContent = displayName;
  if (roleEl) roleEl.textContent = roleLabels[role] || 'عارض';
  if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();
}

window.initSidebar = initSidebar;
window.updateSidebarUser = updateSidebarUser;

// ============================================================
// تصدير الدوال كوحدة ES Module
// ============================================================
export { initSidebar, highlightActiveLink, updateSidebarUser };
