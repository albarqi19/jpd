// بيانات التطبيق
const API_BASE_URL = 'https://sternmost-junita-indiscriminately.ngrok-free.app/api';

// وظيفة مساعدة لتنسيق التوقيت
function formatTime(timeString) {
  if (!timeString) return '';
  
  // إذا كان التوقيت بصيغة ISO (مع التاريخ)
  if (timeString.includes('T')) {
    // استخراج الوقت فقط من النص مباشرة بدون تحويل التاريخ
    const timePart = timeString.split('T')[1]; // الجزء بعد T
    const timeOnly = timePart.split('.')[0]; // إزالة الميلي ثانية
    return timeOnly.substring(0, 5); // أخذ HH:MM فقط
  }
  
  // إذا كان التوقيت بصيغة HH:MM:SS أو HH:MM
  if (timeString.includes(':')) {
    return timeString.substring(0, 5); // أخذ HH:MM فقط
  }
  
  return timeString;
}

const appData = {
  teachers: [
    {
      id: 1,
      name: "أحمد محمد",
      email: "ahmed@school.edu",
      phone: "0501234567",
      subject: "الرياضيات",
      classes: ["الصف الأول أ", "الصف الثاني ب"]
    },
    {
      id: 2,
      name: "فاطمة علي", 
      email: "fatima@school.edu",
      phone: "0509876543",
      subject: "العلوم",
      classes: ["الصف الثالث أ", "الصف الثاني أ"]
    }
  ],
  students: [
    {
      id: 1,
      name: "محمد سعد",
      class: "الصف الأول أ",
      parentPhone: "0501111111",
      rollNumber: "001"
    },
    {
      id: 2,
      name: "سارة أحمد",
      class: "الصف الأول أ", 
      parentPhone: "0502222222",
      rollNumber: "002"
    },
    {
      id: 3,
      name: "عبدالله محمد",
      class: "الصف الأول أ",
      parentPhone: "0503333333", 
      rollNumber: "003"
    },
    {
      id: 4,
      name: "نور فاطمة",
      class: "الصف الأول أ",
      parentPhone: "0504444444",
      rollNumber: "004"
    }
  ],
  classes: [
    {
      id: 1,
      teacherId: 1,
      subject: "الرياضيات",
      className: "الصف الأول أ",
      time: "08:00",
      endTime: "09:00",
      day: "الأحد",
      isCurrent: true
    },
    {
      id: 2,
      teacherId: 1,
      subject: "الرياضيات", 
      className: "الصف الثاني ب",
      time: "10:00",
      endTime: "11:00",
      day: "الأحد",
      isCurrent: false
    },
    {
      id: 3,
      teacherId: 2,
      subject: "العلوم",
      className: "الصف الثالث أ", 
      time: "09:00",
      endTime: "10:00",
      day: "الأحد",
      isCurrent: false
    }
  ],
  stats: {
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    totalTeachers: 0,
    totalClasses: 0
  }
};

// متغيرات عامة
let currentUser = null;
let currentClass = null;
let attendanceData = {};

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', async function() {
  console.log('تطبيق محمل بنجاح');
  
  // فحص URL للوصول المباشر لواجهة الإدارة
  checkAdminAccess();
  
  await initializeApp();
  setupEventListeners();
  updateDateTime();
  setInterval(updateDateTime, 60000); // تحديث كل دقيقة
});

// فحص الوصول لواجهة الإدارة من خلال URL
function checkAdminAccess() {
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  
  // إذا كان URL يحتوي على admin أو #admin
  if (urlParams.get('admin') === 'true' || hash === '#admin') {
    console.log('تم الوصول لواجهة الإدارة من خلال URL');
    setTimeout(() => {
      showPage('adminLogin');
    }, 100);
  }
}

// تهيئة التطبيق
async function initializeApp() {
  // استرجاع حالة المستخدم من localStorage
  const sessionRestored = await restoreUserSession();
  
  // إذا كان المستخدم مسجل دخول، اذهب لوحة التحكم المناسبة
  if (sessionRestored && currentUser) {
    console.log('تم استرجاع الجلسة، توجيه المستخدم للوحة التحكم...');
    console.log('بيانات المستخدم الحالي:', currentUser);
    
    if (currentUser.role === 'teacher') {
      console.log('توجيه للوحة تحكم المعلم...');
      showPage('teacherDashboard');
      // تأخير صغير للتأكد من تحميل الصفحة
      setTimeout(() => {
        console.log('بدء تحميل لوحة تحكم المعلم...');
        loadTeacherDashboard();
      }, 200);
    } else if (currentUser.role === 'admin') {
      console.log('توجيه للوحة تحكم الإدارة...');
      showPage('adminDashboard');
      // تأخير صغير للتأكد من تحميل الصفحة
      setTimeout(() => {
        console.log('بدء تحميل لوحة تحكم الإدارة...');
        loadAdminDashboard();
      }, 200);
    }
  } else {
    console.log('لا توجد جلسة صالحة، عرض الصفحة الرئيسية');
    showPage('homePage');
  }
  
  // إعداد حالة الحضور الافتراضية للطلاب
  appData.students.forEach(student => {
    attendanceData[student.id] = 'present';
  });
  
  // بدء التحقق الدوري من صلاحية الجلسة
  startSessionCheck();
  
  // مراقبة حالة الاتصال بالإنترنت
  window.addEventListener('online', function() {
    showNotification('تم إعادة الاتصال بالإنترنت', 'success');
  });
  
  window.addEventListener('offline', function() {
    showNotification('انقطع الاتصال بالإنترنت - سيتم حفظ البيانات محلياً', 'warning');
  });
}

// التحقق الدوري من صلاحية الجلسة
function startSessionCheck() {
  // تجديد الجلسة عند أي نشاط من المستخدم
  function refreshSession() {
    if (currentUser) {
      const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 ساعة جديدة
      localStorage.setItem('session_expiry', expiryTime.toString());
    }
  }
  
  // إضافة مستمعات للنشاط
  document.addEventListener('click', refreshSession);
  document.addEventListener('keypress', refreshSession);
  document.addEventListener('scroll', refreshSession);
  
  // فحص كل 30 ثانية
  setInterval(() => {
    if (currentUser) {
      const sessionExpiry = localStorage.getItem('session_expiry');
      if (sessionExpiry) {
        const expiryTime = parseInt(sessionExpiry);
        const currentTime = new Date().getTime();
        
        // التأكد من أن وقت انتهاء الصلاحية صحيح
        if (isNaN(expiryTime) || expiryTime <= 0) {
          console.log('وقت انتهاء الجلسة غير صحيح، سيتم تجديده');
          const newExpiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
          localStorage.setItem('session_expiry', newExpiryTime.toString());
          return;
        }
        
        // إذا بقي أقل من 10 دقائق على انتهاء الجلسة
        if (currentTime > expiryTime - (10 * 60 * 1000) && currentTime < expiryTime) {
          showNotification('ستنتهي الجلسة خلال 10 دقائق', 'warning');
        }
        
        // إذا انتهت الجلسة
        if (currentTime > expiryTime) {
          showNotification('انتهت صلاحية الجلسة، سيتم تسجيل الخروج', 'error');
          logout();
        }
      } else {
        // إذا لم يكن هناك وقت انتهاء محفوظ، اضبط واحد جديد
        console.log('لا يوجد وقت انتهاء محفوظ، سيتم إنشاء واحد جديد');
        const newExpiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
        localStorage.setItem('session_expiry', newExpiryTime.toString());
      }
    }
  }, 30000); // كل 30 ثانية
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
  // أزرار الصفحة الرئيسية
  const teacherLoginBtn = document.getElementById('teacherLoginBtn');
  const adminLoginBtn = document.getElementById('adminLoginBtn');
  const adminSecretLink = document.getElementById('adminSecretLink');
  
  if (teacherLoginBtn) {
    teacherLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('النقر على زر دخول المعلم');
      showPage('teacherLogin');
    });
  }
  
  if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('النقر على زر دخول الإدارة');
      showPage('adminLogin');
    });
  }
  
  // الرابط الخفي لواجهة الإدارة
  if (adminSecretLink) {
    adminSecretLink.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('النقر على الرابط الخفي للإدارة');
      showPage('adminLogin');
    });
  }
  
  // أزرار العودة للرئيسية
  const backToHomeFromTeacher = document.getElementById('backToHomeFromTeacher');
  const backToHomeFromAdmin = document.getElementById('backToHomeFromAdmin');
  
  if (backToHomeFromTeacher) {
    backToHomeFromTeacher.addEventListener('click', function(e) {
      e.preventDefault();
      showPage('homePage');
    });
  }
  
  if (backToHomeFromAdmin) {
    backToHomeFromAdmin.addEventListener('click', function(e) {
      e.preventDefault();
      showPage('homePage');
    });
  }
  
  // نماذج تسجيل الدخول
  const teacherForm = document.getElementById('teacherLoginForm');
  const adminForm = document.getElementById('adminLoginForm');
  
  if (teacherForm) {
    teacherForm.addEventListener('submit', function(e) {
      e.preventDefault();
      handleTeacherLogin();
    });
  }
  
  if (adminForm) {
    adminForm.addEventListener('submit', function(e) {
      e.preventDefault();
      handleAdminLogin();
    });
  }
  
  // أزرار تسجيل الخروج
  const teacherLogoutBtn = document.getElementById('teacherLogoutBtn');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  
  if (teacherLogoutBtn) {
    teacherLogoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      logout();
    });
  }
  
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      logout();
    });
  }
  
  // زر العودة من صفحة التحضير
  const backToDashboardBtn = document.getElementById('backToDashboardBtn');
  if (backToDashboardBtn) {
    backToDashboardBtn.addEventListener('click', function(e) {
      e.preventDefault();
      showPage('teacherDashboard');
    });
  }
  
  // زر حفظ الحضور
  const saveAttendanceBtn = document.getElementById('saveAttendanceBtn');
  if (saveAttendanceBtn) {
    saveAttendanceBtn.addEventListener('click', function(e) {
      e.preventDefault();
      saveAttendance();
    });
  }
  
  // أزرار القائمة الجانبية للإدارة
  const adminMenuItems = document.querySelectorAll('[data-section]');
  adminMenuItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const section = this.getAttribute('data-section');
      showAdminSection(section);
    });
  });
  
  // نموذج إضافة معلم
  const addTeacherForm = document.getElementById('addTeacherForm');
  if (addTeacherForm) {
    addTeacherForm.addEventListener('submit', addTeacher);
  }
  
  // نموذج تغيير كلمة المرور
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', changePassword);
  }

  // نموذج إضافة صف
  const addGradeForm = document.getElementById('addGradeForm');
  if (addGradeForm) {
    addGradeForm.addEventListener('submit', handleAddGrade);
  }
}

// عرض الصفحة المحددة
function showPage(pageId) {
  console.log('عرض الصفحة:', pageId);
  
  // إخفاء جميع الصفحات
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => {
    page.classList.remove('active');
  });
  
  // عرض الصفحة المحددة
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    console.log('تم العثور على الصفحة المطلوبة:', pageId);
    targetPage.classList.add('active');
    targetPage.classList.add('fade-in');
    
    // تحديث المحتوى حسب الصفحة
    setTimeout(() => {
      console.log('تحديث محتوى الصفحة:', pageId);
      if (pageId === 'teacherDashboard') {
        loadTeacherDashboard();
      } else if (pageId === 'adminDashboard') {
        loadAdminDashboard();
      } else if (pageId === 'attendancePage') {
        loadAttendancePage();
      }
    }, 100);
  } else {
    console.error('الصفحة غير موجودة:', pageId);
  }
}

// استرجاع حالة المستخدم من التخزين المحلي
async function restoreUserSession() {
  try {
    // استرجاع التوكن
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    const sessionExpiry = localStorage.getItem('session_expiry');
    
    if (token && userData) {
      // فحص انتهاء صلاحية الجلسة
      if (sessionExpiry) {
        const expiryTime = parseInt(sessionExpiry);
        const currentTime = new Date().getTime();
        
        if (currentTime > expiryTime) {
          console.log('انتهت صلاحية الجلسة، سيتم مسح البيانات');
          clearUserSession();
          return false;
        }
      }
      
      console.log('العثور على توكن محفوظ:', token?.substring(0, 20) + '...');
      
      // تعيين التوكن في apiService
      apiService.setAuthToken(token);
      
      // التحقق من أن التوكن تم تعيينه بنجاح
      console.log('التوكن في apiService بعد التعيين:', apiService.token?.substring(0, 20) + '...');
      
      // استرجاع بيانات المستخدم
      currentUser = JSON.parse(userData);
      console.log('بيانات المستخدم المسترجعة:', currentUser);
      
      // التحقق من صلاحية التوكن من خلال استدعاء API
      try {
        console.log('التحقق من صلاحية التوكن...');
        const response = await apiService.me();
        if (response.success) {
          // تحديث بيانات المستخدم إذا كانت مختلفة
          // التحقق من بنية البيانات المرجعة
          if (response.data.user) {
            currentUser = response.data.user; // إذا كانت البيانات مغلفة في user
          } else {
            currentUser = response.data; // إذا كانت البيانات مباشرة
          }
          saveUserSession(token, currentUser);
          console.log('تم استرجاع جلسة المستخدم بنجاح:', currentUser);
          console.log('دور المستخدم:', currentUser.role);
          return true;
        }
      } catch (error) {
        console.log('التوكن غير صالح، سيتم مسح الجلسة:', error.message);
        clearUserSession();
        return false;
      }
    } else {
      console.log('لا توجد جلسة محفوظة');
      return false;
    }
  } catch (error) {
    console.error('خطأ في استرجاع الجلسة:', error);
    // مسح البيانات التالفة
    clearUserSession();
    return false;
  }
}

// حفظ حالة المستخدم في التخزين المحلي
function saveUserSession(token, userData) {
  try {
    apiService.setToken(token); // استخدام apiService لحفظ التوكن
    localStorage.setItem('user_data', JSON.stringify(userData));
    
    // حفظ وقت انتهاء الجلسة (24 ساعة من الآن)
    const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
    localStorage.setItem('session_expiry', expiryTime.toString());
    
    console.log('تم حفظ جلسة المستخدم');
  } catch (error) {
    console.error('خطأ في حفظ الجلسة:', error);
  }
}

// مسح حالة المستخدم من التخزين المحلي
function clearUserSession() {
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('session_expiry');
    apiService.clearAuthToken();
    currentUser = null;
    console.log('تم مسح جلسة المستخدم');
  } catch (error) {
    console.error('خطأ في مسح الجلسة:', error);
  }
}

