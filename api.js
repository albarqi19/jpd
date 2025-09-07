// خدمة API للتواصل مع Laravel
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:8003/api';
    this.token = localStorage.getItem('auth_token');
  }

  // ضبط التوكن
  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // إزالة التوكن
  removeToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // طلبات HTTP الأساسية
  async request(method, endpoint, data = null) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    };

    // إضافة التوكن إذا كان متوفراً
    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    // إضافة البيانات للطلبات POST/PUT/PATCH
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'حدث خطأ في الشبكة');
      }

      return result;
    } catch (error) {
      console.error('API Error:', error);
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

  async getClassStudents(classId) {
    return this.get(`/teacher/classes/${classId}/students`);
  }

  // === الحضور والغياب ===
  async saveAttendance(classId, attendanceData) {
    return this.post(`/teacher/classes/${classId}/attendance`, {
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
    const response = await fetch(`${this.baseUrl}/admin/import/students`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: formData
    });
    
    return this.handleResponse(response);
  }

  async importTeachers(formData) {
    const response = await fetch(`${this.baseUrl}/admin/import/teachers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: formData
    });
    
    return this.handleResponse(response);
  }
}

// إنشاء instance عام للاستخدام في التطبيق
const apiService = new ApiService();
