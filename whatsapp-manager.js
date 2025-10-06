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
        console.log('استدعاء API للإحصائيات...');
        const response = await apiService.get('/admin/whatsapp/statistics');
        console.log('استجابة الإحصائيات:', response);
        
        if (response.success) {
            const stats = response.data;
            console.log('الإحصائيات المحملة:', stats);
            
            document.getElementById('totalSent').textContent = stats.total_sent || 0;
            document.getElementById('totalDelivered').textContent = stats.total_delivered || 0;
            document.getElementById('totalFailed').textContent = stats.total_failed || 0;
            document.getElementById('totalPending').textContent = stats.total_pending || 0;
            
            console.log('تم تحديث واجهة الإحصائيات');
        } else {
            throw new Error(response.message || 'فشل في جلب الإحصائيات');
        }
        
    } catch (error) {
        console.error('خطأ في تحميل الإحصائيات:', error);
        // عرض بيانات افتراضية في حالة الخطأ
        document.getElementById('totalSent').textContent = '0';
        document.getElementById('totalDelivered').textContent = '0';
        document.getElementById('totalFailed').textContent = '0';
        document.getElementById('totalPending').textContent = '0';
    }
}

// تحميل قائمة الانتظار
async function loadQueue() {
    try {
        console.log('استدعاء API لقائمة الانتظار...');
        const response = await apiService.get('/admin/whatsapp/queue');
        console.log('استجابة قائمة الانتظار:', response);
        
        if (response.success) {
            whatsappQueue = response.data.data || response.data; // للتعامل مع pagination
            console.log('قائمة الانتظار المحملة:', whatsappQueue);
        } else {
            throw new Error(response.message || 'فشل في جلب قائمة الانتظار');
        }
        
        displayQueue();
        
    } catch (error) {
        console.error('خطأ في تحميل قائمة الانتظار:', error);
        // عرض رسالة خطأ في الواجهة
        whatsappQueue = [];
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
                        <h6 class="mb-1">${item.student?.name || 'غير محدد'} - ${item.student?.grade || 'غير محدد'}</h6>
                        <p class="mb-1"><strong>رقم الهاتف:</strong> ${item.phone_number}</p>
                        <div class="message-preview">
                            ${item.message_content}
                        </div>
                        <small class="text-muted">
                            <i class="bi bi-clock me-1"></i>
                            ${formatDateTime(item.created_at)}
                            ${item.retry_count > 0 ? `• المحاولة ${item.retry_count}` : ''}
                            ${item.error_message ? `• خطأ: ${item.error_message}` : ''}
                        </small>
                    </div>
                    <div class="ms-3">
                        <span class="badge status-badge bg-${statusColor}">${statusText}</span>
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
        console.log('استدعاء API لسجل الرسائل...');
        const response = await apiService.get('/admin/whatsapp/history');
        console.log('استجابة سجل الرسائل:', response);
        
        if (response.success) {
            whatsappHistory = response.data.data || response.data; // للتعامل مع pagination
            console.log('سجل الرسائل المحمل:', whatsappHistory);
        } else {
            throw new Error(response.message || 'فشل في جلب سجل الرسائل');
        }
        
        displayHistory();
        
    } catch (error) {
        console.error('خطأ في تحميل السجل:', error);
        whatsappHistory = [];
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
        const studentName = item.student ? item.student.name : 'غير محدد';
        const phoneNumber = item.phone_number || 'غير محدد';
        
        html += `
            <div class="timeline-item ${statusClass}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${studentName}</h6>
                        <p class="mb-1">${phoneNumber}</p>
                        <div class="message-preview">
                            ${item.message_content}
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
                            ${item.sent_at ? formatDateTime(item.sent_at) : 'لم يتم الإرسال'}
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
        console.log('استدعاء API للقوالب...');
        const response = await apiService.get('/admin/whatsapp/templates');
        console.log('استجابة القوالب:', response);
        
        if (response.success) {
            messageTemplates = response.data;
            console.log('القوالب المحملة:', messageTemplates);
        } else {
            throw new Error(response.message || 'فشل في جلب القوالب');
        }
        
        displayTemplates();
        
    } catch (error) {
        console.error('خطأ في تحميل القوالب:', error);
        messageTemplates = [];
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
        const templateContent = template.content || template.message || 'لا يوجد محتوى';
        const templateType = template.type || 'عام';
        
        html += `
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0">${template.name}</h6>
                        <small class="text-muted">النوع: ${getTemplateTypeText(templateType)}</small>
                    </div>
                    <div>
                        <span class="badge ${template.is_active ? 'bg-success' : 'bg-secondary'} me-2">
                            ${template.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="editTemplate(${template.id})">
                                <i class="bi bi-pencil"></i> تعديل
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteTemplate(${template.id})">
                                <i class="bi bi-trash"></i> حذف
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="message-preview mb-3">
                        ${templateContent.substring(0, 200)}${templateContent.length > 200 ? '...' : ''}
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <small class="text-muted">تم الإنشاء: ${formatDateTime(template.created_at)}</small>
                        </div>
                        <div class="col-md-6 text-end">
                            <small class="text-muted">آخر تحديث: ${formatDateTime(template.updated_at)}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// تحويل نوع القالب إلى نص
function getTemplateTypeText(type) {
    const types = {
        'absent': 'رسالة الغياب',
        'late': 'رسالة التأخير',
        'repeated_absence': 'الغياب المتكرر',
        'weekly_summary': 'الملخص الأسبوعي'
    };
    return types[type] || 'عام';
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
    const templateName = prompt('اسم القالب:');
    if (!templateName) return;
    
    const templateContent = prompt('محتوى القالب (يمكن استخدام متغيرات مثل {{student_name}}, {{date}}, {{subject}}):');
    if (!templateContent) return;
    
    const templateType = prompt('نوع القالب (absence, late, general):') || 'general';
    
    createNewTemplate({
        name: templateName,
        content: templateContent,
        type: templateType,
        is_active: true
    });
}

async function createNewTemplate(templateData) {
    try {
        showLoading(true);
        console.log('إنشاء قالب جديد:', templateData);
        
        const response = await apiService.post('/admin/whatsapp/templates', templateData);
        console.log('استجابة إنشاء القالب:', response);
        
        if (response.success) {
            showNotification('تم إنشاء القالب بنجاح', 'success');
            await loadTemplates();
        } else {
            throw new Error(response.message || 'فشل في إنشاء القالب');
        }
        
    } catch (error) {
        console.error('خطأ في إنشاء القالب:', error);
        showNotification('فشل في إنشاء القالب: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function editTemplate(templateId) {
    try {
        // الحصول على القالب من البيانات الحقيقية
        const templatesResponse = await apiService.get('/admin/whatsapp/templates');
        const templates = templatesResponse.data || [];
        const template = templates.find(t => t.id === templateId);
        
        if (!template) {
            showNotification('القالب غير موجود', 'error');
            return;
        }
        
        const newName = prompt('اسم القالب:', template.name);
        if (newName === null) return;
        
        const newContent = prompt('محتوى القالب:', template.content || template.message);
        if (newContent === null) return;
        
        const newType = prompt('نوع القالب:', template.type || 'general');
        if (newType === null) return;
        
        await updateTemplate(templateId, {
            name: newName,
            content: newContent,
            type: newType,
            is_active: template.is_active
        });
        
    } catch (error) {
        console.error('خطأ في تحرير القالب:', error);
        showNotification('فشل في تحرير القالب: ' + error.message, 'error');
    }
}

async function updateTemplate(templateId, templateData) {
    try {
        showLoading(true);
        console.log('تحديث القالب:', templateId, templateData);
        
        const response = await apiService.put(`/admin/whatsapp/templates/${templateId}`, templateData);
        console.log('استجابة تحديث القالب:', response);
        
        if (response.success) {
            showNotification('تم تحديث القالب بنجاح', 'success');
            await loadTemplates();
        } else {
            throw new Error(response.message || 'فشل في تحديث القالب');
        }
        
    } catch (error) {
        console.error('خطأ في تحديث القالب:', error);
        showNotification('فشل في تحديث القالب: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function deleteTemplate(templateId) {
    if (!confirm('هل تريد حذف هذا القالب؟')) {
        return;
    }
    
    deleteTemplateConfirmed(templateId);
}

async function deleteTemplateConfirmed(templateId) {
    try {
        showLoading(true);
        console.log('حذف القالب:', templateId);
        
        const response = await apiService.delete(`/admin/whatsapp/templates/${templateId}`);
        console.log('استجابة حذف القالب:', response);
        
        if (response.success) {
            showNotification('تم حذف القالب بنجاح', 'success');
            await loadTemplates();
        } else {
            throw new Error(response.message || 'فشل في حذف القالب');
        }
        
    } catch (error) {
        console.error('خطأ في حذف القالب:', error);
        showNotification('فشل في حذف القالب: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function toggleTemplate(templateId) {
    try {
        showLoading(true);
        console.log('تحديث حالة القالب:', templateId);
        
        // الحصول على القالب الحالي لمعرفة حالته
        const templatesResponse = await apiService.get('/admin/whatsapp/templates');
        const templates = templatesResponse.data || [];
        const template = templates.find(t => t.id === templateId);
        
        if (!template) {
            throw new Error('القالب غير موجود');
        }
        
        const newStatus = !template.is_active;
        
        const response = await apiService.patch(`/admin/whatsapp/templates/${templateId}`, {
            is_active: newStatus
        });
        console.log('استجابة تحديث حالة القالب:', response);
        
        if (response.success) {
            showNotification(`تم ${newStatus ? 'تفعيل' : 'إلغاء تفعيل'} القالب بنجاح`, 'success');
            await loadTemplates();
        } else {
            throw new Error(response.message || 'فشل في تحديث حالة القالب');
        }
        
    } catch (error) {
        console.error('خطأ في تحديث حالة القالب:', error);
        showNotification('فشل في تحديث حالة القالب: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function testTemplate(templateId) {
    try {
        // الحصول على القالب من البيانات الحقيقية
        const templatesResponse = await apiService.get('/admin/whatsapp/templates');
        const templates = templatesResponse.data || [];
        const template = templates.find(t => t.id === templateId);
        
        if (!template) {
            showNotification('القالب غير موجود', 'error');
            return;
        }
        
        const testNumber = prompt('رقم الهاتف للاختبار (مثل: 966xxxxxxxxx):');
        if (!testNumber) return;
        
        // متغيرات تجريبية للاختبار
        const testVariables = {
            student_name: 'أحمد محمد',
            date: new Date().toLocaleDateString('ar-SA'),
            subject: 'الرياضيات',
            class_name: '3أ',
            time: new Date().toLocaleTimeString('ar-SA')
        };
        
        let testMessage = template.content || template.message;
        Object.keys(testVariables).forEach(key => {
            testMessage = testMessage.replace(new RegExp(`{{${key}}}`, 'g'), testVariables[key]);
        });
        
        if (confirm(`سيتم إرسال الرسالة التالية:\n\n${testMessage}\n\nإلى: ${testNumber}\n\nهل تريد المتابعة؟`)) {
            await sendTestMessage(testNumber, testMessage);
        }
        
    } catch (error) {
        console.error('خطأ في اختبار القالب:', error);
        showNotification('فشل في اختبار القالب: ' + error.message, 'error');
    }
}

async function sendTestMessage(phoneNumber, message) {
    try {
        showLoading(true);
        showNotification('جاري إرسال رسالة الاختبار...', 'info');
        
        const response = await apiService.post('/admin/whatsapp/test-connection', {
            test_number: phoneNumber,
            message: message
        });
        
        if (response.success) {
            showNotification('تم إرسال رسالة الاختبار بنجاح', 'success');
        } else {
            throw new Error(response.message || 'فشل في إرسال رسالة الاختبار');
        }
        
    } catch (error) {
        console.error('خطأ في إرسال رسالة الاختبار:', error);
        showNotification('فشل في إرسال رسالة الاختبار: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
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

// إرسال الرسائل المعلقة
async function sendPendingMessages() {
    try {
        showLoading(true);
        console.log('إرسال الرسائل المعلقة...');
        
        const delay = document.getElementById('messageDelay')?.value || 2;
        const response = await apiService.post('/admin/whatsapp/send-pending', { delay });
        
        if (response.success) {
            showNotification(response.message, 'success');
            await loadStatistics();
            await loadQueue();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('خطأ في إرسال الرسائل:', error);
        showNotification('خطأ في إرسال الرسائل: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// إعادة إرسال الرسائل الفاشلة
async function retryFailedMessages() {
    try {
        showLoading(true);
        console.log('إعادة إرسال الرسائل الفاشلة...');
        
        const delay = document.getElementById('messageDelay')?.value || 2;
        const response = await apiService.post('/admin/whatsapp/retry-failed', { delay });
        
        if (response.success) {
            showNotification(response.message, 'success');
            await loadStatistics();
            await loadQueue();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('خطأ في إعادة الإرسال:', error);
        showNotification('خطأ في إعادة الإرسال: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// اختبار الاتصال
async function testConnection() {
    try {
        showLoading(true);
        console.log('اختبار اتصال الواتساب...');
        
        const response = await apiService.post('/admin/whatsapp/test-connection');
        
        if (response.success) {
            showNotification('تم الاتصال بنجاح مع خدمة الواتساب', 'success');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('خطأ في اختبار الاتصال:', error);
        showNotification('فشل في اختبار الاتصال: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// إرسال رسالة واحدة
async function sendSingleMessage(messageId) {
    try {
        showLoading(true);
        console.log('إرسال رسالة واحدة:', messageId);
        
        const response = await apiService.post(`/admin/whatsapp/send-pending`, { 
            limit: 1,
            message_id: messageId 
        });
        
        if (response.success) {
            showNotification('تم إرسال الرسالة بنجاح', 'success');
            await loadStatistics();
            await loadQueue();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error);
        showNotification('خطأ في إرسال الرسالة: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// إعادة إرسال رسالة واحدة
async function retrySingleMessage(messageId) {
    try {
        showLoading(true);
        console.log('إعادة إرسال رسالة واحدة:', messageId);
        
        const response = await apiService.post(`/admin/whatsapp/retry-failed`, { 
            limit: 1,
            message_id: messageId 
        });
        
        if (response.success) {
            showNotification('تم إعادة إرسال الرسالة بنجاح', 'success');
            await loadStatistics();
            await loadQueue();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('خطأ في إعادة إرسال الرسالة:', error);
        showNotification('خطأ في إعادة إرسال الرسالة: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// حذف رسالة
async function deleteMessage(messageId) {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
        return;
    }
    
    try {
        showLoading(true);
        console.log('حذف رسالة:', messageId);
        
        // تحديث قائمة الانتظار محلياً
        whatsappQueue = whatsappQueue.filter(msg => msg.id !== messageId);
        displayQueue();
        
        showNotification('تم حذف الرسالة بنجاح', 'success');
        await loadStatistics();
    } catch (error) {
        console.error('خطأ في حذف الرسالة:', error);
        showNotification('خطأ في حذف الرسالة: ' + error.message, 'error');
        // إعادة تحميل القائمة في حالة الخطأ
        await loadQueue();
    } finally {
        showLoading(false);
    }
}

// تحديث البيانات
async function refreshQueue() {
    await loadQueue();
    showNotification('تم تحديث قائمة الانتظار', 'info');
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

// ==============================================
// Send Messages Tab Functions
// ==============================================

// متغيرات عامة
let allStudents = [];
let filteredStudents = [];
let selectedStudents = [];

// تحميل قائمة الطلاب
async function loadStudentsList() {
    try {
        console.log('جاري تحميل قائمة الطلاب...');
        
        const response = await fetch(`${API_URL}/api/students/all`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل تحميل قائمة الطلاب');
        }
        
        const data = await response.json();
        allStudents = data.students || [];
        filteredStudents = [...allStudents];
        
        console.log(`تم تحميل ${allStudents.length} طالب`);
        displayStudentsList();
        
    } catch (error) {
        console.error('خطأ في تحميل قائمة الطلاب:', error);
        document.getElementById('studentsListContainer').innerHTML = `
            <div class="text-center text-danger py-4">
                <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
                <p class="mt-2">خطأ في تحميل قائمة الطلاب</p>
                <button class="btn btn-sm btn-outline-primary" onclick="loadStudentsList()">
                    <i class="bi bi-arrow-clockwise"></i> إعادة المحاولة
                </button>
            </div>
        `;
    }
}

// عرض قائمة الطلاب
function displayStudentsList() {
    const container = document.getElementById('studentsListContainer');
    
    if (filteredStudents.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                <p class="mt-2">لا توجد نتائج</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    filteredStudents.forEach(student => {
        const isSelected = selectedStudents.some(s => s.id === student.id);
        const absenceDays = student.absence_days || 0;
        
        // تحديد لون badge الغياب
        let absenceClass = 'absence-low';
        if (absenceDays >= 10) absenceClass = 'absence-high';
        else if (absenceDays >= 5) absenceClass = 'absence-medium';
        
        html += `
            <div class="student-item ${isSelected ? 'selected' : ''}" onclick="toggleStudent(${student.id})">
                <div class="d-flex align-items-center gap-3">
                    <input type="checkbox" class="form-check-input" 
                           ${isSelected ? 'checked' : ''} 
                           onclick="event.stopPropagation(); toggleStudent(${student.id})">
                    
                    <div class="student-info">
                        <div class="student-name">${student.name}</div>
                        <div class="student-details">
                            <i class="bi bi-card-text"></i> ${student.national_id || 'غير محدد'} |
                            <i class="bi bi-book"></i> ${student.grade || 'غير محدد'} - ${student.class_name || 'غير محدد'}
                            ${student.parent_phone ? `| <i class="bi bi-phone"></i> ${student.parent_phone}` : ''}
                        </div>
                    </div>
                    
                    ${absenceDays > 0 ? `
                        <span class="absence-badge ${absenceClass}">
                            <i class="bi bi-calendar-x"></i> ${absenceDays} يوم غياب
                        </span>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    updateSelectedCount();
}

// تبديل تحديد طالب
function toggleStudent(studentId) {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;
    
    const index = selectedStudents.findIndex(s => s.id === studentId);
    if (index > -1) {
        selectedStudents.splice(index, 1);
    } else {
        selectedStudents.push(student);
    }
    
    displayStudentsList();
    updateMessagePreview();
}

// تحديد جميع الطلاب
function selectAllStudents() {
    selectedStudents = [...filteredStudents];
    displayStudentsList();
    updateMessagePreview();
}

// إلغاء تحديد جميع الطلاب
function clearAllStudents() {
    selectedStudents = [];
    displayStudentsList();
    updateMessagePreview();
}

// تحديث عداد الطلاب المحددين
function updateSelectedCount() {
    document.getElementById('selectedCount').textContent = selectedStudents.length;
    document.getElementById('sendCount').textContent = selectedStudents.length;
}

// البحث عن طلاب
function searchStudents() {
    const searchTerm = document.getElementById('studentSearch').value.trim().toLowerCase();
    
    if (!searchTerm) {
        filteredStudents = [...allStudents];
    } else {
        filteredStudents = allStudents.filter(student => 
            student.name.toLowerCase().includes(searchTerm) ||
            (student.national_id && student.national_id.includes(searchTerm))
        );
    }
    
    displayStudentsList();
}

// تصفية الطلاب حسب الغياب
async function filterStudentsByAbsence() {
    const days = document.getElementById('absenceFilter').value;
    
    if (!days) {
        filteredStudents = [...allStudents];
        displayStudentsList();
        return;
    }
    
    try {
        showLoading(true);
        console.log(`جاري تحميل الطلاب الغائبين ${days} يوم فأكثر...`);
        
        const response = await fetch(`${API_URL}/api/students/absent?days=${days}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل تحميل الطلاب الغائبين');
        }
        
        const data = await response.json();
        filteredStudents = data.students || [];
        
        console.log(`تم العثور على ${filteredStudents.length} طالب غائب`);
        displayStudentsList();
        
        showNotification(`تم العثور على ${filteredStudents.length} طالب غائب ${days} يوم فأكثر`, 'info');
        
    } catch (error) {
        console.error('خطأ في تصفية الطلاب:', error);
        showNotification('خطأ في تصفية الطلاب: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// تحديث معاينة الرسالة
function updateMessagePreview() {
    const messageText = document.getElementById('messageText').value;
    const previewDiv = document.getElementById('messagePreview');
    const previewTextDiv = document.getElementById('previewText');
    
    if (!messageText || selectedStudents.length === 0) {
        previewDiv.style.display = 'none';
        return;
    }
    
    // معاينة الرسالة بأول طالب محدد
    const firstStudent = selectedStudents[0];
    let preview = messageText
        .replace(/{الاسم}/g, firstStudent.name)
        .replace(/{الصف}/g, firstStudent.grade || 'غير محدد')
        .replace(/{الفصل}/g, firstStudent.class_name || 'غير محدد')
        .replace(/{ايام_الغياب}/g, firstStudent.absence_days || '0');
    
    previewTextDiv.innerHTML = preview.replace(/\n/g, '<br>');
    previewDiv.style.display = 'block';
}

// إرسال الرسائل الجماعية
async function sendBulkMessages() {
    const messageText = document.getElementById('messageText').value.trim();
    
    // التحقق من الرسالة
    if (!messageText) {
        showNotification('الرجاء كتابة نص الرسالة', 'warning');
        return;
    }
    
    // التحقق من الطلاب المحددين
    if (selectedStudents.length === 0) {
        showNotification('الرجاء اختيار طالب واحد على الأقل', 'warning');
        return;
    }
    
    // تأكيد الإرسال
    if (!confirm(`هل أنت متأكد من إرسال الرسالة إلى ${selectedStudents.length} طالب؟`)) {
        return;
    }
    
    try {
        showLoading(true);
        console.log(`جاري إرسال رسائل إلى ${selectedStudents.length} طالب...`);
        
        // إعداد بيانات الإرسال
        const messages = selectedStudents.map(student => {
            let personalizedMessage = messageText
                .replace(/{الاسم}/g, student.name)
                .replace(/{الصف}/g, student.grade || 'غير محدد')
                .replace(/{الفصل}/g, student.class_name || 'غير محدد')
                .replace(/{ايام_الغياب}/g, student.absence_days || '0');
            
            return {
                student_id: student.id,
                phone: student.parent_phone,
                message: personalizedMessage,
                student_name: student.name
            };
        });
        
        const response = await fetch(`${API_URL}/api/whatsapp/send-bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
                messages: messages
            })
        });
        
        if (!response.ok) {
            throw new Error('فشل إرسال الرسائل');
        }
        
        const data = await response.json();
        
        showNotification(`تم إضافة ${data.queued || selectedStudents.length} رسالة إلى قائمة الانتظار`, 'success');
        
        // إعادة تعيين النموذج
        document.getElementById('messageText').value = '';
        clearAllStudents();
        updateMessagePreview();
        
        // التحديث التلقائي للقائمة
        await loadQueue();
        await loadStatistics();
        
        // الانتقال إلى تبويب قائمة الانتظار
        const queueTab = document.getElementById('queue-tab');
        if (queueTab) {
            queueTab.click();
        }
        
    } catch (error) {
        console.error('خطأ في إرسال الرسائل:', error);
        showNotification('خطأ في إرسال الرسائل: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// إضافة مستمع لتحديث المعاينة عند كتابة الرسالة
document.addEventListener('DOMContentLoaded', function() {
    const messageTextarea = document.getElementById('messageText');
    if (messageTextarea) {
        messageTextarea.addEventListener('input', updateMessagePreview);
    }
    
    // تحميل قائمة الطلاب عند فتح التبويب
    const sendMessagesTab = document.getElementById('send-messages-tab');
    if (sendMessagesTab) {
        sendMessagesTab.addEventListener('shown.bs.tab', function() {
            if (allStudents.length === 0) {
                loadStudentsList();
            }
        });
    }
});
