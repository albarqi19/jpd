// ملف إدارة الجدول الدراسي للمعلم
class TeacherSchedule {
  constructor() {
    this.schedule = null;
    this.currentWeek = null;
  }

  // عرض صفحة الجدول
  async showSchedulePage() {
    const teacherDashboard = document.getElementById('teacherDashboard');
    if (!teacherDashboard) return;

    // إخفاء المحتوى الحالي
    const mainContent = teacherDashboard.querySelector('.container.mt-4');
    if (mainContent) {
      mainContent.style.display = 'none';
    }

    // إضافة محتوى الجدول
    const scheduleContainer = document.createElement('div');
    scheduleContainer.id = 'teacherScheduleContainer';
    scheduleContainer.className = 'container mt-4';
    scheduleContainer.innerHTML = this.getScheduleHTML();
    
    teacherDashboard.appendChild(scheduleContainer);

    // تحميل بيانات الجدول
    await this.loadScheduleData();
  }

  // إخفاء صفحة الجدول والعودة للرئيسية
  hideSchedulePage() {
    const scheduleContainer = document.getElementById('teacherScheduleContainer');
    if (scheduleContainer) {
      scheduleContainer.remove();
    }

    const mainContent = document.querySelector('#teacherDashboard .container.mt-4');
    if (mainContent) {
      mainContent.style.display = 'block';
    }
  }