// تسجيل دخول المعلم
async function handleTeacherLogin() {
  console.log('محاولة تسجيل دخول المعلم');
  
  const nationalId = document.getElementById('teacherNationalId').value;
  const password = document.getElementById('teacherPassword').value;
  
  // التحقق من صحة البيانات
  if (nationalId.length !== 10) {
    showNotification('رقم الهوية يجب أن يكون 10 أرقام', 'error');
    return;
  }
  
  const submitBtn = document.getElementById('teacherSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>جاري تسجيل الدخول...';
  
  try {
    const result = await apiService.login({
      national_id: nationalId,
      password: password
    });
    
    if (result.success) {
      currentUser = result.data.user;
      const token = result.data.token; // تصحيح: استخدام token بدلاً من access_token
      
      // حفظ الجلسة
      apiService.setToken(token);
      saveUserSession(token, currentUser);
      
      showNotification('تم تسجيل الدخول بنجاح', 'success');
      
      // التحقق من الحاجة لتغيير كلمة المرور
      if (currentUser.needs_password_change) {
        showNotification('يجب تغيير كلمة المرور عند أول تسجيل دخول', 'warning');
        // يمكن إضافة modal لتغيير كلمة المرور هنا
      }
      
      setTimeout(() => {
        showPage('teacherDashboard');
      }, 1000);
    }
  } catch (error) {
    showNotification(error.message || 'خطأ في تسجيل الدخول', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>دخول';
  }
}

// تسجيل دخول الإدارة
async function handleAdminLogin() {
  console.log('محاولة تسجيل دخول الإدارة');
  
  const nationalId = document.getElementById('adminNationalId').value;
  const password = document.getElementById('adminPassword').value;
  
  // التحقق من صحة البيانات
  if (nationalId.length !== 10) {
    showNotification('رقم الهوية يجب أن يكون 10 أرقام', 'error');
    return;
  }
  
  const submitBtn = document.getElementById('adminSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>جاري تسجيل الدخول...';
  
  try {
    const result = await apiService.login({
      national_id: nationalId,
      password: password
    });
    
    if (result.success) {
      currentUser = result.data.user;
      const token = result.data.token; // تصحيح: استخدام token بدلاً من access_token
      
      // حفظ الجلسة
      apiService.setToken(token);
      saveUserSession(token, currentUser);
      
      showNotification('تم تسجيل الدخول بنجاح', 'success');
      setTimeout(() => {
        showPage('adminDashboard');
      }, 1000);
    }
  } catch (error) {
    showNotification(error.message || 'خطأ في تسجيل الدخول', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>دخول';
  }
}

// تحميل لوحة تحكم المعلم
async function loadTeacherDashboard() {
  console.log('=== بدء تحميل لوحة تحكم المعلم ===');
  console.log('المستخدم الحالي:', currentUser);
  
  if (!currentUser) {
    console.error('لا يوجد مستخدم حالي!');
    return;
  }
  
  console.log('تحميل لوحة تحكم المعلم');
  updateDateTime(); // تحديث الوقت فوراً
  
  // تأكد من وجود التوكن
  if (!apiService.token) {
    console.log('لا يوجد توكن، محاولة إعادة تحميل...');
    apiService.loadToken();
  }
  
  console.log('التوكن الحالي:', apiService.token?.substring(0, 20) + '...');
  
  // عرض اسم المعلم
  const teacherNameEl = document.getElementById('teacherName');
  if (teacherNameEl) {
    teacherNameEl.textContent = currentUser.name;
    console.log('تم تعيين اسم المعلم:', currentUser.name);
  } else {
    console.error('عنصر اسم المعلم غير موجود!');
  }
  
  // عرض الحصص
  const classesList = document.getElementById('classesList');
  if (!classesList) {
    console.error('عنصر قائمة الحصص غير موجود!');
    return;
  }

  try {
    // إظهار حالة التحميل
    classesList.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">جاري التحميل...</span>
        </div>
        <p class="mt-3 text-muted">جاري تحميل الحصص...</p>
      </div>
    `;

    // تحميل حصص المعلم من API
    const sessionsResult = await apiService.getTeacherSessions();
    const allSessions = sessionsResult.data || [];
    
    // تصفية الحصص لليوم الحالي فقط
    const currentDay = sessionsResult.current_day;
    const todaySessions = allSessions.filter(session => session.is_today);
    
    classesList.innerHTML = '';
    
    // عرض معلومات اليوم الحالي
    const dayInfo = document.createElement('div');
    dayInfo.className = 'col-12 mb-3';
    dayInfo.innerHTML = `
      <div class="alert alert-info">
        <i class="bi bi-calendar-day me-2"></i>
        <strong>اليوم: ${currentDay}</strong>
        <small class="ms-2">(${sessionsResult.saudi_time ? new Date(sessionsResult.saudi_time).toLocaleDateString('ar-SA') : ''})</small>
        <br>
        <small>عدد الحصص اليوم: ${todaySessions.length}</small>
      </div>
    `;
    classesList.appendChild(dayInfo);
    
    if (todaySessions.length === 0) {
      classesList.innerHTML += `
        <div class="col-12 text-center py-5">
          <i class="bi bi-calendar-x display-4 text-muted"></i>
          <p class="mt-3 text-muted">لا توجد حصص لك اليوم (${currentDay})</p>
          <small class="text-muted">يمكنك مراجعة جدولك الأسبوعي مع الإدارة</small>
        </div>
      `;
      return;
    }
    
    todaySessions.forEach(session => {
      const classCard = document.createElement('div');
      classCard.className = `col-12 col-md-6`;
      
      // تنسيق الوقت بنظام 12 ساعة
      const startTime = session.formatted_start_time || formatTo12Hour(session.start_time?.slice(0, 5)) || 'غير محدد';
      const endTime = session.formatted_end_time || formatTo12Hour(session.end_time?.slice(0, 5)) || 'غير محدد';
      
      // تحديد حالة الحصة
      const isCurrent = session.is_current || false;
      const isPast = session.is_past || false;
      const isFuture = !isCurrent && !isPast;
      
      // تحديد الأيقونة والألوان حسب حالة الحصة
      let statusIcon, statusClass, statusTitle;
      
      if (isCurrent) {
        statusIcon = 'bi-play-circle-fill text-success';
        statusClass = 'current';
        statusTitle = 'الحصة الحالية - يمكن بدء التحضير';
      } else if (isPast) {
        statusIcon = 'bi-check-circle-fill text-secondary';
        statusClass = 'past';
        statusTitle = 'انتهت هذه الحصة';
      } else {
        statusIcon = 'bi-clock text-muted';
        statusClass = 'future';
        statusTitle = 'لم يحن وقت هذه الحصة بعد';
      }
      
      classCard.innerHTML = `
        <div class="class-card ${statusClass}" data-session-id="${session.id}">
          <div class="row align-items-center">
            <div class="col">
              <h5 class="mb-1">${session.subject?.name || 'غير محدد'}</h5>
              <p class="mb-1 text-muted">${session.grade} - ${session.class_name}</p>
              <small class="text-muted">
                <i class="bi bi-clock me-1"></i>
                ${startTime} - ${endTime}
                <br>
                <i class="bi bi-journal-bookmark me-1"></i>الحصة رقم ${session.period_number || 'غير محدد'}
                ${isCurrent ? '<br><i class="bi bi-circle-fill text-success me-1" style="font-size: 0.5rem;"></i><strong class="text-success">جارية الآن</strong>' : ''}
                ${isPast ? '<br><i class="bi bi-check-circle me-1 text-secondary"></i><span class="text-secondary">انتهت</span>' : ''}
                ${isFuture ? '<br><i class="bi bi-hourglass me-1 text-warning"></i><span class="text-warning">قادمة</span>' : ''}
              </small>
            </div>
            <div class="col-auto">
              <i class="bi ${statusIcon}" style="font-size: 2rem;" title="${statusTitle}"></i>
            </div>
          </div>
        </div>
      `;
      
      // إضافة مستمع الأحداث
      const cardElement = classCard.querySelector('.class-card');
      cardElement.addEventListener('click', function() {
        // فقط السماح بالنقر على الحصص الحالية أو التي يمكن أخذ الحضور فيها
        if (isCurrent || session.can_take_attendance) {
          startAttendance(session.id, session);
        } else if (isPast) {
          showNotification('هذه الحصة قد انتهت بالفعل', 'warning');
        } else {
          showNotification('لم يحن وقت هذه الحصة بعد', 'warning');
        }
      });
      
      classesList.appendChild(classCard);
    });
    
  } catch (error) {
    console.error('خطأ في تحميل الحصص:', error);
    classesList.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-exclamation-triangle display-4 text-danger"></i>
        <p class="mt-3 text-danger">فشل في تحميل الحصص</p>
        <button class="btn btn-outline-primary" onclick="loadTeacherDashboard()">إعادة المحاولة</button>
      </div>
    `;
    showNotification('فشل في تحميل الحصص: ' + error.message, 'error');
  }
}

// بدء التحضير
async function startAttendance(sessionId, sessionData = null) {
  console.log('بدء التحضير للحصة:', sessionId);
  
  try {
    // إذا لم تكن بيانات الحصة متوفرة، جلبها من API
    if (!sessionData) {
      const sessionsResult = await apiService.getTeacherSessions();
      const sessions = sessionsResult.data || [];
      sessionData = sessions.find(s => s.id === sessionId);
    }
    
    if (!sessionData) {
      showNotification('لم يتم العثور على بيانات الحصة', 'error');
      return;
    }
    
    // التحقق من وقت الحصة
    if (!sessionData.is_current && !sessionData.can_take_attendance) {
      // التحقق من نوع الحالة
      if (sessionData.is_past) {
        showNotification('هذه الحصة قد انتهت بالفعل', 'warning');
      } else {
        showNotification('لم يحن وقت هذه الحصة بعد', 'warning');
      }
      return;
    }
    
    currentClass = sessionData;
    
    // التحقق من وجود تحضير مرسل سابقاً
    try {
      const submittedResult = await apiService.getSubmittedAttendance(sessionId);
      
      if (submittedResult.success && submittedResult.submitted) {
        // تم إرسال التحضير سابقاً - عرض في وضع القراءة فقط
        showPreviouslySubmittedAttendance(submittedResult);
        return;
      }
    } catch (error) {
      console.log('لم يتم العثور على تحضير سابق - متابعة بشكل طبيعي');
    }
    
    // لم يتم إرسال تحضير سابقاً - السماح بالتحضير
    showPage('attendancePage');
    
  } catch (error) {
    console.error('خطأ في بدء التحضير:', error);
    showNotification('فشل في بدء التحضير: ' + error.message, 'error');
  }
}

// عرض التحضير المرسل سابقاً (وضع القراءة فقط)
function showPreviouslySubmittedAttendance(submittedData) {
  const { attendance_data, submitted_date, approval_status } = submittedData;
  
  // تحديد حالة الموافقة
  let approvalBadge = '';
  let approvalMessage = '';
  
  if (approval_status === 1) {
    approvalBadge = '<span class="badge bg-success">تم الاعتماد</span>';
    approvalMessage = 'تم اعتماد التحضير من قبل الإدارة';
  } else if (approval_status === 0) {
    approvalBadge = '<span class="badge bg-danger">مرفوض</span>';
    approvalMessage = 'تم رفض التحضير من قبل الإدارة';
  } else {
    approvalBadge = '<span class="badge bg-warning">في الانتظار</span>';
    approvalMessage = 'التحضير في انتظار اعتماد الإدارة';
  }
  
  const content = `
    <div class="container-fluid py-4">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header bg-info text-white">
              <h5 class="mb-0">
                <i class="bi bi-eye me-2"></i>
                تحضير ${currentClass.subject?.name || 'غير محدد'} - ${currentClass.grade} ${currentClass.class_name}
              </h5>
            </div>
            <div class="card-body">
              <div class="alert alert-info">
                <h6><i class="bi bi-info-circle me-2"></i>تم إرسال التحضير سابقاً</h6>
                <p class="mb-2">تم إرسال تحضير هذه الحصة بتاريخ: <strong>${formatDate(submitted_date)}</strong></p>
                <p class="mb-0">حالة الاعتماد: ${approvalBadge} - ${approvalMessage}</p>
              </div>
              
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>اسم الطالب</th>
                      <th>الحالة</th>
                      <th>وقت الإرسال</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.entries(attendance_data).map(([studentId, data]) => `
                      <tr>
                        <td>${data.student_name}</td>
                        <td>
                          ${data.status === 'present' 
                            ? '<span class="badge bg-success">حاضر</span>' 
                            : '<span class="badge bg-danger">غائب</span>'
                          }
                        </td>
                        <td>${formatTime(data.submitted_at)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              <div class="mt-3">
                <button class="btn btn-secondary" onclick="showPage('teacherDashboard')">
                  <i class="bi bi-arrow-left me-2"></i>العودة للوحة التحكم
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('mainContent').innerHTML = content;
}

// تحميل صفحة التحضير
async function loadAttendancePage() {
  if (!currentClass) return;
  
  console.log('تحميل صفحة التحضير');
  
  // عرض معلومات الحصة
  const subjectEl = document.getElementById('currentSubject');
  const classEl = document.getElementById('currentClass');
  const timeEl = document.getElementById('classTime');
  
  if (subjectEl) subjectEl.textContent = currentClass.subject?.name || 'غير محدد';
  if (classEl) classEl.textContent = `${currentClass.grade} - ${currentClass.class_name}`;
  if (timeEl) {
    const startTime = currentClass.formatted_start_time || formatTo12Hour(currentClass.start_time);
    const endTime = currentClass.formatted_end_time || formatTo12Hour(currentClass.end_time);
    timeEl.textContent = `${startTime} - ${endTime}`;
  }
  
  // عرض قائمة الطلاب
  const studentsList = document.getElementById('studentsList');
  if (!studentsList) return;
  
  try {
    // إظهار حالة التحميل
    studentsList.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">جاري التحميل...</span>
        </div>
        <p class="mt-3 text-muted">جاري تحميل قائمة الطلاب...</p>
      </div>
    `;

    // تحميل طلاب الفصل
    const studentsResult = await apiService.getClassStudents(currentClass.id);
    const students = studentsResult.data || [];
    
    // تحميل قائمة الطلاب المتأخرين لليوم
    const lateStudentsResult = await checkLateStudentsForToday(students.map(s => s.id));
    const lateStudents = new Set(lateStudentsResult);
    
    studentsList.innerHTML = '';
    
    if (students.length === 0) {
      studentsList.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-people-fill display-4 text-muted"></i>
          <p class="mt-3 text-muted">لا توجد طلاب مسجلين في هذا الفصل</p>
        </div>
      `;
      return;
    }
    
    // إعداد بيانات الحضور الافتراضية
    attendanceData = {};
    
    students.forEach(student => {
      // التحقق من حالة التأخير
      const isLate = lateStudents.has(student.id);
      
      // افتراض أن جميع الطلاب حاضرين بشكل افتراضي (حتى المتأخرين)
      attendanceData[student.id] = 'present';
      
      const studentItem = document.createElement('div');
      studentItem.className = `student-item present ${isLate ? 'late-arrival' : ''}`;
      studentItem.setAttribute('data-student-id', student.id);
      
      // إضافة علامة التأخير إذا كان الطالب متأخر
      const lateIndicator = isLate ? `
        <div class="late-indicator" title="طالب متأخر - لا يمكن تغيير حالته">
          <i class="bi bi-clock-history text-warning"></i>
          <span class="late-text">متأخر</span>
        </div>
      ` : '';
      
      studentItem.innerHTML = `
        ${isLate ? '' : '<div class="absence-toggle" data-student-id="' + student.id + '"></div>'}
        <div class="student-info">
          <div class="student-name">${student.name}</div>
          <div class="student-roll">رقم الطالب: ${student.student_number}</div>
        </div>
        ${lateIndicator}
        <div class="attendance-status">
          <span class="status-text">${isLate ? 'حاضر (متأخر)' : 'حاضر'}</span>
          <i class="bi bi-check-circle status-icon"></i>
        </div>
      `;
      
      // إضافة مستمع الأحداث لزر التغييب فقط للطلاب غير المتأخرين
      if (!isLate) {
        const absenceToggle = studentItem.querySelector('.absence-toggle');
        absenceToggle.addEventListener('click', function(e) {
          e.stopPropagation(); // منع انتشار الحدث
          toggleStudentAttendance(student.id, studentItem);
        });
        
        // إضافة دعم اللمس لزر التغييب
        absenceToggle.addEventListener('touchend', function(e) {
          e.preventDefault();
          e.stopPropagation();
          toggleStudentAttendance(student.id, studentItem);
        });
      } else {
        // إضافة مستمع لإظهار رسالة للطلاب المتأخرين
        studentItem.addEventListener('click', function(e) {
          e.preventDefault();
          showToast('لا يمكن تغيير حالة الطالب المتأخر', 'warning');
        });
      }
      
      studentsList.appendChild(studentItem);
    });
    
    // تحديث العدادات
    updateAttendanceCounters();
    
  } catch (error) {
    console.error('خطأ في تحميل الطلاب:', error);
    studentsList.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-exclamation-triangle display-4 text-danger"></i>
        <p class="mt-3 text-danger">فشل في تحميل قائمة الطلاب</p>
        <button class="btn btn-outline-primary" onclick="loadAttendancePage()">إعادة المحاولة</button>
      </div>
    `;
    showNotification('فشل في تحميل قائمة الطلاب: ' + error.message, 'error');
  }
}

// فحص الطلاب المتأخرين لليوم الحالي
async function checkLateStudentsForToday(studentIds) {
  if (!studentIds || studentIds.length === 0) return [];
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await apiService.request('GET', `/admin/late-arrivals?date=${today}`);
    
    if (result.success && result.data) {
      // إرجاع قائمة IDs للطلاب المتأخرين
      return result.data.map(late => late.student_id);
    }
    
    return [];
  } catch (error) {
    console.error('خطأ في فحص الطلاب المتأخرين:', error);
    return [];
  }
}

// تبديل حضور الطالب
function toggleStudentAttendance(studentId, element) {
  console.log('تبديل حضور الطالب:', studentId);
  
  const currentStatus = attendanceData[studentId];
  const newStatus = currentStatus === 'present' ? 'absent' : 'present';
  
  attendanceData[studentId] = newStatus;
  
  // تحديث العنصر
  element.classList.remove('present', 'absent');
  element.classList.add(newStatus);
  
  const statusText = element.querySelector('.status-text');
  const statusIcon = element.querySelector('.status-icon');
  
  if (newStatus === 'present') {
    statusText.textContent = 'حاضر';
    statusIcon.className = 'bi bi-check-circle status-icon';
  } else {
    statusText.textContent = 'غائب';
    statusIcon.className = 'bi bi-x-circle status-icon';
  }
  
  // تحديث العدادات
  updateAttendanceCounters();
  
  // تأثير بصري
  element.style.transform = 'scale(0.95)';
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 150);
}

// تحديث عدادات الحضور
function updateAttendanceCounters() {
  const classStudents = appData.students.filter(s => s.class === currentClass.className);
  let presentCount = 0;
  let absentCount = 0;
  
  classStudents.forEach(student => {
    if (attendanceData[student.id] === 'present') {
      presentCount++;
    } else {
      absentCount++;
    }
  });
  
  const presentEl = document.getElementById('presentCount');
  const absentEl = document.getElementById('absentCount');
  
  if (presentEl) presentEl.textContent = presentCount;
  if (absentEl) absentEl.textContent = absentCount;
}

// حفظ الحضور
async function saveAttendance() {
  if (!currentClass) return;
  
  console.log('حفظ الحضور');
  
  const saveBtn = document.getElementById('saveAttendanceBtn');
  if (saveBtn) {
    saveBtn.classList.add('loading');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>جاري الحفظ...';
  }
  
  try {
    // تحضير بيانات الحضور للإرسال - تنسيق مطابق للباك إند
    const attendanceObject = {};
    
    for (const studentId in attendanceData) {
      attendanceObject[studentId] = attendanceData[studentId];
    }
    
    if (Object.keys(attendanceObject).length === 0) {
      throw new Error('لا توجد بيانات حضور للحفظ');
    }
    
    const requestData = {
      attendance: attendanceObject,
      date: new Date().toISOString().split('T')[0]
    };
    
    console.log('بيانات الحضور المرسلة:', requestData);
    
    const result = await apiService.submitAttendance(currentClass.id, requestData);
    
    if (result.success) {
      showNotification('تم حفظ التحضير وإرساله للإدارة بنجاح', 'success');
      
      // إحصائيات سريعة
      const statusValues = Object.values(attendanceObject);
      const presentCount = statusValues.filter(status => status === 'present').length;
      const absentCount = statusValues.filter(status => status === 'absent').length;
      
      console.log(`الحضور: ${presentCount}, الغياب: ${absentCount}`);
      
      // العودة للوحة التحكم
      setTimeout(() => {
        showPage('teacherDashboard');
      }, 1500);
    } else {
      throw new Error(result.message || 'فشل في حفظ التحضير');
    }
  } catch (error) {
    console.error('خطأ في حفظ الحضور:', error);
    
    // التحقق إذا كان الخطأ بسبب إرسال التحضير سابقاً
    if (error.message && error.message.includes('تم إرسال التحضير لهذه الحصة مسبقاً')) {
      showNotification('تم إرسال التحضير لهذه الحصة مسبقاً. لا يمكن إرسال التحضير أكثر من مرة.', 'warning');
      
      // العودة للوحة التحكم بعد 2 ثانية
      setTimeout(() => {
        showPage('teacherDashboard');
      }, 2000);
    } else {
      showNotification(error.message || 'حدث خطأ أثناء حفظ التحضير', 'error');
    }
  } finally {
    // إعادة تعيين الزر
    if (saveBtn) {
      saveBtn.classList.remove('loading');
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>حفظ وإرسال للإدارة';
    }
  }
}

// تحميل لوحة تحكم الإدارة
async function loadAdminDashboard() {
  console.log('تحميل لوحة تحكم الإدارة');
  
  // تأكد من وجود التوكن
  if (!apiService.token) {
    console.log('لا يوجد توكن، محاولة إعادة تحميل...');
    apiService.loadToken();
  }
  
  // انتظار قصير للتأكد من اكتمال تعيين التوكن
  setTimeout(() => {
    showAdminSection('overview');
  }, 100);
}

// عرض قسم إداري محدد
async function showAdminSection(sectionName) {
  console.log('عرض القسم الإداري:', sectionName);
  
  // تحديث حالة القائمة الجانبية
  const listItems = document.querySelectorAll('[data-section]');
  listItems.forEach(item => item.classList.remove('active'));
  
  const activeItem = document.querySelector(`[data-section="${sectionName}"]`);
  if (activeItem) activeItem.classList.add('active');
  
  const adminContent = document.getElementById('adminContent');
  if (!adminContent) return;
  
  // عرض مؤشر التحميل
  adminContent.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <div class="mt-2">جاري التحميل...</div>
    </div>
  `;
  
  let content = '';
  
  try {
    switch(sectionName) {
      case 'overview':
        content = await getOverviewContent();
        break;
      case 'teachers':
        content = await getTeachersContent();
        break;
      case 'students':
        content = await getStudentsContent();
        break;
      case 'subjects':
        content = await getSubjectsContent();
        break;
      case 'schedules':
        content = await getSchedulesContent();
        break;
      case 'class-schedules':
        content = await getClassSchedulesContent();
        break;
      case 'attendance':
        content = getAttendanceReportsContent();
        break;
      case 'approval':
        content = getApprovalContent();
        break;
      case 'late-arrivals':
        content = await getLateArrivalsContent();
        break;
      case 'import':
        showImportSection();
        return; // لأن showImportSection تعمل مباشرة على المحتوى
      case 'settings':
        await showSettingsSection();
        return; // لأن showSettingsSection تعمل مباشرة على المحتوى
      default:
        content = '<div class="alert alert-warning">القسم غير موجود</div>';
    }
    
    adminContent.innerHTML = content;
    
    // إضافة مستمعي الأحداث للأزرار الجديدة
    if (sectionName === 'approval') {
      setupApprovalButtons();
    } else if (sectionName === 'late-arrivals') {
      setupLateArrivalsButtons();
    }
  } catch (error) {
    adminContent.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        حدث خطأ أثناء تحميل المحتوى: ${error.message}
      </div>
    `;
  }
}

// إعداد أزرار الاعتماد
function setupApprovalButtons() {
  const approvalButtons = document.querySelectorAll('[data-approval-id]');
  approvalButtons.forEach(button => {
    button.addEventListener('click', function() {
      const approvalId = this.getAttribute('data-approval-id');
      approveAttendance(approvalId);
    });
  });
}

// محتوى النظرة العامة
async function getOverviewContent() {
  try {
    const result = await apiService.getDashboardStats();
    const stats = result.success ? result.data : {
      total_students: 0,
      present_today: 0,
      absent_today: 0,
      total_teachers: 0,
      pending_approvals: 0
    };
    
    return `
      <div class="row mb-4">
        <div class="col-md-6 col-lg-3 mb-3">
          <div class="card stats-card bg-primary text-white">
            <div class="card-body text-center">
              <i class="bi bi-people display-4 mb-2"></i>
              <h2>${stats.total_students}</h2>
              <small>إجمالي الطلاب</small>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-3 mb-3">
          <div class="card stats-card bg-success text-white">
            <div class="card-body text-center">
              <i class="bi bi-check-circle display-4 mb-2"></i>
              <h2>${stats.present_today}</h2>
              <small>حضور اليوم</small>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-3 mb-3">
          <div class="card stats-card bg-danger text-white">
            <div class="card-body text-center">
              <i class="bi bi-x-circle display-4 mb-2"></i>
              <h2>${stats.absent_today}</h2>
              <small>غياب اليوم</small>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-3 mb-3">
          <div class="card stats-card bg-info text-white">
            <div class="card-body text-center">
              <i class="bi bi-person-workspace display-4 mb-2"></i>
              <h2>${stats.total_teachers}</h2>
              <small>المعلمين</small>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-8 mb-4">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0"><i class="bi bi-graph-up me-2"></i>إحصائيات الحضور الأسبوعية</h5>
            </div>
            <div class="card-body">
              <canvas id="attendanceChart" width="400" height="200"></canvas>
            </div>
          </div>
        </div>
        <div class="col-md-4 mb-4">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0"><i class="bi bi-clock-history me-2"></i>أحدث الأنشطة</h5>
            </div>
            <div class="card-body">
              <div class="list-group list-group-flush">
                <div class="list-group-item d-flex justify-content-between align-items-start">
                  <div class="ms-2 me-auto">
                    <div class="fw-bold">تحضير مرسل</div>
                    <small class="text-muted">حصة الرياضيات - الصف الأول أ</small>
                  </div>
                  <small class="text-muted">10:30</small>
                </div>
                <div class="list-group-item d-flex justify-content-between align-items-start">
                  <div class="ms-2 me-auto">
                    <div class="fw-bold">معلم جديد</div>
                    <small class="text-muted">تم إضافة معلم العلوم</small>
                  </div>
                  <small class="text-muted">09:15</small>
                </div>
                <div class="list-group-item d-flex justify-content-between align-items-start">
                  <div class="ms-2 me-auto">
                    <div class="fw-bold">تحضير معتمد</div>
                    <small class="text-muted">تم إرسال رسائل الواتساب</small>
                  </div>
                  <small class="text-muted">08:45</small>
                </div>
              </div>
            </div>
          </div>
          
          ${stats.pending_approvals > 0 ? `
          <div class="card mt-3">
            <div class="card-body text-center">
              <i class="bi bi-exclamation-triangle text-warning display-4"></i>
              <h3 class="mt-2 text-warning">${stats.pending_approvals}</h3>
              <p class="text-muted mb-0">في انتظار الاعتماد</p>
              <button class="btn btn-warning btn-sm mt-2" onclick="showAdminSection('approval')">
                عرض التفاصيل
              </button>
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  } catch (error) {
    return `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        حدث خطأ أثناء تحميل الإحصائيات: ${error.message}
      </div>
    `;
  }
}

// محتوى إدارة المعلمين
async function getTeachersContent() {
  try {
    const result = await apiService.getTeachers();
    let teachersHtml = '';
    
    if (result.success && result.data.length > 0) {
      result.data.forEach(teacher => {
        teachersHtml += `
          <tr>
            <td>${teacher.name}</td>
            <td>${teacher.national_id}</td>
            <td>${teacher.phone || 'غير محدد'}</td>
            <td>
              ${teacher.generated_password ? 
                `<div class="d-flex align-items-center">
                  <input type="password" class="form-control form-control-sm me-1" value="${teacher.generated_password}" id="pass-${teacher.id}" readonly style="max-width: 100px;">
                  <button class="btn btn-sm btn-outline-secondary" onclick="togglePassword('pass-${teacher.id}')" title="إظهار/إخفاء كلمة المرور">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-primary ms-1" onclick="copyToClipboard('pass-${teacher.id}')" title="نسخ كلمة المرور">
                    <i class="bi bi-clipboard"></i>
                  </button>
                </div>` 
                : 
                `<span class="text-muted">تم تغييرها</span>`
              }
            </td>
            <td>
              <span class="badge ${teacher.status === 'active' ? 'bg-success' : 'bg-secondary'}">
                ${teacher.status === 'active' ? 'نشط' : 'غير نشط'}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-outline-primary me-1" onclick="editTeacher(${teacher.id})" title="تعديل">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-warning me-1" onclick="resetTeacherPassword(${teacher.id})" title="إعادة تعيين كلمة المرور">
                <i class="bi bi-key"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteTeacher(${teacher.id})" title="حذف">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        `;
      });
    } else {
      teachersHtml = `
        <tr>
          <td colspan="6" class="text-center text-muted py-4">
            <i class="bi bi-person-x display-4 d-block mb-2"></i>
            لا يوجد معلمين مسجلين
          </td>
        </tr>
      `;
    }
    
    return `
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0"><i class="bi bi-person-workspace me-2"></i>إدارة المعلمين</h5>
          <button class="btn btn-primary btn-sm" onclick="showAddTeacherModal()">
            <i class="bi bi-plus"></i> إضافة معلم
          </button>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>رقم الهوية</th>
                  <th>الهاتف</th>
                  <th>كلمة المرور</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                ${teachersHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    return `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        حدث خطأ أثناء تحميل المعلمين: ${error.message}
      </div>
    `;
  }
}

// عرض مودال إضافة معلم
function showAddTeacherModal() {
  const modal = new bootstrap.Modal(document.getElementById('addTeacherModal'));
  modal.show();
}

// إضافة معلم جديد
async function addTeacher(event) {
  event.preventDefault();
  
  const name = document.getElementById('addTeacherName').value;
  const nationalId = document.getElementById('teacherNationalIdAdd').value;
  const phone = document.getElementById('teacherPhone').value;
  
  // تشخيص البيانات
  console.log('Teacher data:', { name, nationalId, phone });
  console.log('National ID length:', nationalId.length);
  
  if (!name || name.trim() === '') {
    showNotification('اسم المعلم مطلوب', 'error');
    return;
  }
  
  if (!nationalId || nationalId.length !== 10) {
    showNotification('رقم الهوية يجب أن يكون 10 أرقام', 'error');
    return;
  }
  
  // التحقق من أن رقم الهوية يحتوي على أرقام فقط
  if (!/^\d{10}$/.test(nationalId)) {
    showNotification('رقم الهوية يجب أن يحتوي على أرقام فقط', 'error');
    return;
  }
  
  const teacherData = {
    name: name.trim(),
    national_id: nationalId.trim(),
    phone: phone ? phone.trim() : null
  };
  
  console.log('Sending teacher data:', teacherData);
  
  try {
    const result = await apiService.createTeacher(teacherData);
    
    console.log('API response:', result);
    
    if (result.success) {
      // إغلاق مودال الإضافة
      const addModal = bootstrap.Modal.getInstance(document.getElementById('addTeacherModal'));
      addModal.hide();
      document.getElementById('addTeacherForm').reset();
      
      // عرض بيانات المعلم الجديد
      document.getElementById('generatedNationalId').value = result.data.login_credentials.national_id;
      document.getElementById('generatedPassword').value = result.data.login_credentials.password;
      
      // عرض مودال كلمة المرور
      const passwordModal = new bootstrap.Modal(document.getElementById('teacherPasswordModal'));
      passwordModal.show();
      
      // تحديث محتوى إدارة المعلمين بعد إغلاق المودال
      document.getElementById('teacherPasswordModal').addEventListener('hidden.bs.modal', function() {
        showAdminSection('teachers');
      }, { once: true });
    }
  } catch (error) {
    console.error('Error creating teacher:', error);
    showNotification(error.message || 'حدث خطأ أثناء إضافة المعلم', 'error');
  }
}

// إعادة تعيين كلمة مرور المعلم
async function resetTeacherPassword(teacherId) {
  if (!confirm('هل أنت متأكد من إعادة تعيين كلمة مرور هذا المعلم؟')) {
    return;
  }
  
  try {
    const result = await apiService.resetTeacherPassword(teacherId);
    
    if (result.success) {
      showNotification(`تم إعادة تعيين كلمة المرور. الكلمة الجديدة: ${result.data.new_password}`, 'success');
    }
  } catch (error) {
    showNotification(error.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور', 'error');
  }
}

// ==================== الإعدادات ====================

// عرض قسم الإعدادات
async function showSettingsSection() {
  const content = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4><i class="bi bi-gear me-2"></i>الإعدادات</h4>
    </div>

    <div class="card">
      <div class="card-header">
        <h5 class="card-title mb-0">إعدادات النظام</h5>
      </div>
      <div class="card-body">
        <form id="settingsForm">
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">اسم المدرسة</label>
                <input type="text" class="form-control" id="schoolName" required>
              </div>
              <div class="mb-3">
                <label class="form-label">رقم هاتف المدرسة</label>
                <input type="tel" class="form-control" id="schoolPhone" required>
              </div>
              <div class="mb-3">
                <label class="form-label">رابط ويب هوك الواتساب</label>
                <input type="url" class="form-control" id="webhookUrl" placeholder="https://api.yourservice.com/webhook">
                <div class="form-text">رابط API الخاص بخدمة إرسال رسائل الواتساب</div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">خيارات الإشعارات</label>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="attendanceNotification" checked>
                  <label class="form-check-label" for="attendanceNotification">
                    إرسال إشعارات الحضور والغياب
                  </label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="weeklyReport" checked>
                  <label class="form-check-label" for="weeklyReport">
                    إرسال التقرير الأسبوعي
                  </label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="autoApprove">
                  <label class="form-check-label" for="autoApprove">
                    الاعتماد التلقائي للحضور
                  </label>
                </div>
              </div>
              <div class="mb-3">
                <button type="button" class="btn btn-outline-primary" onclick="testWebhook()">
                  <i class="bi bi-send me-2"></i>اختبار الويب هوك
                </button>
              </div>
            </div>
          </div>
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary">
              <i class="bi bi-check2 me-2"></i>حفظ الإعدادات
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('adminContent').innerHTML = content;
  await loadSettings();
  
  // إضافة مستمع الأحداث
  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveSettings();
  });
}

// تحميل الإعدادات
async function loadSettings() {
  try {
    const result = await apiService.getSettings();
    
    if (result.success) {
      const settings = result.data;
      document.getElementById('schoolName').value = settings.school_name || '';
      document.getElementById('schoolPhone').value = settings.school_phone || '';
      document.getElementById('webhookUrl').value = settings.whatsapp_webhook_url || '';
      document.getElementById('attendanceNotification').checked = settings.attendance_notification !== false;
      document.getElementById('weeklyReport').checked = settings.weekly_report !== false;
      document.getElementById('autoApprove').checked = settings.auto_approve_attendance === true;
    }
  } catch (error) {
    showNotification('خطأ في تحميل الإعدادات', 'error');
  }
}

// حفظ الإعدادات
async function saveSettings() {
  const formData = {
    school_name: document.getElementById('schoolName').value,
    school_phone: document.getElementById('schoolPhone').value,
    whatsapp_webhook_url: document.getElementById('webhookUrl').value,
    attendance_notification: document.getElementById('attendanceNotification').checked,
    weekly_report: document.getElementById('weeklyReport').checked,
    auto_approve_attendance: document.getElementById('autoApprove').checked
  };

  try {
    const result = await apiService.updateSettings(formData);
    
    if (result.success) {
      showNotification('تم حفظ الإعدادات بنجاح', 'success');
    }
  } catch (error) {
    showNotification(error.message || 'حدث خطأ أثناء حفظ الإعدادات', 'error');
  }
}

// اختبار الويب هوك
async function testWebhook() {
  try {
    const result = await apiService.testWebhook();
    
    if (result.success) {
      showNotification('تم إرسال رسالة اختبار بنجاح', 'success');
    }
  } catch (error) {
    showNotification(error.message || 'فشل في اختبار الويب هوك', 'error');
  }
}

// ==================== الاستيراد ====================

// عرض قسم الاستيراد
function showImportSection() {
  const content = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4><i class="bi bi-file-earmark-excel me-2"></i>استيراد الملفات</h4>
    </div>

    <div class="row">
      <!-- استيراد الطلاب -->
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5 class="card-title mb-0">
              <i class="bi bi-people me-2"></i>استيراد الطلاب
            </h5>
          </div>
          <div class="card-body">
            <p class="card-text">استيراد قائمة الطلاب من ملف Excel</p>
            <div class="mb-3">
              <label class="form-label">ترتيب الأعمدة المطلوب:</label>
              <ul class="list-group list-group-flush">
                <li class="list-group-item">العمود 1: الاسم</li>
                <li class="list-group-item">العمود 2: رقم الهوية</li>
                <li class="list-group-item">العمود 3: الصف</li>
                <li class="list-group-item">العمود 4: الفصل</li>
                <li class="list-group-item">العمود 5: رقم جوال ولي الأمر</li>
              </ul>
            </div>
            <div class="mb-3">
              <input type="file" class="form-control" id="studentsFile" accept=".xlsx,.xls,.csv">
            </div>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-success" onclick="importStudents()">
                <i class="bi bi-upload me-2"></i>استيراد الطلاب
              </button>
              <button type="button" class="btn btn-outline-primary" onclick="downloadStudentsTemplate()">
                <i class="bi bi-download me-2"></i>تحميل القالب
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- استيراد المعلمين -->
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header bg-success text-white">
            <h5 class="card-title mb-0">
              <i class="bi bi-person-workspace me-2"></i>استيراد المعلمين
            </h5>
          </div>
          <div class="card-body">
            <p class="card-text">استيراد قائمة المعلمين من ملف Excel</p>
            <div class="mb-3">
              <label class="form-label">ترتيب الأعمدة المطلوب:</label>
              <ul class="list-group list-group-flush">
                <li class="list-group-item">العمود 1: رقم الهوية</li>
                <li class="list-group-item">العمود 2: الاسم</li>
                <li class="list-group-item">العمود 3: رقم الجوال</li>
              </ul>
            </div>
            <div class="mb-3">
              <input type="file" class="form-control" id="teachersFile" accept=".xlsx,.xls,.csv">
            </div>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-success" onclick="importTeachers()">
                <i class="bi bi-upload me-2"></i>استيراد المعلمين
              </button>
              <button type="button" class="btn btn-outline-primary" onclick="downloadTeachersTemplate()">
                <i class="bi bi-download me-2"></i>تحميل القالب
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- نتائج الاستيراد -->
    <div id="importResults" class="mt-4" style="display: none;">
      <div class="card">
        <div class="card-header">
          <h5 class="card-title mb-0">نتائج الاستيراد</h5>
        </div>
        <div class="card-body" id="importResultsContent">
          <!-- سيتم ملؤها بـ JavaScript -->
        </div>
      </div>
    </div>
  `;

  document.getElementById('adminContent').innerHTML = content;
}

// استيراد الطلاب
async function importStudents() {
  const fileInput = document.getElementById('studentsFile');
  const file = fileInput.files[0];
  
  if (!file) {
    showNotification('يرجى اختيار ملف للاستيراد', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    showNotification('جاري استيراد الطلاب...', 'info');
    const result = await apiService.importStudents(formData);
    
    if (result.success) {
      showImportResults(result.data, 'الطلاب');
      showNotification(result.message, 'success');
      fileInput.value = ''; // مسح الملف
    }
  } catch (error) {
    showNotification(error.message || 'حدث خطأ أثناء استيراد الطلاب', 'error');
  }
}

// استيراد المعلمين
async function importTeachers() {
  const fileInput = document.getElementById('teachersFile');
  const file = fileInput.files[0];
  
  if (!file) {
    showNotification('يرجى اختيار ملف للاستيراد', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    showNotification('جاري استيراد المعلمين...', 'info');
    const result = await apiService.importTeachers(formData);
    
    if (result.success) {
      showImportResults(result.data, 'المعلمين', result.data.credentials);
      showNotification(result.message, 'success');
      fileInput.value = ''; // مسح الملف
    }
  } catch (error) {
    showNotification(error.message || 'حدث خطأ أثناء استيراد المعلمين', 'error');
  }
}

// عرض نتائج الاستيراد
function showImportResults(data, type, credentials = null) {
  const resultsDiv = document.getElementById('importResults');
  const contentDiv = document.getElementById('importResultsContent');
  
  let content = `
    <div class="row mb-3">
      <div class="col-md-4">
        <div class="text-center">
          <h5 class="text-success">${data.imported_count}</h5>
          <small class="text-muted">تم استيراد ${type}</small>
        </div>
      </div>
      <div class="col-md-4">
        <div class="text-center">
          <h5 class="text-danger">${data.errors_count}</h5>
          <small class="text-muted">أخطاء</small>
        </div>
      </div>
      <div class="col-md-4">
        <div class="text-center">
          <h5 class="text-info">${data.imported_count + data.errors_count}</h5>
          <small class="text-muted">إجمالي الصفوف</small>
        </div>
      </div>
    </div>
  `;

  // عرض كلمات المرور للمعلمين
  if (credentials && credentials.length > 0) {
    content += `
      <div class="alert alert-info">
        <h6><i class="bi bi-key me-2"></i>كلمات مرور المعلمين الجدد:</h6>
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>رقم الهوية</th>
                <th>كلمة المرور</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    credentials.forEach(teacher => {
      content += `
        <tr>
          <td>${teacher.name}</td>
          <td>${teacher.national_id}</td>
          <td><code>${teacher.password}</code></td>
        </tr>
      `;
    });
    
    content += `
            </tbody>
          </table>
        </div>
        <small class="text-muted">يُرجى تسليم هذه البيانات للمعلمين الجدد</small>
      </div>
    `;
  }

  // عرض الأخطاء إن وجدت
  if (data.errors && data.errors.length > 0) {
    content += `
      <div class="alert alert-warning">
        <h6><i class="bi bi-exclamation-triangle me-2"></i>الأخطاء التي حدثت:</h6>
        <ul class="mb-0">
    `;
    
    data.errors.forEach(error => {
      content += `<li>${error}</li>`;
    });
    
    content += `
        </ul>
      </div>
    `;
  }

  contentDiv.innerHTML = content;
  resultsDiv.style.display = 'block';
}

// تحميل قالب الطلاب
async function downloadStudentsTemplate() {
  try {
    const response = await fetch(apiService.baseURL + '/admin/import/students/template', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiService.token}`,
        'Accept': 'text/csv',
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'قالب_استيراد_الطلاب.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showNotification('تم تحميل القالب بنجاح', 'success');
    } else {
      throw new Error('فشل في تحميل القالب');
    }
  } catch (error) {
    console.error('خطأ في تحميل القالب:', error);
    showNotification('حدث خطأ أثناء تحميل القالب', 'error');
  }
}

// تحميل قالب المعلمين
async function downloadTeachersTemplate() {
  try {
    const response = await fetch(apiService.baseURL + '/admin/import/teachers/template', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiService.token}`,
        'Accept': 'text/csv',
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'قالب_استيراد_المعلمين.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showNotification('تم تحميل القالب بنجاح', 'success');
    } else {
      throw new Error('فشل في تحميل القالب');
    }
  } catch (error) {
    showNotification('حدث خطأ أثناء تحميل القالب', 'error');
  }
}

// حذف معلم
async function deleteTeacher(teacherId) {
  if (!confirm('هل أنت متأكد من حذف هذا المعلم؟ سيتم تعطيل حسابه فقط.')) {
    return;
  }
  
  try {
    const result = await apiService.deleteTeacher(teacherId);
    
    if (result.success) {
      showNotification('تم تعطيل المعلم بنجاح', 'success');
      // تحديث القائمة
      showAdminSection('teachers');
    }
  } catch (error) {
    showNotification(error.message || 'حدث خطأ أثناء حذف المعلم', 'error');
  }
}

// تغيير كلمة المرور
async function changePassword(event) {
  event.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (newPassword !== confirmPassword) {
    showNotification('كلمة المرور الجديدة وتأكيدها غير متطابقين', 'error');
    return;
  }
  
  try {
    const result = await apiService.changePassword({
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: confirmPassword
    });
    
    if (result.success) {
      showNotification('تم تغيير كلمة المرور بنجاح', 'success');
      
      // إغلاق المودال
      const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
      modal.hide();
      document.getElementById('changePasswordForm').reset();
      
      // تحديث حالة المستخدم
      currentUser.needs_password_change = false;
    }
  } catch (error) {
    showNotification(error.message || 'حدث خطأ أثناء تغيير كلمة المرور', 'error');
  }
}

// محتوى إدارة الطلاب
async function getStudentsContent() {
  try {
    const result = await apiService.getStudents();
    let studentsHtml = '';
    
    if (result.success && result.data.length > 0) {
      result.data.forEach(student => {
        studentsHtml += `
          <tr>
            <td>${student.national_id}</td>
            <td>${student.name}</td>
            <td>${student.class_name}</td>
            <td>${student.parent_phone || 'غير محدد'}</td>
            <td>
              <button class="btn btn-sm btn-outline-primary me-1" onclick="editStudent(${student.id})" title="تعديل">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(${student.id})" title="حذف">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        `;
      });
    } else {
      studentsHtml = `
        <tr>
          <td colspan="5" class="text-center text-muted py-4">
            <i class="bi bi-person-x display-4 d-block mb-2"></i>
            لا يوجد طلاب مسجلين
          </td>
        </tr>
      `;
    }
    
    return `
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0"><i class="bi bi-people me-2"></i>إدارة الطلاب</h5>
          <button class="btn btn-primary btn-sm" onclick="showAddStudentModal()">
            <i class="bi bi-plus"></i> إضافة طالب
          </button>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>رقم الهوية</th>
                  <th>الاسم</th>
                  <th>الصف</th>
                  <th>هاتف ولي الأمر</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                ${studentsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    return `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        حدث خطأ أثناء تحميل الطلاب: ${error.message}
      </div>
    `;
  }
}

// محتوى إدارة الفصول
async function getGradesContent() {
  console.log('getGradesContent called');
  try {
    const result = await apiService.getClassSessions();
    let classSessionsHtml = '';
    
    if (result.success && result.data.length > 0) {
      // تجميع الحصص حسب الصف والشعبة
      const gradeMap = {};
      result.data.forEach(session => {
        const gradeKey = `${session.grade} - ${session.class_name}`;
        if (!gradeMap[gradeKey]) {
          gradeMap[gradeKey] = [];
        }
        gradeMap[gradeKey].push(session);
      });

      Object.keys(gradeMap).forEach(gradeKey => {
        const sessions = gradeMap[gradeKey];
        const sessionsHtml = sessions.map(session => `
          <div class="col-md-6 mb-2">
            <div class="card h-100">
              <div class="card-body p-3">
                <h6 class="card-title mb-2">${session.subject.name}</h6>
                <p class="card-text small mb-1">
                  <i class="bi bi-person me-1"></i>${session.teacher.name}
                </p>
                <p class="card-text small mb-1">
                  <i class="bi bi-calendar me-1"></i>${session.day}
                </p>
                <p class="card-text small mb-2">
                  <i class="bi bi-clock me-1"></i>${session.start_time} - ${session.end_time}
                </p>
                <div class="btn-group btn-group-sm w-100">
                  <button class="btn btn-outline-primary btn-sm" onclick="editClassSession(${session.id})" title="تعديل">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-outline-danger btn-sm" onclick="deleteClassSession(${session.id})" title="حذف">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `).join('');

        classSessionsHtml += `
          <div class="card mb-3">
            <div class="card-header bg-light">
              <h6 class="mb-0">${gradeKey}</h6>
            </div>
            <div class="card-body">
              <div class="row">
                ${sessionsHtml}
              </div>
            </div>
          </div>
        `;
      });
    } else {
      classSessionsHtml = `
        <div class="alert alert-info text-center">
          <i class="bi bi-calendar-x display-4 d-block mb-2"></i>
          <p class="mb-0">لا توجد حصص مسجلة حالياً</p>
          <p class="small text-muted">انقر على "إضافة صف" لبدء إضافة الحصص</p>
        </div>
      `;
    }
    
    return `
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0"><i class="bi bi-list-ol me-2"></i>إدارة الفصول</h5>
          <button class="btn btn-primary btn-sm" onclick="showAddGradeModal()">
            <i class="bi bi-plus"></i> إضافة صف
          </button>
        </div>
        <div class="card-body">
          ${classSessionsHtml}
        </div>
      </div>
    `;
  } catch (error) {
    return `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        حدث خطأ أثناء تحميل الفصول: ${error.message}
      </div>
    `;
  }
}

