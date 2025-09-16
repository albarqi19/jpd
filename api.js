// خدمة API للتواصل مع Laravel
class ApiService {
  constructor() {
    this.baseURL = 'https://sternmost-junita-indiscriminately.ngrok-free.app/api';
    this.loadToken(); // تحميل التوكن من localStorage
  }

  // تحميل التوكن من localStorage
  loadToken() {
    this.token = localStorage.getItem('auth_token');
    if (this.token) {
      console.log('تم تحميل التوكن من localStorage:', this.token?.substring(0, 20) + '...');
    }
  }

  // ضبط التوكن
  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
    console.log('تم تعيين التوكن:', token?.substring(0, 20) + '...');
  }

  // إضافة دالة بديلة لـ setAuthToken
  setAuthToken(token) {
    this.setToken(token);
  }

  // إزالة التوكن
  removeToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
    console.log('تم إزالة التوكن');
  }

  // إضافة دالة بديلة لـ clearAuthToken
  clearAuthToken() {
    this.removeToken();
  }

  // طلبات HTTP الأساسية
  async request(method, endpoint, data = null) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true', // تجاهل تحذير ngrok
      }
    };

    // إضافة التوكن إذا كان متوفراً
    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
      console.log('إرسال طلب مع التوكن:', this.token?.substring(0, 20) + '...');
    } else {
      console.warn('لا يوجد توكن - سيتم إرسال طلب بدون مصادقة');
    }

    // إضافة البيانات للطلبات POST/PUT/PATCH
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      config.body = JSON.stringify(data);
    }

    try {
      console.log('إرسال طلب إلى:', `${this.baseURL}${endpoint}`);
      console.log('إعدادات الطلب:', config);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      console.log('استجابة الخادم:', response.status, response.statusText);
      
      const result = await response.json();

      if (!response.ok) {
        console.error('خطأ من الخادم:', result);
        throw new Error(result.message || 'حدث خطأ في الشبكة');
      }

      return result;
    } catch (error) {
      console.error('API Error Details:', {
        message: error.message,
        stack: error.stack,
        endpoint: `${this.baseURL}${endpoint}`,
        config: config
      });
      throw error;
    }
  }

  // طرق GET
  async get(endpoint) {
    return this.request('GET', endpoint);
  }

  // طرق POST
  async post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }

  // طرق PUT
  async put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }

  // طرق DELETE
  async delete(endpoint) {
    return this.request('DELETE', endpoint);
  }

  // === مصادقة المستخدم ===
  async login(credentials) {
    const result = await this.post('/auth/login', credentials);
    if (result.success && result.data.token) {
      this.setToken(result.data.token);
    }
    return result;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.removeToken();
    }
  }

  async changePassword(data) {
    return this.post('/auth/change-password', data);
  }

  async getMe() {
    return this.get('/auth/me');
  }

  // إضافة alias للتوافق
  async me() {
    return this.getMe();
  }

  // === إدارة المعلمين ===
  async getTeachers() {
    return this.get('/admin/teachers');
  }

  async createTeacher(data) {
    console.log('API createTeacher called with data:', data);
    console.log('Full URL will be:', this.baseURL + '/admin/teachers');
    return this.post('/admin/teachers', data);
  }

  async updateTeacher(id, data) {
    return this.put(`/admin/teachers/${id}`, data);
  }

  async deleteTeacher(id) {
    return this.delete(`/admin/teachers/${id}`);
  }

  async resetTeacherPassword(id) {
    return this.post(`/admin/teachers/${id}/reset-password`);
  }

  // === إدارة الطلاب ===
  async getStudents() {
    return this.get('/admin/students');
  }

  async createStudent(data) {
    return this.post('/admin/students', data);
  }

  async updateStudent(id, data) {
    return this.put(`/admin/students/${id}`, data);
  }

  async deleteStudent(id) {
    return this.delete(`/admin/students/${id}`);
  }

  // === إدارة المواد ===
  async getSubjects() {
    return this.get('/admin/subjects');
  }

  async createSubject(data) {
    return this.post('/admin/subjects', data);
  }

  async updateSubject(id, data) {
    return this.put(`/admin/subjects/${id}`, data);
  }

  async deleteSubject(id) {
    return this.delete(`/admin/subjects/${id}`);
  }

  // === إدارة الحصص ===
  async getClassSessions() {
    return this.get('/admin/class-sessions');
  }

  async createClassSession(data) {
    return this.post('/admin/class-sessions', data);
  }

  async updateClassSession(id, data) {
    return this.put(`/admin/class-sessions/${id}`, data);
  }

  async deleteClassSession(id) {
    return this.delete(`/admin/class-sessions/${id}`);
  }

  // === حصص المعلم ===
  async getMyClasses() {
    return this.get('/teacher/my-classes');
  }

  async getClassStudents(sessionId) {
    return this.get(`/teacher/sessions/${sessionId}/students`);
  }

  // === حصص المعلم (جديد) ===
  async getTeacherSessions(teacherId = null) {
    if (teacherId) {
      return this.get(`/admin/teachers/${teacherId}/sessions`);
    }
    return this.get('/teacher/sessions');
  }

  async getCurrentSession() {
    return this.get('/teacher/current-session');
  }

  async getSessionStudents(sessionId) {
    return this.get(`/teacher/sessions/${sessionId}/students`);
  }

  async saveSessionAttendance(sessionId, attendanceData) {
    return this.post(`/teacher/sessions/${sessionId}/attendance`, {
      attendance: attendanceData,
      date: new Date().toISOString().split('T')[0]
    });
  }

  async getTeacherDashboardStats() {
    return this.get('/teacher/dashboard-stats');
  }

  // === الحضور والغياب ===
  async saveAttendance(classId, attendanceData) {
    return this.post(`/teacher/classes/${classId}/attendance`, {
      attendance: attendanceData,
      date: new Date().toISOString().split('T')[0]
    });
  }

  // الطريقة الجديدة للحضور
  async saveSessionAttendance(sessionId, attendanceData) {
    return this.post(`/teacher/sessions/${sessionId}/attendance`, {
      attendance: attendanceData,
      date: new Date().toISOString().split('T')[0]
    });
  }

  async getAttendanceReports(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.get(`/admin/attendance-reports?${params}`);
  }

  async approveAttendance(attendanceId) {
    return this.post(`/admin/attendance/${attendanceId}/approve`);
  }

  async rejectAttendance(attendanceId, reason = '') {
    return this.post(`/admin/attendance/${attendanceId}/reject`, { reason });
  }

  // === الإحصائيات ===
  async getDashboardStats() {
    return this.get('/admin/dashboard-stats');
  }

  async getTeacherStats() {
    return this.get('/teacher/dashboard-stats');
  }

  // === قوالب الواتساب ===
  async getWhatsappTemplates() {
    return this.get('/admin/whatsapp-templates');
  }

  async updateWhatsappTemplate(id, data) {
    return this.put(`/admin/whatsapp-templates/${id}`, data);
  }

  // === الإعدادات ===
  async getSettings() {
    return this.get('/admin/settings');
  }

  async updateSettings(data) {
    return this.put('/admin/settings', data);
  }

  async testWebhook() {
    return this.post('/admin/settings/test-webhook');
  }

  // === الاستيراد ===
  async importStudents(formData) {
    const response = await fetch(`${this.baseURL}/admin/import/students`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: formData
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'حدث خطأ في الشبكة');
    }
    return result;
  }

  async importTeachers(formData) {
    const response = await fetch(`${this.baseURL}/admin/import/teachers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: formData
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'حدث خطأ في الشبكة');
    }
    return result;
  }

  // === إدارة التوقيتات ===
  async getSchedules() {
    return this.get('/admin/schedules');
  }

  async getScheduleDetails(scheduleId) {
    return this.get(`/admin/schedules/${scheduleId}`);
  }

  async createSchedule(scheduleData) {
    return this.post('/admin/schedules', scheduleData);
  }

  async activateSchedule(scheduleId) {
    return this.post(`/admin/schedules/${scheduleId}/activate`);
  }

  async deleteSchedule(scheduleId) {
    return this.delete(`/admin/schedules/${scheduleId}`);
  }

  async getScheduleTemplates() {
    return this.get('/admin/schedules/templates');
  }

  // === إدارة جداول الفصول ===
  async getClasses() {
    return this.get('/admin/class-schedules/classes');
  }

  async getClassSchedule(grade, className) {
    return this.get(`/admin/class-schedules/${encodeURIComponent(grade)}/${encodeURIComponent(className)}`);
  }

  async addQuickSession(sessionData) {
    return this.post('/admin/class-schedules/quick-session', sessionData);
  }

  async applyScheduleToClass(data) {
    return this.post('/admin/class-schedules/apply-schedule', data);
  }

  async deleteClassSession(sessionId) {
    return this.delete(`/admin/class-schedules/sessions/${sessionId}`);
  }

  async getSessionData() {
    return this.get('/admin/class-schedules/session-data');
  }

  // ===== تقارير الحضور =====
  
  // الحصول على تقارير الحضور مع فلاتر
  async getAttendanceReports(filters = {}) {
    let endpoint = '/admin/attendance-reports';
    
    // إضافة query parameters للفلاتر
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });
    
    if (queryParams.toString()) {
      endpoint += '?' + queryParams.toString();
    }
    
    return this.get(endpoint);
  }

  // الحصول على التحضيرات في انتظار الاعتماد
  async getPendingApprovals() {
    return this.get('/admin/attendance-reports/pending-approvals');
  }

  // اعتماد سجل حضور
  async approveAttendance(attendanceId) {
    return this.post(`/admin/attendance-reports/${attendanceId}/approve`);
  }

  // اعتماد جلسة حضور كاملة
  async approveSession(sessionId, date) {
    return this.post('/admin/attendance-reports/approve-session', {
      session_id: sessionId,
      date: date
    });
  }

  // رفض جلسة حضور كاملة
  async rejectSession(sessionId, date, reason = null) {
    return this.post('/admin/attendance-reports/reject-session', {
      session_id: sessionId,
      date: date,
      reason: reason
    });
  }

  // تصدير تقرير الحضور
  async exportAttendanceReport(format, filters = {}) {
    let endpoint = `/admin/attendance-reports/export/${format}`;
    
    // إضافة query parameters للفلاتر
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });
    
    if (queryParams.toString()) {
      endpoint += '?' + queryParams.toString();
    }
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/octet-stream'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.blob();
  }

  // اعتماد سجل حضور
  async approveAttendance(attendanceId) {
    return this.post(`/admin/attendance-reports/${attendanceId}/approve`);
  }

  // رفض سجل حضور
  async rejectAttendance(attendanceId, data = {}) {
    return this.post(`/admin/attendance-reports/${attendanceId}/reject`, data);
  }

  // الحصول على تفاصيل جلسة الحضور
  async getAttendanceSessionDetails(attendanceId) {
    return this.get(`/admin/attendance-reports/${attendanceId}/details`);
  }

  // ===== دوال المعلمين =====
  
  // حفظ الحضور (للمعلمين)
  async submitAttendance(sessionId, attendanceData) {
    return this.post(`/teacher/sessions/${sessionId}/attendance`, attendanceData);
  }

  // جلب التحضير المرسل سابقاً
  async getSubmittedAttendance(sessionId, date = null) {
    let endpoint = `/teacher/sessions/${sessionId}/submitted-attendance`;
    if (date) {
      endpoint += `?date=${date}`;
    }
    return this.get(endpoint);
  }

  // الحصول على حصص المعلم
  async getTeacherSessions(teacherId = null) {
    const endpoint = teacherId ? `/teacher/sessions?teacher_id=${teacherId}` : '/teacher/sessions';
    return this.get(endpoint);
  }

  // الحصول على الحصة الحالية
  async getCurrentSession() {
    return this.get('/teacher/current-session');
  }

  // الحصول على طلاب الحصة
  async getSessionStudents(sessionId) {
    return this.get(`/teacher/sessions/${sessionId}/students`);
  }

  // الحصول على إحصائيات المعلم
  async getTeacherStats() {
    return this.get('/teacher/dashboard-stats');
  }

  // ======== دوال الواتساب ========

  // الحصول على إحصائيات الواتساب
  async getWhatsappStatistics() {
    return this.get('/admin/whatsapp/statistics');
  }

  // الحصول على قائمة انتظار الواتساب
  async getWhatsappQueue() {
    return this.get('/admin/whatsapp/queue');
  }

  // الحصول على سجل الواتساب
  async getWhatsappHistory() {
    return this.get('/admin/whatsapp/history');
  }

  // الحصول على إعدادات الواتساب
  async getWhatsappSettings() {
    return this.get('/admin/whatsapp/settings');
  }

  // تحديث إعدادات الواتساب
  async updateWhatsappSettings(settings) {
    return this.put('/admin/whatsapp/settings', settings);
  }

  // الحصول على قوالب الواتساب
  async getWhatsappTemplates() {
    return this.get('/admin/whatsapp/templates');
  }

  // إنشاء قالب واتساب جديد
  async createWhatsappTemplate(template) {
    return this.post('/admin/whatsapp/templates', template);
  }

  // تحديث قالب واتساب
  async updateWhatsappTemplate(id, template) {
    return this.put(`/admin/whatsapp/templates/${id}`, template);
  }

  // حذف قالب واتساب
  async deleteWhatsappTemplate(id) {
    return this.delete(`/admin/whatsapp/templates/${id}`);
  }

  // إرسال الرسائل المعلقة
  async sendPendingWhatsappMessages() {
    return this.post('/admin/whatsapp/send-pending');
  }

  // إرسال رسالة واحدة
  async sendSingleWhatsappMessage(id) {
    return this.post(`/admin/whatsapp/send-single/${id}`);
  }

  // اختبار اتصال الواتساب
  async testWhatsappConnection() {
    return this.post('/admin/whatsapp/test-connection');
  }

  // حذف رسالة من قائمة الانتظار
  async deleteWhatsappMessage(id) {
    return this.delete(`/admin/whatsapp/queue/${id}`);
  }
}

// إنشاء instance عام للاستخدام في التطبيق
const apiService = new ApiService();
