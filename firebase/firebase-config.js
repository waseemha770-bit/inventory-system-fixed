// ============================================================
// إعدادات Firebase - نظام إدارة المخزون السحابي
// ============================================================
//
// ⚠️ IMPORTANT: استبدل القيم التالية بمفاتيحك الخاصة من Firebase
//
// 📋 خطوات الحصول على المفاتيح:
// 1. اذهب إلى https://console.firebase.google.com/
// 2. أنشئ مشروع جديد (أو استخدم مشروع موجود)
// 3. من القائمة الجانبية: Project Settings > General > Your apps
// 4. اضغط على أيقونة الويب (</>) لإنشاء تطبيق ويب
// 5. انسخ بيانات التكوين (firebaseConfig) والصقها هنا
//
// 📋 تفعيل الخدمات المطلوبة (جميعها مجانية):
// - Authentication: Enable > Sign-in method > Email/Password
// - Firestore Database: Create Database > Start in production mode
// - Offline Persistence: مفعّل تلقائياً عبر IndexedDB
//
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, query, where, orderBy, limit, serverTimestamp, Timestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================================================
// ⚠️ بيانات التكوين - ضع مفاتيحك هنا
// ============================================================
const firebaseConfig = {


  apiKey: "AIzaSyD3uyMIpvlVgEJhrfETA7t4_ApOUCGmWRM",


  authDomain: "enterprise-inventory-sys-55d86.firebaseapp.com",


  projectId: "enterprise-inventory-sys-55d86",


  storageBucket: "enterprise-inventory-sys-55d86.firebasestorage.app",


  messagingSenderId: "528601705322",


  appId: "1:528601705322:web:f71703b5d27fc576755313"


};




// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// تفعيل العمل بدون إنترنت (Offline-First) عبر IndexedDB
// هذا يعمل تلقائياً في الخطة المجانية بدون أي تكاليف إضافية
async function enableOfflinePersistence() {
  try {
    await enableIndexedDbPersistence(db);
    console.log("✅ تم تفعيل التخزين المحلي (Offline Persistence) بنجاح");
  } catch (err) {
    if (err.code === 'failed-precondition') {
      console.warn("⚠️ لا يمكن تفعيل التخزين المحلي: المتصفح لا يدعم IndexedDB");
    } else if (err.code === 'unimplemented') {
      console.warn("⚠️ التخزين المحلي غير مدعوم في هذا المتصفح");
    } else {
      console.warn("⚠️ تحذير: " + err.message);
    }
  }
}

enableOfflinePersistence();

// ============================================================
// تصدير المكونات للاستخدام في باقي الملفات
// ============================================================
export {
  auth,
  db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
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
};

// ============================================================
// معلومات حول الخطة المجانية (Spark Plan):
// ============================================================
// ✅ Firestore Database:
//   - 50,000 قراءة / يوم
//   - 20,000 كتابة / يوم
//   - 20,000 حذف / يوم
//   - 1 GB تخزين
//   - 10 GB نقل بيانات / شهر
//
// ✅ Authentication:
//   - 50,000 مستخدم نشط / شهر
//   - بدون حد لعمليات تسجيل الدخول
//   - بدون تكاليف إضافية
//
// ✅ Hosting (اختياري):
//   - 1 GB تخزين
//   - 10 GB نقل بيانات / شهر
//   - SSL مجاني
//
// ✅ Hosting Functions:
//   - 125,000 استدعاء / يوم
//   - 2,000,000 GB-seconds
// ============================================================