// محتوى إدارة الحصص
async function getClassesContent() {
  console.log('getClassesContent called');
  try {
    const result = await apiService.getClassSessions();
    let classSessionsHtml = '';
    
    if (result.success && result.data.length > 0) {
      // تجميع الحصص حسب اليوم
      const dayMap = {
        'الأحد': [],
        'الإثنين': [],
        'الثلاثاء': [],
        'الأربعاء': [],
        'الخميس': []
      };
      
      result.data.forEach(session => {
        if (dayMap[session.day]) {
          dayMap[session.day].push(session);
        }
      });

      Object.keys(dayMap).forEach(day => {
        const sessions = dayMap[day];
        if (sessions.length > 0) {
          // ترتيب الحصص حسب وقت البداية
          sessions.sort((a, b) => a.start_time.localeCompare(b.start_time));
          
          const sessionsHtml = sessions.map(session => `
            <tr>
              <td>${session.period_number}</td>
              <td>${session.start_time} - ${session.end_time}</td>
              <td>${session.subject.name}</td>
              <td>${session.teacher.name}</td>
              <td>${session.grade} - ${session.class_name}</td>
              <td>
                <span class="badge ${session.status === 'active' ? 'bg-success' : 'bg-secondary'}">
                  ${session.status === 'active' ? 'نشطة' : 'غير نشطة'}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editClassSession(${session.id})" title="تعديل">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteClassSession(${session.id})" title="حذف">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          `).join('');

          classSessionsHtml += `
            <div class="card mb-3">
              <div class="card-header bg-primary text-white">
                <h6 class="mb-0">
                  <i class="bi bi-calendar-day me-2"></i>${day}
                  <span class="badge bg-light text-dark ms-2">${sessions.length} حصة</span>
                </h6>
              </div>
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-hover mb-0">
                    <thead class="table-light">
                      <tr>
                        <th width="80">الحصة</th>
                        <th width="140">التوقيت</th>
                        <th>المادة</th>
                        <th>المعلم</th>
                        <th>الصف</th>
                        <th width="80">الحالة</th>
                        <th width="120">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${sessionsHtml}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          `;
        }
      });
    } else {
      classSessionsHtml = `
        <div class="alert alert-info text-center">
          <i class="bi bi-calendar-x display-4 d-block mb-2"></i>
          <p class="mb-0">لا توجد حصص مسجلة حالياً</p>
          <p class="small text-muted">يمكنك إضافة الحصص من قسم "إدارة الفصول"</p>
        </div>
      `;
    }
    
    return `
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0"><i class="bi bi-calendar-check me-2"></i>إدارة الحصص</h5>
          <div>
            <button class="btn btn-outline-primary btn-sm me-2" onclick="showClassScheduleView()">
              <i class="bi bi-table"></i> عرض الجدول
            </button>
            <button class="btn btn-primary btn-sm" onclick="showAddClassSessionDirectModal()">
              <i class="bi bi-plus"></i> إضافة حصة
            </button>
          </div>
        </div>
        <div class="card-body">
          ${classSessionsHtml}
        </div>
      </div>
    `;
  } catch (error) {
    return `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        حدث خطأ أثناء تحميل الحصص: ${error.message}
      </div>
    `;
  }
}

