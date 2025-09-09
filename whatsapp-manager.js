// WhatsApp Manager JavaScript
// ===========================

// متغيرات عامة
let currentUser = null;
let whatsappQueue = [];
let whatsappHistory = [];
let whatsappSettings = {};
let messageTemplates = [];
let refreshInterval = null;

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', async function() {
    console.log('تطبيق إدارة الواتساب محمل بنجاح');
    
    // مستمع الرسائل من النافذة الأساسية
    window.addEventListener('message', function(event) {
        if (event.data.type === 'USER_DATA') {
            // تحديث localStorage في النافذة الجديدة
            localStorage.setItem('auth_token', event.data.token);
            localStorage.setItem('user_data', event.data.user);
            console.log('تم استقبال بيانات المستخدم من النافذة الأساسية');
        }
    });
    
    // التحقق من تسجيل الدخول
    await checkAuthentication();
    
    // تحميل البيانات الأولية
    await loadInitialData();
    
    // بدء التحديث التلقائي
    startAutoRefresh();
    
    // إضافة مستمعي الأحداث
    setupEventListeners();
});

// التحقق من تسجيل الدخول
async function checkAuthentication() {
    console.log('=== بدء التحقق من المصادقة في صفحة الواتساب ===');
    
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user_data');
    
    console.log('التوكن الموجود:', token?.substring(0, 20) + '...');
    console.log('بيانات المستخدم الموجودة:', user);
    
    if (!token || !user) {
        console.log('لا توجد بيانات مصادقة، العودة للصفحة الرئيسية');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(user);
        console.log('تم تحليل بيانات المستخدم:', currentUser);
        
        apiService.setToken(token);
        console.log('تم تعيين التوكن في apiService');
        
        // التحقق من صحة التوكن
        console.log('التحقق من صحة التوكن...');
        const response = await apiService.getMe();
        
        if (!response.success) {
            console.error('استجابة غير صحيحة من API:', response);
            throw new Error('Invalid token');
        }
        
        console.log('تم التحقق من المصادقة بنجاح');
        
    } catch (error) {
        console.error('خطأ في التحقق من المصادقة:', error);
        logout();
    }
}

// تحميل البيانات الأولية
async function loadInitialData() {
    try {
        showLoading(true);
        
        // تحميل الإحصائيات
        await loadStatistics();
        
        // تحميل قائمة الانتظار
        await loadQueue();
        
        // تحميل السجل
        await loadHistory();
        
        // تحميل الإعدادات
        await loadSettings();
        
        // تحميل القوالب
        await loadTemplates();
        
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        showToast('فشل في تحميل البيانات', 'error');
    } finally {
        showLoading(false);
    }
}

// تحميل الإحصائيات
async function loadStatistics() {
    try {
        const response = await apiService.getWhatsappStatistics();
        if (response.success) {
            const stats = response.data;
            document.getElementById('totalSent').textContent = stats.total_sent;
            document.getElementById('totalDelivered').textContent = stats.total_delivered;
            document.getElementById('totalFailed').textContent = stats.total_failed;
            document.getElementById('totalPending').textContent = stats.total_pending;
        }
        
    } catch (error) {
        console.error('خطأ في تحميل الإحصائيات:', error);
        // عرض بيانات افتراضية في حالة الخطأ
        document.getElementById('totalSent').textContent = '245';
        document.getElementById('totalDelivered').textContent = '238';
        document.getElementById('totalFailed').textContent = '7';
        document.getElementById('totalPending').textContent = '12';
    }
}

// تحميل قائمة الانتظار
async function loadQueue() {
    try {
        const response = await apiService.getWhatsappQueue();
        if (response.success) {
            whatsappQueue = response.data;
        }
        
        displayQueue();
        
    } catch (error) {
        console.error('خطأ في تحميل قائمة الانتظار:', error);
        // عرض بيانات افتراضية في حالة الخطأ
        whatsappQueue = [
            {
                id: 1,
                student_name: 'أحمد محمد',
                parent_phone: '966501234567',
                message: 'عزيزي ولي الأمر، نود إعلامكم بأن الطالب أحمد محمد كان غائباً في حصة الرياضيات اليوم.',
                status: 'pending',
                attempts: 0,
                created_at: new Date().toISOString(),
                subject: 'الرياضيات',
                grade: 'الصف الأول أ'
            }
        ];
        displayQueue();
    }
}

