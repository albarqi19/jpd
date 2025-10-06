// الثوابت
const API_URL = 'https://roseanne-nonrestricting-arnoldo.ngrok-free.dev/api';
let reportData = null;
let currentReportType = 'class';

// تحديد نوع التقرير
function selectReportType(type) {
    currentReportType = type;
    
    // تحديث الأزرار
    document.querySelectorAll('.report-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // إظهار/إخفاء الحقول المناسبة
    const gradeFilter = document.getElementById('gradeFilter');
    const classFilter = document.getElementById('classFilter');
    const studentFilter = document.getElementById('studentFilter');
    
    if (type === 'class') {
        gradeFilter.style.display = 'block';
        classFilter.style.display = 'block';
        studentFilter.style.display = 'none';
    } else if (type === 'student') {
        gradeFilter.style.display = 'none';
        classFilter.style.display = 'none';
        studentFilter.style.display = 'block';
        loadAllStudents();
    } else if (type === 'grade') {
        gradeFilter.style.display = 'block';
        classFilter.style.display = 'none';
        studentFilter.style.display = 'none';
    }
}

// تحميل الفصول حسب الصف
function loadClasses() {
    const grade = document.getElementById('gradeSelect').value;
    const classSelect = document.getElementById('classSelect');
    
    if (!grade) {
        classSelect.innerHTML = '<option value="">اختر الفصل</option>';
        return;
    }
    
    // الفصول حسب الصف
    let classes = [];
    if (grade === 'الصف الأول') {
        classes = ['1', '2', '3', '4', '5'];
    } else if (grade === 'الصف الثاني') {
        classes = ['1', '2', '3', '4'];
    } else if (grade === 'الصف الثالث') {
        classes = ['1', '2', '3', '4'];
    } else if (grade === 'الصف الرابع') {
        classes = ['1', '2', '3', '4', '5', '6'];
    } else if (grade === 'الصف الخامس') {
        classes = ['1', '2', '3', '4', '5'];
    } else if (grade === 'الصف السادس') {
        classes = ['1', '2', '3', '4'];
    }
    
    classSelect.innerHTML = '<option value="">اختر الفصل</option>';
    classes.forEach(cls => {
        classSelect.innerHTML += `<option value="${cls}">${cls}</option>`;
    });
}

// تحميل جميع الطلاب
async function loadAllStudents() {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_URL}/admin/students/all`, {
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('فشل تحميل الطلاب');
        
        const result = await response.json();
        console.log('Students API Response:', result); // للتأكد
        
        // التعامل مع الاستجابة بشكل صحيح
        let students = [];
        if (result.success && result.data) {
            students = Array.isArray(result.data) ? result.data : [];
        } else if (Array.isArray(result)) {
            students = result;
        }
        
        const studentSelect = document.getElementById('studentSelect');
        studentSelect.innerHTML = '<option value="">ابحث عن طالب...</option>';
        
        if (students.length > 0) {
            students.forEach(student => {
                studentSelect.innerHTML += `<option value="${student.id}">${student.name} - ${student.grade} ${student.class_name}</option>`;
            });
        } else {
            showToast('لا توجد بيانات طلاب', 'warning');
        }
        
    } catch (error) {
        console.error('خطأ في تحميل الطلاب:', error);
        showToast('فشل تحميل قائمة الطلاب', 'error');
    }
}

// التبديل بين التواريخ المخصصة
function toggleCustomDates() {
    const period = document.getElementById('periodSelect').value;
    const customDates = document.getElementById('customDates');
    
    if (period === 'custom') {
        customDates.style.display = 'flex';
        
        // تعيين التاريخ الافتراضي
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('endDate').value = today;
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        document.getElementById('startDate').value = weekAgo.toISOString().split('T')[0];
    } else {
        customDates.style.display = 'none';
    }
}

// حساب نطاق التاريخ حسب الفترة
function getDateRange() {
    const period = document.getElementById('periodSelect').value;
    const endDate = new Date();
    let startDate = new Date();
    
    if (period === 'today') {
        startDate = new Date();
    } else if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'custom') {
        const customStart = document.getElementById('startDate').value;
        const customEnd = document.getElementById('endDate').value;
        
        if (!customStart || !customEnd) {
            throw new Error('يرجى تحديد تاريخ البداية والنهاية');
        }
        
        return {
            start: customStart,
            end: customEnd
        };
    }
    
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
    };
}

// إنشاء التقرير
async function generateReport() {
    try {
        // التحقق من البيانات المطلوبة
        if (currentReportType === 'class') {
            const grade = document.getElementById('gradeSelect').value;
            const className = document.getElementById('classSelect').value;
            
            if (!grade || !className) {
                showToast('يرجى اختيار الصف والفصل', 'warning');
                return;
            }
        } else if (currentReportType === 'student') {
            const studentId = document.getElementById('studentSelect').value;
            
            if (!studentId) {
                showToast('يرجى اختيار الطالب', 'warning');
                return;
            }
        } else if (currentReportType === 'grade') {
            const grade = document.getElementById('gradeSelect').value;
            
            if (!grade) {
                showToast('يرجى اختيار الصف', 'warning');
                return;
            }
        }
        
        // إظهار Loading
        document.getElementById('loading').style.display = 'block';
        document.getElementById('previewSection').style.display = 'none';
        
        // الحصول على نطاق التاريخ
        const dateRange = getDateRange();
        
        // جلب البيانات من API
        const data = await fetchAttendanceData(dateRange);
        
        // إنشاء التقرير
        buildReport(data, dateRange);
        
        // إخفاء Loading وإظهار المعاينة
        document.getElementById('loading').style.display = 'none';
        document.getElementById('previewSection').style.display = 'block';
        
        // التمرير للمعاينة
        document.getElementById('previewSection').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('خطأ في إنشاء التقرير:', error);
        document.getElementById('loading').style.display = 'none';
        showToast('فشل إنشاء التقرير: ' + error.message, 'error');
    }
}

// جلب بيانات الحضور من API
async function fetchAttendanceData(dateRange) {
    let url = `${API_URL}/admin/attendance/report?`;
    
    if (currentReportType === 'class') {
        const grade = document.getElementById('gradeSelect').value;
        const className = document.getElementById('classSelect').value;
        url += `type=class&grade=${grade}&class=${className}`;
    } else if (currentReportType === 'student') {
        const studentId = document.getElementById('studentSelect').value;
        url += `type=student&student_id=${studentId}`;
    } else if (currentReportType === 'grade') {
        const grade = document.getElementById('gradeSelect').value;
        url += `type=grade&grade=${grade}`;
    }
    
    url += `&start_date=${dateRange.start}&end_date=${dateRange.end}`;
    
    console.log('Fetching from:', url); // للتأكد
    
    const token = localStorage.getItem('auth_token');
    const response = await fetch(url, {
        headers: {
            'ngrok-skip-browser-warning': 'true',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error('فشل جلب بيانات الحضور');
    }
    
    const result = await response.json();
    console.log('API Response:', result); // للتأكد
    return result.data || result;
}

// بناء التقرير
function buildReport(data, dateRange) {
    reportData = data;
    
    console.log('Report Data:', data); // للتأكد من البيانات
    
    // تحديث معلومات التقرير
    updateReportHeader(dateRange);
    
    // بناء الجدول
    buildAttendanceTable(data);
    
    // بناء الإحصائيات
    buildStatistics(data);
}

// تحديث رأس التقرير
function updateReportHeader(dateRange) {
    const reportClass = document.getElementById('reportClass');
    const reportPeriod = document.getElementById('reportPeriod');
    const printDate = document.getElementById('printDate');
    const reportTitle = document.getElementById('reportTitle');
    
    // تحديث العنوان
    if (currentReportType === 'class') {
        const grade = document.getElementById('gradeSelect').value;
        const className = document.getElementById('classSelect').value;
        reportClass.textContent = `${grade} - ${className}`;
        reportTitle.textContent = `كشف حضور وغياب الفصل ${grade} ${className}`;
    } else if (currentReportType === 'student') {
        const studentSelect = document.getElementById('studentSelect');
        const studentName = studentSelect.options[studentSelect.selectedIndex].text;
        reportClass.textContent = studentName;
        reportTitle.textContent = `كشف حضور وغياب الطالب`;
    } else if (currentReportType === 'grade') {
        const grade = document.getElementById('gradeSelect').value;
        reportClass.textContent = `الصف ${grade}`;
        reportTitle.textContent = `كشف حضور وغياب الصف ${grade}`;
    }
    
    // تحديث الفترة
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    reportPeriod.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    
    // تاريخ الطباعة
    printDate.textContent = formatDate(new Date());
}

// بناء جدول الحضور
function buildAttendanceTable(data) {
    const table = document.getElementById('attendanceTable');
    const showPresent = document.getElementById('showPresent').checked;
    const showAbsent = document.getElementById('showAbsent').checked;
    const showLate = document.getElementById('showLate').checked;
    
    // خيارات الأعمدة
    const showColumnPresent = document.getElementById('showColumnPresent').checked;
    const showColumnAbsent = document.getElementById('showColumnAbsent').checked;
    const showColumnLate = document.getElementById('showColumnLate').checked;
    
    let html = '<thead><tr><th rowspan="2">#</th><th rowspan="2">الاسم</th>';
    
    // رؤوس الأعمدة (الأيام/الأسابيع)
    const dates = data.dates || [];
    dates.forEach(date => {
        html += `<th>${formatDateShort(new Date(date))}</th>`;
    });
    
    // أعمدة الإحصائيات حسب الاختيار
    if (showColumnPresent) html += '<th rowspan="2">الحضور</th>';
    if (showColumnAbsent) html += '<th rowspan="2">الغياب</th>';
    if (showColumnLate) html += '<th rowspan="2">التأخير</th>';
    
    html += '</tr></thead><tbody>';
    
    // صفوف الطلاب
    const students = data.students || [];
    students.forEach((student, index) => {
        html += `<tr>`;
        html += `<td>${index + 1}</td>`;
        html += `<td class="student-name">${student.name}</td>`;
        
        // الحضور لكل يوم
        dates.forEach(date => {
            const record = student.attendance.find(a => {
                // التأكد من تطابق التاريخ (قد يكون بصيغة datetime)
                const recordDate = a.date ? a.date.split(' ')[0] : '';
                return recordDate === date || a.date === date;
            });
            let cellClass = '';
            let cellText = '-';
            
            if (record && record.status) {
                if (record.status === 'present') {
                    cellClass = showPresent ? 'cell-present' : '';
                    cellText = showPresent ? '✓' : '-';
                } else if (record.status === 'absent') {
                    cellClass = showAbsent ? 'cell-absent' : '';
                    cellText = showAbsent ? '✗' : '-';
                } else if (record.status === 'late') {
                    cellClass = showLate ? 'cell-late' : '';
                    cellText = showLate ? '⚠' : '-';
                }
            }
            
            html += `<td class="${cellClass}">${cellText}</td>`;
        });
        
        // الإحصائيات - فقط الأعمدة المفعلة
        if (showColumnPresent) html += `<td class="cell-present">${student.total_present || 0}</td>`;
        if (showColumnAbsent) html += `<td class="cell-absent">${student.total_absent || 0}</td>`;
        if (showColumnLate) html += `<td class="cell-late">${student.total_late || 0}</td>`;
        html += '</tr>';
    });
    
    html += '</tbody>';
    table.innerHTML = html;
}

// بناء الإحصائيات
function buildStatistics(data) {
    const stats = document.getElementById('statistics');
    
    // خيارات عرض الإحصائيات
    const showColumnPresent = document.getElementById('showColumnPresent').checked;
    const showColumnAbsent = document.getElementById('showColumnAbsent').checked;
    const showColumnLate = document.getElementById('showColumnLate').checked;
    
    console.log('Building statistics for:', data.students); // للتأكد
    
    // حساب الإجماليات
    const totalPresent = data.students.reduce((sum, s) => {
        const val = parseInt(s.total_present) || 0;
        console.log(`${s.name}: present=${val}`);
        return sum + val;
    }, 0);
    const totalAbsent = data.students.reduce((sum, s) => {
        const val = parseInt(s.total_absent) || 0;
        console.log(`${s.name}: absent=${val}`);
        return sum + val;
    }, 0);
    const totalLate = data.students.reduce((sum, s) => {
        const val = parseInt(s.total_late) || 0;
        return sum + val;
    }, 0);
    
    console.log('Totals:', {totalPresent, totalAbsent, totalLate});
    
    let html = '';
    
    if (showColumnPresent) {
        html += `
            <div class="stat-box present">
                <span class="number">${totalPresent}</span>
                <span class="label">إجمالي الحضور</span>
            </div>
        `;
    }
    
    if (showColumnAbsent) {
        html += `
            <div class="stat-box absent">
                <span class="number">${totalAbsent}</span>
                <span class="label">إجمالي الغياب</span>
            </div>
        `;
    }
    
    if (showColumnLate) {
        html += `
            <div class="stat-box late">
                <span class="number">${totalLate}</span>
                <span class="label">إجمالي التأخير</span>
            </div>
        `;
    }
    
    stats.innerHTML = html;
}

// طباعة التقرير
function printReport() {
    window.print();
}

// تصدير PDF
function exportPDF() {
    const element = document.getElementById('printPage');
    const opt = {
        margin: 10,
        filename: `كشف_الغياب_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(element).save();
    showToast('جاري تصدير PDF...', 'success');
}