// محتوى إدارة المواد
async function getSubjectsContent() {
  try {
    const result = await apiService.getSubjects();
    let subjectsHtml = '';
    
    if (result.success && result.data.length > 0) {
      result.data.forEach(subject => {
        subjectsHtml += `
          <tr>
            <td>${subject.name}</td>
            <td>${subject.name_en || 'غير محدد'}</td>
            <td>${subject.description || 'غير محدد'}</td>
            <td>
              <span class="badge ${subject.status === 'active' ? 'bg-success' : 'bg-secondary'}">
                ${subject.status === 'active' ? 'نشطة' : 'غير نشطة'}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-outline-primary me-1" onclick="editSubject(${subject.id})" title="تعديل">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteSubject(${subject.id})" title="حذف">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        `;
      });
    } else {
      subjectsHtml = `
        <tr>
          <td colspan="5" class="text-center text-muted py-4">
            <i class="bi bi-book-x display-4 d-block mb-2"></i>
            لا توجد مواد مسجلة
          </td>
        </tr>
      `;
    }
    
    return `
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0"><i class="bi bi-book me-2"></i>إدارة المواد</h5>
          <button class="btn btn-primary btn-sm" onclick="showAddSubjectModal()">
            <i class="bi bi-plus"></i> إضافة مادة
          </button>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>اسم المادة</th>
                  <th>الاسم الإنجليزي</th>
                  <th>الوصف</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                ${subjectsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    return `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        حدث خطأ أثناء تحميل المواد: ${error.message}
      </div>
    `;
  }
}

// محتوى تقارير الحضور
function getAttendanceReportsContent() {
  // تحميل البيانات الحقيقية عند عرض المحتوى
  setTimeout(() => {
    loadAttendanceReports();
  }, 100);

  return `
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0"><i class="bi bi-journal-check me-2"></i>تقارير الحضور</h5>
      </div>
      <div class="card-body">
        <div class="row mb-4">
          <div class="col-md-2 mb-2">
            <label class="form-label">الصف</label>
            <select class="form-control" id="reportGradeFilter">
              <option value="">جميع الصفوف</option>
            </select>
          </div>
          <div class="col-md-2 mb-2">
            <label class="form-label">من تاريخ</label>
            <input type="date" class="form-control" id="reportDateFrom" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="col-md-2 mb-2">
            <label class="form-label">إلى تاريخ</label>
            <input type="date" class="form-control" id="reportDateTo" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="col-md-2 mb-2">
            <label class="form-label">الحالة</label>
            <select class="form-control" id="reportStatusFilter">
              <option value="">جميع الحالات</option>
              <option value="present">حاضر</option>
              <option value="absent">غائب</option>
              <option value="late">متأخر</option>
              <option value="excused">معذور</option>
            </select>
          </div>
          <div class="col-md-2 mb-2">
            <label class="form-label">&nbsp;</label>
            <button class="btn btn-primary d-block" onclick="filterAttendanceReports()">
              <i class="bi bi-search me-1"></i>بحث
            </button>
          </div>
          <div class="col-md-2 mb-2">
            <label class="form-label">&nbsp;</label>
            <div class="dropdown d-block">
              <button class="btn btn-success dropdown-toggle" type="button" data-bs-toggle="dropdown">
                <i class="bi bi-download me-1"></i>تصدير
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#" onclick="exportAttendanceReport('excel')">
                  <i class="bi bi-file-earmark-excel me-2"></i>Excel
                </a></li>
                <li><a class="dropdown-item" href="#" onclick="exportAttendanceReport('pdf')">
                  <i class="bi bi-file-earmark-pdf me-2"></i>PDF
                </a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div id="attendanceReportsLoading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
          </div>
          <p class="mt-2">جاري تحميل تقارير الحضور...</p>
        </div>
        
        <div id="attendanceReportsTable" style="display: none;">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>اسم الطالب</th>
                  <th>الصف</th>
                  <th>المادة</th>
                  <th>المعلم</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th>الوقت</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody id="attendanceReportsTableBody">
              </tbody>
            </table>
          </div>
          
          <div id="attendanceReportsPagination" class="d-flex justify-content-center mt-3">
          </div>
        </div>
        
        <div id="attendanceReportsEmpty" style="display: none;" class="text-center py-4">
          <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
          <p class="text-muted mt-2">لا توجد سجلات حضور بالمعايير المحددة</p>
        </div>
      </div>
    </div>
  `;
}

// دالة تحميل تقارير الحضور
async function loadAttendanceReports(filters = {}) {
  try {
    // إظهار حالة التحميل
    document.getElementById('attendanceReportsLoading').style.display = 'block';
    document.getElementById('attendanceReportsTable').style.display = 'none';
    document.getElementById('attendanceReportsEmpty').style.display = 'none';
    
    // تحميل الصفوف للفلتر
    await loadGradesForFilter();
    
    // استدعاء API للحصول على تقارير الحضور
    const response = await apiService.getAttendanceReports(filters);
    
    if (response.success && response.data) {
      displayAttendanceReports(response.data);
    } else {
      throw new Error(response.message || 'فشل في تحميل التقارير');
    }
  } catch (error) {
    console.error('خطأ في تحميل تقارير الحضور:', error);
    showToast('فشل في تحميل تقارير الحضور', 'error');
    
    // إخفاء حالة التحميل وإظهار رسالة فارغة
    document.getElementById('attendanceReportsLoading').style.display = 'none';
    document.getElementById('attendanceReportsEmpty').style.display = 'block';
  }
}

// دالة عرض تقارير الحضور
function displayAttendanceReports(reports) {
  const tableBody = document.getElementById('attendanceReportsTableBody');
  const loadingDiv = document.getElementById('attendanceReportsLoading');
  const tableDiv = document.getElementById('attendanceReportsTable');
  const emptyDiv = document.getElementById('attendanceReportsEmpty');
  
  // إخفاء حالة التحميل
  loadingDiv.style.display = 'none';
  
  if (!reports || reports.length === 0) {
    emptyDiv.style.display = 'block';
    tableDiv.style.display = 'none';
    return;
  }
  
  // إظهار الجدول
  tableDiv.style.display = 'block';
  emptyDiv.style.display = 'none';
  
  // تنظيف محتوى الجدول
  tableBody.innerHTML = '';
  
  // إضافة البيانات للجدول
  reports.forEach(report => {
    const row = createAttendanceReportRow(report);
    tableBody.appendChild(row);
  });
}

// دالة إنشاء صف في جدول تقارير الحضور
function createAttendanceReportRow(report) {
  const row = document.createElement('tr');
  
  // تحديد لون الحالة
  let statusBadge = '';
  switch(report.status) {
    case 'present':
      statusBadge = '<span class="badge bg-success">حاضر</span>';
      break;
    case 'absent':
      statusBadge = '<span class="badge bg-danger">غائب</span>';
      break;
    case 'late':
      statusBadge = '<span class="badge bg-warning">متأخر</span>';
      break;
    case 'excused':
      statusBadge = '<span class="badge bg-info">معذور</span>';
      break;
    default:
      statusBadge = '<span class="badge bg-secondary">غير محدد</span>';
  }
  
  // تحديد حالة الموافقة
  let approvalStatus = '';
  if (report.is_approved === 1) {
    approvalStatus = '<span class="badge bg-success">معتمد</span>';
  } else if (report.is_approved === 0) {
    approvalStatus = '<span class="badge bg-danger">مرفوض</span>';
  } else {
    approvalStatus = '<span class="badge bg-warning">في الانتظار</span>';
  }
  
  row.innerHTML = `
    <td>${report.student_name || 'غير محدد'}</td>
    <td>${report.grade || 'غير محدد'} ${report.class_name || ''}</td>
    <td>${report.subject_name || 'غير محدد'}</td>
    <td>${report.teacher_name || 'غير محدد'}</td>
    <td>${statusBadge}</td>
    <td>${formatDate(report.attendance_date)}</td>
    <td>${formatTime(report.recorded_at)}</td>
    <td>${approvalStatus}</td>
    <td>
      ${report.is_approved === null ? `
        <button class="btn btn-sm btn-success me-1" onclick="approveAttendanceRecord(${report.id})">
          <i class="bi bi-check"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="rejectAttendanceRecord(${report.id})">
          <i class="bi bi-x"></i>
        </button>
      ` : ''}
      <button class="btn btn-sm btn-outline-primary" onclick="viewAttendanceDetails(${report.id})">
        <i class="bi bi-eye"></i>
      </button>
    </td>
  `;
  
  return row;
}

// دالة فلترة تقارير الحضور
async function filterAttendanceReports() {
  const filters = {
    grade: document.getElementById('reportGradeFilter').value,
    date_from: document.getElementById('reportDateFrom').value,
    date_to: document.getElementById('reportDateTo').value,
    status: document.getElementById('reportStatusFilter').value
  };
  
  // إزالة الفلاتر الفارغة
  Object.keys(filters).forEach(key => {
    if (!filters[key]) delete filters[key];
  });
  
  await loadAttendanceReports(filters);
}

// دالة تحميل الصفوف للفلتر
async function loadGradesForFilter() {
  try {
    const response = await apiService.getClasses();
    const gradeFilter = document.getElementById('reportGradeFilter');
    
    if (response.success && response.data) {
      // تنظيف القائمة
      gradeFilter.innerHTML = '<option value="">جميع الصفوف</option>';
      
      // إضافة الصفوف
      const grades = [...new Set(response.data.map(cls => cls.grade))];
      grades.forEach(grade => {
        const option = document.createElement('option');
        option.value = grade;
        option.textContent = grade;
        gradeFilter.appendChild(option);
      });
    }
  } catch (error) {
    console.error('خطأ في تحميل الصفوف:', error);
  }
}

// دالة اعتماد سجل حضور
async function approveAttendanceRecord(attendanceId) {
  try {
    const response = await apiService.approveAttendance(attendanceId);
    
    if (response.success) {
      showToast('تم اعتماد سجل الحضور بنجاح', 'success');
      // إعادة تحميل التقارير
      await loadAttendanceReports();
    } else {
      throw new Error(response.message || 'فشل في اعتماد السجل');
    }
  } catch (error) {
    console.error('خطأ في اعتماد السجل:', error);
    showToast('فشل في اعتماد السجل: ' + error.message, 'error');
  }
}

// دالة رفض سجل حضور
async function rejectAttendanceRecord(attendanceId) {
  try {
    const response = await apiService.rejectAttendance(attendanceId);
    
    if (response.success) {
      showToast('تم رفض سجل الحضور', 'warning');
      // إعادة تحميل التقارير
      await loadAttendanceReports();
    } else {
      throw new Error(response.message || 'فشل في رفض السجل');
    }
  } catch (error) {
    console.error('خطأ في رفض السجل:', error);
    showToast('فشل في رفض السجل: ' + error.message, 'error');
  }
}

// دالة عرض تفاصيل سجل الحضور
function viewAttendanceDetails(attendanceId) {
  // ستكون متاحة لاحقاً
  showToast('ميزة عرض التفاصيل ستكون متاحة قريباً', 'info');
}

// دالة تصدير تقارير الحضور
async function exportAttendanceReport(format) {
  try {
    const filters = {
      grade: document.getElementById('reportGradeFilter').value,
      date_from: document.getElementById('reportDateFrom').value,
      date_to: document.getElementById('reportDateTo').value,
      status: document.getElementById('reportStatusFilter').value
    };
    
    // إزالة الفلاتر الفارغة
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });
    
    showToast('جاري تحضير التقرير...', 'info');
    
    // استدعاء API للتصدير
    const response = await apiService.exportAttendanceReport(format, filters);
    
    if (response) {
      // إنشاء رابط التنزيل
      const url = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.${format}`;
      
      document.body.appendChild(a);
      a.click();
      
      // تنظيف
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showToast('تم تنزيل التقرير بنجاح', 'success');
    }
  } catch (error) {
    console.error('خطأ في تصدير التقرير:', error);
    showToast('فشل في تصدير التقرير: ' + error.message, 'error');
  }
}

// دوال مساعدة لتنسيق التاريخ والوقت
function formatDate(dateString) {
  if (!dateString) return 'غير محدد';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// محتوى اعتماد التحضير
function getApprovalContent() {
  // تحميل البيانات الحقيقية عند عرض المحتوى
  setTimeout(() => {
    loadPendingApprovals();
  }, 100);

  return `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0"><i class="bi bi-check2-square me-2"></i>اعتماد التحضير</h5>
        <button class="btn btn-outline-primary btn-sm" onclick="loadPendingApprovals()">
          <i class="bi bi-arrow-clockwise me-1"></i>تحديث
        </button>
      </div>
      <div class="card-body">
        <!-- فلاتر -->
        <div class="row mb-3">
          <div class="col-md-3">
            <label class="form-label">التاريخ</label>
            <input type="date" class="form-control" id="approvalDateFilter" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="col-md-3">
            <label class="form-label">المعلم</label>
            <select class="form-control" id="approvalTeacherFilter">
              <option value="">جميع المعلمين</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">الصف</label>
            <select class="form-control" id="approvalGradeFilter">
              <option value="">جميع الصفوف</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">&nbsp;</label>
            <button class="btn btn-primary d-block" onclick="filterPendingApprovals()">
              <i class="bi bi-search me-1"></i>فلترة
            </button>
          </div>
        </div>
        
        <!-- حالة التحميل -->
        <div id="approvalsLoading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
          </div>
          <p class="mt-2">جاري تحميل التحضير المطلوب اعتماده...</p>
        </div>
        
        <!-- قائمة التحضير -->
        <div id="approvalsList" style="display: none;">
          <div class="list-group" id="approvalsListGroup">
          </div>
        </div>
        
        <!-- رسالة فارغة -->
        <div id="approvalsEmpty" style="display: none;" class="text-center py-4">
          <i class="bi bi-check-circle text-success" style="font-size: 3rem;"></i>
          <p class="text-muted mt-2">لا يوجد تحضير في انتظار الاعتماد</p>
        </div>
      </div>
    </div>
  `;
}

// دالة تحميل التحضير المطلوب اعتماده
async function loadPendingApprovals(filters = {}) {
  try {
    // إظهار حالة التحميل
    document.getElementById('approvalsLoading').style.display = 'block';
    document.getElementById('approvalsList').style.display = 'none';
    document.getElementById('approvalsEmpty').style.display = 'none';
    
    // تحميل المعلمين والصفوف للفلاتر
    await loadFiltersForApprovals();
    
    // استدعاء API للحصول على التحضير المطلوب اعتماده
    const response = await apiService.getPendingApprovals();
    
    if (response.success && response.data) {
      displayPendingApprovals(response.data);
    } else {
      throw new Error(response.message || 'فشل في تحميل التحضير');
    }
  } catch (error) {
    console.error('خطأ في تحميل التحضير المطلوب اعتماده:', error);
    showToast('فشل في تحميل التحضير المطلوب اعتماده', 'error');
    
    // إخفاء حالة التحميل وإظهار رسالة فارغة
    document.getElementById('approvalsLoading').style.display = 'none';
    document.getElementById('approvalsEmpty').style.display = 'block';
  }
}

// دالة عرض التحضير المطلوب اعتماده
function displayPendingApprovals(approvals) {
  const listGroup = document.getElementById('approvalsListGroup');
  const loadingDiv = document.getElementById('approvalsLoading');
  const listDiv = document.getElementById('approvalsList');
  const emptyDiv = document.getElementById('approvalsEmpty');
  
  // إخفاء حالة التحميل
  loadingDiv.style.display = 'none';
  
  if (!approvals || approvals.length === 0) {
    emptyDiv.style.display = 'block';
    listDiv.style.display = 'none';
    return;
  }
  
  // إظهار القائمة
  listDiv.style.display = 'block';
  emptyDiv.style.display = 'none';
  
  // تنظيف محتوى القائمة
  listGroup.innerHTML = '';
  
  // إضافة البيانات للقائمة
  approvals.forEach(approval => {
    const item = createApprovalItem(approval);
    listGroup.appendChild(item);
  });
}

// دالة إنشاء عنصر في قائمة التحضير
function createApprovalItem(approval) {
  const item = document.createElement('div');
  item.className = 'list-group-item';
  item.id = `approval-${approval.id}`;
  item.setAttribute('data-session', approval.class_session_id);
  item.setAttribute('data-date', approval.attendance_date);
  
  // استخدام البيانات الجديدة من API
  const presentCount = approval.present_count || 0;
  const absentCount = approval.absent_count || 0;
  const lateCount = approval.late_count || 0;
  const excusedCount = approval.excused_count || 0;
  const totalCount = approval.student_count || (presentCount + absentCount + lateCount + excusedCount);
  
  item.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <div class="flex-grow-1">
        <h6 class="mb-1">
          تحضير حصة ${approval.subject_name || 'غير محدد'} - ${approval.grade || 'غير محدد'} ${approval.class_name || ''}
        </h6>
        <p class="mb-1">
          <strong>المعلم:</strong> ${approval.teacher_name || 'غير محدد'}
        </p>
        <div class="row">
          <div class="col-md-6">
            <small class="text-muted">
              <i class="bi bi-calendar me-1"></i>التاريخ: ${formatDate(approval.attendance_date)}
            </small>
          </div>
          <div class="col-md-6">
            <small class="text-muted">
              <i class="bi bi-clock me-1"></i>وقت التسجيل: ${formatTime(approval.recorded_at)}
            </small>
          </div>
        </div>
        <div class="mt-2">
          <span class="badge bg-success me-1">حاضر: ${presentCount}</span>
          <span class="badge bg-danger me-1">غائب: ${absentCount}</span>
          ${lateCount > 0 ? `<span class="badge bg-warning me-1">متأخر: ${lateCount}</span>` : ''}
          ${excusedCount > 0 ? `<span class="badge bg-secondary me-1">معذور: ${excusedCount}</span>` : ''}
          <span class="badge bg-info">المجموع: ${totalCount}</span>
        </div>
      </div>
      <div class="ms-3">
        <button class="btn btn-success btn-sm me-1" onclick="approveAttendanceSession(${approval.class_session_id}, '${approval.attendance_date}')">
          <i class="bi bi-check"></i> اعتماد
        </button>
        <button class="btn btn-outline-danger btn-sm me-1" onclick="rejectAttendanceSession(${approval.class_session_id}, '${approval.attendance_date}')">
          <i class="bi bi-x"></i> رفض
        </button>
        <button class="btn btn-outline-primary btn-sm" onclick="viewAttendanceSessionDetails(${approval.id})">
          <i class="bi bi-eye"></i> تفاصيل
        </button>
      </div>
    </div>
  `;
  
  return item;
}

// دالة تحميل الفلاتر للاعتماد
async function loadFiltersForApprovals() {
  try {
    // تحميل المعلمين
    const teachersResponse = await apiService.getTeachers();
    const teacherFilter = document.getElementById('approvalTeacherFilter');
    
    if (teachersResponse.success && teachersResponse.data) {
      teacherFilter.innerHTML = '<option value="">جميع المعلمين</option>';
      teachersResponse.data.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = teacher.name;
        teacherFilter.appendChild(option);
      });
    }
    
    // تحميل الصفوف
    const classesResponse = await apiService.getClasses();
    const gradeFilter = document.getElementById('approvalGradeFilter');
    
    if (classesResponse.success && classesResponse.data) {
      gradeFilter.innerHTML = '<option value="">جميع الصفوف</option>';
      const grades = [...new Set(classesResponse.data.map(cls => cls.grade))];
      grades.forEach(grade => {
        const option = document.createElement('option');
        option.value = grade;
        option.textContent = grade;
        gradeFilter.appendChild(option);
      });
    }
  } catch (error) {
    console.error('خطأ في تحميل الفلاتر:', error);
  }
}

// دالة فلترة التحضير المطلوب اعتماده
async function filterPendingApprovals() {
  const filters = {
    date: document.getElementById('approvalDateFilter').value,
    teacher_id: document.getElementById('approvalTeacherFilter').value,
    grade: document.getElementById('approvalGradeFilter').value
  };
  
  // إزالة الفلاتر الفارغة
  Object.keys(filters).forEach(key => {
    if (!filters[key]) delete filters[key];
  });
  
  await loadPendingApprovals(filters);
}

// دالة اعتماد جلسة حضور
async function approveAttendanceSession(sessionId, date) {
  if (!confirm('هل تريد اعتماد هذا التحضير؟ سيتم إرسال إشعارات لأولياء الأمور.')) {
    return;
  }
  
  try {
    const response = await apiService.approveSession(sessionId, date);
    
    if (response.success) {
      showToast('تم اعتماد التحضير بنجاح وإرسال الإشعارات', 'success');
      
      // تحديث العنصر في القائمة
      const approvalItem = document.querySelector(`[id*="approval-"][data-session="${sessionId}"][data-date="${date}"]`);
      if (approvalItem) {
        approvalItem.style.opacity = '0.7';
        approvalItem.innerHTML = `
          <div class="text-center text-success p-3">
            <i class="bi bi-check-circle me-2"></i>تم الاعتماد وإرسال الإشعارات بنجاح
          </div>
        `;
        
        // إزالة العنصر بعد 3 ثواني
        setTimeout(() => {
          approvalItem.remove();
          
          // التحقق من وجود عناصر أخرى
          const remainingItems = document.querySelectorAll('#approvalsListGroup .list-group-item');
          if (remainingItems.length === 0) {
            document.getElementById('approvalsList').style.display = 'none';
            document.getElementById('approvalsEmpty').style.display = 'block';
          }
        }, 3000);
      } else {
        // إعادة تحميل القائمة
        loadPendingApprovals();
      }
    } else {
      throw new Error(response.message || 'فشل في اعتماد التحضير');
    }
  } catch (error) {
    console.error('خطأ في اعتماد التحضير:', error);
    showToast('فشل في اعتماد التحضير: ' + error.message, 'error');
  }
}

// دالة رفض جلسة حضور
async function rejectAttendanceSession(sessionId, date) {
  const reason = prompt('سبب الرفض (اختياري):');
  if (reason === null) return; // المستخدم ألغى العملية
  
  try {
    const response = await apiService.rejectSession(sessionId, date, reason);
    
    if (response.success) {
      showToast('تم رفض التحضير', 'warning');
      
      // تحديث العنصر في القائمة
      const approvalItem = document.querySelector(`[id*="approval-"][data-session="${sessionId}"][data-date="${date}"]`);
      if (approvalItem) {
        approvalItem.style.opacity = '0.7';
        approvalItem.innerHTML = `
          <div class="text-center text-warning p-3">
            <i class="bi bi-x-circle me-2"></i>تم رفض التحضير
            ${reason ? `<br><small>السبب: ${reason}</small>` : ''}
          </div>
        `;
        
        // إزالة العنصر بعد 3 ثواني
        setTimeout(() => {
          approvalItem.remove();
          
          // التحقق من وجود عناصر أخرى
          const remainingItems = document.querySelectorAll('#approvalsListGroup .list-group-item');
          if (remainingItems.length === 0) {
            document.getElementById('approvalsList').style.display = 'none';
            document.getElementById('approvalsEmpty').style.display = 'block';
          }
        }, 3000);
      } else {
        // إعادة تحميل القائمة
        loadPendingApprovals();
      }
    } else {
      throw new Error(response.message || 'فشل في رفض التحضير');
    }
  } catch (error) {
    console.error('خطأ في رفض التحضير:', error);
    showToast('فشل في رفض التحضير: ' + error.message, 'error');
  }
}

// دالة عرض تفاصيل جلسة الحضور
async function viewAttendanceSessionDetails(attendanceId) {
  try {
    showToast('جاري تحميل التفاصيل...', 'info');
    
    const response = await apiService.getAttendanceSessionDetails(attendanceId);
    
    if (response.success && response.data) {
      showAttendanceDetailsModal(response.data);
    } else {
      throw new Error(response.message || 'فشل في تحميل التفاصيل');
    }
  } catch (error) {
    console.error('خطأ في تحميل تفاصيل الجلسة:', error);
    showToast('فشل في تحميل تفاصيل الجلسة: ' + error.message, 'error');
  }
}

// دالة عرض modal تفاصيل الحضور
function showAttendanceDetailsModal(sessionData) {
  const { session_info, students, statistics } = sessionData;
  
  // تجميع الطلاب حسب الحالة
  const presentStudents = students.filter(s => s.status === 'present');
  const absentStudents = students.filter(s => s.status === 'absent');
  const lateStudents = students.filter(s => s.status === 'late');
  const excusedStudents = students.filter(s => s.status === 'excused');
  
  const modalHtml = `
    <div class="modal fade" id="attendanceDetailsModal" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-clipboard-data me-2"></i>
              تفاصيل تحضير ${session_info.subject_name} - ${session_info.grade} ${session_info.class_name}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <!-- معلومات الجلسة -->
            <div class="card mb-3">
              <div class="card-header">
                <h6 class="mb-0"><i class="bi bi-info-circle me-2"></i>معلومات الجلسة</h6>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <p><strong>المعلم:</strong> ${session_info.teacher_name}</p>
                    <p><strong>المادة:</strong> ${session_info.subject_name}</p>
                    <p><strong>الصف:</strong> ${session_info.grade} ${session_info.class_name}</p>
                  </div>
                  <div class="col-md-6">
                    <p><strong>التاريخ:</strong> ${formatDate(session_info.attendance_date)}</p>
                    <p><strong>وقت التسجيل:</strong> ${formatTime(session_info.recorded_at)}</p>
                    <p><strong>الحالة:</strong> ${getApprovalStatusBadge(session_info.is_approved)}</p>
                  </div>
                </div>
                ${session_info.rejection_reason ? `
                  <div class="alert alert-warning mt-2">
                    <strong>سبب الرفض:</strong> ${session_info.rejection_reason}
                  </div>
                ` : ''}
              </div>
            </div>
            
            <!-- الإحصائيات -->
            <div class="card mb-3">
              <div class="card-header">
                <h6 class="mb-0"><i class="bi bi-graph-up me-2"></i>إحصائيات الحضور</h6>
              </div>
              <div class="card-body">
                <div class="row text-center">
                  <div class="col-md-2">
                    <div class="stat-box bg-info">
                      <h4>${statistics.total_students}</h4>
                      <small>إجمالي الطلاب</small>
                    </div>
                  </div>
                  <div class="col-md-2">
                    <div class="stat-box bg-success">
                      <h4>${statistics.present_count}</h4>
                      <small>حاضر</small>
                    </div>
                  </div>
                  <div class="col-md-2">
                    <div class="stat-box bg-danger">
                      <h4>${statistics.absent_count}</h4>
                      <small>غائب</small>
                    </div>
                  </div>
                  <div class="col-md-2">
                    <div class="stat-box bg-warning">
                      <h4>${statistics.late_count}</h4>
                      <small>متأخر</small>
                    </div>
                  </div>
                  <div class="col-md-2">
                    <div class="stat-box bg-secondary">
                      <h4>${statistics.excused_count}</h4>
                      <small>معذور</small>
                    </div>
                  </div>
                  <div class="col-md-2">
                    <div class="stat-box bg-primary">
                      <h4>${statistics.attendance_rate}%</h4>
                      <small>معدل الحضور</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- قوائم الطلاب -->
            <div class="row">
              <!-- الطلاب الحاضرون -->
              ${presentStudents.length > 0 ? `
                <div class="col-md-6 mb-3">
                  <div class="card">
                    <div class="card-header bg-success text-white">
                      <h6 class="mb-0"><i class="bi bi-check-circle me-2"></i>الطلاب الحاضرون (${presentStudents.length})</h6>
                    </div>
                    <div class="card-body" style="max-height: 300px; overflow-y: auto;">
                      ${createStudentsList(presentStudents, 'success')}
                    </div>
                  </div>
                </div>
              ` : ''}
              
              <!-- الطلاب الغائبون -->
              ${absentStudents.length > 0 ? `
                <div class="col-md-6 mb-3">
                  <div class="card">
                    <div class="card-header bg-danger text-white">
                      <h6 class="mb-0"><i class="bi bi-x-circle me-2"></i>الطلاب الغائبون (${absentStudents.length})</h6>
                    </div>
                    <div class="card-body" style="max-height: 300px; overflow-y: auto;">
                      ${createStudentsList(absentStudents, 'danger')}
                    </div>
                  </div>
                </div>
              ` : ''}
              
              <!-- الطلاب المتأخرون -->
              ${lateStudents.length > 0 ? `
                <div class="col-md-6 mb-3">
                  <div class="card">
                    <div class="card-header bg-warning text-dark">
                      <h6 class="mb-0"><i class="bi bi-clock me-2"></i>الطلاب المتأخرون (${lateStudents.length})</h6>
                    </div>
                    <div class="card-body" style="max-height: 300px; overflow-y: auto;">
                      ${createStudentsList(lateStudents, 'warning')}
                    </div>
                  </div>
                </div>
              ` : ''}
              
              <!-- الطلاب المعذورون -->
              ${excusedStudents.length > 0 ? `
                <div class="col-md-6 mb-3">
                  <div class="card">
                    <div class="card-header bg-secondary text-white">
                      <h6 class="mb-0"><i class="bi bi-shield-check me-2"></i>الطلاب المعذورون (${excusedStudents.length})</h6>
                    </div>
                    <div class="card-body" style="max-height: 300px; overflow-y: auto;">
                      ${createStudentsList(excusedStudents, 'secondary')}
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
            <button type="button" class="btn btn-primary" onclick="exportSessionReport(${session_info.id}, '${session_info.attendance_date}')">
              <i class="bi bi-download me-1"></i>تصدير التقرير
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // إزالة المودال القديم إذا كان موجوداً
  const oldModal = document.getElementById('attendanceDetailsModal');
  if (oldModal) {
    oldModal.remove();
  }
  
  // إضافة المودال الجديد
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // إضافة CSS للإحصائيات
  addStatsCSS();
  
  // عرض المودال
  const modal = new bootstrap.Modal(document.getElementById('attendanceDetailsModal'));
  modal.show();
}

// اعتماد التحضير (الدالة القديمة للتوافق)
function approveAttendance(attendanceId) {
  approveAttendanceSession(attendanceId);
}

// دالة إنشاء قائمة الطلاب
function createStudentsList(students, badgeType) {
  return students.map(student => `
    <div class="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
      <div>
        <strong>${student.name}</strong>
        ${student.national_id ? `<br><small class="text-muted">رقم الهوية: ${student.national_id}</small>` : ''}
        ${student.notes ? `<br><small class="text-muted">ملاحظة: ${student.notes}</small>` : ''}
      </div>
      <div class="text-end">
        <span class="badge bg-${badgeType}">${getStatusText(student.status)}</span>
        <br><small class="text-muted">${formatTime(student.recorded_at)}</small>
        ${student.status === 'absent' ? `
          <br><button class="btn btn-sm btn-warning mt-1" onclick="changeToLate(${student.attendance_id})">
            <i class="bi bi-clock me-1"></i>تغيير إلى متأخر
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// دالة الحصول على نص الحالة
function getStatusText(status) {
  const statusTexts = {
    'present': 'حاضر',
    'absent': 'غائب',
    'late': 'متأخر',
    'excused': 'معذور'
  };
  return statusTexts[status] || status;
}

// دالة الحصول على شارة حالة الموافقة
function getApprovalStatusBadge(isApproved) {
  if (isApproved === 1) {
    return '<span class="badge bg-success">معتمد</span>';
  } else if (isApproved === 0) {
    return '<span class="badge bg-danger">مرفوض</span>';
  } else {
    return '<span class="badge bg-warning">في الانتظار</span>';
  }
}

// دالة إضافة CSS للإحصائيات
function addStatsCSS() {
  if (!document.getElementById('statsCSS')) {
    const style = document.createElement('style');
    style.id = 'statsCSS';
    style.textContent = `
      .stat-box {
        padding: 15px;
        border-radius: 8px;
        color: white;
        margin-bottom: 10px;
      }
      .stat-box h4 {
        margin: 0;
        font-size: 2rem;
        font-weight: bold;
      }
      .stat-box small {
        font-size: 0.9rem;
        opacity: 0.9;
      }
    `;
    document.head.appendChild(style);
  }
}

// دالة تصدير تقرير الجلسة
function exportSessionReport(sessionId, date) {
  const filters = {
    class_session_id: sessionId,
    date: date
  };
  exportAttendanceReport('excel', filters);
}

// تغيير حالة الطالب من غائب إلى متأخر
async function changeToLate(attendanceId) {
  if (!confirm('هل تريد تغيير حالة الطالب من غائب إلى متأخر؟\nسيتم حساب دقائق التأخير تلقائياً من بداية أول حصة.')) {
    return;
  }

  try {
    const result = await apiService.post(`/admin/attendance-reports/${attendanceId}/change-to-late`, {});

    if (result.success) {
      showNotification(result.message, 'success');
      // إعادة تحميل تفاصيل الحضور
      window.location.reload(); // سريع لإعادة تحديث البيانات
    } else {
      showNotification(result.message || 'فشل في تغيير حالة الطالب', 'error');
    }
  } catch (error) {
    console.error('خطأ في تغيير حالة الطالب:', error);
    showNotification('خطأ في تغيير حالة الطالب: ' + error.message, 'error');
  }
}

// تسجيل الخروج
async function logout() {
  console.log('تسجيل خروج');
  
  try {
    await apiService.logout();
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
  } finally {
    // تنظيف البيانات المحلية
    clearUserSession(); // مسح الجلسة من localStorage
    currentUser = null;
    currentClass = null;
    attendanceData = {};
    
    // إعادة تعيين حالة الحضور
    appData.students.forEach(student => {
      attendanceData[student.id] = 'present';
    });
    
    showNotification('تم تسجيل الخروج بنجاح', 'info');
    setTimeout(() => {
      showPage('homePage');
    }, 1000);
  }
}

// تحديث التاريخ والوقت
function updateDateTime() {
  const now = new Date();
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  
  const currentDay = days[now.getDay()];
  const currentDate = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  const currentTime = now.toLocaleTimeString('ar-SA', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  
  // تحديث العناصر إذا كانت موجودة
  const dayElement = document.getElementById('currentDay');
  const dateElement = document.getElementById('currentDate');
  const timeElement = document.getElementById('currentTime');
  
  if (dayElement) dayElement.textContent = currentDay;
  if (dateElement) dateElement.textContent = currentDate;
  if (timeElement) timeElement.textContent = currentTime;
}

// دالة تحويل الوقت إلى نظام 12 ساعة
function formatTo12Hour(time24) {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'م' : 'ص';
  const hours12 = hours % 12 || 12;
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// عرض التنبيهات
function showNotification(message, type = 'info') {
  console.log('إشعار:', message, type);
  
  const toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    console.error('مكان التنبيهات غير موجود');
    return;
  }
  
  // إنشاء toast جديد
  const toastId = 'toast-' + Date.now();
  const toastEl = document.createElement('div');
  toastEl.id = toastId;
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'alert');
  
  // تحديد أيقونة ولون التنبيه
  let iconClass = 'bi-info-circle text-primary';
  let headerClass = '';
  
  switch(type) {
    case 'success':
      iconClass = 'bi-check-circle text-success';
      headerClass = 'bg-success text-white';
      break;
    case 'error':
      iconClass = 'bi-exclamation-circle text-danger';
      headerClass = 'bg-danger text-white';
      break;
    case 'warning':
      iconClass = 'bi-exclamation-triangle text-warning';
      headerClass = 'bg-warning text-dark';
      break;
  }
  
  toastEl.innerHTML = `
    <div class="toast-header ${headerClass}">
      <i class="${iconClass} me-2"></i>
      <strong class="me-auto">إشعار</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;
  
  toastContainer.appendChild(toastEl);
  
  // عرض التنبيه
  const bsToast = new bootstrap.Toast(toastEl, {
    autohide: true,
    delay: 4000
  });
  bsToast.show();
  
  // إزالة العنصر بعد الإغلاق
  toastEl.addEventListener('hidden.bs.toast', function() {
    toastEl.remove();
  });
}

// إضافة دعم اللمس للأجهزة المحمولة
if ('ontouchstart' in window) {
  document.addEventListener('touchstart', function() {}, { passive: true });
}

// دوال مساعدة جديدة

// عرض رسالة Toast (نسخة محسنة)
function showToast(message, type = 'info') {
  // إنشاء التنبيه إذا لم يكن موجود
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }
  
  const toastId = 'toast-' + Date.now();
  const toastEl = document.createElement('div');
  toastEl.id = toastId;
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'alert');
  
  let headerClass = '';
  let iconClass = '';
  
  switch(type) {
    case 'success':
      headerClass = 'bg-success text-white';
      iconClass = 'bi bi-check-circle-fill text-white';
      break;
    case 'error':
      headerClass = 'bg-danger text-white';
      iconClass = 'bi bi-exclamation-triangle-fill text-white';
      break;
    case 'warning':
      headerClass = 'bg-warning text-dark';
      iconClass = 'bi bi-exclamation-triangle-fill text-dark';
      break;
    default:
      headerClass = 'bg-info text-white';
      iconClass = 'bi bi-info-circle-fill text-white';
  }
  
  toastEl.innerHTML = `
    <div class="toast-header ${headerClass}">
      <i class="${iconClass} me-2"></i>
      <strong class="me-auto">إشعار</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;
  
  toastContainer.appendChild(toastEl);
  
  // عرض التنبيه
  const bsToast = new bootstrap.Toast(toastEl, {
    autohide: true,
    delay: 4000
  });
  bsToast.show();
  
  // إزالة العنصر بعد الإغلاق
  toastEl.addEventListener('hidden.bs.toast', function() {
    toastEl.remove();
  });
}

// دالة التحقق من صحة رقم الهوية السعودية
function validateSaudiID(id) {
  if (!/^\d{10}$/.test(id)) return false;
  
  const digits = id.split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? remainder : 11 - remainder;
  
  return checkDigit === digits[9];
}

// دالة التحقق من صحة رقم الهاتف السعودي
function validateSaudiPhone(phone) {
  // إزالة المسافات والرموز
  phone = phone.replace(/[\s\-\(\)]/g, '');
  
  // التحقق من الصيغة السعودية
  return /^(00966|966|\+966|05|5)([0-9]{8})$/.test(phone);
}

// تنسيق رقم الهاتف السعودي
function formatSaudiPhone(phone) {
  phone = phone.replace(/[\s\-\(\)]/g, '');
  
  if (phone.startsWith('00966')) {
    phone = phone.substring(5);
  } else if (phone.startsWith('966')) {
    phone = phone.substring(3);
  } else if (phone.startsWith('+966')) {
    phone = phone.substring(4);
  } else if (phone.startsWith('05')) {
    phone = phone.substring(1);
  }
  
  return '5' + phone.substring(1);
}

// دالة تحميل الحصص للمعلم
async function loadTeacherSessions(teacherId) {
  try {
    const sessions = await apiService.getTeacherSessions(teacherId);
    return sessions.data || [];
  } catch (error) {
    console.error('خطأ في تحميل الحصص:', error);
    showToast('خطأ في تحميل الحصص', 'error');
    return [];
  }
}

// دالة تحميل الطلاب للفصل (للاستخدام في الإدارة)
async function loadClassStudents(sessionId) {
  try {
    const students = await apiService.getClassStudents(sessionId);
    return students.data || [];
  } catch (error) {
    console.error('خطأ في تحميل الطلاب:', error);
    showToast('خطأ في تحميل الطلاب', 'error');
    return [];
  }
}

// دالة حفظ الحضور مع إرسال الواتساب
async function submitAttendance(sessionId, attendanceData) {
  try {
    showToast('جاري حفظ الحضور...', 'info');
    
    const result = await apiService.submitAttendance(sessionId, attendanceData);
    
    if (result.success) {
      showToast('تم حفظ الحضور وإرسال الإشعارات بنجاح', 'success');
      return true;
    } else {
      throw new Error(result.message || 'فشل في حفظ الحضور');
    }
  } catch (error) {
    console.error('خطأ في حفظ الحضور:', error);
    showToast('فشل في حفظ الحضور: ' + error.message, 'error');
    return false;
  }
}

// دالة تنزيل تقرير الحضور
async function downloadAttendanceReport(format = 'pdf', filters = {}) {
  try {
    showToast('جاري تحضير التقرير...', 'info');
    
    const blob = await apiService.downloadReport(format, filters);
    
    // إنشاء رابط التنزيل
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.${format}`;
    
    document.body.appendChild(a);
    a.click();
    
    // تنظيف
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showToast('تم تنزيل التقرير بنجاح', 'success');
  } catch (error) {
    console.error('خطأ في تنزيل التقرير:', error);
    showToast('فشل في تنزيل التقرير', 'error');
  }
}