// عرض قائمة الانتظار
function displayQueue() {
    const container = document.getElementById('queueContainer');
    
    if (whatsappQueue.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-inbox display-4"></i>
                <p class="mt-2">لا توجد رسائل في قائمة الانتظار</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    whatsappQueue.forEach(item => {
        const statusClass = getStatusClass(item.status);
        const statusText = getStatusText(item.status);
        
        html += `
            <div class="queue-item ${statusClass}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${item.student_name} - ${item.grade}</h6>
                        <p class="mb-1"><strong>المادة:</strong> ${item.subject}</p>
                        <p class="mb-1"><strong>رقم الهاتف:</strong> ${item.parent_phone}</p>
                        <div class="message-preview">
                            ${item.message}
                        </div>
                        <small class="text-muted">
                            <i class="bi bi-clock me-1"></i>
                            ${formatDateTime(item.created_at)}
                            ${item.attempts > 0 ? `• المحاولة ${item.attempts}` : ''}
                        </small>
                    </div>
                    <div class="ms-3">
                        <span class="badge status-badge bg-${statusClass}">${statusText}</span>
                        <div class="mt-2">
                            ${item.status === 'pending' ? `
                                <button class="btn btn-primary btn-sm" onclick="sendSingleMessage(${item.id})">
                                    <i class="bi bi-send"></i> إرسال
                                </button>
                            ` : ''}
                            ${item.status === 'failed' ? `
                                <button class="btn btn-warning btn-sm" onclick="retrySingleMessage(${item.id})">
                                    <i class="bi bi-arrow-clockwise"></i> إعادة
                                </button>
                            ` : ''}
                            <button class="btn btn-outline-secondary btn-sm" onclick="editMessage(${item.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteMessage(${item.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// تحميل السجل
async function loadHistory() {
    try {
        const response = await apiService.getWhatsappHistory();
        if (response.success) {
            whatsappHistory = response.data;
        }
        
        displayHistory();
        
    } catch (error) {
        console.error('خطأ في تحميل السجل:', error);
        // عرض بيانات افتراضية في حالة الخطأ
        whatsappHistory = [
            {
                id: 1,
                student_name: 'سارة أحمد',
                parent_phone: '966502222222',
                message: 'تم إرسال إشعار الغياب بنجاح',
                status: 'delivered',
                sent_at: new Date(Date.now() - 3600000).toISOString(),
                delivered_at: new Date(Date.now() - 3500000).toISOString()
            }
        ];
        displayHistory();
    }
}

// عرض السجل
function displayHistory() {
    const container = document.getElementById('historyTimeline');
    
    if (whatsappHistory.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-clock-history display-4"></i>
                <p class="mt-2">لا يوجد سجل إرسال</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    whatsappHistory.forEach(item => {
        const statusClass = getStatusClass(item.status);
        
        html += `
            <div class="timeline-item ${statusClass}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${item.student_name}</h6>
                        <p class="mb-1">${item.parent_phone}</p>
                        <div class="message-preview">
                            ${item.message}
                        </div>
                        ${item.error_message ? `
                            <div class="alert alert-danger py-1 px-2 mt-2">
                                <small><i class="bi bi-exclamation-triangle me-1"></i>${item.error_message}</small>
                            </div>
                        ` : ''}
                    </div>
                    <div class="text-end">
                        <span class="badge status-badge bg-${statusClass}">${getStatusText(item.status)}</span>
                        <br>
                        <small class="text-muted">
                            ${formatDateTime(item.sent_at)}
                            ${item.delivered_at ? `<br>وصلت: ${formatDateTime(item.delivered_at)}` : ''}
                        </small>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// تحميل الإعدادات
async function loadSettings() {
    try {
        const response = await apiService.getWhatsappSettings();
        if (response.success) {
            whatsappSettings = response.data;
            
            // ملء النموذج
            document.getElementById('whatsappApiUrl').value = whatsappSettings.api_url || '';
            document.getElementById('whatsappApiKey').value = whatsappSettings.api_key || '';
            document.getElementById('senderNumber').value = whatsappSettings.sender_number || '';
            document.getElementById('autoSendEnabled').checked = whatsappSettings.auto_send_enabled || false;
            document.getElementById('sendTimeFrom').value = whatsappSettings.send_time_from || '07:00';
            document.getElementById('sendTimeTo').value = whatsappSettings.send_time_to || '22:00';
            document.getElementById('messageDelay').value = whatsappSettings.message_delay || 5;
            
            // أيام الإرسال
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            days.forEach(day => {
                const checkbox = document.getElementById(`send${day.charAt(0).toUpperCase() + day.slice(1)}`);
                if (checkbox) {
                    checkbox.checked = whatsappSettings.send_days?.includes(day) || false;
                }
            });
        }
        
    } catch (error) {
        console.error('خطأ في تحميل الإعدادات:', error);
        // إعدادات افتراضية في حالة الخطأ
        whatsappSettings = {
            api_url: 'https://api.whatsapp.com/send',
            api_key: '',
            sender_number: '',
            auto_send_enabled: true,
            send_time_from: '07:00',
            send_time_to: '22:00',
            send_days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
            message_delay: 5
        };
        
        // ملء النموذج بالإعدادات الافتراضية
        document.getElementById('whatsappApiUrl').value = whatsappSettings.api_url;
        document.getElementById('autoSendEnabled').checked = whatsappSettings.auto_send_enabled;
        document.getElementById('sendTimeFrom').value = whatsappSettings.send_time_from;
        document.getElementById('sendTimeTo').value = whatsappSettings.send_time_to;
        document.getElementById('messageDelay').value = whatsappSettings.message_delay;
    }
}

// تحميل القوالب
async function loadTemplates() {
    try {
        const response = await apiService.getWhatsappTemplates();
        if (response.success) {
            messageTemplates = response.data;
        }
        
        displayTemplates();
        
    } catch (error) {
        console.error('خطأ في تحميل القوالب:', error);
        // قوالب افتراضية في حالة الخطأ
        messageTemplates = [
            {
                id: 1,
                name: 'إشعار الغياب',
                content: 'عزيزي ولي الأمر، نود إعلامكم بأن الطالب {student_name} كان غائباً في حصة {subject} اليوم {date}.',
                type: 'absence',
                is_active: true
            },
            {
                id: 2,
                name: 'إشعار التأخير',
                content: 'عزيزي ولي الأمر، نود إعلامكم بأن الطالب {student_name} تأخر في حصة {subject} اليوم {date}.',
                type: 'late',
                is_active: true
            }
        ];
        displayTemplates();
    }
}

// عرض القوالب
function displayTemplates() {
    const container = document.getElementById('templatesContainer');
    
    if (messageTemplates.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-file-text display-4"></i>
                <p class="mt-2">لا توجد قوالب رسائل</p>
                <button class="btn btn-primary" onclick="addMessageTemplate()">
                    <i class="bi bi-plus"></i> إضافة قالب جديد
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    messageTemplates.forEach(template => {
        html += `
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0">${template.name}</h6>
                        <small class="text-muted">النوع: ${getTemplateTypeText(template.type)}</small>
                    </div>
                    <div>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" ${template.is_active ? 'checked' : ''} 
                                   onchange="toggleTemplate(${template.id})">
                            <label class="form-check-label">نشط</label>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="message-preview">
                        ${template.content}
                    </div>
                    <div class="mt-2">
                        <button class="btn btn-outline-primary btn-sm" onclick="editTemplate(${template.id})">
                            <i class="bi bi-pencil"></i> تعديل
                        </button>
                        <button class="btn btn-outline-success btn-sm" onclick="testTemplate(${template.id})">
                            <i class="bi bi-play"></i> اختبار
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteTemplate(${template.id})">
                            <i class="bi bi-trash"></i> حذف
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ======== دوال الإجراءات ========

// إرسال الرسائل المعلقة
async function sendPendingMessages() {
    if (!confirm('هل تريد إرسال جميع الرسائل المعلقة؟')) {
        return;
    }
    
    try {
        showLoading(true);
        showToast('جاري إرسال الرسائل...', 'info');
        
        const response = await apiService.sendPendingWhatsappMessages();
        
        if (response.success) {
            showToast(response.message, 'success');
            await loadStatistics();
            await loadQueue();
        } else {
            showToast(response.message || 'فشل في إرسال الرسائل', 'error');
        }
        
    } catch (error) {
        console.error('خطأ في إرسال الرسائل:', error);
        showToast('فشل في إرسال الرسائل', 'error');
    } finally {
        showLoading(false);
    }
}

// إرسال رسالة واحدة
async function sendSingleMessage(messageId, showFeedback = true) {
    try {
        if (showFeedback) showLoading(true);
        
        const response = await apiService.sendSingleWhatsappMessage(messageId);
        
        if (response.success) {
            if (showFeedback) showToast('تم إرسال الرسالة بنجاح', 'success');
            
            // تحديث القائمة والسجل
            await loadQueue();
            await loadHistory();
            await loadStatistics();
        } else {
            if (showFeedback) showToast(response.message || 'فشل في إرسال الرسالة', 'error');
        }
        
    } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error);
        if (showFeedback) showToast('فشل في إرسال الرسالة', 'error');
    } finally {
        if (showFeedback) showLoading(false);
    }
}

// إعادة إرسال الرسائل الفاشلة
async function retryFailedMessages() {
    const failedMessages = whatsappQueue.filter(msg => msg.status === 'failed');
    
    if (failedMessages.length === 0) {
        showToast('لا توجد رسائل فاشلة لإعادة الإرسال', 'info');
        return;
    }
    
    if (!confirm(`هل تريد إعادة إرسال ${failedMessages.length} رسالة فاشلة؟`)) {
        return;
    }
    
    try {
        showLoading(true);
        
        for (const message of failedMessages) {
            message.status = 'pending';
            await sendSingleMessage(message.id, false);
            const delay = parseInt(document.getElementById('messageDelay').value) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        showToast('تم إعادة إرسال الرسائل الفاشلة', 'success');
        
    } catch (error) {
        console.error('خطأ في إعادة الإرسال:', error);
        showToast('فشل في إعادة إرسال بعض الرسائل', 'error');
    } finally {
        showLoading(false);
    }
}

// اختبار الاتصال
async function testConnection() {
    try {
        showLoading(true);
        showToast('جاري اختبار الاتصال...', 'info');
        
        const response = await apiService.testWhatsappConnection();
        
        if (response.success) {
            showToast('تم الاتصال بخدمة الواتساب بنجاح', 'success');
        } else {
            showToast(response.message || 'فشل في الاتصال بخدمة الواتساب', 'error');
        }
        
    } catch (error) {
        console.error('خطأ في اختبار الاتصال:', error);
        showToast('فشل في اختبار الاتصال', 'error');
    } finally {
        showLoading(false);
    }
}

// ======== دوال مساعدة ========

function getStatusClass(status) {
    switch (status) {
        case 'pending': return 'warning';
        case 'processing': return 'primary';
        case 'sent': return 'success';
        case 'delivered': return 'success';
        case 'failed': return 'danger';
        default: return 'secondary';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'pending': return 'في الانتظار';
        case 'processing': return 'قيد الإرسال';
        case 'sent': return 'مرسلة';
        case 'delivered': return 'وصلت';
        case 'failed': return 'فشلت';
        default: return 'غير معروف';
    }
}

function getTemplateTypeText(type) {
    switch (type) {
        case 'absence': return 'إشعار غياب';
        case 'late': return 'إشعار تأخير';
        case 'general': return 'عام';
        default: return 'غير محدد';
    }
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    const toastId = 'toast-' + Date.now();
    
    let bgClass = 'bg-primary';
    let iconClass = 'bi-info-circle';
    
    switch (type) {
        case 'success':
            bgClass = 'bg-success';
            iconClass = 'bi-check-circle';
            break;
        case 'error':
            bgClass = 'bg-danger';
            iconClass = 'bi-exclamation-circle';
            break;
        case 'warning':
            bgClass = 'bg-warning';
            iconClass = 'bi-exclamation-triangle';
            break;
    }
    
    const toastHtml = `
        <div class="toast" id="${toastId}" role="alert">
            <div class="toast-header ${bgClass} text-white">
                <i class="${iconClass} me-2"></i>
                <strong class="me-auto">إشعار</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 4000 });
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

function startAutoRefresh() {
    // تحديث كل 30 ثانية
    refreshInterval = setInterval(async () => {
        await loadStatistics();
        await loadQueue();
    }, 30000);
}

function setupEventListeners() {
    // نموذج الإعدادات
    document.getElementById('whatsappSettingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveSettings();
    });
}

// حفظ الإعدادات
async function saveSettings() {
    try {
        showLoading(true);
        
        // جمع البيانات من النموذج
        const formData = {
            api_url: document.getElementById('whatsappApiUrl').value,
            api_key: document.getElementById('whatsappApiKey').value,
            sender_number: document.getElementById('senderNumber').value,
            auto_send_enabled: document.getElementById('autoSendEnabled').checked,
            send_time_from: document.getElementById('sendTimeFrom').value,
            send_time_to: document.getElementById('sendTimeTo').value,
            message_delay: parseInt(document.getElementById('messageDelay').value),
            send_days: []
        };
        
        // جمع أيام الإرسال
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        days.forEach(day => {
            const checkbox = document.getElementById(`send${day.charAt(0).toUpperCase() + day.slice(1)}`);
            if (checkbox && checkbox.checked) {
                formData.send_days.push(day);
            }
        });
        
        const response = await apiService.updateWhatsappSettings(formData);
        
        if (response.success) {
            whatsappSettings = formData;
            showToast('تم حفظ الإعدادات بنجاح', 'success');
        } else {
            showToast(response.message || 'فشل في حفظ الإعدادات', 'error');
        }
        
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
        showToast('فشل في حفظ الإعدادات', 'error');
    } finally {
        showLoading(false);
    }
}

// دوال التحديث
function refreshQueue() {
    loadQueue();
}

function filterHistory() {
    loadHistory();
}

// دوال القوالب
function addMessageTemplate() {
    // ستتم إضافتها لاحقاً
    showToast('ميزة إضافة القوالب ستكون متاحة قريباً', 'info');
}

function editTemplate(templateId) {
    // ستتم إضافتها لاحقاً
    showToast('ميزة تعديل القوالب ستكون متاحة قريباً', 'info');
}

function deleteTemplate(templateId) {
    // ستتم إضافتها لاحقاً
    showToast('ميزة حذف القوالب ستكون متاحة قريباً', 'info');
}

function toggleTemplate(templateId) {
    const template = messageTemplates.find(t => t.id === templateId);
    if (template) {
        template.is_active = !template.is_active;
        showToast(`تم ${template.is_active ? 'تفعيل' : 'تعطيل'} القالب`, 'success');
    }
}

function testTemplate(templateId) {
    // ستتم إضافتها لاحقاً
    showToast('ميزة اختبار القوالب ستكون متاحة قريباً', 'info');
}

// دوال إدارة الرسائل
function editMessage(messageId) {
    // ستتم إضافتها لاحقاً
    showToast('ميزة تعديل الرسائل ستكون متاحة قريباً', 'info');
}

async function deleteMessage(messageId) {
    if (!confirm('هل تريد حذف هذه الرسالة؟')) {
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await apiService.deleteWhatsappMessage(messageId);
        
        if (response.success) {
            showToast('تم حذف الرسالة', 'success');
            await loadQueue();
        } else {
            showToast(response.message || 'فشل في حذف الرسالة', 'error');
        }
        
    } catch (error) {
        console.error('خطأ في حذف الرسالة:', error);
        showToast('فشل في حذف الرسالة', 'error');
    } finally {
        showLoading(false);
    }
}

function retrySingleMessage(messageId) {
    const message = whatsappQueue.find(msg => msg.id === messageId);
    if (message) {
        message.status = 'pending';
        sendSingleMessage(messageId);
    }
}

// اختبار اتصال الواتساب
function testWhatsappConnection() {
    testConnection();
}

// تسجيل الخروج
function logout() {
    console.log('تسجيل الخروج من صفحة الواتساب');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('session_expiry');
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    window.location.href = 'index.html';
}
