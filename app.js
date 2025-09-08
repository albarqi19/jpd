// بيانات التطبيق
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
    totalStudents: 150,
    presentToday: 142,
    absentToday: 8,
    totalTeachers: 25,
    totalClasses: 45
  }
};

// متغيرات عامة
let currentUser = null;
let currentClass = null;
let attendanceData = {};

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', async function() {
  console.log('تطبيق محمل بنجاح');
  await initializeApp();
  setupEventListeners();
  updateDateTime();
  setInterval(updateDateTime, 60000); // تحديث كل دقيقة
});

// تهيئة التطبيق
async function initializeApp() {
  // استرجاع حالة المستخدم من localStorage
  const sessionRestored = await restoreUserSession();
  
  // إذا كان المستخدم مسجل دخول، اذهب لوحة التحكم المناسبة
  if (sessionRestored && currentUser) {
    console.log('تم استرجاع الجلسة، توجيه المستخدم للوحة التحكم...');
    
    if (currentUser.role === 'teacher') {
      showPage('teacherDashboard');
      // تأخير صغير للتأكد من تحميل الصفحة
      setTimeout(() => {
        loadTeacherDashboard();
      }, 200);
    } else if (currentUser.role === 'admin') {
      showPage('adminDashboard');
      // تأخير صغير للتأكد من تحميل الصفحة
      setTimeout(() => {
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
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
  // أزرار الصفحة الرئيسية
  const teacherLoginBtn = document.getElementById('teacherLoginBtn');
  const adminLoginBtn = document.getElementById('adminLoginBtn');
  
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
    targetPage.classList.add('active');
    targetPage.classList.add('fade-in');
    
    // تحديث المحتوى حسب الصفحة
    setTimeout(() => {
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
    
    if (token && userData) {
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
          currentUser = response.data;
          saveUserSession(token, currentUser);
          console.log('تم استرجاع جلسة المستخدم بنجاح:', currentUser);
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
  if (!currentUser) return;
  
  console.log('تحميل لوحة تحكم المعلم');
  updateDateTime(); // تحديث الوقت فوراً
  
  // تأكد من وجود التوكن
  if (!apiService.token) {
    console.log('لا يوجد توكن، محاولة إعادة تحميل...');
    apiService.loadToken();
  }
  
  // عرض اسم المعلم
  const teacherNameEl = document.getElementById('teacherName');
  if (teacherNameEl) {
    teacherNameEl.textContent = currentUser.name;
  }
  
  // عرض الحصص
  const classesList = document.getElementById('classesList');
  if (!classesList) return;

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
    showPage('attendancePage');
    
  } catch (error) {
    console.error('خطأ في بدء التحضير:', error);
    showNotification('فشل في بدء التحضير: ' + error.message, 'error');
  }
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
      // افتراض أن جميع الطلاب حاضرين بشكل افتراضي
      attendanceData[student.id] = 'present';
      
      const studentItem = document.createElement('div');
      studentItem.className = `student-item present`;
      studentItem.setAttribute('data-student-id', student.id);
      studentItem.innerHTML = `
        <div class="student-info">
          <div class="student-name">${student.name}</div>
          <div class="student-roll">رقم الطالب: ${student.student_number}</div>
        </div>
        <div class="attendance-status">
          <span class="status-text">حاضر</span>
          <i class="bi bi-check-circle status-icon"></i>
        </div>
      `;
      
      // إضافة مستمع الأحداث للنقر
      studentItem.addEventListener('click', function() {
        toggleStudentAttendance(student.id, studentItem);
      });
      
      // إضافة دعم اللمس للأجهزة المحمولة
      studentItem.addEventListener('touchend', function(e) {
        e.preventDefault();
        toggleStudentAttendance(student.id, studentItem);
      });
      
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
    // تحضير بيانات الحضور للإرسال
    const attendanceList = [];
    
    for (const studentId in attendanceData) {
      attendanceList.push({
        student_id: parseInt(studentId),
        status: attendanceData[studentId],
        attendance_date: new Date().toISOString().split('T')[0] // تاريخ اليوم
      });
    }
    
    if (attendanceList.length === 0) {
      throw new Error('لا توجد بيانات حضور للحفظ');
    }
    
    console.log('بيانات الحضور المرسلة:', {
      class_session_id: currentClass.id,
      attendance_data: attendanceList
    });
    
    const result = await apiService.submitAttendance(currentClass.id, attendanceList);
    
    if (result.success) {
      showNotification('تم حفظ التحضير وإرساله للإدارة بنجاح', 'success');
      
      // إحصائيات سريعة
      const presentCount = attendanceList.filter(a => a.status === 'present').length;
      const absentCount = attendanceList.filter(a => a.status === 'absent').length;
      
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
    showNotification(error.message || 'حدث خطأ أثناء حفظ التحضير', 'error');
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
      case 'classes':
        content = await getClassesContent();
        break;
      case 'subjects':
        content = await getSubjectsContent();
        break;
      case 'grades':
        content = await getGradesContent();
        break;
      case 'attendance':
        content = getAttendanceReportsContent();
        break;
      case 'approval':
        content = getApprovalContent();
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
    window.open(API_BASE_URL + '/admin/import/students/template', '_blank');
  } catch (error) {
    showNotification('حدث خطأ أثناء تحميل القالب', 'error');
  }
}

// تحميل قالب المعلمين
async function downloadTeachersTemplate() {
  try {
    window.open(API_BASE_URL + '/admin/import/teachers/template', '_blank');
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
  return `
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0"><i class="bi bi-journal-check me-2"></i>تقارير الحضور</h5>
      </div>
      <div class="card-body">
        <div class="row mb-4">
          <div class="col-md-3 mb-2">
            <select class="form-control">
              <option>جميع الصفوف</option>
              <option>الصف الأول أ</option>
              <option>الصف الثاني ب</option>
              <option>الصف الثالث أ</option>
            </select>
          </div>
          <div class="col-md-3 mb-2">
            <input type="date" class="form-control" value="2025-09-07">
          </div>
          <div class="col-md-3 mb-2">
            <button class="btn btn-primary">
              <i class="bi bi-search me-1"></i>بحث
            </button>
          </div>
          <div class="col-md-3 mb-2">
            <button class="btn btn-success">
              <i class="bi bi-download me-1"></i>تصدير
            </button>
          </div>
        </div>
        
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>اسم الطالب</th>
                <th>الصف</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th>المعلم</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>محمد سعد</td>
                <td>الصف الأول أ</td>
                <td><span class="badge bg-success">حاضر</span></td>
                <td>7 سبتمبر 2025</td>
                <td>أحمد محمد</td>
              </tr>
              <tr>
                <td>سارة أحمد</td>
                <td>الصف الأول أ</td>
                <td><span class="badge bg-danger">غائب</span></td>
                <td>7 سبتمبر 2025</td>
                <td>أحمد محمد</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// محتوى اعتماد التحضير
function getApprovalContent() {
  return `
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0"><i class="bi bi-check2-square me-2"></i>اعتماد التحضير</h5>
      </div>
      <div class="card-body">
        <div class="list-group">
          <div class="list-group-item" id="approval-1">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="mb-1">تحضير حصة الرياضيات - الصف الأول أ</h6>
                <p class="mb-1">المعلم: أحمد محمد</p>
                <small class="text-muted">الوقت: 08:00 - 09:00 | التاريخ: 7 سبتمبر 2025</small>
              </div>
              <div>
                <button class="btn btn-success btn-sm me-1" data-approval-id="1">
                  <i class="bi bi-check"></i> اعتماد
                </button>
                <button class="btn btn-outline-danger btn-sm">
                  <i class="bi bi-x"></i> رفض
                </button>
              </div>
            </div>
          </div>
          <div class="list-group-item" id="approval-2">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="mb-1">تحضير حصة العلوم - الصف الثالث أ</h6>
                <p class="mb-1">المعلم: فاطمة علي</p>
                <small class="text-muted">الوقت: 09:00 - 10:00 | التاريخ: 7 سبتمبر 2025</small>
              </div>
              <div>
                <button class="btn btn-success btn-sm me-1" data-approval-id="2">
                  <i class="bi bi-check"></i> اعتماد
                </button>
                <button class="btn btn-outline-danger btn-sm">
                  <i class="bi bi-x"></i> رفض
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// اعتماد التحضير
function approveAttendance(attendanceId) {
  console.log('اعتماد التحضير:', attendanceId);
  showNotification('تم اعتماد التحضير بنجاح وإرسال الرسائل لأولياء الأمور', 'success');
  
  // إخفاء العنصر المعتمد
  setTimeout(() => {
    const approvalItem = document.getElementById(`approval-${attendanceId}`);
    if (approvalItem) {
      approvalItem.style.opacity = '0.5';
      approvalItem.innerHTML = `
        <div class="text-center text-success p-3">
          <i class="bi bi-check-circle me-2"></i>تم الاعتماد والإرسال
        </div>
      `;
    }
  }, 1000);
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
    period_number: document.getElementById('classPeriodNumber').value
  };
  
  // التحقق من صحة البيانات
  if (!formData.teacher_id) {
    showNotification('يجب اختيار المعلم', 'error');
    return;
  }
  
  if (!formData.subject_id) {
    showNotification('يجب اختيار المادة', 'error');
    return;
  }
  
  if (!formData.grade || formData.grade.length < 2) {
    showNotification('اسم الصف مطلوب', 'error');
    return;
  }
  
  if (!formData.class_name) {
    showNotification('اسم الشعبة مطلوب', 'error');
    return;
  }
  
  if (!formData.day) {
    showNotification('يجب اختيار اليوم', 'error');
    return;
  }
  
  if (!formData.start_time || !formData.end_time) {
    showNotification('يجب تحديد وقت البداية والنهاية', 'error');
    return;
  }
  
  // التحقق من أن وقت النهاية أكبر من وقت البداية
  if (formData.start_time >= formData.end_time) {
    showNotification('وقت النهاية يجب أن يكون أكبر من وقت البداية', 'error');
    return;
  }
  
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
      
      // إعادة تحميل قائمة الحصص
      showAdminSection('classes');
      
      // إعادة تعيين النموذج
      addClassForm.reset();
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
        const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
        const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
        
        let scheduleHTML = `
            <div class="table-responsive">
                <table class="table table-bordered text-center" id="scheduleTable">
                    <thead>
                        <tr>
                            <th style="width: 100px;">الوقت</th>
                            ${daysOfWeek.map(day => `<th>${day}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        // إنشاء جدول الحصص
        timeSlots.forEach(timeSlot => {
            scheduleHTML += `<tr>`;
            scheduleHTML += `<td class="fw-bold bg-light">${formatTo12Hour(timeSlot)} - ${formatTo12Hour(addOneHour(timeSlot))}</td>`;
            
            daysOfWeek.forEach((day, dayIndex) => {
                // البحث عن الحصة بناءً على اليوم والوقت
                const session = sessions.find(s => {
                    const sessionDay = s.day;
                    const sessionTime = s.start_time ? s.start_time.substring(0, 5) : '';
                    
                    console.log(`البحث عن حصة: اليوم=${day}, الوقت=${timeSlot}, حصة: يوم=${sessionDay}, وقت=${sessionTime}`);
                    
                    return sessionDay === day && sessionTime === timeSlot;
                });

                if (session) {
                    const currentDay = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
                    const isToday = dayIndex === currentDay;
                    
                    scheduleHTML += `
                        <td class="schedule-cell ${isToday ? 'current-day' : ''}">
                            <div class="fw-bold text-primary">${session.subject?.name || 'غير محدد'}</div>
                            <div class="small text-muted">${session.grade || 'غير محدد'}</div>
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

// دالة مساعدة لإضافة ساعة للوقت
function addOneHour(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const newHours = (hours + 1) % 24;
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}