// دالة البحث في البيانات
function searchData(data, searchTerm, fields) {
  if (!searchTerm) return data;
  
  searchTerm = searchTerm.toLowerCase();
  
  return data.filter(item => {
    return fields.some(field => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(searchTerm);
    });
  });
}

// دالة تأكيد الحذف
function confirmDelete(message, callback) {
  const modalHtml = `
    <div class="modal fade" id="confirmDeleteModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">
              <i class="bi bi-exclamation-triangle me-2"></i>تأكيد الحذف
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">${message}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
            <button type="button" class="btn btn-danger" id="confirmDeleteBtn">حذف</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // إزالة المودال السابق إن وجد
  const existingModal = document.getElementById('confirmDeleteModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // إضافة المودال الجديد
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  
  confirmBtn.onclick = function() {
    callback();
    modal.hide();
  };
  
  modal.show();
  
  // إزالة المودال من DOM بعد الإغلاق
  document.getElementById('confirmDeleteModal').addEventListener('hidden.bs.modal', function() {
    this.remove();
  });
}

// دالة نسخ النص إلى الحافظة
function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  element.select();
  element.setSelectionRange(0, 99999); // للهواتف المحمولة
  
  try {
    document.execCommand('copy');
    showNotification('تم نسخ النص إلى الحافظة', 'success');
  } catch (err) {
    showNotification('لم يتم نسخ النص', 'error');
  }
}

// دالة إظهار/إخفاء كلمة المرور
function togglePassword(elementId) {
  const element = document.getElementById(elementId);
  const button = element.nextElementSibling;
  const icon = button.querySelector('i');
  
  if (element.type === 'password') {
    element.type = 'text';
    icon.classList.remove('bi-eye');
    icon.classList.add('bi-eye-slash');
  } else {
    element.type = 'password';
    icon.classList.remove('bi-eye-slash');
    icon.classList.add('bi-eye');
  }
}

// إضافة مستمعي الأحداث للطلاب والحصص
document.addEventListener('DOMContentLoaded', function() {
  // نموذج إضافة طالب
  const addStudentForm = document.getElementById('addStudentForm');
  if (addStudentForm) {
    addStudentForm.addEventListener('submit', handleAddStudent);
  }
  
  // نموذج إضافة حصة
  const addClassForm = document.getElementById('addClassForm');
  if (addClassForm) {
    addClassForm.addEventListener('submit', handleAddClass);
  }
  
  // نموذج إضافة مادة
  const addSubjectForm = document.getElementById('addSubjectForm');
  if (addSubjectForm) {
    addSubjectForm.addEventListener('submit', handleAddSubject);
  }
});

// معالج إضافة طالب جديد
async function handleAddStudent(event) {
  event.preventDefault();
  
  const formData = {
    name: document.getElementById('addStudentName').value.trim(),
    national_id: document.getElementById('studentNationalId').value.trim(),
    grade: document.getElementById('studentGrade').value,
    class_name: document.getElementById('studentClassName').value.trim(),
    parent_name: document.getElementById('studentParentName').value.trim(),
    parent_phone: document.getElementById('studentPhone').value.trim()
  };
  
  // التحقق من صحة البيانات
  if (!formData.name || formData.name.length < 2) {
    showNotification('اسم الطالب يجب أن يكون أطول من حرفين', 'error');
    return;
  }
  
  if (!formData.national_id || formData.national_id.length !== 10) {
    showNotification('رقم الهوية يجب أن يكون 10 أرقام', 'error');
    return;
  }
  
  if (!formData.grade) {
    showNotification('يجب اختيار الصف', 'error');
    return;
  }
  
  if (!formData.class_name) {
    showNotification('اسم الشعبة مطلوب', 'error');
    return;
  }
  
  if (!formData.parent_name || formData.parent_name.length < 2) {
    showNotification('اسم ولي الأمر مطلوب', 'error');
    return;
  }
  
  if (!formData.parent_phone || !formData.parent_phone.match(/^05\d{8}$/)) {
    showNotification('رقم الهاتف مطلوب ويجب أن يبدأ بـ 05 ويكون 10 أرقام', 'error');
    return;
  }
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>جاري الإضافة...';
    
    const result = await apiService.createStudent(formData);
    
    if (result.success) {
      showNotification('تم إضافة الطالب بنجاح', 'success');
      
      // إغلاق المودال
      const modal = bootstrap.Modal.getInstance(document.getElementById('addStudentModal'));
      modal.hide();
      
      // إعادة تحميل قائمة الطلاب
      showAdminSection('students');
      
      // إعادة تعيين النموذج
      addStudentForm.reset();
    } else {
      throw new Error(result.message || 'فشل في إضافة الطالب');
    }
  } catch (error) {
    console.error('خطأ في إضافة الطالب:', error);
    showNotification(error.message || 'حدث خطأ أثناء إضافة الطالب', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// معالج إضافة حصة جديدة
async function handleAddClass(event) {
  event.preventDefault();
  
  const formData = {
    teacher_id: document.getElementById('classTeacherId').value,
    subject_id: document.getElementById('classSubjectId').value,
    grade: document.getElementById('classGrade').value.trim(),
    class_name: document.getElementById('className').value.trim(),
    day: document.getElementById('classDay').value,
    start_time: document.getElementById('classStartTime').value,
    end_time: document.getElementById('classEndTime').value,
    period_number: document.getElementById('classPeriodNumber').value,
    schedule_id: document.getElementById('selectedScheduleId').value || null,
    notes: document.getElementById('classNotes').value.trim() || null
  };
  
  // التحقق من البيانات المطلوبة فقط
  if (!formData.teacher_id) {
    showNotification('يجب اختيار المعلم', 'error');
    return;
  }
  
  if (!formData.subject_id) {
    showNotification('يجب اختيار المادة', 'error');
    return;
  }
  
  // البيانات الأخرى مضمونة لأنها مملوءة تلقائياً
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>جاري الإضافة...';
    
    const result = await apiService.createClassSession(formData);
    
    if (result.success) {
      showNotification('تم إضافة الحصة بنجاح', 'success');
      
      // إغلاق المودال
      const modal = bootstrap.Modal.getInstance(document.getElementById('addClassModal'));
      modal.hide();
      
      // إعادة تحميل الجدول
      showClassSchedule(formData.grade, formData.class_name);
      
      // مسح الحقول القابلة للتعديل فقط
      document.getElementById('classTeacherId').value = '';
      document.getElementById('classSubjectId').value = '';
      document.getElementById('classNotes').value = '';
    } else {
      throw new Error(result.message || 'فشل في إضافة الحصة');
    }
  } catch (error) {
    console.error('خطأ في إضافة الحصة:', error);
    showNotification(error.message || 'حدث خطأ أثناء إضافة الحصة', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// تحميل قوائم المعلمين والمواد عند عرض مودال الحصص
async function loadClassModalData() {
  try {
    // تحميل قائمة المعلمين
    const teachersResult = await apiService.getTeachers();
    const teachers = teachersResult.success ? teachersResult.data : [];
    
    const teacherSelect = document.getElementById('classTeacherId');
    teacherSelect.innerHTML = '<option value="">اختر المعلم</option>';
    
    teachers.forEach(teacher => {
      const option = document.createElement('option');
      option.value = teacher.id;
      option.textContent = teacher.name;
      teacherSelect.appendChild(option);
    });
    
    // تحميل قائمة المواد
    const subjectsResult = await apiService.getSubjects();
    const subjects = subjectsResult.success ? subjectsResult.data : [];
    
    const subjectSelect = document.getElementById('classSubjectId');
    subjectSelect.innerHTML = '<option value="">اختر المادة</option>';
    
    subjects.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject.id;
      option.textContent = subject.name;
      subjectSelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('خطأ في تحميل بيانات المودال:', error);
    showNotification('فشل في تحميل بيانات النموذج', 'error');
  }
}

// إضافة مستمع لحدث عرض مودال إضافة الحصة
document.addEventListener('DOMContentLoaded', function() {
  const addClassModal = document.getElementById('addClassModal');
  if (addClassModal) {
    addClassModal.addEventListener('shown.bs.modal', loadClassModalData);
  }
});

// دالة لعرض مودال إضافة طالب
function showAddStudentModal() {
  const modal = new bootstrap.Modal(document.getElementById('addStudentModal'));
  modal.show();
}

// دالة لعرض مودال إضافة حصة
function showAddClassModal() {
  const modal = new bootstrap.Modal(document.getElementById('addClassModal'));
  modal.show();
}

// دالة لتحديث الفصول بعد إضافة فصل جديد
async function refreshGradesContent() {
  const adminContent = document.getElementById('adminContent');
  if (adminContent) {
    try {
      adminContent.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
      const content = await getGradesContent();
      adminContent.innerHTML = content;
    } catch (error) {
      adminContent.innerHTML = `<div class="alert alert-danger">حدث خطأ في تحديث الفصول: ${error.message}</div>`;
    }
  }
}

// دالة لتعديل حصة
async function editClassSession(sessionId) {
  try {
    // سيتم تنفيذها لاحقاً
    showAlert('ميزة التعديل ستكون متاحة قريباً', 'info');
  } catch (error) {
    showAlert('حدث خطأ في تعديل الحصة: ' + error.message, 'danger');
  }
}

// دالة لحذف حصة
async function deleteClassSession(sessionId) {
  if (confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
    try {
      const result = await apiService.deleteClassSession(sessionId);
      if (result.success) {
        showAlert('تم حذف الحصة بنجاح', 'success');
        await refreshGradesContent();
      } else {
        showAlert('حدث خطأ في حذف الحصة: ' + result.message, 'danger');
      }
    } catch (error) {
      showAlert('حدث خطأ في حذف الحصة: ' + error.message, 'danger');
    }
  }
}

// دالة لإضافة حصة للصف
async function addClassSession(gradeData) {
  try {
    // حفظ بيانات الصف مؤقتاً لإضافة الحصص
    window.tempGradeData = gradeData;
    
    // إنشاء أسماء الفصول بناءً على عدد الفصول المطلوب
    const classNames = [];
    const sections = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص', 'ق', 'ر'];
    
    for (let i = 0; i < gradeData.sections; i++) {
      const sectionName = sections[i] || (i + 1).toString();
      classNames.push(sectionName);
    }
    
    // عرض مودال إضافة الحصص مع قائمة الفصول
    showAddMultipleClassSessionsModal(gradeData.gradeName, classNames);
  } catch (error) {
    showAlert('حدث خطأ: ' + error.message, 'danger');
  }
}

// دالة لعرض مودال إضافة حصص متعددة للصف
function showAddMultipleClassSessionsModal(gradeName, classNames) {
  const classNamesHtml = classNames.map(className => `
    <div class="form-check">
      <input class="form-check-input" type="checkbox" value="${className}" id="class_${className}" checked>
      <label class="form-check-label" for="class_${className}">
        ${gradeName} - ${className}
      </label>
    </div>
  `).join('');

  const modalHtml = `
    <div class="modal fade" id="addMultipleClassSessionsModal" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">إضافة حصص للصف: ${gradeName}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-4">
                <h6>الفصول المتاحة:</h6>
                <div class="border p-3 mb-3" style="max-height: 200px; overflow-y: auto;">
                  ${classNamesHtml}
                </div>
                
                <div class="mb-3">
                  <label class="form-label">المعلم</label>
                  <select class="form-control" id="multiSessionTeacher" required>
                    <option value="">اختر المعلم</option>
                  </select>
                </div>
                
                <div class="mb-3">
                  <label class="form-label">المادة</label>
                  <select class="form-control" id="multiSessionSubject" required>
                    <option value="">اختر المادة</option>
                  </select>
                </div>
              </div>
              
              <div class="col-md-8">
                <h6>تفاصيل الحصة:</h6>
                <form id="addMultipleClassSessionsForm">
                  <div class="row">
                    <div class="col-md-4 mb-3">
                      <label class="form-label">اليوم</label>
                      <select class="form-control" id="multiSessionDay" required>
                        <option value="">اختر اليوم</option>
                        <option value="الأحد">الأحد</option>
                        <option value="الإثنين">الإثنين</option>
                        <option value="الثلاثاء">الثلاثاء</option>
                        <option value="الأربعاء">الأربعاء</option>
                        <option value="الخميس">الخميس</option>
                      </select>
                    </div>
                    <div class="col-md-4 mb-3">
                      <label class="form-label">وقت البداية</label>
                      <input type="time" class="form-control" id="multiSessionStartTime" required>
                    </div>
                    <div class="col-md-4 mb-3">
                      <label class="form-label">وقت النهاية</label>
                      <input type="time" class="form-control" id="multiSessionEndTime" required>
                    </div>
                  </div>
                  
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label">رقم الحصة</label>
                      <input type="number" class="form-control" id="multiSessionPeriod" min="1" max="8" required>
                    </div>
                  </div>
                  
                  <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    سيتم إضافة حصة واحدة لكل فصل محدد بنفس التفاصيل أعلاه
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
            <button type="button" class="btn btn-primary" onclick="handleAddMultipleClassSessions('${gradeName}')">إضافة الحصص</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // إزالة المودال القديم إذا كان موجوداً
  const oldModal = document.getElementById('addMultipleClassSessionsModal');
  if (oldModal) {
    oldModal.remove();
  }
  
  // إضافة المودال الجديد
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // تحميل بيانات المعلمين والمواد
  loadMultipleTeachersAndSubjects();
  
  // عرض المودال
  const modal = new bootstrap.Modal(document.getElementById('addMultipleClassSessionsModal'));
  modal.show();
}