  // HTML لصفحة الجدول
  getScheduleHTML() {
    return `
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 class="mb-1">
                <i class="bi bi-calendar-week me-2 text-success"></i>
                جدولي الدراسي
              </h2>
              <p class="text-muted mb-0">عرض جميع الحصص الأسبوعية</p>
            </div>
            <button class="btn btn-outline-success" id="backToTeacherDashboard">
              <i class="bi bi-arrow-right me-2"></i>العودة للرئيسية
            </button>
          </div>
        </div>
      </div>

      <!-- معلومات الأسبوع -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card bg-light">
            <div class="card-body text-center">
              <h5 class="card-title mb-1">الأسبوع الحالي</h5>
              <p class="card-text text-muted mb-0" id="currentWeekInfo">
                <i class="bi bi-calendar3 me-1"></i>
                <span id="weekRange">جاري التحميل...</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- الجدول -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header bg-success text-white">
              <h5 class="mb-0">
                <i class="bi bi-table me-2"></i>
                الجدول الأسبوعي
              </h5>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-bordered mb-0" id="scheduleTable">
                  <thead class="table-light">
                    <tr>
                      <th width="80" class="text-center">الحصة</th>
                      <th width="100" class="text-center">التوقيت</th>
                      <th class="text-center">الأحد</th>
                      <th class="text-center">الإثنين</th>
                      <th class="text-center">الثلاثاء</th>
                      <th class="text-center">الأربعاء</th>
                      <th class="text-center">الخميس</th>
                    </tr>
                  </thead>
                  <tbody id="scheduleTableBody">
                    <!-- سيتم ملؤها بـ JavaScript -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- إحصائيات سريعة -->
      <div class="row mt-4">
        <div class="col-md-3">
          <div class="card text-center bg-primary text-white">
            <div class="card-body">
              <h3 class="mb-1" id="totalSessionsCount">-</h3>
              <p class="mb-0 small">إجمالي الحصص</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center bg-success text-white">
            <div class="card-body">
              <h3 class="mb-1" id="todaySessionsCount">-</h3>
              <p class="mb-0 small">حصص اليوم</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center bg-info text-white">
            <div class="card-body">
              <h3 class="mb-1" id="subjectsCount">-</h3>
              <p class="mb-0 small">عدد المواد</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center bg-warning text-white">
            <div class="card-body">
              <h3 class="mb-1" id="classesCount">-</h3>
              <p class="mb-0 small">عدد الفصول</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // تحميل بيانات الجدول
  async loadScheduleData() {
    try {
      // عرض حالة التحميل
      this.showLoadingState();

      // جلب الحصص من API
      const response = await apiService.getTeacherSessions();
      
      if (response.success) {
        this.schedule = response.data;
        this.currentWeek = response.saudi_time;
        
        // رسم الجدول
        this.renderScheduleTable();
        this.updateWeekInfo();
        this.updateStatistics();
      } else {
        this.showErrorState('فشل في تحميل الجدول: ' + response.message);
      }
    } catch (error) {
      console.error('خطأ في تحميل الجدول:', error);
      this.showErrorState('حدث خطأ في تحميل الجدول');
    }
  }

  // عرض حالة التحميل
  showLoadingState() {
    const tbody = document.getElementById('scheduleTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5">
            <div class="spinner-border text-success me-2" role="status"></div>
            جاري تحميل الجدول...
          </td>
        </tr>
      `;
    }
  }

  // عرض حالة الخطأ
  showErrorState(message) {
    const tbody = document.getElementById('scheduleTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5 text-danger">
            <i class="bi bi-exclamation-triangle display-4 d-block mb-2"></i>
            ${message}
            <br>
            <button class="btn btn-outline-success btn-sm mt-2" onclick="teacherSchedule.loadScheduleData()">
              إعادة المحاولة
            </button>
          </td>
        </tr>
      `;
    }
  }

  // رسم الجدول
  renderScheduleTable() {
    const tbody = document.getElementById('scheduleTableBody');
    if (!tbody) return;

    // تنظيم الحصص حسب رقم الحصة واليوم
    const organizedSchedule = this.organizeScheduleByPeriod();
    
    // أوقات الحصص الافتراضية
    const defaultTimes = [
      '07:30 - 08:15',
      '08:15 - 09:00', 
      '09:00 - 09:45',
      '09:45 - 10:15', // فسحة
      '10:15 - 11:00',
      '11:00 - 11:45',
      '11:45 - 12:30',
      '12:30 - 01:15'
    ];

    let tableHTML = '';

    // رسم 8 حصص
    for (let period = 1; period <= 8; period++) {
      if (period === 4) {
        // فسحة
        tableHTML += `
          <tr class="table-warning">
            <td class="text-center fw-bold">فسحة</td>
            <td class="text-center">${defaultTimes[period - 1]}</td>
            <td colspan="5" class="text-center">
              <i class="bi bi-cup-hot me-1"></i>فترة راحة
            </td>
          </tr>
        `;
        continue;
      }

      tableHTML += `<tr>`;
      tableHTML += `<td class="text-center fw-bold">${period}</td>`;
      tableHTML += `<td class="text-center small">${defaultTimes[period - 1]}</td>`;

      // أيام الأسبوع
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
      
      days.forEach(day => {
        const session = organizedSchedule[period]?.[day];
        if (session) {
          const time12h = this.convertTo12Hour(session.formatted_start_time || session.start_time);
          tableHTML += `
            <td class="p-2">
              <div class="schedule-cell ${session.is_today ? 'current-day' : ''}">
                <div class="fw-bold text-primary small">${session.subject?.name || 'غير محدد'}</div>
                <div class="text-muted small">${session.grade} - ${session.class_name}</div>
                <div class="text-success small">
                  <i class="bi bi-clock me-1"></i>${time12h}
                </div>
              </div>
            </td>
          `;
        } else {
          tableHTML += `<td class="text-center text-muted">-</td>`;
        }
      });

      tableHTML += `</tr>`;
    }

    tbody.innerHTML = tableHTML;
  }

  // تنظيم الحصص حسب رقم الحصة واليوم
  organizeScheduleByPeriod() {
    const organized = {};
    
    this.schedule.forEach(session => {
      const period = session.period_number;
      const day = session.day;
      
      if (!organized[period]) {
        organized[period] = {};
      }
      
      organized[period][day] = session;
    });
    
    return organized;
  }

  // تحديث معلومات الأسبوع
  updateWeekInfo() {
    const weekRange = document.getElementById('weekRange');
    if (weekRange && this.currentWeek) {
      const currentDate = new Date(this.currentWeek);
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const formatDate = (date) => {
        return date.toLocaleDateString('ar-SA', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      };
      
      weekRange.textContent = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
    }
  }

  // تحديث الإحصائيات
  updateStatistics() {
    // إجمالي الحصص
    const totalElement = document.getElementById('totalSessionsCount');
    if (totalElement) {
      totalElement.textContent = this.schedule.length;
    }

    // حصص اليوم
    const todayElement = document.getElementById('todaySessionsCount');
    if (todayElement) {
      const todaySessions = this.schedule.filter(s => s.is_today).length;
      todayElement.textContent = todaySessions;
    }

    // عدد المواد
    const subjectsElement = document.getElementById('subjectsCount');
    if (subjectsElement) {
      const uniqueSubjects = [...new Set(this.schedule.map(s => s.subject?.name))].length;
      subjectsElement.textContent = uniqueSubjects;
    }

    // عدد الفصول
    const classesElement = document.getElementById('classesCount');
    if (classesElement) {
      const uniqueClasses = [...new Set(this.schedule.map(s => `${s.grade}-${s.class_name}`))].length;
      classesElement.textContent = uniqueClasses;
    }
  }

  // تحويل الوقت إلى نظام 12 ساعة
  convertTo12Hour(time24) {
    if (!time24) return 'غير محدد';
    
    try {
      const [hours, minutes] = time24.split(':');
      const hour24 = parseInt(hours);
      const period = hour24 >= 12 ? 'م' : 'ص';
      const hour12 = hour24 % 12 || 12;
      
      return `${hour12}:${minutes} ${period}`;
    } catch (error) {
      return time24; // fallback للتنسيق الأصلي إذا فشل التحويل
    }
  }
}

// إنشاء instance عام
const teacherSchedule = new TeacherSchedule();