// تصدير Excel
function exportExcel() {
    if (!reportData) {
        showToast('لا توجد بيانات للتصدير', 'warning');
        return;
    }
    
    const wb = XLSX.utils.book_new();
    
    // بناء البيانات للإكسل
    const data = [];
    
    // الرؤوس
    const headers = ['#', 'الاسم'];
    reportData.dates.forEach(date => {
        headers.push(formatDateShort(new Date(date)));
    });
    headers.push('الحضور', 'الغياب', 'التأخير');
    data.push(headers);
    
    // البيانات
    reportData.students.forEach((student, index) => {
        const row = [index + 1, student.name];
        
        reportData.dates.forEach(date => {
            const record = student.attendance.find(a => a.date === date);
            if (record) {
                if (record.status === 'present') row.push('حاضر');
                else if (record.status === 'absent') row.push('غائب');
                else if (record.status === 'late') row.push('متأخر');
                else row.push('-');
            } else {
                row.push('-');
            }
        });
        
        row.push(student.total_present || 0);
        row.push(student.total_absent || 0);
        row.push(student.total_late || 0);
        
        data.push(row);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'كشف الغياب');
    
    XLSX.writeFile(wb, `كشف_الغياب_${new Date().getTime()}.xlsx`);
    showToast('تم تصدير Excel بنجاح', 'success');
}

// إغلاق المعاينة
function closePreview() {
    document.getElementById('previewSection').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// إعادة تعيين الفلاتر
function resetFilters() {
    document.getElementById('gradeSelect').value = '';
    document.getElementById('classSelect').innerHTML = '<option value="">اختر الفصل</option>';
    document.getElementById('studentSelect').value = '';
    document.getElementById('periodSelect').value = 'today';
    document.getElementById('customDates').style.display = 'none';
    document.getElementById('showPresent').checked = true;
    document.getElementById('showAbsent').checked = true;
    document.getElementById('showLate').checked = true;
    
    selectReportType('class');
}

// تنسيق التاريخ
function formatDate(date) {
    return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

function formatDateShort(date) {
    return new Intl.DateTimeFormat('ar-SA', {
        month: 'numeric',
        day: 'numeric'
    }).format(date);
}

// إظهار Toast
function showToast(message, type = 'info') {
    const bgColors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColors[type]};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// تحميل البيانات عند فتح الص٤حة
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من وجود token
    const token = localStorage.getItem('auth_token');
    if (!token) {
        showToast('يجب تسجيل الدخول أولاً', 'error');
        setTimeout(() => {
            window.close();
        }, 2000);
        return;
    }
    
    // تعيين التاريخ الافتراضي للفترة المخصصة
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('endDate').value = today;
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    document.getElementById('startDate').value = weekAgo.toISOString().split('T')[0];
    
    // الاستماع لرسائل postMessage
    window.addEventListener('message', function(event) {
        if (event.data.type === 'USER_DATA' && event.data.token) {
            localStorage.setItem('auth_token', event.data.token);
        }
    });
});