// دالة لتحميل المعلمين والمواد في المودال المتعدد
async function loadMultipleTeachersAndSubjects() {
  try {
    // تحميل المعلمين
    const teachersResult = await apiService.getTeachers();
    const teacherSelect = document.getElementById('multiSessionTeacher');
    if (teachersResult.success && teachersResult.data) {
      teachersResult.data.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = teacher.name;
        teacherSelect.appendChild(option);
      });
    }
    
    // تحميل المواد
    const subjectsResult = await apiService.getSubjects();
    const subjectSelect = document.getElementById('multiSessionSubject');
    if (subjectsResult.success && subjectsResult.data) {
      subjectsResult.data.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        subjectSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading teachers and subjects:', error);
  }
}

// دالة للتعامل مع إضافة حصص متعددة
async function handleAddMultipleClassSessions(gradeName) {
  // جمع الفصول المحددة
  const selectedClasses = [];
  const checkboxes = document.querySelectorAll('#addMultipleClassSessionsModal input[type="checkbox"]:checked');
  checkboxes.forEach(checkbox => {
    selectedClasses.push(checkbox.value);
  });
  
  if (selectedClasses.length === 0) {
    showAlert('يرجى اختيار فصل واحد على الأقل', 'warning');
    return;
  }
  
  const formData = {
    teacher_id: document.getElementById('multiSessionTeacher').value,
    subject_id: document.getElementById('multiSessionSubject').value,
    grade: gradeName,
    day: document.getElementById('multiSessionDay').value,
    start_time: document.getElementById('multiSessionStartTime').value,
    end_time: document.getElementById('multiSessionEndTime').value,
    period_number: parseInt(document.getElementById('multiSessionPeriod').value)
  };
  
  // التحقق من أن جميع الحقول مملوءة
  if (!formData.teacher_id || !formData.subject_id || !formData.day || !formData.start_time || !formData.end_time || !formData.period_number) {
    showAlert('يرجى ملء جميع الحقول المطلوبة', 'warning');
    return;
  }
  
  try {
    let successCount = 0;
    let errorCount = 0;
    
    // إضافة حصة لكل فصل محدد
    for (const className of selectedClasses) {
      const sessionData = {
        ...formData,
        class_name: className
      };
      
      try {
        const result = await apiService.createClassSession(sessionData);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          console.error(`فشل في إضافة حصة للفصل ${className}:`, result.message);
        }
      } catch (error) {
        errorCount++;
        console.error(`خطأ في إضافة حصة للفصل ${className}:`, error);
      }
    }
    
    // إغلاق المودال
    const modal = bootstrap.Modal.getInstance(document.getElementById('addMultipleClassSessionsModal'));
    modal.hide();
    
    // عرض النتيجة
    if (successCount > 0) {
      showAlert(`تم إضافة ${successCount} حصة بنجاح` + (errorCount > 0 ? ` (فشل ${errorCount})` : ''), successCount > errorCount ? 'success' : 'warning');
      await refreshGradesContent();
    } else {
      showAlert('فشل في إضافة الحصص', 'danger');
    }
  } catch (error) {
    showAlert('حدث خطأ في إضافة الحصص: ' + error.message, 'danger');
  }
}

// دالة لعرض مودال إضافة حصة للصف
function showAddClassSessionModal() {
  // إنشاء مودال ديناميكي لإضافة الحصص
  const modalHtml = `
    <div class="modal fade" id="addClassSessionModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">إضافة حصص للصف</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="addClassSessionForm">
            <div class="modal-body">
              <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                سيتم إضافة الحصص للصف: <strong>${window.tempGradeData?.gradeName}</strong>
              </div>
              
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">المعلم</label>
                  <select class="form-control" id="sessionTeacher" required>
                    <option value="">اختر المعلم</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">المادة</label>
                  <select class="form-control" id="sessionSubject" required>
                    <option value="">اختر المادة</option>
                  </select>
                </div>
              </div>
              
              <div class="row">
                <div class="col-md-4 mb-3">
                  <label class="form-label">اليوم</label>
                  <select class="form-control" id="sessionDay" required>
                    <option value="">اختر اليوم</option>
                    <option value="الأحد">الأحد</option>
                    <option value="الإثنين">الإثنين</option>
                    <option value="الثلاثاء">الثلاثاء</option>
                    <option value="الأربعاء">الأربعاء</option>
                    <option value="الخميس">الخميس</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">وقت البداية</label>
                  <input type="time" class="form-control" id="sessionStartTime" required>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">وقت النهاية</label>
                  <input type="time" class="form-control" id="sessionEndTime" required>
                </div>
              </div>
              
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">رقم الحصة</label>
                  <input type="number" class="form-control" id="sessionPeriod" min="1" max="8" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">الشعبة</label>
                  <input type="text" class="form-control" id="sessionClassName" placeholder="مثال: أ" required>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
              <button type="submit" class="btn btn-primary">إضافة الحصة</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  // إزالة المودال القديم إذا كان موجوداً
  const oldModal = document.getElementById('addClassSessionModal');
  if (oldModal) {
    oldModal.remove();
  }
  
  // إضافة المودال الجديد
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // تحميل بيانات المعلمين والمواد
  loadTeachersAndSubjects();
  
  // عرض المودال
  const modal = new bootstrap.Modal(document.getElementById('addClassSessionModal'));
  modal.show();
  
  // إضافة مستمع للنموذج
  document.getElementById('addClassSessionForm').addEventListener('submit', handleAddClassSession);
}

// دالة لتحميل المعلمين والمواد في القائمة
async function loadTeachersAndSubjects() {
  try {
    // تحميل المعلمين
    const teachersResult = await apiService.getTeachers();
    const teacherSelect = document.getElementById('sessionTeacher');
    if (teachersResult.success && teachersResult.data) {
      teachersResult.data.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = teacher.name;
        teacherSelect.appendChild(option);
      });
    }
    
    // تحميل المواد
    const subjectsResult = await apiService.getSubjects();
    const subjectSelect = document.getElementById('sessionSubject');
    if (subjectsResult.success && subjectsResult.data) {
      subjectsResult.data.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        subjectSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading teachers and subjects:', error);
  }
}

// دالة للتعامل مع إضافة حصة جديدة
async function handleAddClassSession(event) {
  event.preventDefault();
  
  const formData = {
    teacher_id: document.getElementById('sessionTeacher').value,
    subject_id: document.getElementById('sessionSubject').value,
    grade: window.tempGradeData?.gradeName || 'غير محدد',
    class_name: document.getElementById('sessionClassName').value,
    day: document.getElementById('sessionDay').value,
    start_time: document.getElementById('sessionStartTime').value,
    end_time: document.getElementById('sessionEndTime').value,
    period_number: parseInt(document.getElementById('sessionPeriod').value)
  };
  
  try {
    const result = await apiService.createClassSession(formData);
    
    if (result.success) {
      showAlert('تم إضافة الحصة بنجاح', 'success');
      
      // إغلاق المودال
      const modal = bootstrap.Modal.getInstance(document.getElementById('addClassSessionModal'));
      modal.hide();
      
      // تحديث محتوى الفصول
      await refreshGradesContent();
    } else {
      showAlert('حدث خطأ في إضافة الحصة: ' + result.message, 'danger');
    }
  } catch (error) {
    showAlert('حدث خطأ في إضافة الحصة: ' + error.message, 'danger');
  }
}

// دالة لعرض مودال إضافة مادة
function showAddSubjectModal() {
  const modal = new bootstrap.Modal(document.getElementById('addSubjectModal'));
  modal.show();
}

// معالج إضافة مادة جديدة
async function handleAddSubject(event) {
  event.preventDefault();
  
  const formData = {
    name: document.getElementById('addSubjectName').value.trim(),
    name_en: document.getElementById('addSubjectNameEn').value.trim(),
    description: document.getElementById('addSubjectDescription').value.trim()
  };
  
  // التحقق من صحة البيانات
  if (!formData.name || formData.name.length < 2) {
    showNotification('اسم المادة يجب أن يكون أطول من حرفين', 'error');
    return;
  }
  
  if (!formData.name_en || formData.name_en.length < 2) {
    showNotification('الاسم الإنجليزي للمادة يجب أن يكون أطول من حرفين', 'error');
    return;
  }
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>جاري الإضافة...';
    
    const result = await apiService.createSubject(formData);
    
    if (result.success) {
      showNotification('تم إضافة المادة بنجاح', 'success');
      
      // إغلاق المودال
      const modal = bootstrap.Modal.getInstance(document.getElementById('addSubjectModal'));
      modal.hide();
      
      // إعادة تحميل قائمة المواد
      showAdminSection('subjects');
      
      // إعادة تعيين النموذج
      event.target.reset();
    } else {
      throw new Error(result.message || 'فشل في إضافة المادة');
    }
  } catch (error) {
    console.error('خطأ في إضافة المادة:', error);
    showNotification(error.message || 'حدث خطأ أثناء إضافة المادة', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// دالة لعرض مودال إضافة صف
function showAddGradeModal() {
  console.log('showAddGradeModal called');
  const modalElement = document.getElementById('addGradeModal');
  console.log('Modal element:', modalElement);
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    console.log('Modal shown');
  } else {
    console.error('Modal element not found');
  }
}

// دالة للتعامل مع إضافة صف جديد
async function handleAddGrade(event) {
  event.preventDefault();
  
  const gradeName = document.getElementById('gradeName').value;
  const gradeSections = parseInt(document.getElementById('gradeSections').value);
  
  if (!gradeName || !gradeSections) {
    showAlert('يرجى ملء جميع الحقول المطلوبة', 'warning');
    return;
  }
  
  // إغلاق مودال إضافة الصف
  const modal = bootstrap.Modal.getInstance(document.getElementById('addGradeModal'));
  modal.hide();
  
  // إضافة الحصص للصف
  const gradeData = {
    gradeName: gradeName,
    sections: gradeSections
  };
  
  await addClassSession(gradeData);
}

// دالة لعرض مودال إضافة حصة مباشرة (من قسم إدارة الحصص)
function showAddClassSessionDirectModal() {
  // إنشاء مودال ديناميكي لإضافة حصة مباشرة
  const modalHtml = `
    <div class="modal fade" id="addClassSessionDirectModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">إضافة حصة جديدة</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="addClassSessionDirectForm">
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">المعلم</label>
                  <select class="form-control" id="directSessionTeacher" required>
                    <option value="">اختر المعلم</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">المادة</label>
                  <select class="form-control" id="directSessionSubject" required>
                    <option value="">اختر المادة</option>
                  </select>
                </div>
              </div>
              
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">الصف</label>
                  <input type="text" class="form-control" id="directSessionGrade" placeholder="مثال: السادس" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">الشعبة</label>
                  <input type="text" class="form-control" id="directSessionClassName" placeholder="مثال: أ" required>
                </div>
              </div>
              
              <div class="row">
                <div class="col-md-4 mb-3">
                  <label class="form-label">اليوم</label>
                  <select class="form-control" id="directSessionDay" required>
                    <option value="">اختر اليوم</option>
                    <option value="الأحد">الأحد</option>
                    <option value="الإثنين">الإثنين</option>
                    <option value="الثلاثاء">الثلاثاء</option>
                    <option value="الأربعاء">الأربعاء</option>
                    <option value="الخميس">الخميس</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">وقت البداية</label>
                  <input type="time" class="form-control" id="directSessionStartTime" required>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">وقت النهاية</label>
                  <input type="time" class="form-control" id="directSessionEndTime" required>
                </div>
              </div>
              
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">رقم الحصة</label>
                  <input type="number" class="form-control" id="directSessionPeriod" min="1" max="8" required>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
              <button type="submit" class="btn btn-primary">إضافة الحصة</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  // إزالة المودال القديم إذا كان موجوداً
  const oldModal = document.getElementById('addClassSessionDirectModal');
  if (oldModal) {
    oldModal.remove();
  }
  
  // إضافة المودال الجديد
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // تحميل بيانات المعلمين والمواد
  loadDirectTeachersAndSubjects();
  
  // عرض المودال
  const modal = new bootstrap.Modal(document.getElementById('addClassSessionDirectModal'));
  modal.show();
  
  // إضافة مستمع للنموذج
  document.getElementById('addClassSessionDirectForm').addEventListener('submit', handleAddClassSessionDirect);
}

// دالة لتحميل المعلمين والمواد في المودال المباشر
async function loadDirectTeachersAndSubjects() {
  try {
    // تحميل المعلمين
    const teachersResult = await apiService.getTeachers();
    const teacherSelect = document.getElementById('directSessionTeacher');
    if (teachersResult.success && teachersResult.data) {
      teachersResult.data.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = teacher.name;
        teacherSelect.appendChild(option);
      });
    }
    
    // تحميل المواد
    const subjectsResult = await apiService.getSubjects();
    const subjectSelect = document.getElementById('directSessionSubject');
    if (subjectsResult.success && subjectsResult.data) {
      subjectsResult.data.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        subjectSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading teachers and subjects:', error);
  }
}

// دالة للتعامل مع إضافة حصة مباشرة
async function handleAddClassSessionDirect(event) {
  event.preventDefault();
  
  const formData = {
    teacher_id: document.getElementById('directSessionTeacher').value,
    subject_id: document.getElementById('directSessionSubject').value,
    grade: document.getElementById('directSessionGrade').value,
    class_name: document.getElementById('directSessionClassName').value,
    day: document.getElementById('directSessionDay').value,
    start_time: document.getElementById('directSessionStartTime').value,
    end_time: document.getElementById('directSessionEndTime').value,
    period_number: parseInt(document.getElementById('directSessionPeriod').value)
  };
  
  try {
    const result = await apiService.createClassSession(formData);
    
    if (result.success) {
      showAlert('تم إضافة الحصة بنجاح', 'success');
      
      // إغلاق المودال
      const modal = bootstrap.Modal.getInstance(document.getElementById('addClassSessionDirectModal'));
      modal.hide();
      
      // تحديث محتوى الحصص
      await refreshClassesContent();
    } else {
      showAlert('حدث خطأ في إضافة الحصة: ' + result.message, 'danger');
    }
  } catch (error) {
    showAlert('حدث خطأ في إضافة الحصة: ' + error.message, 'danger');
  }
}

// دالة لتحديث محتوى الحصص
async function refreshClassesContent() {
  const adminContent = document.getElementById('adminContent');
  if (adminContent) {
    try {
      adminContent.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
      const content = await getClassesContent();
      adminContent.innerHTML = content;
    } catch (error) {
      adminContent.innerHTML = `<div class="alert alert-danger">حدث خطأ في تحديث الحصص: ${error.message}</div>`;
    }
  }
}

// دالة لعرض جدول الحصص
function showClassScheduleView() {
  // سيتم تنفيذها لاحقاً
  showAlert('ميزة عرض الجدول ستكون متاحة قريباً', 'info');
}

// دالة عرض قسم الجدول الأسبوعي
function showTeacherSchedule() {
    // إخفاء محتوى الحصص اليومية
    const classesList = document.getElementById('classesList');
    const scheduleContainer = document.getElementById('scheduleContainer');
    const cardTitle = document.getElementById('cardTitle');
    const backBtn = document.getElementById('backToClassesBtn');
    
    if (classesList) classesList.style.display = 'none';
    if (scheduleContainer) scheduleContainer.style.display = 'block';
    if (cardTitle) cardTitle.innerHTML = '<i class="bi bi-calendar-week me-2"></i>الجدول الأسبوعي للمعلم';
    if (backBtn) backBtn.style.display = 'inline-block';
    
    loadTeacherSchedule();
}

// دالة إخفاء قسم الجدول والعودة للحصص اليومية
function hideScheduleSection() {
    // إظهار محتوى الحصص اليومية
    const classesList = document.getElementById('classesList');
    const scheduleContainer = document.getElementById('scheduleContainer');
    const cardTitle = document.getElementById('cardTitle');
    const backBtn = document.getElementById('backToClassesBtn');
    
    if (classesList) classesList.style.display = 'block';
    if (scheduleContainer) scheduleContainer.style.display = 'none';
    if (cardTitle) cardTitle.innerHTML = '<i class="bi bi-calendar-check me-2"></i>حصص اليوم';
    if (backBtn) backBtn.style.display = 'none';
}

// دالة تحميل جدول المعلم الأسبوعي
async function loadTeacherSchedule() {
    try {
        const scheduleContainer = document.getElementById('scheduleContainer');
        if (!scheduleContainer) return;
        
        // إظهار حالة التحميل
        scheduleContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">جاري التحميل...</span>
                </div>
                <p class="mt-3 text-muted">جاري تحميل الجدول الأسبوعي...</p>
            </div>
        `;
        
        const sessionsResult = await apiService.getTeacherSessions();
        const sessions = sessionsResult.data || [];
        
        console.log('بيانات الحصص للجدول الأسبوعي:', sessions);
        
        if (!sessions || sessions.length === 0) {
            scheduleContainer.innerHTML = `
                <div class="alert alert-info text-center">
                    <i class="bi bi-info-circle me-2"></i>
                    لا توجد حصص مجدولة هذا الأسبوع
                </div>
            `;
            return;
        }

        // أيام الأسبوع
        const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
        
        // استخراج جميع الأوقات الفريدة من الحصص وترتيبها
        const uniqueTimes = [...new Set(sessions.map(s => s.formatted_start_time || s.start_time?.substring(0, 5)))];
        const timeSlots = uniqueTimes.filter(time => time).sort();
        
        console.log('الأوقات المستخرجة من الحصص:', timeSlots);
        
        if (timeSlots.length === 0) {
            scheduleContainer.innerHTML = `
                <div class="alert alert-warning text-center">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    لا توجد أوقات محددة للحصص
                </div>
            `;
            return;
        }
        
        let scheduleHTML = `
            <div class="table-responsive">
                <table class="table table-bordered text-center" id="scheduleTable">
                    <thead>
                        <tr>
                            <th style="width: 120px;">الوقت</th>
                            ${daysOfWeek.map(day => `<th>${day}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        // إنشاء جدول الحصص بناءً على الأوقات الفعلية
        timeSlots.forEach(timeSlot => {
            scheduleHTML += `<tr>`;
            
            // البحث عن حصة في هذا الوقت لاستخراج وقت الانتهاء
            const sampleSession = sessions.find(s => 
                (s.formatted_start_time || s.start_time?.substring(0, 5)) === timeSlot
            );
            const endTime = sampleSession ? 
                (sampleSession.formatted_end_time || sampleSession.end_time?.substring(0, 5)) : 
                timeSlot;
            
            scheduleHTML += `<td class="fw-bold bg-light">${timeSlot} - ${endTime}</td>`;
            
            daysOfWeek.forEach((day, dayIndex) => {
                // البحث عن الحصة بناءً على اليوم والوقت
                const session = sessions.find(s => {
                    const sessionDay = s.day;
                    const sessionTime = s.formatted_start_time || s.start_time?.substring(0, 5);
                    
                    return sessionDay === day && sessionTime === timeSlot;
                });

                if (session) {
                    const currentDay = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
                    const isToday = dayIndex === currentDay;
                    
                    scheduleHTML += `
                        <td class="schedule-cell ${isToday ? 'current-day' : ''} ${session.is_current ? 'current-session' : ''}" style="background-color: ${session.is_current ? '#e3f2fd' : ''}">
                            <div class="fw-bold text-primary">${session.subject?.name || 'غير محدد'}</div>
                            <div class="small text-muted">${session.grade || 'غير محدد'} - ${session.class_name || ''}</div>
                            ${session.is_current ? '<div class="badge bg-success mt-1">جارية الآن</div>' : ''}
                            ${session.can_take_attendance ? '<div class="badge bg-warning mt-1">يمكن أخذ الحضور</div>' : ''}
                        </td>
                    `;
                } else {
                    scheduleHTML += `<td class="text-muted">-</td>`;
                }
            });
            
            scheduleHTML += `</tr>`;
        });

        scheduleHTML += `
                    </tbody>
                </table>
            </div>
        `;

        scheduleContainer.innerHTML = scheduleHTML;
        
    } catch (error) {
        console.error('خطأ في تحميل الجدول الأسبوعي:', error);
        const scheduleContainer = document.getElementById('scheduleContainer');
        if (scheduleContainer) {
            scheduleContainer.innerHTML = `
                <div class="alert alert-danger text-center">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    خطأ في تحميل الجدول الأسبوعي: ${error.message || 'خطأ غير معروف'}
                    <br>
                    <button class="btn btn-outline-primary btn-sm mt-2" onclick="loadTeacherSchedule()">إعادة المحاولة</button>
                </div>
            `;
        }
    }
}

// دالة مساعدة لتحويل اليوم إلى فهرس
function getDayIndex(dayName) {
    const days = {
        'الأحد': 0,
        'الاثنين': 1,
        'الثلاثاء': 2,
        'الأربعاء': 3,
        'الخميس': 4
    };
    return days[dayName] || 0;
}

// ==================== إدارة التوقيتات ====================

// محتوى إدارة التوقيتات
async function getSchedulesContent() {
  try {
    const result = await apiService.getSchedules();
    let schedulesHtml = '';
    
    if (result.success && result.data.length > 0) {
      result.data.forEach(schedule => {
        const periodsCount = schedule.periods ? schedule.periods.length : 0;
        const statusBadge = schedule.is_active ? 
          '<span class="badge bg-success">مفعل</span>' : 
          '<span class="badge bg-secondary">غير مفعل</span>';
        
        schedulesHtml += `
          <div class="col-md-6 col-lg-4 mb-3">
            <div class="card">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h5 class="card-title">${schedule.name}</h5>
                  ${statusBadge}
                </div>
                <p class="card-text text-muted mb-2">
                  <small>
                    <i class="bi bi-calendar me-1"></i>${schedule.type === 'winter' ? 'شتوي' : schedule.type === 'summer' ? 'صيفي' : 'مخصص'}
                    ${schedule.target_level ? ` • ${schedule.target_level}` : ''}
                  </small>
                </p>
                <p class="card-text text-muted mb-3">
                  <small><i class="bi bi-clock me-1"></i>${periodsCount} فترة</small>
                </p>
                <div class="d-flex gap-1">
                  ${!schedule.is_active ? `
                    <button class="btn btn-sm btn-success" onclick="activateSchedule(${schedule.id})" title="تفعيل">
                      <i class="bi bi-check-circle"></i>
                    </button>
                  ` : ''}
                  <button class="btn btn-sm btn-primary" onclick="viewScheduleDetails(${schedule.id})" title="عرض التفاصيل">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-warning" onclick="editSchedule(${schedule.id})" title="تعديل">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="deleteSchedule(${schedule.id})" title="حذف">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      });
    } else {
      schedulesHtml = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-clock display-4 text-muted"></i>
          <p class="mt-3 text-muted">لا توجد توقيتات مسجلة</p>
          <button class="btn btn-primary" onclick="showCreateScheduleModal()">
            <i class="bi bi-plus me-2"></i>إنشاء توقيت جديد
          </button>
        </div>
      `;
    }
    
    return `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4><i class="bi bi-clock me-2"></i>إدارة التوقيتات</h4>
        <div>
          <button class="btn btn-success me-2" onclick="showCreateScheduleModal()">
            <i class="bi bi-plus me-2"></i>توقيت جديد
          </button>
          <button class="btn btn-outline-primary" onclick="showScheduleTemplatesModal()">
            <i class="bi bi-file-earmark-text me-2"></i>القوالب
          </button>
        </div>
      </div>

      <div class="row">
        ${schedulesHtml}
      </div>
    `;
  } catch (error) {
    return `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        حدث خطأ أثناء تحميل التوقيتات: ${error.message}
      </div>
    `;
  }
}

// محتوى إدارة جداول الفصول
async function getClassSchedulesContent() {
  try {
    const result = await apiService.getClasses();
    let classesHtml = '';
    
    if (result.success && result.data.length > 0) {
      result.data.forEach(classItem => {
        classesHtml += `
          <div class="col-md-6 col-lg-4 mb-3">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">${classItem.name}</h5>
                <p class="card-text text-muted">
                  <i class="bi bi-people me-1"></i>${classItem.students_count} طالب
                </p>
                <button class="btn btn-primary w-100" onclick="showClassSchedule('${classItem.grade}', '${classItem.class_name}')">
                  <i class="bi bi-table me-2"></i>عرض الجدول
                </button>
              </div>
            </div>
          </div>
        `;
      });
    } else {
      classesHtml = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-building display-4 text-muted"></i>
          <p class="mt-3 text-muted">لا توجد فصول مسجلة</p>
          <small class="text-muted">قم بإضافة طلاب أولاً لظهور الفصول</small>
        </div>
      `;
    }
    
    return `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4><i class="bi bi-table me-2"></i>جداول الفصول</h4>
      </div>

      <div class="row">
        ${classesHtml}
      </div>
    `;
  } catch (error) {
    return `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        حدث خطأ أثناء تحميل الفصول: ${error.message}
      </div>
    `;
  }
}

// تفعيل توقيت
async function activateSchedule(scheduleId) {
  if (!confirm('هل أنت متأكد من تفعيل هذا التوقيت؟')) {
    return;
  }
  
  try {
    const result = await apiService.activateSchedule(scheduleId);
    
    if (result.success) {
      showNotification('تم تفعيل التوقيت بنجاح', 'success');
      showAdminSection('schedules'); // إعادة تحميل المحتوى
    }
  } catch (error) {
    showNotification(error.message || 'حدث خطأ أثناء تفعيل التوقيت', 'error');
  }
}

// عرض تفاصيل توقيت
async function viewScheduleDetails(scheduleId) {
  try {
    const result = await apiService.getScheduleDetails(scheduleId);
    
    if (result.success) {
      const schedule = result.data;
      let periodsHtml = '';
      
      if (schedule.periods && schedule.periods.length > 0) {
        schedule.periods.forEach(period => {
          periodsHtml += `
            <tr>
              <td>${period.period_number}</td>
              <td>${period.period_name || 'حصة ' + period.period_number}</td>
              <td>${period.start_time}</td>
              <td>${period.end_time}</td>
              <td>
                ${period.is_break ? 
                  '<span class="badge bg-warning">فسحة</span>' : 
                  '<span class="badge bg-primary">حصة</span>'
                }
              </td>
            </tr>
          `;
        });
      }
      
      const modalHtml = `
        <div class="modal fade" id="scheduleDetailsModal" tabindex="-1">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">تفاصيل التوقيت: ${schedule.name}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <div class="row mb-3">
                  <div class="col-md-6">
                    <strong>النوع:</strong> ${schedule.type === 'winter' ? 'شتوي' : schedule.type === 'summer' ? 'صيفي' : 'مخصص'}
                  </div>
                  <div class="col-md-6">
                    <strong>الحالة:</strong> 
                    ${schedule.is_active ? 
                      '<span class="badge bg-success">مفعل</span>' : 
                      '<span class="badge bg-secondary">غير مفعل</span>'
                    }
                  </div>
                </div>
                ${schedule.target_level ? `
                  <div class="row mb-3">
                    <div class="col-12">
                      <strong>المرحلة المستهدفة:</strong> ${schedule.target_level}
                    </div>
                  </div>
                ` : ''}
                ${schedule.description ? `
                  <div class="row mb-3">
                    <div class="col-12">
                      <strong>الوصف:</strong> ${schedule.description}
                    </div>
                  </div>
                ` : ''}
                
                <h6>الفترات الزمنية:</h6>
                <div class="table-responsive">
                  <table class="table table-striped">
                    <thead>
                      <tr>
                        <th>رقم الفترة</th>
                        <th>اسم الفترة</th>
                        <th>وقت البداية</th>
                        <th>وقت النهاية</th>
                        <th>النوع</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${periodsHtml || '<tr><td colspan="5" class="text-center">لا توجد فترات محددة</td></tr>'}
                    </tbody>
                  </table>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                ${!schedule.is_active ? `
                  <button type="button" class="btn btn-success" onclick="activateSchedule(${schedule.id}); bootstrap.Modal.getInstance(document.getElementById('scheduleDetailsModal')).hide();">
                    <i class="bi bi-check-circle me-2"></i>تفعيل
                  </button>
                ` : ''}
                <button type="button" class="btn btn-warning" onclick="editSchedule(${schedule.id})">
                  <i class="bi bi-pencil me-2"></i>تعديل
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // إزالة المودال السابق إن وجد
      const existingModal = document.getElementById('scheduleDetailsModal');
      if (existingModal) {
        existingModal.remove();
      }
      
      // إضافة المودال الجديد
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      // إظهار المودال
      const modal = new bootstrap.Modal(document.getElementById('scheduleDetailsModal'));
      modal.show();
    }
  } catch (error) {
    showNotification('حدث خطأ أثناء جلب تفاصيل التوقيت: ' + error.message, 'error');
  }
}

// تعديل توقيت
async function editSchedule(scheduleId) {
  try {
    // استخدام apiService مباشرة
    const result = await apiService.get(`/admin/schedules/${scheduleId}`);
    
    if (!result.success) {
      throw new Error(result.message || 'فشل في جلب بيانات التوقيت');
    }
    
    const schedule = result.data;
    
    // إظهار مودال التعديل
    const modalHtml = `
      <div class="modal fade" id="editScheduleModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">تعديل التوقيت</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="editScheduleForm">
              <div class="modal-body">
                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="form-label">اسم التوقيت</label>
                      <input type="text" class="form-control" id="editScheduleName" name="name" required value="${schedule.name}">
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="form-label">نوع التوقيت</label>
                      <select class="form-control" id="editScheduleType" name="type" required>
                        <option value="winter" ${schedule.type === 'winter' ? 'selected' : ''}>شتوي</option>
                        <option value="summer" ${schedule.type === 'summer' ? 'selected' : ''}>صيفي</option>
                        <option value="custom" ${schedule.type === 'custom' ? 'selected' : ''}>مخصص</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="form-label">المرحلة المستهدفة</label>
                      <input type="text" class="form-control" id="editScheduleTargetLevel" name="target_level" value="${schedule.target_level || ''}">
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="form-label">الوصف</label>
                      <input type="text" class="form-control" id="editScheduleDescription" name="description" value="${schedule.description || ''}">
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                <button type="submit" class="btn btn-primary">حفظ التغييرات</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // إزالة أي مودال موجود وإضافة الجديد
    const existingModal = document.getElementById('editScheduleModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // تهيئة المودال
    const modal = new bootstrap.Modal(document.getElementById('editScheduleModal'));
    modal.show();
    
    // معالجة الفورم
    document.getElementById('editScheduleForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      await updateSchedule(scheduleId, new FormData(this));
      modal.hide();
    });
    
  } catch (error) {
    showNotification('خطأ في تحميل بيانات التوقيت: ' + error.message, 'error');
  }
}

// وظيفة تحديث التوقيت
async function updateSchedule(scheduleId, formData) {
  try {
    const scheduleData = {
      name: formData.get('name'),
      type: formData.get('type'),
      target_level: formData.get('target_level'),
      description: formData.get('description')
    };
    
    // استخدام apiService مباشرة
    const result = await apiService.put(`/admin/schedules/${scheduleId}`, scheduleData);
    
    if (result.success) {
      showNotification('تم تحديث التوقيت بنجاح', 'success');
      // إعادة تحميل قائمة التوقيتات
      showSection('schedules');
    } else {
      throw new Error(result.message || 'فشل في تحديث التوقيت');
    }
    
  } catch (error) {
    showNotification('خطأ في تحديث التوقيت: ' + error.message, 'error');
  }
}

// إظهار مودال إنشاء توقيت جديد
async function showCreateScheduleModal() {
  const modalHtml = `
    <div class="modal fade" id="createScheduleModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">إنشاء توقيت جديد</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="createScheduleForm">
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">اسم التوقيت</label>
                    <input type="text" class="form-control" id="scheduleName" name="scheduleName" required placeholder="مثال: التوقيت الشتوي">
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">نوع التوقيت</label>
                    <select class="form-control" id="scheduleType" name="scheduleType" required>
                      <option value="">اختر النوع</option>
                      <option value="winter">شتوي</option>
                      <option value="summer">صيفي</option>
                      <option value="custom">مخصص</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">المرحلة المستهدفة (اختياري)</label>
                    <input type="text" class="form-control" id="scheduleTargetLevel" name="scheduleTargetLevel" placeholder="مثال: الابتدائية">
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">الوصف (اختياري)</label>
                    <input type="text" class="form-control" id="scheduleDescription" name="scheduleDescription" placeholder="وصف مختصر للتوقيت">
                  </div>
                </div>
              </div>
              
              <hr>
              
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6>الفترات الزمنية</h6>
                <button type="button" class="btn btn-sm btn-primary" onclick="addSchedulePeriod()">
                  <i class="bi bi-plus me-1"></i>إضافة فترة
                </button>
              </div>
              
              <div id="schedulePeriodsContainer">
                <!-- سيتم إضافة الفترات هنا -->
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
              <button type="submit" class="btn btn-primary">إنشاء التوقيت</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  // إزالة المودال السابق إن وجد
  const existingModal = document.getElementById('createScheduleModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // إضافة المودال الجديد
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // إضافة مستمع للنموذج
  document.getElementById('createScheduleForm').addEventListener('submit', handleCreateSchedule);
  
  // إضافة فترة افتراضية
  addSchedulePeriod();
  
  // إظهار المودال
  const modal = new bootstrap.Modal(document.getElementById('createScheduleModal'));
  modal.show();
}

// إضافة فترة جديدة لنموذج التوقيت
function addSchedulePeriod() {
  const container = document.getElementById('schedulePeriodsContainer');
  const periodsCount = container.children.length;
  const periodNumber = periodsCount + 1;
  
  const periodHtml = `
    <div class="period-item border rounded p-3 mb-3" data-period="${periodNumber}">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="mb-0">الفترة ${periodNumber}</h6>
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="removePeriod(this)">
          <i class="bi bi-trash"></i>
        </button>
      </div>
      
      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">اسم الفترة</label>
            <input type="text" class="form-control" name="period_name[]" placeholder="مثال: الحصة الأولى">
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">نوع الفترة</label>
            <select class="form-control" name="is_break[]" onchange="toggleBreakFields(this)">
              <option value="0">حصة دراسية</option>
              <option value="1">فسحة</option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-4">
          <div class="mb-3">
            <label class="form-label">وقت البداية</label>
            <input type="time" class="form-control" name="start_time[]" required>
          </div>
        </div>
        <div class="col-md-4">
          <div class="mb-3">
            <label class="form-label">وقت النهاية</label>
            <input type="time" class="form-control" name="end_time[]" required>
          </div>
        </div>
        <div class="col-md-4 break-duration" style="display: none;">
          <div class="mb-3">
            <label class="form-label">مدة الفسحة (دقيقة)</label>
            <input type="number" class="form-control" name="break_duration[]" min="1" max="60">
          </div>
        </div>
      </div>
      
      <input type="hidden" name="period_number[]" value="${periodNumber}">
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', periodHtml);
}

// إزالة فترة
function removePeriod(button) {
  const periodItem = button.closest('.period-item');
  periodItem.remove();
  updatePeriodNumbers();
}

// تحديث أرقام الفترات
function updatePeriodNumbers() {
  const container = document.getElementById('schedulePeriodsContainer');
  const periods = container.children;
  
  for (let i = 0; i < periods.length; i++) {
    const period = periods[i];
    const periodNumber = i + 1;
    
    period.dataset.period = periodNumber;
    period.querySelector('h6').textContent = `الفترة ${periodNumber}`;
    period.querySelector('input[name="period_number[]"]').value = periodNumber;
  }
}

// تفعيل/إلغاء حقول الفسحة
function toggleBreakFields(select) {
  const periodItem = select.closest('.period-item');
  const breakDurationField = periodItem.querySelector('.break-duration');
  
  if (select.value === '1') {
    breakDurationField.style.display = 'block';
    breakDurationField.querySelector('input').required = true;
  } else {
    breakDurationField.style.display = 'none';
    breakDurationField.querySelector('input').required = false;
  }
}

// معالجة إنشاء التوقيت
async function handleCreateSchedule(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  
  // جمع البيانات الأساسية
  const scheduleName = formData.get('scheduleName');
  const scheduleType = formData.get('scheduleType');
  const scheduleTargetLevel = formData.get('scheduleTargetLevel');
  const scheduleDescription = formData.get('scheduleDescription');
  
  console.log('Schedule data:', {
    name: scheduleName,
    type: scheduleType,
    target_level: scheduleTargetLevel,
    description: scheduleDescription
  });
  
  const scheduleData = {
    name: scheduleName,
    type: scheduleType,
    target_level: scheduleTargetLevel,
    description: scheduleDescription,
    periods: []
  };
  
  // جمع بيانات الفترات
  const periodNumbers = formData.getAll('period_number[]');
  const periodNames = formData.getAll('period_name[]');
  const startTimes = formData.getAll('start_time[]');
  const endTimes = formData.getAll('end_time[]');
  const isBreaks = formData.getAll('is_break[]');
  const breakDurations = formData.getAll('break_duration[]');
  
  for (let i = 0; i < periodNumbers.length; i++) {
    scheduleData.periods.push({
      period_number: parseInt(periodNumbers[i]),
      period_name: periodNames[i] || null,
      start_time: startTimes[i],
      end_time: endTimes[i],
      is_break: isBreaks[i] === '1',
      break_duration: isBreaks[i] === '1' ? parseInt(breakDurations[i]) || null : null
    });
  }
  
  console.log('Full schedule data:', scheduleData);
  
  // التحقق من البيانات
  if (!scheduleData.name || scheduleData.name.trim() === '') {
    showNotification('اسم التوقيت مطلوب', 'error');
    return;
  }
  
  if (!scheduleData.type || scheduleData.type.trim() === '') {
    showNotification('نوع التوقيت مطلوب', 'error');
    return;
  }
  
  if (scheduleData.periods.length === 0) {
    showNotification('يجب إضافة فترة واحدة على الأقل', 'error');
    return;
  }
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>جاري الإنشاء...';
    
    const result = await apiService.createSchedule(scheduleData);
    
    if (result.success) {
      showNotification('تم إنشاء التوقيت بنجاح', 'success');
      
      // إغلاق المودال
      const modal = bootstrap.Modal.getInstance(document.getElementById('createScheduleModal'));
      modal.hide();
      
      // إعادة تحميل قائمة التوقيتات
      showAdminSection('schedules');
    }
  } catch (error) {
    console.error('Error creating schedule:', error);
    showNotification(error.message || 'حدث خطأ أثناء إنشاء التوقيت', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// حذف توقيت
async function deleteSchedule(scheduleId) {
  try {
    // أولاً نتحقق من وجود حصص مرتبطة
    const checkResult = await apiService.get(`/admin/schedules/${scheduleId}`);
    
    if (!checkResult.success) {
      throw new Error(checkResult.message || 'فشل في التحقق من التوقيت');
    }
    
    const schedule = checkResult.data;
    let confirmMessage = 'هل أنت متأكد من حذف هذا التوقيت؟\nلن يمكن التراجع عن هذه العملية.';
    
    // إذا كان هناك حصص مرتبطة، نضيف تحذير
    if (schedule.sessions_count && schedule.sessions_count > 0) {
      confirmMessage = `تحذير: هذا التوقيت مرتبط بـ ${schedule.sessions_count} حصة!\n\nإذا قمت بحذفه ستتأثر جميع هذه الحصص.\nهل أنت متأكد من المتابعة؟`;
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    const result = await apiService.deleteSchedule(scheduleId);
    
    if (result.success) {
      showNotification('تم حذف التوقيت بنجاح', 'success');
      showAdminSection('schedules'); // إعادة تحميل المحتوى
    }
  } catch (error) {
    if (error.message.includes('مرتبط بحصص')) {
      showNotification('لا يمكن حذف هذا التوقيت لأنه مرتبط بحصص نشطة. قم بإزالة أو تغيير التوقيت للحصص أولاً.', 'warning');
    } else {
      showNotification(error.message || 'حدث خطأ أثناء حذف التوقيت', 'error');
    }
  }
}

// عرض جدول فصل محدد
async function showClassSchedule(grade, className) {
  try {
    // عرض مؤشر التحميل
    const adminContent = document.getElementById('adminContent');
    adminContent.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="mt-2">جاري تحميل جدول الفصل...</div>
      </div>
    `;

    const result = await apiService.getClassSchedule(grade, className);
    
    if (result.success) {
      const scheduleData = result.data.schedule;
      const classInfo = result.data.class_info;
      const appliedSchedule = result.data.applied_schedule;
      
      // إنشاء جدول تفاعلي
      let tableHtml = `
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4><i class="bi bi-table me-2"></i>جدول ${classInfo.full_name}</h4>
            ${appliedSchedule ? `<small class="text-muted">التوقيت المطبق: ${appliedSchedule.name}</small>` : ''}
          </div>
          <div>
            <button class="btn btn-outline-secondary me-2" onclick="showAdminSection('class-schedules')">
              <i class="bi bi-arrow-right"></i> العودة
            </button>
            <button class="btn btn-primary" onclick="showApplyScheduleModal('${grade}', '${className}')">
              <i class="bi bi-clock"></i> تطبيق توقيت
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-bordered">
            <thead class="table-light">
              <tr>
                <th width="15%">اليوم / الحصة</th>`;
      
      // إنشاء رؤوس الحصص مع التوقيت إذا كان متوفر
      for (let period = 1; period <= 5; period++) {
        // البحث عن أي حصة لهذه الفترة لاستخراج التوقيت
        let periodTime = '';
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
        for (const day of days) {
          if (scheduleData[day] && scheduleData[day][period]) {
            const session = scheduleData[day][period];
            // تنسيق التوقيت بشكل صحيح
            const startTime = formatTime(session.start_time);
            const endTime = formatTime(session.end_time);
            
            if (startTime && endTime) {
              periodTime = `<br><small class="text-muted">${startTime} - ${endTime}</small>`;
            }
            break;
          }
        }
        
        tableHtml += `<th width="17%">الحصة ${period}${periodTime}</th>`;
      }
      
      tableHtml += `
              </tr>
            </thead>
            <tbody>
      `;
      
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
      
      days.forEach(day => {
        tableHtml += `<tr><td class="fw-bold bg-light">${day}</td>`;
        
        for (let period = 1; period <= 5; period++) {
          const session = scheduleData[day] && scheduleData[day][period];
          
          if (session) {
            // تنسيق التوقيت بشكل صحيح
            const startTime = formatTime(session.start_time);
            const endTime = formatTime(session.end_time);
            const timeDisplay = (startTime && endTime) ? `${startTime} - ${endTime}` : '';
            
            tableHtml += `
              <td class="session-cell filled" data-day="${day}" data-period="${period}">
                <div class="session-info">
                  <strong>${session.subject_name}</strong><br>
                  <small class="text-muted">${session.teacher_name}</small>
                  ${timeDisplay ? `<br><small class="text-primary">${timeDisplay}</small>` : ''}
                </div>
                <button class="btn btn-sm btn-outline-danger mt-1" onclick="deleteSession(${session.id})" title="حذف">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            `;
          } else {
            tableHtml += `
              <td class="session-cell empty" data-day="${day}" data-period="${period}">
                <button class="btn btn-outline-primary w-100" onclick="showAddSessionModal('${grade}', '${className}', '${day}', ${period})">
                  <i class="bi bi-plus"></i> إضافة حصة
                </button>
              </td>
            `;
          }
        }
        
        tableHtml += '</tr>';
      });
      
      tableHtml += `
            </tbody>
          </table>
        </div>
      `;
      
      adminContent.innerHTML = tableHtml;
    }
  } catch (error) {
    const adminContent = document.getElementById('adminContent');
    adminContent.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        حدث خطأ أثناء تحميل جدول الفصل: ${error.message}
      </div>
    `;
  }
}

// إظهار مودال إضافة حصة
async function showAddSessionModal(grade, className, day, period) {
  try {
    // إعداد نص معلومات الموقع
    const locationText = document.getElementById('sessionLocationText');
    locationText.textContent = `${day} - الحصة ${period} - فصل ${grade} ${className}`;
    
    // ملء البيانات المخفية تلقائياً
    document.getElementById('classGrade').value = grade;
    document.getElementById('className').value = className;
    document.getElementById('classDay').value = day;
    document.getElementById('classPeriodNumber').value = period;
    
    // محاولة جلب التوقيت المطبق على هذا الفصل
    try {
      const classScheduleResult = await apiService.getClassSchedule(grade, className);
      if (classScheduleResult.success && classScheduleResult.data.applied_schedule) {
        const appliedSchedule = classScheduleResult.data.applied_schedule;
        document.getElementById('selectedScheduleId').value = appliedSchedule.id;
        
        // جلب تفاصيل التوقيت لتحديد الأوقات
        const scheduleResult = await apiService.getScheduleDetails(appliedSchedule.id);
        if (scheduleResult.success && scheduleResult.data.periods) {
          const periodData = scheduleResult.data.periods.find(p => p.period_number == period);
          
          if (periodData) {
            document.getElementById('classStartTime').value = periodData.start_time;
            document.getElementById('classEndTime').value = periodData.end_time;
          } else {
            // استخدام أوقات افتراضية
            setDefaultTimes(period);
          }
        } else {
          setDefaultTimes(period);
        }
      } else {
        // لا يوجد توقيت مطبق، استخدام أوقات افتراضية
        document.getElementById('selectedScheduleId').value = '';
        setDefaultTimes(period);
      }
    } catch (error) {
      console.warn('تعذر جلب التوقيت المطبق، سيتم استخدام أوقات افتراضية');
      setDefaultTimes(period);
    }
    
    // تحميل قوائم المعلمين والمواد
    await loadClassModalData();
    
    // مسح الحقول القابلة للتعديل
    document.getElementById('classTeacherId').value = '';
    document.getElementById('classSubjectId').value = '';
    document.getElementById('classNotes').value = '';
    
    // إظهار المودال
    const modal = new bootstrap.Modal(document.getElementById('addClassModal'));
    modal.show();
  } catch (error) {
    showNotification('حدث خطأ أثناء فتح مودال إضافة الحصة: ' + error.message, 'error');
  }
}

// دالة مساعدة لتعيين الأوقات الافتراضية
function setDefaultTimes(period) {
  const defaultStartTimes = {
    1: '07:30',
    2: '08:30', 
    3: '09:30',
    4: '10:30',
    5: '11:30',
    6: '12:30',
    7: '13:30',
    8: '14:30'
  };
  
  const startTime = defaultStartTimes[period] || '07:30';
  const endTime = addOneHour(startTime);
  
  document.getElementById('classStartTime').value = startTime;
  document.getElementById('classEndTime').value = endTime;
}

// إظهار مودال تطبيق توقيت
async function showApplyScheduleModal(grade, className) {
  try {
    // إنشاء مودال ديناميكي
    const modalId = 'applyScheduleModal';
    let modal = document.getElementById(modalId);
    
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = modalId;
      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">تطبيق توقيت على الفصل</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="applyScheduleForm">
              <div class="modal-body">
                <div class="alert alert-info">
                  <i class="bi bi-info-circle me-2"></i>
                  سيتم تطبيق التوقيت المختار على فصل ${grade} ${className}
                </div>
                
                <div class="mb-3">
                  <label class="form-label">اختر التوقيت</label>
                  <select class="form-control" id="scheduleToApply" required>
                    <option value="">جاري التحميل...</option>
                  </select>
                </div>
                
                <div class="mb-3">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="replaceExisting" checked>
                    <label class="form-check-label" for="replaceExisting">
                      استبدال الحصص الموجودة
                      <small class="text-muted d-block">في حالة عدم التحديد، سيتم إضافة الحصص فقط للفترات الفارغة</small>
                    </label>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                <button type="submit" class="btn btn-primary">تطبيق التوقيت</button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      // إضافة مستمع للنموذج
      document.getElementById('applyScheduleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleApplySchedule(grade, className);
      });
    }
    
    // تحميل قائمة التوقيتات
    const schedulesResult = await apiService.getSchedules();
    const scheduleSelect = document.getElementById('scheduleToApply');
    
    if (schedulesResult.success && schedulesResult.data.length > 0) {
      scheduleSelect.innerHTML = '<option value="">اختر التوقيت</option>';
      schedulesResult.data.forEach(schedule => {
        const option = document.createElement('option');
        option.value = schedule.id;
        option.textContent = `${schedule.name} (${schedule.periods_count || schedule.periods?.length || 0} فترات)`;
        scheduleSelect.appendChild(option);
      });
    } else {
      scheduleSelect.innerHTML = '<option value="">لا توجد توقيتات متاحة</option>';
    }
    
    // إظهار المودال
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
  } catch (error) {
    showNotification('حدث خطأ أثناء فتح مودال تطبيق التوقيت: ' + error.message, 'error');
  }
}

// تطبيق التوقيت على فصل
async function handleApplySchedule(grade, className) {
  const scheduleId = document.getElementById('scheduleToApply').value;
  const replaceExisting = document.getElementById('replaceExisting').checked;
  
  if (!scheduleId) {
    showNotification('يجب اختيار توقيت', 'error');
    return;
  }
  
  const submitBtn = document.querySelector('#applyScheduleForm button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>جاري التطبيق...';
    
    const result = await apiService.applyScheduleToClass({
      grade: grade,
      class_name: className,
      schedule_id: scheduleId,
      replace_existing: replaceExisting
    });
    
    if (result.success) {
      showNotification('تم تطبيق التوقيت بنجاح', 'success');
      
      // إغلاق المودال
      const modal = bootstrap.Modal.getInstance(document.getElementById('applyScheduleModal'));
      modal.hide();
      
      // إعادة تحميل الجدول
      showClassSchedule(grade, className);
    }
  } catch (error) {
    showNotification(error.message || 'حدث خطأ أثناء تطبيق التوقيت', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// حذف حصة
async function deleteSession(sessionId) {
  if (!confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
    return;
  }
  
  try {
    const result = await apiService.deleteClassSession(sessionId);
    
    if (result.success) {
      showNotification('تم حذف الحصة بنجاح', 'success');
      // إعادة تحميل الجدول
      const currentUrl = window.location.hash;
      if (currentUrl.includes('class-schedule')) {
        // إعادة تحميل الجدول الحالي
        location.reload();
      }
    }
  } catch (error) {
    showNotification(error.message || 'حدث خطأ أثناء حذف الحصة', 'error');
  }
}

// دالة مساعدة لإضافة ساعة للوقت
function addOneHour(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const newHours = (hours + 1) % 24;
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// تحديث أوقات الحصة بناءً على التوقيت المختار
async function updateSessionTimesFromSchedule() {
  const scheduleId = document.getElementById('selectedScheduleId').value;
  const periodNumber = document.getElementById('classPeriodNumber').value;
  
  if (!scheduleId || !periodNumber) {
    // إفراغ الأوقات إذا لم يتم اختيار توقيت
    document.getElementById('classStartTime').value = '';
    document.getElementById('classEndTime').value = '';
    return;
  }
  
  try {
    // جلب تفاصيل التوقيت
    const result = await apiService.getScheduleDetails(scheduleId);
    
    if (result.success && result.data.periods) {
      const period = result.data.periods.find(p => p.period_number == periodNumber);
      
      if (period) {
        document.getElementById('classStartTime').value = period.start_time;
        document.getElementById('classEndTime').value = period.end_time;
      } else {
        // إذا لم توجد الفترة في التوقيت، استخدم أوقات افتراضية
        const defaultStartTimes = ['07:30', '08:30', '09:30', '10:30', '11:30', '12:30', '13:30', '14:30'];
        const startTime = defaultStartTimes[periodNumber - 1] || '07:30';
        const endTime = addOneHour(startTime);
        
        document.getElementById('classStartTime').value = startTime;
        document.getElementById('classEndTime').value = endTime;
      }
    }
  } catch (error) {
    console.error('خطأ في تحديث أوقات الحصة:', error);
    // استخدام أوقات افتراضية في حالة الخطأ
    const defaultStartTimes = ['07:30', '08:30', '09:30', '10:30', '11:30', '12:30', '13:30', '14:30'];
    const startTime = defaultStartTimes[periodNumber - 1] || '07:30';
    const endTime = addOneHour(startTime);
    
    document.getElementById('classStartTime').value = startTime;
    document.getElementById('classEndTime').value = endTime;
  }
}

// فتح صفحة إدارة الواتساب
function openWhatsappManager() {
  // فتح النافذة في تبويب جديد
  const whatsappWindow = window.open('whatsapp-manager.html', '_blank');
  
  // تمرير بيانات المستخدم للنافذة الجديدة
  setTimeout(() => {
    if (whatsappWindow && !whatsappWindow.closed) {
      // تأكد من وجود التوكن في localStorage للنافذة الجديدة
      whatsappWindow.postMessage({
        type: 'USER_DATA',
        token: localStorage.getItem('auth_token'),
      }, '*');
    }
  }, 1000);
}

// ============ وظائف إدارة التأخير ============

// جلب محتوى صفحة إدارة التأخير
async function getLateArrivalsContent() {
  return `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4><i class="bi bi-clock-history me-2"></i>إدارة التأخير</h4>
      <button class="btn btn-primary" onclick="showAddLateArrivalModal()">
        <i class="bi bi-plus-circle me-2"></i>تسجيل تأخير جديد
      </button>
    </div>
    
    <!-- إحصائيات التأخير -->
    <div class="row mb-4">
      <div class="col-md-4">
        <div class="card bg-warning text-white">
          <div class="card-body text-center">
            <i class="bi bi-clock-history display-4 mb-2"></i>
            <h3 id="lateStudentsToday">0</h3>
            <small>متأخرين اليوم</small>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card bg-info text-white">
          <div class="card-body text-center">
            <i class="bi bi-calendar-week display-4 mb-2"></i>
            <h3 id="lateStudentsWeek">0</h3>
            <small>متأخرين هذا الأسبوع</small>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card bg-secondary text-white">
          <div class="card-body text-center">
            <i class="bi bi-whatsapp display-4 mb-2"></i>
            <h3 id="messagesSentToday">0</h3>
            <small>رسائل مرسلة اليوم</small>
          </div>
        </div>
      </div>
    </div>
    
    <!-- فلتر البيانات -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row">
          <div class="col-md-3">
            <label class="form-label">التاريخ</label>
            <input type="date" class="form-control" id="lateFilterDate" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="col-md-3">
            <label class="form-label">الفصل</label>
            <select class="form-select" id="lateFilterClass">
              <option value="">جميع الفصول</option>
            </select>
          </div>
          <div class="col-md-3 d-flex align-items-end">
            <button class="btn btn-secondary me-2" onclick="loadLateArrivals()">
              <i class="bi bi-search me-2"></i>بحث
            </button>
            <button class="btn btn-outline-secondary" onclick="exportLateArrivals()">
              <i class="bi bi-download me-2"></i>تصدير
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- قائمة الطلاب المتأخرين -->
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">الطلاب المتأخرين</h5>
      </div>
      <div class="card-body">
        <div id="lateArrivalsTable">
          <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status"></div>
            <div class="mt-2">جاري تحميل البيانات...</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// إعداد أزرار إدارة التأخير
function setupLateArrivalsButtons() {
  // تحميل البيانات الأولية
  loadLateArrivals();
  loadClassesForFilter();
  loadLateArrivalsStats();
  
  // إضافة مستمع لتغيير التاريخ
  document.getElementById('lateFilterDate').addEventListener('change', loadLateArrivals);
  document.getElementById('lateFilterClass').addEventListener('change', loadLateArrivals);
}

// تحميل قائمة الطلاب المتأخرين
async function loadLateArrivals() {
  const tableContainer = document.getElementById('lateArrivalsTable');
  if (!tableContainer) return;
  
  tableContainer.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-primary" role="status"></div>
      <div class="mt-2">جاري تحميل البيانات...</div>
    </div>
  `;
  
  try {
    const date = document.getElementById('lateFilterDate').value;
    const classFilter = document.getElementById('lateFilterClass').value;
    
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (classFilter) params.append('class', classFilter);
    
    const result = await apiService.request('GET', `/admin/late-arrivals?${params}`);
    
    if (result.success && result.data) {
      displayLateArrivals(result.data);
    } else {
      tableContainer.innerHTML = `
        <div class="alert alert-warning text-center">
          <i class="bi bi-info-circle me-2"></i>
          لا توجد بيانات تأخير للعرض
        </div>
      `;
    }
  } catch (error) {
    console.error('خطأ في تحميل بيانات التأخير:', error);
    tableContainer.innerHTML = `
      <div class="alert alert-danger text-center">
        <i class="bi bi-exclamation-triangle me-2"></i>
        حدث خطأ في تحميل البيانات
      </div>
    `;
  }
}

// عرض قائمة الطلاب المتأخرين
function displayLateArrivals(lateArrivals) {
  const tableContainer = document.getElementById('lateArrivalsTable');
  
  if (!lateArrivals || lateArrivals.length === 0) {
    tableContainer.innerHTML = `
      <div class="alert alert-info text-center">
        <i class="bi bi-info-circle me-2"></i>
        لا يوجد طلاب متأخرين في هذا التاريخ
      </div>
    `;
    return;
  }
  
  let tableHTML = `
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>اسم الطالب</th>
            <th>الفصل</th>
            <th>وقت التسجيل</th>
            <th>سجل بواسطة</th>
            <th>حالة الرسالة</th>
            <th>ملاحظات</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  lateArrivals.forEach(late => {
    tableHTML += `
      <tr>
        <td><strong>${late.student_name}</strong></td>
        <td><span class="badge bg-secondary">${late.student_class || 'غير محدد'}</span></td>
        <td>${formatDateTime(late.recorded_at)}</td>
        <td>${late.recorded_by_name}</td>
        <td>
          ${late.whatsapp_sent ? 
            '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>تم الإرسال</span>' : 
            '<span class="badge bg-warning"><i class="bi bi-clock me-1"></i>في الانتظار</span>'
          }
        </td>
        <td>${late.notes || '-'}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="removeLateArrival(${late.id})" title="حذف">
            <i class="bi bi-trash"></i>
          </button>
          ${!late.whatsapp_sent ? 
            `<button class="btn btn-sm btn-outline-primary ms-1" onclick="sendLateMessage(${late.id})" title="إرسال رسالة">
              <i class="bi bi-whatsapp"></i>
            </button>` : ''
          }
        </td>
      </tr>
    `;
  });
  
  tableHTML += `
        </tbody>
      </table>
    </div>
  `;
  
  tableContainer.innerHTML = tableHTML;
}

// تحميل إحصائيات التأخير
async function loadLateArrivalsStats() {
  try {
    const result = await apiService.request('GET', '/admin/late-arrivals/stats');
    
    if (result.success && result.data) {
      document.getElementById('lateStudentsToday').textContent = result.data.today || 0;
      document.getElementById('lateStudentsWeek').textContent = result.data.week || 0;
      document.getElementById('messagesSentToday').textContent = result.data.messages_sent || 0;
    }
  } catch (error) {
    console.error('خطأ في تحميل إحصائيات التأخير:', error);
  }
}

// تحميل قائمة الفصول للفلتر
async function loadClassesForFilter() {
  try {
    const result = await apiService.request('GET', '/admin/students');
    
    if (result.success && result.data) {
      const classes = [...new Set(result.data.map(student => student.class).filter(Boolean))];
      const classSelect = document.getElementById('lateFilterClass');
      
      classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        classSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('خطأ في تحميل قائمة الفصول:', error);
  }
}

// عرض نافذة تسجيل تأخير جديد
function showAddLateArrivalModal() {
  const modalHTML = `
    <div class="modal fade" id="addLateArrivalModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">تسجيل تأخير جديد</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="addLateArrivalForm">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">الفصل</label>
                  <select class="form-select" id="lateArrivalClass" required>
                    <option value="">اختر الفصل</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">التاريخ</label>
                  <input type="date" class="form-control" id="lateArrivalDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">الطلاب</label>
                <div id="studentsContainer" class="border rounded p-3" style="max-height: 300px; overflow-y: auto;">
                  <div class="text-center text-muted">اختر الفصل أولاً</div>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">ملاحظات (اختياري)</label>
                <textarea class="form-control" id="lateArrivalNotes" rows="3" placeholder="أي ملاحظات إضافية..."></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
            <button type="button" class="btn btn-primary" onclick="submitLateArrival()">
              <i class="bi bi-check-circle me-2"></i>تسجيل التأخير
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // إزالة أي modal موجود مسبقاً
  const existingModal = document.getElementById('addLateArrivalModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // إضافة المودال للصفحة
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // تحميل قائمة الفصول
  loadClassesForLateModal();
  
  // إظهار المودال
  const modal = new bootstrap.Modal(document.getElementById('addLateArrivalModal'));
  modal.show();
  
  // إضافة مستمع لتغيير الفصل
  document.getElementById('lateArrivalClass').addEventListener('change', loadStudentsForLateModal);
}

// تحميل قائمة الفصول في مودال التأخير
async function loadClassesForLateModal() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/students`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success && result.data) {
      const classes = [...new Set(result.data.map(student => student.class).filter(Boolean))];
      const classSelect = document.getElementById('lateArrivalClass');
      
      classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        classSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('خطأ في تحميل قائمة الفصول:', error);
  }
}

// تحميل طلاب الفصل في مودال التأخير
async function loadStudentsForLateModal() {
  const className = document.getElementById('lateArrivalClass').value;
  const studentsContainer = document.getElementById('studentsContainer');
  
  if (!className) {
    studentsContainer.innerHTML = '<div class="text-center text-muted">اختر الفصل أولاً</div>';
    return;
  }
  
  studentsContainer.innerHTML = `
    <div class="text-center">
      <div class="spinner-border spinner-border-sm" role="status"></div>
      <div class="mt-2">جاري تحميل الطلاب...</div>
    </div>
  `;
  
  try {
    const result = await apiService.request('GET', `/admin/students?class=${encodeURIComponent(className)}`);
    
    if (result.success && result.data) {
      displayStudentsForLateSelection(result.data);
    } else {
      studentsContainer.innerHTML = '<div class="text-center text-muted">لا يوجد طلاب في هذا الفصل</div>';
    }
  } catch (error) {
    console.error('خطأ في تحميل طلاب الفصل:', error);
    studentsContainer.innerHTML = '<div class="text-center text-danger">حدث خطأ في تحميل الطلاب</div>';
  }
}

// عرض طلاب الفصل للاختيار
function displayStudentsForLateSelection(students) {
  const studentsContainer = document.getElementById('studentsContainer');
  
  if (!students || students.length === 0) {
    studentsContainer.innerHTML = '<div class="text-center text-muted">لا يوجد طلاب في هذا الفصل</div>';
    return;
  }
  
  let studentsHTML = '<div class="row">';
  
  students.forEach(student => {
    studentsHTML += `
      <div class="col-md-6 mb-2">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="${student.id}" id="student_${student.id}">
          <label class="form-check-label" for="student_${student.id}">
            ${student.name}
          </label>
        </div>
      </div>
    `;
  });
  
  studentsHTML += '</div>';
  studentsContainer.innerHTML = studentsHTML;
}

// تسجيل التأخير
async function submitLateArrival() {
  const selectedStudents = [];
  const checkboxes = document.querySelectorAll('#studentsContainer input[type="checkbox"]:checked');
  
  checkboxes.forEach(checkbox => {
    selectedStudents.push(parseInt(checkbox.value));
  });
  
  if (selectedStudents.length === 0) {
    showToast('يرجى اختيار طالب واحد على الأقل', 'warning');
    return;
  }
  
  const formData = {
    student_ids: selectedStudents,
    late_date: document.getElementById('lateArrivalDate').value,
    notes: document.getElementById('lateArrivalNotes').value
  };
  
  try {
    const result = await apiService.request('POST', '/admin/late-arrivals', formData);
    
    if (result.success) {
      showToast('تم تسجيل التأخير بنجاح وإرسال الرسائل', 'success');
      
      // إغلاق المودال
      const modal = bootstrap.Modal.getInstance(document.getElementById('addLateArrivalModal'));
      modal.hide();
      
      // إعادة تحميل البيانات
      loadLateArrivals();
      loadLateArrivalsStats();
    } else {
      showToast(result.message || 'حدث خطأ في تسجيل التأخير', 'error');
    }
  } catch (error) {
    console.error('خطأ في تسجيل التأخير:', error);
    showToast('حدث خطأ في الاتصال', 'error');
  }
}

// حذف تأخير
async function removeLateArrival(lateId) {
  if (!confirm('هل أنت متأكد من حذف هذا التأخير؟')) {
    return;
  }
  
  try {
    const result = await apiService.request('DELETE', `/admin/late-arrivals/${lateId}`);
    
    if (result.success) {
      showToast('تم حذف التأخير بنجاح', 'success');
      loadLateArrivals();
      loadLateArrivalsStats();
    } else {
      showToast(result.message || 'حدث خطأ في حذف التأخير', 'error');
    }
  } catch (error) {
    console.error('خطأ في حذف التأخير:', error);
    showToast('حدث خطأ في الاتصال', 'error');
  }
}

// إرسال رسالة تأخير
async function sendLateMessage(lateId) {
  try {
    const result = await apiService.request('POST', `/admin/late-arrivals/${lateId}/send-message`);
    
    if (result.success) {
      showToast('تم إرسال رسالة التأخير بنجاح', 'success');
      loadLateArrivals();
    } else {
      showToast(result.message || 'حدث خطأ في إرسال الرسالة', 'error');
    }
  } catch (error) {
    console.error('خطأ في إرسال رسالة التأخير:', error);
    showToast('حدث خطأ في الاتصال', 'error');
  }
}

// تصدير بيانات التأخير
function exportLateArrivals() {
  const date = document.getElementById('lateFilterDate').value;
  const classFilter = document.getElementById('lateFilterClass').value;
  
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (classFilter) params.append('class', classFilter);
  params.append('export', 'excel');
  
  const url = `${API_BASE_URL}/admin/late-arrivals/export?${params}`;
  
  // إنشاء رابط تحميل مؤقت
  const link = document.createElement('a');
  link.href = url;
  link.download = `late_arrivals_${date || 'all'}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// وظيفة مساعدة لتنسيق التاريخ والوقت
function formatDateTime(datetime) {
  if (!datetime) return '-';
  
  const date = new Date(datetime);
  return date.toLocaleString('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}