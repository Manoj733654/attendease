/**
 * AttendEase – Attendance & Notice Management System
 * Core Application Logic & Data Management
 */

(function () {
  'use strict';

  // =========================================================================
  // CONSTANTS & DEFAULT CONFIGURATION
  // =========================================================================
  const STORAGE_KEYS = {
    STUDENTS: 'attendease_students_v1',
    TEMPLATE: 'attendease_template_v1',
    COLLEGE_NAME: 'attendease_college_v1',
    SIGNATORY: 'attendease_signatory_v1',
    ADMIN_AUTH: 'attendease_admin_auth',
    ADMIN_CREDS: 'attendease_admin_creds',
    NOTICE_ATTACHMENT: 'attendease_notice_attachment_v1'
  };

  const DEFAULT_ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123',
    isDefault: true
  };

  const DEFAULT_TEMPLATE = `Dear Parent,

This is to inform you that {{name}} (Roll No. {{roll}}) has attended {{attended}} out of {{total}} classes. Their current attendance is {{percentage}}%.

You are requested to kindly ensure regular attendance.

Regards,
Class Coordinator`;

  const DEMO_STUDENTS = [
    {
      id: 'demo_1',
      rollNumber: '85',
      studentName: 'Manoj Choudhary',
      parentName: 'Suresh Choudhary',
      parentWhatsApp: '9876543210',
      totalClasses: 50,
      attendedClasses: 45,
      studentMobile: '9876543211'
    },
    {
      id: 'demo_2',
      rollNumber: '86',
      studentName: 'Rahul Sharma',
      parentName: 'Ramesh Sharma',
      parentWhatsApp: '9876543212',
      totalClasses: 50,
      attendedClasses: 35,
      studentMobile: '9876543213'
    },
    {
      id: 'demo_3',
      rollNumber: '87',
      studentName: 'Priya Patel',
      parentName: 'Kishore Patel',
      parentWhatsApp: '9876543214',
      totalClasses: 50,
      attendedClasses: 42,
      studentMobile: '9876543215'
    },
    {
      id: 'demo_4',
      rollNumber: '88',
      studentName: 'Amit Verma',
      parentName: 'Sanjay Verma',
      parentWhatsApp: '9876543216',
      totalClasses: 50,
      attendedClasses: 32,
      studentMobile: '9876543217'
    },
    {
      id: 'demo_5',
      rollNumber: '89',
      studentName: 'Neha Singh',
      parentName: 'Devendra Singh',
      parentWhatsApp: '9876543218',
      totalClasses: 50,
      attendedClasses: 47,
      studentMobile: '9876543219'
    },
    {
      id: 'demo_6',
      rollNumber: '90',
      studentName: 'Vikram Reddy',
      parentName: 'Anand Reddy',
      parentWhatsApp: '9876543220',
      totalClasses: 50,
      attendedClasses: 36,
      studentMobile: '9876543221'
    }
  ];

  // =========================================================================
  // APPLICATION STATE
  // =========================================================================
  const state = {
    students: [],
    selectedStudentIds: new Set(),
    searchQuery: '',
    statusFilter: 'all', // 'all' | 'below' | 'good'
    customTemplate: DEFAULT_TEMPLATE,
    collegeName: 'Department of Computer Science & Engineering',
    signatoryTitle: 'Class Coordinator / HOD',
    activeNoticeStudentId: null,
    deleteCandidateId: null,
    parsedExcelStudents: [], // Staged student records from Excel/CSV before commit
    isAdminLoggedIn: false,
    noticeAttachment: null // { name, type, size, dataUrl }
  };

  // =========================================================================
  // DOM ELEMENT REFERENCES
  // =========================================================================
  const dom = {
    // Auth Views
    viewAdminLogin: document.getElementById('viewAdminLogin'),
    viewApp: document.getElementById('viewApp'),
    formAdminLogin: document.getElementById('formAdminLogin'),
    txtAdminUsername: document.getElementById('txtAdminUsername'),
    txtAdminPassword: document.getElementById('txtAdminPassword'),
    loginErrorBox: document.getElementById('loginErrorBox'),
    loginErrorText: document.getElementById('loginErrorText'),
    btnFillAdminCredentials: document.getElementById('btnFillAdminCredentials'),
    btnAdminLogout: document.getElementById('btnAdminLogout'),
    adminUserBadge: document.getElementById('adminUserBadge'),
    btnChangeAdminCreds: document.getElementById('btnChangeAdminCreds'),

    // Modal: Admin Credentials Setup / Change
    modalAdminCreds: document.getElementById('modalAdminCreds'),
    formAdminCreds: document.getElementById('formAdminCreds'),
    btnCloseModalCreds: document.getElementById('btnCloseModalCreds'),
    btnCancelCreds: document.getElementById('btnCancelCreds'),
    lblModalCredsTitle: document.getElementById('lblModalCredsTitle'),
    lblModalCredsSub: document.getElementById('lblModalCredsSub'),
    boxFirstTimeNotice: document.getElementById('boxFirstTimeNotice'),
    credsErrorBox: document.getElementById('credsErrorBox'),
    credsErrorText: document.getElementById('credsErrorText'),
    txtNewAdminUsername: document.getElementById('txtNewAdminUsername'),
    txtNewAdminPassword: document.getElementById('txtNewAdminPassword'),
    txtConfirmAdminPassword: document.getElementById('txtConfirmAdminPassword'),
    btnSaveAdminCreds: document.getElementById('btnSaveAdminCreds'),

    // Modal: QR Code for Mobile
    btnShowQrCode: document.getElementById('btnShowQrCode'),
    btnLoginShowQr: document.getElementById('btnLoginShowQr'),
    modalQrCode: document.getElementById('modalQrCode'),
    btnCloseModalQr: document.getElementById('btnCloseModalQr'),
    btnDoneQr: document.getElementById('btnDoneQr'),
    imgQrCode: document.getElementById('imgQrCode'),
    txtQrUrl: document.getElementById('txtQrUrl'),
    btnCopyQrUrl: document.getElementById('btnCopyQrUrl'),

    // Navigation (Desktop & Mobile)
    navTabs: document.querySelectorAll('.nav-tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    navNoticeCount: document.getElementById('navNoticeCount'),
    mobileBottomNav: document.getElementById('mobileBottomNav'),
    btnMobileMenuToggle: document.getElementById('btnMobileMenuToggle'),
    btnMobileQrCode: document.getElementById('btnMobileQrCode'),
    sheetMobileMenu: document.getElementById('sheetMobileMenu'),
    btnCloseMobileSheet: document.getElementById('btnCloseMobileSheet'),
    fabAddStudent: document.getElementById('fabAddStudent'),
    mobileNoticeBadge: document.getElementById('mobileNoticeBadge'),
    btnMobileMoreMenu: document.getElementById('btnMobileMoreMenu'),
    mobileInstallBanner: document.getElementById('mobileInstallBanner'),
    btnInstallAppPrompt: document.getElementById('btnInstallAppPrompt'),
    btnCloseInstallBanner: document.getElementById('btnCloseInstallBanner'),

    // Mobile Sheet Actions
    mItemAddStudent: document.getElementById('mItemAddStudent'),
    mItemExcelImport: document.getElementById('mItemExcelImport'),
    mItemExportBackup: document.getElementById('mItemExportBackup'),
    mItemImportBackup: document.getElementById('mItemImportBackup'),
    mItemLoadDemo: document.getElementById('mItemLoadDemo'),
    mItemShowQr: document.getElementById('mItemShowQr'),
    mItemChangePassword: document.getElementById('mItemChangePassword'),
    mItemClearAll: document.getElementById('mItemClearAll'),
    mItemLogout: document.getElementById('mItemLogout'),

    // KPI Cards
    kpiTotalStudents: document.getElementById('kpiTotalStudents'),
    kpiTotalClasses: document.getElementById('kpiTotalClasses'),
    kpiAvgAttendance: document.getElementById('kpiAvgAttendance'),
    kpiAvgHint: document.getElementById('kpiAvgHint'),
    kpiBelow75: document.getElementById('kpiBelow75'),
    badgeBelow75Count: document.getElementById('badgeBelow75Count'),

    // Dashboard Controls
    btnSelectBelow75: document.getElementById('btnSelectBelow75'),
    btnClearSelection: document.getElementById('btnClearSelection'),
    btnOpenAddStudent: document.getElementById('btnOpenAddStudent'),
    btnOpenExcelModal: document.getElementById('btnOpenExcelModal'),
    txtSearchStudent: document.getElementById('txtSearchStudent'),
    btnClearSearch: document.getElementById('btnClearSearch'),
    filterChips: document.querySelectorAll('.filter-chip'),

    // Selection Toolbar
    selectionToolbar: document.getElementById('selectionToolbar'),
    lblSelectionCount: document.getElementById('lblSelectionCount'),
    btnGenerateForSelected: document.getElementById('btnGenerateForSelected'),
    btnBatchSetClasses: document.getElementById('btnBatchSetClasses'),

    // Tables
    chkSelectAll: document.getElementById('chkSelectAll'),
    tbodyStudents: document.getElementById('tbodyStudents'),
    tbodyRegister: document.getElementById('tbodyRegister'),
    lblTableRecordCount: document.getElementById('lblTableRecordCount'),
    emptyState: document.getElementById('emptyState'),
    btnEmptyAddStudent: document.getElementById('btnEmptyAddStudent'),
    btnEmptyExcelImport: document.getElementById('btnEmptyExcelImport'),
    btnEmptyLoadDemo: document.getElementById('btnEmptyLoadDemo'),

    // Backup & Demo & Clear
    btnExportBackup: document.getElementById('btnExportBackup'),
    btnImportBackup: document.getElementById('btnImportBackup'),
    fileImportBackup: document.getElementById('fileImportBackup'),
    btnClearAllData: document.getElementById('btnClearAllData'),
    btnLoadDemoData: document.getElementById('btnLoadDemoData'),

    // Attendance Register Tab
    btnQuickIncrementAllTotal: document.getElementById('btnQuickIncrementAllTotal'),
    btnOpenCommonTotalModal: document.getElementById('btnOpenCommonTotalModal'),

    // Notice Generator Tab
    selectNoticeStudent: document.getElementById('selectNoticeStudent'),
    btnNoticePickBelow75: document.getElementById('btnNoticePickBelow75'),
    chkStudentCustomNotice: document.getElementById('chkStudentCustomNotice'),
    badgeCustomNoticeActive: document.getElementById('badgeCustomNoticeActive'),
    lblNoticeTemplateTitle: document.getElementById('lblNoticeTemplateTitle'),
    btnUploadNoticeFile: document.getElementById('btnUploadNoticeFile'),
    fileNoticeInput: document.getElementById('fileNoticeInput'),
    txtNoticeTemplate: document.getElementById('txtNoticeTemplate'),
    btnSaveTemplate: document.getElementById('btnSaveTemplate'),
    btnResetTemplate: document.getElementById('btnResetTemplate'),
    btnRegeneratePreview: document.getElementById('btnRegeneratePreview'),
    placeholderChips: document.querySelectorAll('.chip-tag'),
    txtCollegeName: document.getElementById('txtCollegeName'),
    txtSignatory: document.getElementById('txtSignatory'),

    // Official Notice / Circular Upload
    fileNoticeAttachment: document.getElementById('fileNoticeAttachment'),
    btnTriggerNoticeUpload: document.getElementById('btnTriggerNoticeUpload'),
    noticeUploadEmptyState: document.getElementById('noticeUploadEmptyState'),
    noticeUploadLoadedState: document.getElementById('noticeUploadLoadedState'),
    lblNoticeFileName: document.getElementById('lblNoticeFileName'),
    lblNoticeFileSize: document.getElementById('lblNoticeFileSize'),
    btnViewUploadedNotice: document.getElementById('btnViewUploadedNotice'),
    btnRemoveUploadedNotice: document.getElementById('btnRemoveUploadedNotice'),

    // Notice Preview Letterhead
    previewPager: document.getElementById('previewPager'),
    btnPrevNotice: document.getElementById('btnPrevNotice'),
    btnNextNotice: document.getElementById('btnNextNotice'),
    lblPagerText: document.getElementById('lblPagerText'),
    prevInstituteName: document.getElementById('prevInstituteName'),
    prevRefNo: document.getElementById('prevRefNo'),
    prevNoticeDate: document.getElementById('prevNoticeDate'),
    prevStudentName: document.getElementById('prevStudentName'),
    prevRollNo: document.getElementById('prevRollNo'),
    prevParentName: document.getElementById('prevParentName'),
    prevWhatsApp: document.getElementById('prevWhatsApp'),
    prevStudentMobile: document.getElementById('prevStudentMobile'),
    prevTotalClasses: document.getElementById('prevTotalClasses'),
    prevAttendedClasses: document.getElementById('prevAttendedClasses'),
    prevPercentageBadge: document.getElementById('prevPercentageBadge'),
    prevStatusTag: document.getElementById('prevStatusTag'),
    prevMessageContent: document.getElementById('prevMessageContent'),
    prevNoticeAttachmentBox: document.getElementById('prevNoticeAttachmentBox'),
    prevNoticeImgWrap: document.getElementById('prevNoticeImgWrap'),
    prevNoticeImg: document.getElementById('prevNoticeImg'),
    prevNoticeDocWrap: document.getElementById('prevNoticeDocWrap'),
    prevNoticeDocName: document.getElementById('prevNoticeDocName'),
    prevSignatoryTitle: document.getElementById('prevSignatoryTitle'),
    prevSignatoryDept: document.getElementById('prevSignatoryDept'),
    btnPrintNotice: document.getElementById('btnPrintNotice'),
    btnPrintAllSelected: document.getElementById('btnPrintAllSelected'),
    lblPrintAllCount: document.getElementById('lblPrintAllCount'),
    batchPrintContainer: document.getElementById('batchPrintContainer'),
    btnSendWhatsApp: document.getElementById('btnSendWhatsApp'),
    lblSendWhatsAppText: document.getElementById('lblSendWhatsAppText'),
    btnSendStudentWhatsApp: document.getElementById('btnSendStudentWhatsApp'),
    lblSendStudentText: document.getElementById('lblSendStudentText'),
    btnCopyNoticeText: document.getElementById('btnCopyNoticeText'),

    // Modal: Student Add/Edit
    modalStudent: document.getElementById('modalStudent'),
    formStudent: document.getElementById('formStudent'),
    lblModalStudentTitle: document.getElementById('lblModalStudentTitle'),
    btnCloseModalStudent: document.getElementById('btnCloseModalStudent'),
    btnCancelStudent: document.getElementById('btnCancelStudent'),
    txtStudentId: document.getElementById('txtStudentId'),
    txtRollNumber: document.getElementById('txtRollNumber'),
    txtStudentName: document.getElementById('txtStudentName'),
    txtParentName: document.getElementById('txtParentName'),
    txtParentWhatsApp: document.getElementById('txtParentWhatsApp'),
    txtTotalClasses: document.getElementById('txtTotalClasses'),
    txtAttendedClasses: document.getElementById('txtAttendedClasses'),
    txtStudentMobile: document.getElementById('txtStudentMobile'),
    lblLiveCalcPercentage: document.getElementById('lblLiveCalcPercentage'),
    badgeLiveCalcStatus: document.getElementById('badgeLiveCalcStatus'),

    // Modal: Delete
    modalDelete: document.getElementById('modalDelete'),
    btnCloseModalDelete: document.getElementById('btnCloseModalDelete'),
    btnCancelDelete: document.getElementById('btnCancelDelete'),
    btnConfirmDelete: document.getElementById('btnConfirmDelete'),
    deleteStudentInfo: document.getElementById('deleteStudentInfo'),

    // Modal: Batch Set Classes
    modalBatchClasses: document.getElementById('modalBatchClasses'),
    btnCloseModalBatchClasses: document.getElementById('btnCloseModalBatchClasses'),
    btnCancelBatchClasses: document.getElementById('btnCancelBatchClasses'),
    btnApplyBatchClasses: document.getElementById('btnApplyBatchClasses'),
    txtBatchTotalValue: document.getElementById('txtBatchTotalValue'),
    lblBatchSelectedCount: document.getElementById('lblBatchSelectedCount'),

    // Modal: Clear All Data
    modalClearAll: document.getElementById('modalClearAll'),
    btnCloseModalClearAll: document.getElementById('btnCloseModalClearAll'),
    btnCancelClearAll: document.getElementById('btnCancelClearAll'),
    btnConfirmClearAll: document.getElementById('btnConfirmClearAll'),
    lblClearStudentCount: document.getElementById('lblClearStudentCount'),

    // Modal: Excel / CSV Import
    modalExcelImport: document.getElementById('modalExcelImport'),
    btnCloseModalExcel: document.getElementById('btnCloseModalExcel'),
    btnCancelExcelImport: document.getElementById('btnCancelExcelImport'),
    btnConfirmExcelImport: document.getElementById('btnConfirmExcelImport'),
    fileExcelInput: document.getElementById('fileExcelInput'),
    excelDropzone: document.getElementById('excelDropzone'),
    btnDownloadSampleExcel: document.getElementById('btnDownloadSampleExcel'),
    excelFileLoaded: document.getElementById('excelFileLoaded'),
    lblExcelFileName: document.getElementById('lblExcelFileName'),
    lblExcelParsedCount: document.getElementById('lblExcelParsedCount'),
    btnClearExcelFile: document.getElementById('btnClearExcelFile'),
    excelPreviewArea: document.getElementById('excelPreviewArea'),
    tbodyExcelPreview: document.getElementById('tbodyExcelPreview'),
    chkIgnoreMobileNumbers: document.getElementById('chkIgnoreMobileNumbers'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  // =========================================================================
  // CORE CALCULATION ENGINE
  // =========================================================================

  /**
   * Attendance Percentage Formula: (Classes Attended / Total Classes) * 100
   * Do NOT allow attendance above 100%.
   */
  function calculateAttendance(attended, total) {
    total = Number(total) || 0;
    attended = Number(attended) || 0;

    if (total <= 0) return 0;
    if (attended <= 0) return 0;

    let percentage = (attended / total) * 100;
    if (percentage > 100) percentage = 100;

    return percentage;
  }

  /**
   * Formats attendance percentage to 2 decimal places or integer if whole.
   * e.g. 70 -> "70%", 72.5 -> "72.5%", 72.666 -> "72.67%"
   */
  function formatPercentage(percentage) {
    if (percentage === undefined || percentage === null || isNaN(percentage)) {
      return '0%';
    }
    const rounded = parseFloat(percentage.toFixed(2));
    return `${rounded}%`;
  }

  /**
   * Check if attendance is below 75%
   */
  function isBelow75(percentage) {
    return percentage < 75;
  }

  /**
   * Determine Student Status
   * - 75% or above -> "Good"
   * - Below 75% -> "Notice Required"
   */
  function getStudentStatus(percentage) {
    return isBelow75(percentage) ? 'Notice Required' : 'Good';
  }

  /**
   * Phone Number Normalizer for Indian Numbers
   * Accepts: 9876543210, +919876543210, 09876543210
   * Output: 919876543210 (digits only, prepended with 91 if needed)
   */
  function normalizeIndianPhone(phone) {
    if (!phone) return '';
    // Strip non-digit characters
    let cleaned = phone.toString().replace(/\D/g, '');

    // If starts with 0 and length is 11, strip leading 0
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // If 10 digits starting with 6, 7, 8, or 9
    if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      return '91' + cleaned;
    }

    // If 12 digits starting with 91
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return cleaned;
    }

    return cleaned;
  }

  /**
   * Validates if a phone number is an acceptable Indian mobile number
   */
  function isValidIndianPhone(phone) {
    if (!phone || phone.trim() === '') return true; // Optional field
    const normalized = normalizeIndianPhone(phone);
    return /^91[6-9]\d{9}$/.test(normalized);
  }

  // =========================================================================
  // STORAGE MANAGER (localStorage Persistence)
  // =========================================================================
  const Storage = {
    load() {
      try {
        const storedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
        if (storedStudents) {
          state.students = JSON.parse(storedStudents);
        } else {
          state.students = [];
        }

        const storedTemplate = localStorage.getItem(STORAGE_KEYS.TEMPLATE);
        if (storedTemplate) {
          state.customTemplate = storedTemplate;
        }

        const storedCollege = localStorage.getItem(STORAGE_KEYS.COLLEGE_NAME);
        if (storedCollege) {
          state.collegeName = storedCollege;
        }

        const storedSignatory = localStorage.getItem(STORAGE_KEYS.SIGNATORY);
        if (storedSignatory) {
          state.signatoryTitle = storedSignatory;
        }

        const storedAttachment = localStorage.getItem(STORAGE_KEYS.NOTICE_ATTACHMENT);
        if (storedAttachment) {
          try {
            state.noticeAttachment = JSON.parse(storedAttachment);
          } catch (e) {
            state.noticeAttachment = null;
          }
        }
      } catch (err) {
        console.error('Error loading data from localStorage:', err);
        state.students = [];
      }
    },

    saveNoticeAttachment(attachment) {
      try {
        state.noticeAttachment = attachment;
        if (attachment) {
          localStorage.setItem(STORAGE_KEYS.NOTICE_ATTACHMENT, JSON.stringify(attachment));
        } else {
          localStorage.removeItem(STORAGE_KEYS.NOTICE_ATTACHMENT);
        }
      } catch (err) {
        console.error('Failed to save notice attachment to localStorage:', err);
      }
    },

    saveStudents() {
      try {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(state.students));
      } catch (err) {
        console.error('Failed to save students to localStorage:', err);
      }
    },

    saveTemplate() {
      try {
        localStorage.setItem(STORAGE_KEYS.TEMPLATE, state.customTemplate);
        localStorage.setItem(STORAGE_KEYS.COLLEGE_NAME, state.collegeName);
        localStorage.setItem(STORAGE_KEYS.SIGNATORY, state.signatoryTitle);
      } catch (err) {
        console.error('Failed to save template to localStorage:', err);
      }
    },

    checkAuth() {
      try {
        return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
      } catch (err) {
        return false;
      }
    },

    setAuth(isLoggedIn) {
      try {
        if (isLoggedIn) {
          localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
        } else {
          localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
        }
      } catch (err) {
        console.error('Failed to save admin auth state:', err);
      }
    },

    clearAllStudents() {
      state.students = [];
      state.selectedStudentIds.clear();
      state.activeNoticeStudentId = null;
      try {
        localStorage.removeItem(STORAGE_KEYS.STUDENTS);
      } catch (err) {
        console.error('Failed to clear students from localStorage:', err);
      }
    }
  };

  // =========================================================================
  // TOAST NOTIFICATION SERVICE
  // =========================================================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else {
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 200);
    }, 3200);
  }

  // =========================================================================
  // NOTICE TEMPLATE ENGINE
  // =========================================================================
  /**
   * Dynamic Placeholder Replacement:
   * {{name}}       -> Student Name
   * {{roll}}       -> Roll Number
   * {{attended}}   -> Classes Attended
   * {{total}}      -> Total Classes
   * {{percentage}} -> Attendance %
   */
  function renderNoticeMessage(template, student) {
    if (!student) return '';

    const percentage = calculateAttendance(student.attendedClasses, student.totalClasses);
    const pctString = formatPercentage(percentage);

    let message = template;

    // Handle clean replacement avoiding double percentage signs
    message = message.replace(/\{\{name\}\}/gi, student.studentName || 'Student');
    message = message.replace(/\{\{roll\}\}/gi, student.rollNumber || 'N/A');
    message = message.replace(/\{\{attended\}\}/gi, student.attendedClasses ?? 0);
    message = message.replace(/\{\{total\}\}/gi, student.totalClasses ?? 0);

    // Replace {{percentage}}% and {{percentage}}
    message = message.replace(/\{\{percentage\}\}%/gi, pctString);
    message = message.replace(/\{\{percentage\}\}/gi, pctString.replace('%', ''));

    return message;
  }

  // =========================================================================
  // UI RENDERING & DASHBOARD UPDATES
  // =========================================================================

  /**
   * Recalculates and updates Dashboard KPIs
   * 1. Total Students
   * 2. Total Classes
   * 3. Average Attendance
   * 4. Students Below 75%
   */
  function updateDashboardKPIs() {
    const totalStudents = state.students.length;
    dom.kpiTotalStudents.textContent = totalStudents;

    if (totalStudents === 0) {
      dom.kpiTotalClasses.textContent = '0';
      dom.kpiAvgAttendance.textContent = '0%';
      dom.kpiAvgHint.textContent = 'No records';
      dom.kpiBelow75.textContent = '0';
      dom.badgeBelow75Count.textContent = '0';
      dom.navNoticeCount.classList.add('hidden');
      if (dom.mobileNoticeBadge) dom.mobileNoticeBadge.classList.add('hidden');
      return;
    }

    // Total classes: find max total classes among students
    let maxTotal = 0;
    let sumPercentage = 0;
    let belowCount = 0;

    state.students.forEach(student => {
      const total = Number(student.totalClasses) || 0;
      if (total > maxTotal) maxTotal = total;

      const pct = calculateAttendance(student.attendedClasses, total);
      sumPercentage += pct;

      if (isBelow75(pct)) {
        belowCount++;
      }
    });

    const avgAttendance = sumPercentage / totalStudents;

    dom.kpiTotalClasses.textContent = maxTotal;
    dom.kpiAvgAttendance.textContent = formatPercentage(avgAttendance);
    dom.kpiAvgHint.textContent = avgAttendance >= 75 ? 'Overall in safe range' : 'Overall shortage alert';
    dom.kpiBelow75.textContent = belowCount;
    dom.badgeBelow75Count.textContent = belowCount;

    if (belowCount > 0) {
      dom.navNoticeCount.textContent = belowCount;
      dom.navNoticeCount.classList.remove('hidden');
      if (dom.mobileNoticeBadge) {
        dom.mobileNoticeBadge.textContent = belowCount;
        dom.mobileNoticeBadge.classList.remove('hidden');
      }
    } else {
      dom.navNoticeCount.classList.add('hidden');
      if (dom.mobileNoticeBadge) dom.mobileNoticeBadge.classList.add('hidden');
    }
  }

  /**
   * Filter students based on search query and status filter chip
   */
  function getFilteredStudents() {
    const query = state.searchQuery.trim().toLowerCase();

    return state.students.filter(student => {
      const pct = calculateAttendance(student.attendedClasses, student.totalClasses);
      const isShortage = isBelow75(pct);

      // Status filter
      if (state.statusFilter === 'below' && !isShortage) return false;
      if (state.statusFilter === 'good' && isShortage) return false;

      // Search query filter
      if (query) {
        const roll = (student.rollNumber || '').toLowerCase();
        const name = (student.studentName || '').toLowerCase();
        const parent = (student.parentName || '').toLowerCase();

        return roll.includes(query) || name.includes(query) || parent.includes(query);
      }

      return true;
    });
  }

  /**
   * Render Attendance Overview Table (Dashboard Tab)
   */
  function renderOverviewTable() {
    const filtered = getFilteredStudents();
    dom.tbodyStudents.innerHTML = '';

    if (state.students.length === 0) {
      dom.emptyState.classList.remove('hidden');
      document.querySelector('.table-responsive').classList.add('hidden');
      dom.lblTableRecordCount.textContent = 'Showing 0 students';
      dom.selectionToolbar.classList.add('hidden');
      return;
    }

    dom.emptyState.classList.add('hidden');
    document.querySelector('.table-responsive').classList.remove('hidden');

    if (filtered.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="9" style="text-align: center; padding: 2.5rem; color: #64748b;">
          No students match the search filter "<strong>${state.searchQuery}</strong>".
        </td>
      `;
      dom.tbodyStudents.appendChild(tr);
      dom.lblTableRecordCount.textContent = `Showing 0 of ${state.students.length} students`;
      return;
    }

    dom.lblTableRecordCount.textContent = `Showing ${filtered.length} of ${state.students.length} students`;

    filtered.forEach(student => {
      const pct = calculateAttendance(student.attendedClasses, student.totalClasses);
      const isShortage = isBelow75(pct);
      const statusText = getStudentStatus(pct);
      const isSelected = state.selectedStudentIds.has(student.id);

      const tr = document.createElement('tr');
      if (isSelected) tr.classList.add('row-selected');
      if (isShortage) tr.classList.add('row-danger');

      tr.innerHTML = `
        <td style="text-align: center;">
          <input type="checkbox" class="student-row-chk" data-id="${student.id}" ${isSelected ? 'checked' : ''}>
        </td>
        <td>
          <span class="roll-badge">${student.rollNumber || '—'}</span>
        </td>
        <td>
          <div class="student-meta-cell">
            <span class="student-name-text">${escapeHtml(student.studentName)}</span>
            ${student.studentMobile ? `<span class="parent-subtext">📱 ${escapeHtml(student.studentMobile)}</span>` : ''}
          </div>
        </td>
        <td>
          <div class="contact-cell">
            <span>${escapeHtml(student.parentName || 'Parent / Guardian')}</span>
            ${student.parentWhatsApp ? `
              <span class="contact-whatsapp" title="WhatsApp: ${student.parentWhatsApp}">
                💬 ${escapeHtml(student.parentWhatsApp)}
              </span>
            ` : '<span style="color:#94a3b8; font-size:0.75rem;">No WhatsApp</span>'}
          </div>
        </td>
        <td style="text-align: center; font-weight: 600; color: #334155;">
          ${student.totalClasses}
        </td>
        <td style="text-align: center; font-weight: 600; color: #334155;">
          ${student.attendedClasses}
        </td>
        <td style="text-align: center;">
          <div class="attendance-cell">
            <span class="attendance-pct-number ${isShortage ? 'text-danger' : ''}">${formatPercentage(pct)}</span>
            <div class="attendance-progress-track">
              <div class="attendance-progress-bar ${isShortage ? 'bar-danger' : 'bar-good'}" style="width: ${Math.min(pct, 100)}%;"></div>
            </div>
          </div>
        </td>
        <td style="text-align: center;">
          <span class="status-badge ${isShortage ? 'status-badge-notice' : 'status-badge-good'}">
            ${isShortage ? '⚠️ Notice Required' : '✓ Good'}
          </span>
        </td>
        <td style="text-align: right;">
          <div class="row-actions-group">
            <button type="button" class="btn-table-action btn-action-whatsapp btn-row-whatsapp" data-id="${student.id}" title="Send WhatsApp to Parent: ${escapeHtml(student.parentName || student.studentName + '\'s Parent')} (${student.parentWhatsApp || 'No WhatsApp'})">
              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.33C9.33 7.33 9 7.4 8.74 7.69C8.47 7.97 7.74 8.66 7.74 10.08C7.74 11.5 8.77 12.87 8.92 13.06C9.06 13.26 11.1 16.41 14.22 17.76C14.96 18.08 15.54 18.27 16 18.41C16.74 18.65 17.42 18.61 17.95 18.53C18.54 18.45 19.77 17.79 20.03 17.06C20.28 16.33 20.28 15.71 20.21 15.58C20.13 15.45 19.93 15.38 19.63 15.23C19.33 15.08 17.86 14.36 17.58 14.26C17.31 14.16 17.11 14.11 16.92 14.41C16.72 14.7 16.15 15.38 15.98 15.58C15.8 15.77 15.63 15.8 15.33 15.65C15.04 15.5 14.09 15.19 12.96 14.18C12.09 13.4 11.5 12.44 11.33 12.15C11.16 11.85 11.31 11.7 11.46 11.55C11.59 11.42 11.76 11.2 11.91 11.03C12.05 10.86 12.1 10.74 12.2 10.54C12.3 10.35 12.25 10.18 12.18 10.03C12.1 9.89 11.52 8.46 11.28 7.87C11.04 7.3 10.8 7.38 10.62 7.37C10.45 7.36 10.25 7.33 10.05 7.33H9.53Z"/>
              </svg>
            </button>
            <button type="button" class="btn-table-action btn-action-notice btn-row-notice" data-id="${student.id}" title="Preview / Customize Notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            <button type="button" class="btn-table-action btn-row-edit" data-id="${student.id}" title="Edit student">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button type="button" class="btn-table-action btn-action-delete btn-row-delete" data-id="${student.id}" title="Delete student">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </td>
      `;

      dom.tbodyStudents.appendChild(tr);
    });

    updateSelectionUI();
  }

  /**
   * Render Attendance Register Table (Attendance Register Tab)
   */
  function renderRegisterTable() {
    dom.tbodyRegister.innerHTML = '';

    if (state.students.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="7" style="text-align: center; padding: 2.5rem; color: #64748b;">
          No students enrolled. Add students to use the attendance register.
        </td>
      `;
      dom.tbodyRegister.appendChild(tr);
      return;
    }

    state.students.forEach(student => {
      const pct = calculateAttendance(student.attendedClasses, student.totalClasses);
      const isShortage = isBelow75(pct);

      const tr = document.createElement('tr');
      if (isShortage) tr.classList.add('row-danger');

      tr.innerHTML = `
        <td><span class="roll-badge">${student.rollNumber || '—'}</span></td>
        <td><strong>${escapeHtml(student.studentName)}</strong></td>
        <td style="text-align: center;">
          <input type="number" class="stepper-input reg-total-input" data-id="${student.id}" value="${student.totalClasses}" min="0">
        </td>
        <td style="text-align: center;">
          <div class="stepper-group">
            <button type="button" class="btn-stepper btn-attended-dec" data-id="${student.id}" title="Decrease attended">&minus;</button>
            <input type="number" class="stepper-input reg-attended-input" data-id="${student.id}" value="${student.attendedClasses}" min="0" max="${student.totalClasses}">
            <button type="button" class="btn-stepper btn-attended-inc" data-id="${student.id}" title="Increase attended">&plus;</button>
          </div>
        </td>
        <td style="text-align: center;">
          <span style="font-weight: 700; ${isShortage ? 'color: var(--danger-red);' : 'color: var(--good-green);'}">
            ${formatPercentage(pct)}
          </span>
        </td>
        <td style="text-align: center;">
          <span class="status-badge ${isShortage ? 'status-badge-notice' : 'status-badge-good'}">
            ${isShortage ? '⚠️ Notice Required' : '✓ Good'}
          </span>
        </td>
        <td style="text-align: center;">
          ${isShortage ? '<span style="color: var(--danger-red); font-weight: 800;">YES</span>' : '<span style="color: #94a3b8;">No</span>'}
        </td>
      `;

      dom.tbodyRegister.appendChild(tr);
    });
  }

  /**
   * Synchronize Selection Bar and Select All Checkbox
   */
  function updateSelectionUI() {
    const selectedCount = state.selectedStudentIds.size;
    const filtered = getFilteredStudents();

    if (selectedCount > 0) {
      dom.selectionToolbar.classList.remove('hidden');
      dom.lblSelectionCount.textContent = `${selectedCount} selected`;
      dom.lblBatchSelectedCount.textContent = selectedCount;
    } else {
      dom.selectionToolbar.classList.add('hidden');
    }

    // Sync header checkbox
    if (filtered.length > 0 && filtered.every(s => state.selectedStudentIds.has(s.id))) {
      dom.chkSelectAll.checked = true;
      dom.chkSelectAll.indeterminate = false;
    } else if (filtered.some(s => state.selectedStudentIds.has(s.id))) {
      dom.chkSelectAll.checked = false;
      dom.chkSelectAll.indeterminate = true;
    } else {
      dom.chkSelectAll.checked = false;
      dom.chkSelectAll.indeterminate = false;
    }
  }

  /**
   * Populate Student Select Dropdown in Notice Generator Tab
   * Always includes all students so the teacher can pick anyone,
   * organized clearly by selection and shortage status.
   */
  function populateNoticeStudentSelect() {
    dom.selectNoticeStudent.innerHTML = '';

    if (state.students.length === 0) {
      dom.selectNoticeStudent.innerHTML = '<option value="">-- No students available --</option>';
      return;
    }

    // Ensure active student exists
    if (!state.activeNoticeStudentId || !state.students.some(s => s.id === state.activeNoticeStudentId)) {
      if (state.selectedStudentIds.size > 0) {
        state.activeNoticeStudentId = Array.from(state.selectedStudentIds)[0];
      } else {
        state.activeNoticeStudentId = state.students[0].id;
      }
    }

    const hasSelection = state.selectedStudentIds.size > 0;

    let defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Choose a student to preview & dispatch notice --';
    dom.selectNoticeStudent.appendChild(defaultOption);

    if (hasSelection) {
      const selectedGroup = document.createElement('optgroup');
      selectedGroup.label = `⭐ Selected Students (${state.selectedStudentIds.size})`;
      const otherGroup = document.createElement('optgroup');
      otherGroup.label = '📋 Other Students';

      state.students.forEach(student => {
        const pct = calculateAttendance(student.attendedClasses, student.totalClasses);
        const isShortage = isBelow75(pct);
        const opt = document.createElement('option');
        opt.value = student.id;
        opt.textContent = `Roll ${student.rollNumber}: ${student.studentName} (${formatPercentage(pct)}) ${isShortage ? '[⚠️ Shortage]' : ''}`;

        if (state.selectedStudentIds.has(student.id)) {
          selectedGroup.appendChild(opt);
        } else {
          otherGroup.appendChild(opt);
        }
      });

      dom.selectNoticeStudent.appendChild(selectedGroup);
      if (otherGroup.children.length > 0) {
        dom.selectNoticeStudent.appendChild(otherGroup);
      }
    } else {
      const shortageGroup = document.createElement('optgroup');
      shortageGroup.label = '⚠️ Attendance Shortage (Below 75%)';
      const normalGroup = document.createElement('optgroup');
      normalGroup.label = '✓ Good Attendance (75%+)';

      state.students.forEach(student => {
        const pct = calculateAttendance(student.attendedClasses, student.totalClasses);
        const isShortage = isBelow75(pct);
        const opt = document.createElement('option');
        opt.value = student.id;
        opt.textContent = `Roll ${student.rollNumber}: ${student.studentName} (${formatPercentage(pct)}) ${isShortage ? '[⚠️ Shortage]' : ''}`;

        if (isShortage) {
          shortageGroup.appendChild(opt);
        } else {
          normalGroup.appendChild(opt);
        }
      });

      if (shortageGroup.children.length > 0) {
        dom.selectNoticeStudent.appendChild(shortageGroup);
      }
      if (normalGroup.children.length > 0) {
        dom.selectNoticeStudent.appendChild(normalGroup);
      }
    }

    if (state.activeNoticeStudentId) {
      dom.selectNoticeStudent.value = state.activeNoticeStudentId;
    }
  }

  /**
   * Render Official Notice Letterhead Preview
   */
  function renderNoticePreview() {
    // If activeNoticeStudentId is missing, pick first student
    if (!state.activeNoticeStudentId && state.students.length > 0) {
      if (state.selectedStudentIds.size > 0) {
        state.activeNoticeStudentId = Array.from(state.selectedStudentIds)[0];
      } else {
        state.activeNoticeStudentId = state.students[0].id;
      }
    }

    const student = state.students.find(s => s.id === state.activeNoticeStudentId);

    // Update settings
    dom.prevInstituteName.textContent = state.collegeName;
    dom.prevSignatoryTitle.textContent = state.signatoryTitle;
    dom.prevSignatoryDept.textContent = state.collegeName;

    // Date
    const today = new Date();
    const dateFormatted = today.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    dom.prevNoticeDate.textContent = dateFormatted;

    // Render attached official notice (if uploaded)
    if (state.noticeAttachment && state.noticeAttachment.dataUrl) {
      if (dom.noticeUploadLoadedState) dom.noticeUploadLoadedState.classList.remove('hidden');
      if (dom.noticeUploadEmptyState) dom.noticeUploadEmptyState.classList.add('hidden');
      if (dom.lblNoticeFileName) dom.lblNoticeFileName.textContent = state.noticeAttachment.name;
      if (dom.lblNoticeFileSize) dom.lblNoticeFileSize.textContent = `${state.noticeAttachment.size} • Attached to notice`;

      if (dom.prevNoticeAttachmentBox) {
        dom.prevNoticeAttachmentBox.classList.remove('hidden');
        const isImg = state.noticeAttachment.type.startsWith('image/');
        if (isImg) {
          if (dom.prevNoticeImgWrap) dom.prevNoticeImgWrap.classList.remove('hidden');
          if (dom.prevNoticeImg) dom.prevNoticeImg.src = state.noticeAttachment.dataUrl;
          if (dom.prevNoticeDocWrap) dom.prevNoticeDocWrap.classList.add('hidden');
        } else {
          if (dom.prevNoticeImgWrap) dom.prevNoticeImgWrap.classList.add('hidden');
          if (dom.prevNoticeDocWrap) dom.prevNoticeDocWrap.classList.remove('hidden');
          if (dom.prevNoticeDocName) dom.prevNoticeDocName.textContent = state.noticeAttachment.name;
        }
      }
    } else {
      if (dom.noticeUploadLoadedState) dom.noticeUploadLoadedState.classList.add('hidden');
      if (dom.noticeUploadEmptyState) dom.noticeUploadEmptyState.classList.remove('hidden');
      if (dom.prevNoticeAttachmentBox) dom.prevNoticeAttachmentBox.classList.add('hidden');
    }

    if (!student) {
      dom.prevStudentName.textContent = 'Select a student';
      dom.prevRollNo.textContent = '—';
      dom.prevParentName.textContent = '—';
      dom.prevWhatsApp.textContent = '—';
      if (dom.prevStudentMobile) dom.prevStudentMobile.textContent = '—';
      dom.prevTotalClasses.textContent = '—';
      dom.prevAttendedClasses.textContent = '—';
      dom.prevPercentageBadge.textContent = '0%';
      dom.prevPercentageBadge.className = 'badge-status-lg';
      dom.prevStatusTag.textContent = 'Pending';
      dom.prevStatusTag.className = 'status-indicator-tag';
      dom.prevRefNo.textContent = 'ATTN-' + today.getFullYear() + '/000';
      dom.prevMessageContent.textContent = 'Please select a student from the dropdown above to generate and preview their personalized attendance notice.';
      dom.previewPager.classList.add('hidden');
      if (dom.lblSendWhatsAppText) dom.lblSendWhatsAppText.textContent = 'Send to Parent WhatsApp';
      if (dom.btnSendStudentWhatsApp) dom.btnSendStudentWhatsApp.classList.add('hidden');
      if (dom.chkStudentCustomNotice) dom.chkStudentCustomNotice.checked = false;
      if (dom.badgeCustomNoticeActive) dom.badgeCustomNoticeActive.classList.add('hidden');
      if (dom.lblNoticeTemplateTitle) dom.lblNoticeTemplateTitle.textContent = 'Notice Message Template';
      return;
    }

    const pct = calculateAttendance(student.attendedClasses, student.totalClasses);
    const isShortage = isBelow75(pct);

    dom.prevStudentName.textContent = student.studentName;
    dom.prevRollNo.textContent = student.rollNumber;
    dom.prevParentName.textContent = student.parentName || 'Parent / Guardian';
    dom.prevWhatsApp.textContent = student.parentWhatsApp || 'Not Provided';
    if (dom.prevStudentMobile) dom.prevStudentMobile.textContent = student.studentMobile || 'Not Provided';
    dom.prevTotalClasses.textContent = student.totalClasses;
    dom.prevAttendedClasses.textContent = student.attendedClasses;

    dom.prevPercentageBadge.textContent = formatPercentage(pct);
    dom.prevPercentageBadge.className = `badge-status-lg ${isShortage ? 'status-badge-notice' : 'status-badge-good'}`;

    dom.prevStatusTag.textContent = isShortage ? 'Notice Required (Shortage)' : 'Satisfactory Attendance';
    dom.prevStatusTag.className = `status-indicator-tag ${isShortage ? 'status-badge-notice' : 'status-badge-good'}`;

    dom.prevRefNo.textContent = `ATTN-${today.getFullYear()}/${student.rollNumber.padStart(3, '0')}`;

    // Handle student-specific custom notice vs default template
    const hasCustomNotice = Boolean(student.customNotice && student.customNotice.trim());
    if (dom.chkStudentCustomNotice) {
      dom.chkStudentCustomNotice.checked = hasCustomNotice;
    }
    if (dom.badgeCustomNoticeActive) {
      if (hasCustomNotice) {
        dom.badgeCustomNoticeActive.classList.remove('hidden');
        dom.badgeCustomNoticeActive.textContent = `Customized for ${student.studentName}`;
      } else {
        dom.badgeCustomNoticeActive.classList.add('hidden');
      }
    }
    if (dom.lblNoticeTemplateTitle) {
      dom.lblNoticeTemplateTitle.textContent = hasCustomNotice
        ? `Custom Notice for ${student.studentName}`
        : 'Notice Message Template';
    }

    // Only update textarea if user is not actively editing it
    const activeNoticeContent = hasCustomNotice ? student.customNotice : state.customTemplate;
    if (document.activeElement !== dom.txtNoticeTemplate) {
      dom.txtNoticeTemplate.value = activeNoticeContent;
    }

    // Render personalized message
    const renderedMsg = renderNoticeMessage(activeNoticeContent, student);
    dom.prevMessageContent.textContent = renderedMsg;

    // Update WhatsApp action buttons with target details
    if (dom.lblSendWhatsAppText) {
      dom.lblSendWhatsAppText.textContent = student.parentWhatsApp
        ? `Send to Parent (${student.parentWhatsApp})`
        : 'Send to Parent WhatsApp';
    }

    if (dom.btnSendStudentWhatsApp && dom.lblSendStudentText) {
      if (student.studentMobile && student.studentMobile.trim()) {
        dom.btnSendStudentWhatsApp.classList.remove('hidden');
        dom.lblSendStudentText.textContent = `Send to Student (${student.studentMobile})`;
      } else {
        dom.btnSendStudentWhatsApp.classList.add('hidden');
      }
    }

    // Keep dropdown selection synced
    if (dom.selectNoticeStudent.value !== student.id) {
      dom.selectNoticeStudent.value = student.id;
    }

    // Check multiple selection pagination & batch print button
    const selectedList = state.students.filter(s => state.selectedStudentIds.has(s.id));
    if (selectedList.length > 1) {
      dom.previewPager.classList.remove('hidden');
      const idx = selectedList.findIndex(s => s.id === student.id);
      dom.lblPagerText.textContent = `${idx >= 0 ? idx + 1 : 1} of ${selectedList.length}`;
      if (dom.btnPrintAllSelected) {
        dom.btnPrintAllSelected.classList.remove('hidden');
        dom.lblPrintAllCount.textContent = `Print All Selected (${selectedList.length})`;
      }
    } else {
      dom.previewPager.classList.add('hidden');
      if (dom.btnPrintAllSelected) {
        dom.btnPrintAllSelected.classList.add('hidden');
      }
    }
  }

  // =========================================================================
  // ACTIONS: WHATSAPP, PRINT, COPY
  // =========================================================================

  /**
   * Pre-fill and Launch WhatsApp Click-to-Chat
   * https://wa.me/PHONE_NUMBER?text=ENCODED_MESSAGE
   * @param {string} target 'parent' or 'student'
   * @param {object} explicitStudent optional student object
   */
  function sendOnWhatsApp(target = 'parent', explicitStudent = null) {
    const student = explicitStudent || state.students.find(s => s.id === state.activeNoticeStudentId);

    if (!student) {
      showToast('Select a student first to prepare WhatsApp message.', 'warning');
      return;
    }

    const isStudentTarget = target === 'student';
    let phone = isStudentTarget ? student.studentMobile : student.parentWhatsApp;
    let recipientLabel = isStudentTarget
      ? `${student.studentName} (Student)`
      : `${student.parentName || student.studentName + "'s Parent"} (Parent)`;

    if (!phone || phone.trim() === '') {
      if (!isStudentTarget && student.studentMobile) {
        showToast(`No Parent WhatsApp for ${student.studentName}. You can use "Send to Student" (${student.studentMobile}).`, 'warning');
      } else {
        showToast(`No ${isStudentTarget ? 'Student Mobile' : 'Parent WhatsApp'} number found for ${student.studentName}. Please edit details.`, 'warning');
      }
      return;
    }

    const cleanPhone = normalizeIndianPhone(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast(`Invalid WhatsApp number "${phone}" for ${recipientLabel}. Please update with a 10-digit number.`, 'error');
      return;
    }

    const activeNoticeContent = (student.customNotice && student.customNotice.trim())
      ? student.customNotice
      : state.customTemplate;
    let message = renderNoticeMessage(activeNoticeContent, student);
    if (state.noticeAttachment && state.noticeAttachment.name) {
      message += `\n\n📌 Attached Circular: ${state.noticeAttachment.name}`;
    }
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    window.open(waUrl, '_blank');
    showToast(`Opening WhatsApp for ${recipientLabel}: +${cleanPhone}...`, 'success');
  }

  /**
   * Browser Print Dialog for Notice / Save PDF (Single Student)
   */
  function printNotice() {
    const student = state.students.find(s => s.id === state.activeNoticeStudentId);
    if (!student) {
      showToast('Select a student first to print notice.', 'warning');
      return;
    }

    document.body.classList.remove('is-batch-printing');
    window.print();
  }

  /**
   * Browser Print Dialog for All Selected Students (Batch Print)
   */
  function printAllSelectedNotices() {
    const selectedList = state.students.filter(s => state.selectedStudentIds.has(s.id));
    if (selectedList.length === 0) {
      showToast('No students selected to print.', 'warning');
      return;
    }

    const today = new Date();
    const dateFormatted = today.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    let batchHtml = '';
    selectedList.forEach(student => {
      const pct = calculateAttendance(student.attendedClasses, student.totalClasses);
      const isShortage = isBelow75(pct);
      const activeNoticeContent = (student.customNotice && student.customNotice.trim())
        ? student.customNotice
        : state.customTemplate;
      const renderedMsg = renderNoticeMessage(activeNoticeContent, student);
      const refNo = `ATTN-${today.getFullYear()}/${student.rollNumber.padStart(3, '0')}`;

      let attachmentHtml = '';
      if (state.noticeAttachment && state.noticeAttachment.dataUrl) {
        if (state.noticeAttachment.type && state.noticeAttachment.type.startsWith('image/')) {
          attachmentHtml = `
            <div class="notice-attachment-preview-box" style="margin-top: 14px; text-align: center; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px; background: #fafafa;">
              <div style="font-size: 0.72rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Official Circular Attachment (${escapeHtml(state.noticeAttachment.name)})</div>
              <img src="${state.noticeAttachment.dataUrl}" alt="Official Notice" style="max-height: 200px; max-width: 100%; object-fit: contain; border-radius: 4px;" />
            </div>
          `;
        } else {
          attachmentHtml = `
            <div class="notice-attachment-preview-box" style="margin-top: 14px; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 8px 12px; background: #fafafa; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.1rem;">📄</span>
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: #475569;">OFFICIAL ATTACHMENT</div>
                <div style="font-size: 0.82rem; font-weight: 600; color: #1e293b;">${escapeHtml(state.noticeAttachment.name)}</div>
              </div>
            </div>
          `;
        }
      }

      batchHtml += `
        <div class="notice-letterhead">
          <div class="notice-header">
            <div class="notice-crest">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div class="notice-institute">
              <h3>${escapeHtml(state.collegeName)}</h3>
              <div class="notice-title-banner">OFFICIAL ATTENDANCE NOTICE</div>
            </div>
          </div>
          <div class="notice-meta-bar">
            <span><strong>Ref No:</strong> ${refNo}</span>
            <span><strong>Date:</strong> ${dateFormatted}</span>
          </div>
          <div class="notice-student-box">
            <table class="notice-details-table">
              <tr>
                <td class="lbl">Student Name:</td>
                <td class="val"><strong>${escapeHtml(student.studentName)}</strong></td>
                <td class="lbl">Roll Number:</td>
                <td class="val"><strong>${escapeHtml(student.rollNumber)}</strong></td>
              </tr>
              <tr>
                <td class="lbl">Parent / Guardian:</td>
                <td class="val">${escapeHtml(student.parentName || 'Parent / Guardian')}</td>
                <td class="lbl">WhatsApp Contact:</td>
                <td class="val">${escapeHtml(student.parentWhatsApp || '—')}</td>
              </tr>
              <tr>
                <td class="lbl">Student Mobile:</td>
                <td class="val">${escapeHtml(student.studentMobile || '—')}</td>
                <td class="lbl">Status:</td>
                <td class="val">
                  <span class="status-indicator-tag ${isShortage ? 'status-badge-notice' : 'status-badge-good'}">${isShortage ? 'Notice Required (Shortage)' : 'Satisfactory Attendance'}</span>
                </td>
              </tr>
              <tr>
                <td class="lbl">Total Classes:</td>
                <td class="val">${student.totalClasses}</td>
                <td class="lbl">Classes Attended:</td>
                <td class="val">${student.attendedClasses}</td>
              </tr>
              <tr>
                <td class="lbl">Attendance %:</td>
                <td class="val" colspan="3">
                  <span class="badge-status-lg ${isShortage ? 'status-badge-notice' : 'status-badge-good'}">${formatPercentage(pct)}</span>
                </td>
              </tr>
            </table>
          </div>
          <div class="notice-message-body">${escapeHtml(renderedMsg)}</div>
          ${attachmentHtml}
          <div class="notice-signoff-block">
            <div class="signature-line"></div>
            <div class="signatory-name">${escapeHtml(state.signatoryTitle)}</div>
            <div class="signatory-dept">${escapeHtml(state.collegeName)}</div>
          </div>
        </div>
      `;
    });

    dom.batchPrintContainer.innerHTML = batchHtml;
    document.body.classList.add('is-batch-printing');

    window.print();

    setTimeout(() => {
      document.body.classList.remove('is-batch-printing');
      dom.batchPrintContainer.innerHTML = '';
    }, 1000);
  }

  /**
   * Copy personalized notice text to clipboard
   */
  function copyNoticeText() {
    const student = state.students.find(s => s.id === state.activeNoticeStudentId);
    if (!student) {
      showToast('Select a student first to copy notice text.', 'warning');
      return;
    }

    const activeNoticeContent = (student.customNotice && student.customNotice.trim())
      ? student.customNotice
      : state.customTemplate;
    let message = renderNoticeMessage(activeNoticeContent, student);
    if (state.noticeAttachment && state.noticeAttachment.name) {
      message += `\n\n📌 Attached Circular: ${state.noticeAttachment.name}`;
    }
    navigator.clipboard.writeText(message).then(() => {
      showToast('Notice message copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Could not copy to clipboard. Please copy manually.', 'error');
    });
  }

  // =========================================================================
  // MODAL HANDLERS: ADD / EDIT / DELETE / BATCH
  // =========================================================================

  function openAddStudentModal() {
    dom.formStudent.reset();
    dom.txtStudentId.value = '';
    dom.lblModalStudentTitle.textContent = 'Add Student';

    // Default values
    dom.txtTotalClasses.value = 50;
    dom.txtAttendedClasses.value = 45;
    updateModalLiveCalc();

    dom.modalStudent.classList.remove('hidden');
    dom.txtRollNumber.focus();
  }

  function openEditStudentModal(id) {
    const student = state.students.find(s => s.id === id);
    if (!student) return;

    dom.txtStudentId.value = student.id;
    dom.lblModalStudentTitle.textContent = 'Edit Student';
    dom.txtRollNumber.value = student.rollNumber || '';
    dom.txtStudentName.value = student.studentName || '';
    dom.txtParentName.value = student.parentName || '';
    dom.txtParentWhatsApp.value = student.parentWhatsApp || '';
    dom.txtTotalClasses.value = student.totalClasses ?? 0;
    dom.txtAttendedClasses.value = student.attendedClasses ?? 0;
    dom.txtStudentMobile.value = student.studentMobile || '';

    updateModalLiveCalc();
    dom.modalStudent.classList.remove('hidden');
    dom.txtStudentName.focus();
  }

  function closeStudentModal() {
    dom.modalStudent.classList.add('hidden');
  }

  function updateModalLiveCalc() {
    const total = Number(dom.txtTotalClasses.value) || 0;
    const attended = Number(dom.txtAttendedClasses.value) || 0;

    const pct = calculateAttendance(attended, total);
    dom.lblLiveCalcPercentage.textContent = formatPercentage(pct);

    const isShortage = isBelow75(pct);
    dom.badgeLiveCalcStatus.textContent = isShortage ? 'Notice Required (< 75%)' : 'Good (75%+)';
    dom.badgeLiveCalcStatus.className = `badge-status ${isShortage ? 'status-badge-notice' : 'status-badge-good'}`;
  }

  function handleSaveStudent(e) {
    e.preventDefault();

    const id = dom.txtStudentId.value;
    const rollNumber = dom.txtRollNumber.value.trim();
    const studentName = dom.txtStudentName.value.trim();
    const parentName = dom.txtParentName.value.trim();
    const parentWhatsApp = dom.txtParentWhatsApp.value.trim();
    const totalClasses = Number(dom.txtTotalClasses.value);
    const attendedClasses = Number(dom.txtAttendedClasses.value);
    const studentMobile = dom.txtStudentMobile.value.trim();

    // Validation 1: Roll Number required
    if (!rollNumber) {
      showToast('Please enter roll number.', 'error');
      dom.txtRollNumber.focus();
      return;
    }

    // Validation 2: Student Name required
    if (!studentName) {
      showToast('Please enter student name.', 'error');
      dom.txtStudentName.focus();
      return;
    }

    // Validation 3: Total classes must be 0 or greater
    if (isNaN(totalClasses) || totalClasses < 0) {
      showToast('Total classes must be 0 or greater.', 'error');
      dom.txtTotalClasses.focus();
      return;
    }

    // Validation 4: Attended classes must be 0 or greater
    if (isNaN(attendedClasses) || attendedClasses < 0) {
      showToast('Attended classes must be 0 or greater.', 'error');
      dom.txtAttendedClasses.focus();
      return;
    }

    // Validation 5: Attended classes cannot be greater than total classes
    if (attendedClasses > totalClasses) {
      showToast('Attended classes cannot be greater than total classes.', 'error');
      dom.txtAttendedClasses.focus();
      return;
    }

    // Validation 6: WhatsApp number format validation (if provided)
    if (parentWhatsApp && !isValidIndianPhone(parentWhatsApp)) {
      showToast('Please enter a valid WhatsApp number (e.g. 9876543210 or +919876543210).', 'error');
      dom.txtParentWhatsApp.focus();
      return;
    }

    if (id) {
      // EDIT EXISTING
      const studentIndex = state.students.findIndex(s => s.id === id);
      if (studentIndex !== -1) {
        state.students[studentIndex] = {
          ...state.students[studentIndex],
          rollNumber,
          studentName,
          parentName,
          parentWhatsApp,
          totalClasses,
          attendedClasses,
          studentMobile
        };
        showToast('Student saved successfully.', 'success');
      }
    } else {
      // ADD NEW STUDENT
      const newStudent = {
        id: 'std_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        rollNumber,
        studentName,
        parentName,
        parentWhatsApp,
        totalClasses,
        attendedClasses,
        studentMobile
      };
      state.students.push(newStudent);
      showToast('Student saved successfully.', 'success');
    }

    // Persist and Refresh
    Storage.saveStudents();
    closeStudentModal();
    updateAllViews();
  }

  function openDeleteConfirmModal(id) {
    const student = state.students.find(s => s.id === id);
    if (!student) return;

    state.deleteCandidateId = id;
    dom.deleteStudentInfo.innerHTML = `
      <strong>${escapeHtml(student.studentName)}</strong> (Roll No: ${escapeHtml(student.rollNumber)})<br>
      <span style="color: #64748b; font-size: 0.8rem;">Attended: ${student.attendedClasses} / ${student.totalClasses} classes</span>
    `;

    dom.modalDelete.classList.remove('hidden');
  }

  function closeDeleteModal() {
    dom.modalDelete.classList.add('hidden');
    state.deleteCandidateId = null;
  }

  function handleConfirmDelete() {
    if (!state.deleteCandidateId) return;

    const id = state.deleteCandidateId;
    state.students = state.students.filter(s => s.id !== id);
    state.selectedStudentIds.delete(id);

    if (state.activeNoticeStudentId === id) {
      state.activeNoticeStudentId = state.students.length > 0 ? state.students[0].id : null;
    }

    Storage.saveStudents();
    closeDeleteModal();
    updateAllViews();
    showToast('Student deleted successfully.', 'success');
  }

  // =========================================================================
  // VIEW SYNCHRONIZATION
  // =========================================================================
  function updateAllViews() {
    updateDashboardKPIs();
    renderOverviewTable();
    renderRegisterTable();
    populateNoticeStudentSelect();
    renderNoticePreview();
  }

  function switchTab(targetTab) {
    dom.navTabs.forEach(tab => {
      if (tab.dataset.tab === targetTab) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Sync mobile bottom navigation bar
    const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn[data-tab]');
    mobileNavBtns.forEach(btn => {
      if (btn.dataset.tab === targetTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    dom.tabContents.forEach(content => {
      if (content.id === `tab${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    if (targetTab === 'notices') {
      populateNoticeStudentSelect();
      renderNoticePreview();
    } else if (targetTab === 'attendance') {
      renderRegisterTable();
    } else {
      renderOverviewTable();
    }

    // Smooth scroll to top on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =========================================================================
  // EVENT LISTENERS INITIALIZATION
  // =========================================================================
  function initEventListeners() {
    // Tab Switching
    dom.navTabs.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Add Student Button
    dom.btnOpenAddStudent.addEventListener('click', openAddStudentModal);
    dom.btnEmptyAddStudent.addEventListener('click', openAddStudentModal);
    dom.btnCloseModalStudent.addEventListener('click', closeStudentModal);
    dom.btnCancelStudent.addEventListener('click', closeStudentModal);
    dom.formStudent.addEventListener('submit', handleSaveStudent);

    // Live calc inside student modal
    dom.txtTotalClasses.addEventListener('input', updateModalLiveCalc);
    dom.txtAttendedClasses.addEventListener('input', updateModalLiveCalc);

    // Delete Modal
    dom.btnCloseModalDelete.addEventListener('click', closeDeleteModal);
    dom.btnCancelDelete.addEventListener('click', closeDeleteModal);
    dom.btnConfirmDelete.addEventListener('click', handleConfirmDelete);

    // Search Input
    dom.txtSearchStudent.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (state.searchQuery) {
        dom.btnClearSearch.classList.remove('hidden');
      } else {
        dom.btnClearSearch.classList.add('hidden');
      }
      renderOverviewTable();
    });

    dom.btnClearSearch.addEventListener('click', () => {
      dom.txtSearchStudent.value = '';
      state.searchQuery = '';
      dom.btnClearSearch.classList.add('hidden');
      renderOverviewTable();
    });

    // Status Filter Chips
    dom.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        dom.filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.statusFilter = chip.dataset.filter;
        renderOverviewTable();
      });
    });

    // Prominent "Select Below 75%" Button
    dom.btnSelectBelow75.addEventListener('click', () => {
      state.selectedStudentIds.clear();
      let count = 0;
      let firstShortageId = null;

      state.students.forEach(student => {
        const pct = calculateAttendance(student.attendedClasses, student.totalClasses);
        if (isBelow75(pct)) {
          state.selectedStudentIds.add(student.id);
          if (!firstShortageId) firstShortageId = student.id;
          count++;
        }
      });

      if (firstShortageId) {
        state.activeNoticeStudentId = firstShortageId;
      }

      renderOverviewTable();
      if (count > 0) {
        showToast(`Selected ${count} student${count === 1 ? '' : 's'} with attendance below 75%.`, 'warning');
      } else {
        showToast('No students currently have attendance below 75%.', 'info');
      }
    });

    // "Clear Selection" Button
    dom.btnClearSelection.addEventListener('click', () => {
      state.selectedStudentIds.clear();
      renderOverviewTable();
      showToast('Selection cleared.', 'info');
    });

    // Header Select All Checkbox
    dom.chkSelectAll.addEventListener('change', (e) => {
      const filtered = getFilteredStudents();
      if (e.target.checked) {
        filtered.forEach(s => state.selectedStudentIds.add(s.id));
      } else {
        filtered.forEach(s => state.selectedStudentIds.delete(s.id));
      }
      renderOverviewTable();
    });

    // Table Row Checkboxes & Row Actions Delegation
    dom.tbodyStudents.addEventListener('click', (e) => {
      // Row checkbox
      const chk = e.target.closest('.student-row-chk');
      if (chk) {
        const id = chk.dataset.id;
        if (chk.checked) {
          state.selectedStudentIds.add(id);
          state.activeNoticeStudentId = id; // Immediately sync active notice recipient
        } else {
          state.selectedStudentIds.delete(id);
          if (state.activeNoticeStudentId === id && state.selectedStudentIds.size > 0) {
            state.activeNoticeStudentId = Array.from(state.selectedStudentIds)[0];
          }
        }
        renderOverviewTable();
        return;
      }

      // Direct Row WhatsApp Button: Immediate dispatch for this exact student's parent
      const btnWhatsApp = e.target.closest('.btn-row-whatsapp');
      if (btnWhatsApp) {
        const studentId = btnWhatsApp.dataset.id;
        state.activeNoticeStudentId = studentId;
        const student = state.students.find(s => s.id === studentId);
        if (student) {
          sendOnWhatsApp('parent', student);
        }
        return;
      }

      // Row Edit Button
      const btnEdit = e.target.closest('.btn-row-edit');
      if (btnEdit) {
        openEditStudentModal(btnEdit.dataset.id);
        return;
      }

      // Row Delete Button
      const btnDelete = e.target.closest('.btn-row-delete');
      if (btnDelete) {
        openDeleteConfirmModal(btnDelete.dataset.id);
        return;
      }

      // Row Notice Button
      const btnNotice = e.target.closest('.btn-row-notice');
      if (btnNotice) {
        state.activeNoticeStudentId = btnNotice.dataset.id;
        state.selectedStudentIds.clear();
        state.selectedStudentIds.add(btnNotice.dataset.id);
        switchTab('notices');
        return;
      }
    });

    // Generate for Selected from toolbar
    dom.btnGenerateForSelected.addEventListener('click', () => {
      if (state.selectedStudentIds.size === 0) {
        showToast('Select at least one student.', 'warning');
        return;
      }
      // Set the first selected student as active in Notice Generator
      const firstId = Array.from(state.selectedStudentIds)[0];
      state.activeNoticeStudentId = firstId;
      switchTab('notices');
      showToast('Notice generated successfully.', 'success');
    });

    // Notice Generator Tab Controls
    dom.selectNoticeStudent.addEventListener('change', (e) => {
      state.activeNoticeStudentId = e.target.value || null;
      renderNoticePreview();
    });

    dom.btnNoticePickBelow75.addEventListener('click', () => {
      const belowList = state.students.filter(s => isBelow75(calculateAttendance(s.attendedClasses, s.totalClasses)));
      if (belowList.length === 0) {
        showToast('No students have attendance below 75%.', 'info');
        return;
      }
      state.selectedStudentIds.clear();
      belowList.forEach(s => state.selectedStudentIds.add(s.id));
      state.activeNoticeStudentId = belowList[0].id;
      populateNoticeStudentSelect();
      renderNoticePreview();
      showToast(`Viewing notices for ${belowList.length} students below 75%.`, 'warning');
    });

    // Notice Template Insertion Chips
    dom.placeholderChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.tag;
        insertTagIntoTemplate(tag);
      });
    });

    // Live update notice preview while typing in template editor
    if (dom.txtNoticeTemplate) {
      dom.txtNoticeTemplate.addEventListener('input', () => {
        const student = state.students.find(s => s.id === state.activeNoticeStudentId);
        const isCustom = dom.chkStudentCustomNotice && dom.chkStudentCustomNotice.checked;
        if (isCustom && student) {
          student.customNotice = dom.txtNoticeTemplate.value;
        }
        if (student) {
          dom.prevMessageContent.textContent = renderNoticeMessage(dom.txtNoticeTemplate.value, student);
        }
      });
    }

    // Toggle Customized Notice for currently active student
    if (dom.chkStudentCustomNotice) {
      dom.chkStudentCustomNotice.addEventListener('change', (e) => {
        const student = state.students.find(s => s.id === state.activeNoticeStudentId);
        if (!student) {
          dom.chkStudentCustomNotice.checked = false;
          showToast('Please select a student from the dropdown first.', 'warning');
          return;
        }

        if (e.target.checked) {
          if (!student.customNotice || !student.customNotice.trim()) {
            student.customNotice = dom.txtNoticeTemplate.value.trim() || state.customTemplate;
          }
          Storage.saveStudents();
          renderNoticePreview();
          showToast(`Custom notice mode active for ${student.studentName}. Edits will only apply to this student.`, 'info');
        } else {
          if (confirm(`Remove custom notice for ${student.studentName} and revert to standard template?`)) {
            delete student.customNotice;
            Storage.saveStudents();
            renderNoticePreview();
            showToast(`Reverted ${student.studentName} to standard notice template.`, 'info');
          } else {
            dom.chkStudentCustomNotice.checked = true;
          }
        }
      });
    }

    // Upload draft/template file directly into editor
    if (dom.btnUploadNoticeFile && dom.fileNoticeInput) {
      dom.btnUploadNoticeFile.addEventListener('click', () => {
        dom.fileNoticeInput.click();
      });

      dom.fileNoticeInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          const content = loadEvt.target.result;
          if (typeof content === 'string') {
            dom.txtNoticeTemplate.value = content;
            const student = state.students.find(s => s.id === state.activeNoticeStudentId);
            const isCustom = dom.chkStudentCustomNotice && dom.chkStudentCustomNotice.checked;
            if (isCustom && student) {
              student.customNotice = content;
              Storage.saveStudents();
              showToast(`Custom notice loaded from "${file.name}" for ${student.studentName}!`, 'success');
            } else {
              state.customTemplate = content;
              Storage.saveTemplate();
              showToast(`Standard template loaded from "${file.name}"!`, 'success');
            }
            renderNoticePreview();
          }
        };
        reader.onerror = () => {
          showToast('Failed to read notice file.', 'error');
        };
        reader.readAsText(file);
        dom.fileNoticeInput.value = '';
      });
    }

    // Template Save & Reset
    dom.btnSaveTemplate.addEventListener('click', () => {
      const student = state.students.find(s => s.id === state.activeNoticeStudentId);
      const isCustom = dom.chkStudentCustomNotice && dom.chkStudentCustomNotice.checked;

      state.collegeName = dom.txtCollegeName.value.trim() || 'Department of Computer Science & Engineering';
      state.signatoryTitle = dom.txtSignatory.value.trim() || 'Class Coordinator / HOD';

      if (isCustom && student) {
        student.customNotice = dom.txtNoticeTemplate.value;
        Storage.saveStudents();
        Storage.saveTemplate();
        renderNoticePreview();
        showToast(`Custom notice saved specifically for ${student.studentName}!`, 'success');
      } else {
        state.customTemplate = dom.txtNoticeTemplate.value;
        Storage.saveTemplate();
        renderNoticePreview();
        showToast('Standard notice template saved successfully.', 'success');
      }
    });

    dom.btnResetTemplate.addEventListener('click', () => {
      const student = state.students.find(s => s.id === state.activeNoticeStudentId);
      const isCustom = dom.chkStudentCustomNotice && dom.chkStudentCustomNotice.checked;

      if (isCustom && student) {
        delete student.customNotice;
        Storage.saveStudents();
        if (dom.chkStudentCustomNotice) dom.chkStudentCustomNotice.checked = false;
        dom.txtNoticeTemplate.value = state.customTemplate;
        renderNoticePreview();
        showToast(`Custom notice removed for ${student.studentName}. Reverted to default template.`, 'info');
      } else {
        dom.txtNoticeTemplate.value = DEFAULT_TEMPLATE;
        state.customTemplate = DEFAULT_TEMPLATE;
        Storage.saveTemplate();
        renderNoticePreview();
        showToast('Template reset to default.', 'info');
      }
    });

    dom.btnRegeneratePreview.addEventListener('click', () => {
      const student = state.students.find(s => s.id === state.activeNoticeStudentId);
      const isCustom = dom.chkStudentCustomNotice && dom.chkStudentCustomNotice.checked;
      if (isCustom && student) {
        student.customNotice = dom.txtNoticeTemplate.value;
        Storage.saveStudents();
      } else {
        state.customTemplate = dom.txtNoticeTemplate.value;
      }
      state.collegeName = dom.txtCollegeName.value.trim();
      state.signatoryTitle = dom.txtSignatory.value.trim();
      renderNoticePreview();
      showToast('Notice preview refreshed.', 'success');
    });

    // Official Notice / Circular File Attachment Upload
    if (dom.btnTriggerNoticeUpload && dom.fileNoticeAttachment) {
      dom.btnTriggerNoticeUpload.addEventListener('click', () => {
        dom.fileNoticeAttachment.click();
      });

      dom.fileNoticeAttachment.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (file.size > 8 * 1024 * 1024) {
          showToast('Notice file too large (Max 8 MB).', 'error');
          dom.fileNoticeAttachment.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target.result;
          const formattedSize = file.size < 1024 * 1024
            ? `${(file.size / 1024).toFixed(1)} KB`
            : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

          const attachment = {
            name: file.name,
            type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
            size: formattedSize,
            dataUrl: dataUrl
          };

          Storage.saveNoticeAttachment(attachment);
          renderNoticePreview();
          showToast(`Official circular "${file.name}" uploaded and attached!`, 'success');
        };
        reader.onerror = () => {
          showToast('Error reading uploaded notice file.', 'error');
        };
        reader.readAsDataURL(file);
        dom.fileNoticeAttachment.value = '';
      });
    }

    if (dom.btnRemoveUploadedNotice) {
      dom.btnRemoveUploadedNotice.addEventListener('click', () => {
        if (confirm('Remove the attached official notice circular?')) {
          Storage.saveNoticeAttachment(null);
          if (dom.fileNoticeAttachment) dom.fileNoticeAttachment.value = '';
          renderNoticePreview();
          showToast('Official notice circular removed.', 'info');
        }
      });
    }

    if (dom.btnViewUploadedNotice) {
      dom.btnViewUploadedNotice.addEventListener('click', () => {
        if (!state.noticeAttachment || !state.noticeAttachment.dataUrl) {
          showToast('No notice document attached.', 'warning');
          return;
        }
        const win = window.open();
        if (win) {
          if (state.noticeAttachment.type && state.noticeAttachment.type.startsWith('image/')) {
            win.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(state.noticeAttachment.name)}</title></head><body style="margin:0; background:#0f172a; display:flex; justify-content:center; align-items:center; min-height:100vh;"><img src="${state.noticeAttachment.dataUrl}" style="max-width:96%; max-height:96vh; object-fit:contain; border-radius:8px; box-shadow:0 10px 25px rgba(0,0,0,0.5);" alt="Official Notice" /></body></html>`);
          } else {
            win.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(state.noticeAttachment.name)}</title></head><body style="margin:0; height:100vh; overflow:hidden;"><iframe src="${state.noticeAttachment.dataUrl}" style="width:100%; height:100%; border:none;"></iframe></body></html>`);
          }
        } else {
          showToast('Pop-up blocked. Please allow pop-ups to view notice.', 'warning');
        }
      });
    }

    // Multiple selection Pager (Next/Prev)
    dom.btnPrevNotice.addEventListener('click', () => navigateNoticeSelection(-1));
    dom.btnNextNotice.addEventListener('click', () => navigateNoticeSelection(1));

    // Notice Preview Actions
    dom.btnPrintNotice.addEventListener('click', printNotice);
    if (dom.btnPrintAllSelected) {
      dom.btnPrintAllSelected.addEventListener('click', printAllSelectedNotices);
    }
    dom.btnSendWhatsApp.addEventListener('click', () => sendOnWhatsApp('parent'));
    if (dom.btnSendStudentWhatsApp) {
      dom.btnSendStudentWhatsApp.addEventListener('click', () => sendOnWhatsApp('student'));
    }
    dom.btnCopyNoticeText.addEventListener('click', copyNoticeText);

    // Attendance Register Table Steppers
    dom.tbodyRegister.addEventListener('click', (e) => {
      const btnInc = e.target.closest('.btn-attended-inc');
      if (btnInc) {
        incrementAttended(btnInc.dataset.id, 1);
        return;
      }
      const btnDec = e.target.closest('.btn-attended-dec');
      if (btnDec) {
        incrementAttended(btnDec.dataset.id, -1);
        return;
      }
    });

    dom.tbodyRegister.addEventListener('change', (e) => {
      const inputTotal = e.target.closest('.reg-total-input');
      if (inputTotal) {
        updateStudentTotalInline(inputTotal.dataset.id, Number(inputTotal.value));
        return;
      }
      const inputAttended = e.target.closest('.reg-attended-input');
      if (inputAttended) {
        updateStudentAttendedInline(inputAttended.dataset.id, Number(inputAttended.value));
        return;
      }
    });

    dom.btnQuickIncrementAllTotal.addEventListener('click', () => {
      if (state.students.length === 0) {
        showToast('No students added yet.', 'warning');
        return;
      }
      state.students.forEach(s => {
        s.totalClasses = (Number(s.totalClasses) || 0) + 1;
      });
      Storage.saveStudents();
      updateAllViews();
      showToast('Incremented +1 Total Class for all students.', 'success');
    });

    // Batch Set Classes Modal
    dom.btnOpenCommonTotalModal.addEventListener('click', () => {
      dom.txtBatchTotalValue.value = 50;
      dom.modalBatchClasses.classList.remove('hidden');
    });
    dom.btnBatchSetClasses.addEventListener('click', () => {
      dom.txtBatchTotalValue.value = 50;
      dom.modalBatchClasses.classList.remove('hidden');
    });
    dom.btnCloseModalBatchClasses.addEventListener('click', () => dom.modalBatchClasses.classList.add('hidden'));
    dom.btnCancelBatchClasses.addEventListener('click', () => dom.modalBatchClasses.classList.add('hidden'));
    dom.btnApplyBatchClasses.addEventListener('click', applyBatchClassesUpdate);

    // Export & Import Backup
    dom.btnExportBackup.addEventListener('click', exportBackupJSON);
    dom.btnImportBackup.addEventListener('click', () => dom.fileImportBackup.click());
    dom.fileImportBackup.addEventListener('change', handleImportBackupJSON);

    // Clear All Data Modal
    if (dom.btnClearAllData) {
      dom.btnClearAllData.addEventListener('click', openClearAllModal);
    }
    if (dom.btnCloseModalClearAll) {
      dom.btnCloseModalClearAll.addEventListener('click', closeClearAllModal);
    }
    if (dom.btnCancelClearAll) {
      dom.btnCancelClearAll.addEventListener('click', closeClearAllModal);
    }
    if (dom.btnConfirmClearAll) {
      dom.btnConfirmClearAll.addEventListener('click', confirmClearAllData);
    }

    // Excel / CSV Import Modal
    if (dom.btnOpenExcelModal) {
      dom.btnOpenExcelModal.addEventListener('click', openExcelModal);
    }
    if (dom.btnEmptyExcelImport) {
      dom.btnEmptyExcelImport.addEventListener('click', openExcelModal);
    }
    if (dom.btnCloseModalExcel) {
      dom.btnCloseModalExcel.addEventListener('click', closeExcelModal);
    }
    if (dom.btnCancelExcelImport) {
      dom.btnCancelExcelImport.addEventListener('click', closeExcelModal);
    }
    if (dom.btnClearExcelFile) {
      dom.btnClearExcelFile.addEventListener('click', resetExcelModal);
    }
    if (dom.btnConfirmExcelImport) {
      dom.btnConfirmExcelImport.addEventListener('click', commitExcelImport);
    }
    if (dom.btnDownloadSampleExcel) {
      dom.btnDownloadSampleExcel.addEventListener('click', downloadSampleExcelTemplate);
    }
    if (dom.chkIgnoreMobileNumbers) {
      dom.chkIgnoreMobileNumbers.addEventListener('change', () => {
        if (state.parsedExcelStudents && state.parsedExcelStudents.length > 0) {
          renderExcelPreview(state.parsedExcelStudents);
        }
      });
    }

    // Excel Drag & Drop and File Picker
    if (dom.fileExcelInput) {
      dom.fileExcelInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleExcelFile(file);
      });
    }

    if (dom.excelDropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dom.excelDropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dom.excelDropzone.classList.add('drag-over');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dom.excelDropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dom.excelDropzone.classList.remove('drag-over');
        });
      });

      dom.excelDropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        if (file) handleExcelFile(file);
      });
    }

    // Admin Auth Form & Buttons
    if (dom.formAdminLogin) {
      dom.formAdminLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        handleAdminLogin(dom.txtAdminUsername.value, dom.txtAdminPassword.value);
      });
    }

    if (dom.btnFillAdminCredentials) {
      dom.btnFillAdminCredentials.addEventListener('click', () => {
        const creds = getAdminCredentials();
        dom.txtAdminUsername.value = creds.username;
        dom.txtAdminPassword.value = creds.password;
        handleAdminLogin(creds.username, creds.password);
      });
    }

    if (dom.btnAdminLogout) {
      dom.btnAdminLogout.addEventListener('click', handleAdminLogout);
    }

    // Admin Credentials Modal
    if (dom.btnChangeAdminCreds) {
      dom.btnChangeAdminCreds.addEventListener('click', () => openAdminCredsModal(false));
    }
    if (dom.btnCloseModalCreds) {
      dom.btnCloseModalCreds.addEventListener('click', closeAdminCredsModal);
    }
    if (dom.btnCancelCreds) {
      dom.btnCancelCreds.addEventListener('click', closeAdminCredsModal);
    }
    if (dom.formAdminCreds) {
      dom.formAdminCreds.addEventListener('submit', handleSaveAdminCreds);
    }

    // QR Code Modal
    if (dom.btnShowQrCode) {
      dom.btnShowQrCode.addEventListener('click', openQrModal);
    }
    if (dom.btnLoginShowQr) {
      dom.btnLoginShowQr.addEventListener('click', openQrModal);
    }
    if (dom.btnCloseModalQr) {
      dom.btnCloseModalQr.addEventListener('click', closeQrModal);
    }
    if (dom.btnDoneQr) {
      dom.btnDoneQr.addEventListener('click', closeQrModal);
    }
    if (dom.btnCopyQrUrl) {
      dom.btnCopyQrUrl.addEventListener('click', copyQrUrl);
    }

    // Demo Data
    dom.btnLoadDemoData.addEventListener('click', loadDemoData);
    dom.btnEmptyLoadDemo.addEventListener('click', loadDemoData);

    // Mobile Bottom Navigation Bar
    const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn[data-tab]');
    mobileNavBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Mobile Bottom Sheet Menu (Drawer)
    function openMobileSheet() {
      if (dom.sheetMobileMenu) dom.sheetMobileMenu.classList.remove('hidden');
    }
    function closeMobileSheet() {
      if (dom.sheetMobileMenu) dom.sheetMobileMenu.classList.add('hidden');
    }

    if (dom.btnMobileMenuToggle) dom.btnMobileMenuToggle.addEventListener('click', openMobileSheet);
    if (dom.btnMobileMoreMenu) dom.btnMobileMoreMenu.addEventListener('click', openMobileSheet);
    if (dom.btnCloseMobileSheet) dom.btnCloseMobileSheet.addEventListener('click', closeMobileSheet);
    if (dom.sheetMobileMenu) {
      dom.sheetMobileMenu.addEventListener('click', (e) => {
        if (e.target === dom.sheetMobileMenu) closeMobileSheet();
      });
    }

    // Mobile Sheet Actions
    if (dom.mItemAddStudent) {
      dom.mItemAddStudent.addEventListener('click', () => { closeMobileSheet(); openAddStudentModal(); });
    }
    if (dom.mItemExcelImport) {
      dom.mItemExcelImport.addEventListener('click', () => { closeMobileSheet(); openExcelModal(); });
    }
    if (dom.mItemExportBackup) {
      dom.mItemExportBackup.addEventListener('click', () => { closeMobileSheet(); exportBackupJSON(); });
    }
    if (dom.mItemImportBackup) {
      dom.mItemImportBackup.addEventListener('click', () => { closeMobileSheet(); dom.fileImportBackup.click(); });
    }
    if (dom.mItemLoadDemo) {
      dom.mItemLoadDemo.addEventListener('click', () => { closeMobileSheet(); loadDemoData(); });
    }
    if (dom.mItemShowQr) {
      dom.mItemShowQr.addEventListener('click', () => { closeMobileSheet(); openQrModal(); });
    }
    if (dom.btnMobileQrCode) {
      dom.btnMobileQrCode.addEventListener('click', openQrModal);
    }
    if (dom.mItemChangePassword) {
      dom.mItemChangePassword.addEventListener('click', () => { closeMobileSheet(); openAdminCredsModal(false); });
    }
    if (dom.mItemClearAll) {
      dom.mItemClearAll.addEventListener('click', () => { closeMobileSheet(); openClearAllModal(); });
    }
    if (dom.mItemLogout) {
      dom.mItemLogout.addEventListener('click', () => { closeMobileSheet(); handleAdminLogout(); });
    }

    // Mobile Floating Action Button (FAB)
    if (dom.fabAddStudent) {
      dom.fabAddStudent.addEventListener('click', openAddStudentModal);
    }

    // Mobile PWA App Install Banner & Prompt
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (dom.mobileInstallBanner && !sessionStorage.getItem('dismissedInstallBanner')) {
        dom.mobileInstallBanner.classList.remove('hidden');
      }
    });

    if (dom.btnInstallAppPrompt) {
      dom.btnInstallAppPrompt.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          deferredPrompt = null;
          if (dom.mobileInstallBanner) dom.mobileInstallBanner.classList.add('hidden');
        } else {
          alert('To install AttendEase on your phone:\n\n• On Android (Chrome/Edge): Tap Menu (⋮) > "Install App" or "Add to Home screen"\n• On iPhone (Safari): Tap Share (⎋) > "Add to Home Screen"');
        }
      });
    }

    if (dom.btnCloseInstallBanner) {
      dom.btnCloseInstallBanner.addEventListener('click', () => {
        if (dom.mobileInstallBanner) dom.mobileInstallBanner.classList.add('hidden');
        sessionStorage.setItem('dismissedInstallBanner', 'true');
      });
    }

    // Service Worker for Offline PWA Capabilities
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => {
          console.warn('ServiceWorker registration error:', err);
        });
      });
    }
  }

  // =========================================================================
  // HELPER LOGIC: TEMPLATE INSERTION & REGISTER INLINE UPDATES
  // =========================================================================
  function insertTagIntoTemplate(tag) {
    const textarea = dom.txtNoticeTemplate;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    textarea.value = text.substring(0, start) + tag + text.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + tag.length;

    const student = state.students.find(s => s.id === state.activeNoticeStudentId);
    const isCustom = dom.chkStudentCustomNotice && dom.chkStudentCustomNotice.checked;
    if (isCustom && student) {
      student.customNotice = textarea.value;
      Storage.saveStudents();
    } else {
      state.customTemplate = textarea.value;
    }
    renderNoticePreview();
  }

  function navigateNoticeSelection(direction) {
    const selectedList = state.students.filter(s => state.selectedStudentIds.has(s.id));
    if (selectedList.length === 0) return;

    const currentIdx = selectedList.findIndex(s => s.id === state.activeNoticeStudentId);
    let nextIdx = currentIdx + direction;
    if (nextIdx < 0) nextIdx = selectedList.length - 1;
    if (nextIdx >= selectedList.length) nextIdx = 0;

    state.activeNoticeStudentId = selectedList[nextIdx].id;
    dom.selectNoticeStudent.value = state.activeNoticeStudentId;
    renderNoticePreview();
  }

  function incrementAttended(studentId, amount) {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    let newAttended = (Number(student.attendedClasses) || 0) + amount;
    if (newAttended < 0) newAttended = 0;
    if (newAttended > student.totalClasses) {
      showToast('Attended classes cannot be greater than total classes.', 'error');
      return;
    }

    student.attendedClasses = newAttended;
    Storage.saveStudents();
    updateAllViews();
  }

  function updateStudentTotalInline(studentId, newTotal) {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    if (isNaN(newTotal) || newTotal < 0) {
      showToast('Total classes must be 0 or greater.', 'error');
      renderRegisterTable();
      return;
    }

    student.totalClasses = newTotal;
    if (student.attendedClasses > newTotal) {
      student.attendedClasses = newTotal;
    }

    Storage.saveStudents();
    updateAllViews();
  }

  function updateStudentAttendedInline(studentId, newAttended) {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    if (isNaN(newAttended) || newAttended < 0) {
      showToast('Attended classes must be 0 or greater.', 'error');
      renderRegisterTable();
      return;
    }

    if (newAttended > student.totalClasses) {
      showToast('Attended classes cannot be greater than total classes.', 'error');
      renderRegisterTable();
      return;
    }

    student.attendedClasses = newAttended;
    Storage.saveStudents();
    updateAllViews();
  }

  function applyBatchClassesUpdate() {
    const newTotal = Number(dom.txtBatchTotalValue.value);
    if (isNaN(newTotal) || newTotal < 0) {
      showToast('Total classes must be 0 or greater.', 'error');
      return;
    }

    const scope = document.querySelector('input[name="batchScope"]:checked').value;

    if (scope === 'selected') {
      if (state.selectedStudentIds.size === 0) {
        showToast('No students selected.', 'warning');
        return;
      }
      state.students.forEach(s => {
        if (state.selectedStudentIds.has(s.id)) {
          s.totalClasses = newTotal;
          if (s.attendedClasses > newTotal) s.attendedClasses = newTotal;
        }
      });
      showToast(`Updated Total Classes to ${newTotal} for ${state.selectedStudentIds.size} selected students.`, 'success');
    } else {
      state.students.forEach(s => {
        s.totalClasses = newTotal;
        if (s.attendedClasses > newTotal) s.attendedClasses = newTotal;
      });
      showToast(`Updated Total Classes to ${newTotal} for all ${state.students.length} students.`, 'success');
    }

    dom.modalBatchClasses.classList.add('hidden');
    Storage.saveStudents();
    updateAllViews();
  }

  // =========================================================================
  // BACKUP & RESTORE (JSON)
  // =========================================================================
  function exportBackupJSON() {
    const backupData = {
      app: 'AttendEase',
      version: '1.0',
      exportDate: new Date().toISOString(),
      students: state.students,
      customTemplate: state.customTemplate,
      collegeName: state.collegeName,
      signatoryTitle: state.signatoryTitle,
      noticeAttachment: state.noticeAttachment
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    const todayStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `attendease_backup_${todayStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Backup downloaded successfully.', 'success');
  }

  function handleImportBackupJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || !Array.isArray(parsed.students)) {
          throw new Error('Invalid backup file format');
        }

        state.students = parsed.students;
        if (parsed.customTemplate) state.customTemplate = parsed.customTemplate;
        if (parsed.collegeName) state.collegeName = parsed.collegeName;
        if (parsed.signatoryTitle) state.signatoryTitle = parsed.signatoryTitle;
        if (parsed.noticeAttachment !== undefined) {
          state.noticeAttachment = parsed.noticeAttachment;
          Storage.saveNoticeAttachment(parsed.noticeAttachment);
        }

        state.selectedStudentIds.clear();
        state.activeNoticeStudentId = state.students.length > 0 ? state.students[0].id : null;

        Storage.saveStudents();
        Storage.saveTemplate();
        updateAllViews();
        showToast(`Backup restored! Loaded ${state.students.length} student records.`, 'success');
      } catch (err) {
        console.error('Import error:', err);
        showToast('Error importing backup file. Please select a valid AttendEase JSON backup.', 'error');
      } finally {
        dom.fileImportBackup.value = '';
      }
    };
    reader.readAsText(file);
  }

  function loadDemoData() {
    // Clear selections and load demo students
    state.students = JSON.parse(JSON.stringify(DEMO_STUDENTS));
    state.selectedStudentIds.clear();
    state.activeNoticeStudentId = state.students[0].id;
    state.customTemplate = DEFAULT_TEMPLATE;

    Storage.saveStudents();
    Storage.saveTemplate();
    updateAllViews();

    showToast('Demo data loaded successfully! (Manoj 90%, Rahul 70%, etc.)', 'success');
  }

  // =========================================================================
  // ADMIN AUTHENTICATION CONTROLLER & CREDENTIAL MANAGEMENT
  // =========================================================================
  let isForcedFirstTimeCreds = false;

  function getAdminCredentials() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_CREDS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.username && parsed.password) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to load admin credentials from storage:', err);
    }
    return { ...DEFAULT_ADMIN_CREDENTIALS };
  }

  function saveAdminCredentials(username, password) {
    const creds = {
      username: username.trim(),
      password: password.trim(),
      isDefault: false
    };
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_CREDS, JSON.stringify(creds));
    } catch (err) {
      console.error('Failed to save admin credentials to storage:', err);
    }
    return creds;
  }

  function updateAdminBadge() {
    const creds = getAdminCredentials();
    if (dom.adminUserBadge) {
      const badgeText = dom.adminUserBadge.querySelector('span:last-child');
      if (badgeText) {
        badgeText.textContent = creds.username ? `Admin (${creds.username})` : 'Admin';
      }
    }
  }

  function initAdminAuth() {
    const isLoggedIn = Storage.checkAuth();
    state.isAdminLoggedIn = isLoggedIn;
    renderAuthView();
    updateAdminBadge();
  }

  function renderAuthView() {
    if (state.isAdminLoggedIn) {
      if (dom.viewAdminLogin) dom.viewAdminLogin.classList.add('hidden');
      if (dom.viewApp) dom.viewApp.classList.remove('hidden');
    } else {
      if (dom.viewApp) dom.viewApp.classList.add('hidden');
      if (dom.viewAdminLogin) dom.viewAdminLogin.classList.remove('hidden');
      if (dom.txtAdminPassword) dom.txtAdminPassword.value = '';
      if (dom.loginErrorBox) dom.loginErrorBox.classList.add('hidden');
    }
  }

  function handleAdminLogin(username, password) {
    username = (username || '').trim();
    password = (password || '').trim();

    const currentCreds = getAdminCredentials();

    if (username === currentCreds.username && password === currentCreds.password) {
      state.isAdminLoggedIn = true;
      Storage.setAuth(true);
      if (dom.loginErrorBox) dom.loginErrorBox.classList.add('hidden');
      renderAuthView();
      updateAdminBadge();
      updateAllViews();

      // If user is logging in with default credentials for the first time, force them to set new credentials
      if (currentCreds.isDefault !== false) {
        showToast('Welcome! Please set your new admin username and password.', 'info');
        setTimeout(() => {
          openAdminCredsModal(true);
        }, 350);
      } else {
        showToast(`Welcome back, ${currentCreds.username}!`, 'success');
      }
      return true;
    } else {
      if (dom.loginErrorBox && dom.loginErrorText) {
        dom.loginErrorText.textContent = 'Invalid admin username or password.';
        dom.loginErrorBox.classList.remove('hidden');
      }
      showToast('Invalid admin username or password.', 'error');
      return false;
    }
  }

  function handleAdminLogout() {
    state.isAdminLoggedIn = false;
    Storage.setAuth(false);
    renderAuthView();
    showToast('Logged out successfully.', 'info');
  }

  function openAdminCredsModal(isFirstTime = false) {
    isForcedFirstTimeCreds = isFirstTime;
    const creds = getAdminCredentials();

    if (dom.txtNewAdminUsername) dom.txtNewAdminUsername.value = creds.username || '';
    if (dom.txtNewAdminPassword) dom.txtNewAdminPassword.value = '';
    if (dom.txtConfirmAdminPassword) dom.txtConfirmAdminPassword.value = '';
    if (dom.credsErrorBox) dom.credsErrorBox.classList.add('hidden');

    if (isFirstTime) {
      if (dom.lblModalCredsTitle) dom.lblModalCredsTitle.textContent = 'First-Time Setup: Set Admin Credentials';
      if (dom.lblModalCredsSub) dom.lblModalCredsSub.textContent = 'Please set your custom username and password to secure your account';
      if (dom.boxFirstTimeNotice) dom.boxFirstTimeNotice.classList.remove('hidden');
      if (dom.btnCancelCreds) dom.btnCancelCreds.classList.add('hidden');
      if (dom.btnCloseModalCreds) dom.btnCloseModalCreds.classList.add('hidden');
    } else {
      if (dom.lblModalCredsTitle) dom.lblModalCredsTitle.textContent = 'Admin Security Credentials';
      if (dom.lblModalCredsSub) dom.lblModalCredsSub.textContent = 'Change your administrator username and password';
      if (dom.boxFirstTimeNotice) dom.boxFirstTimeNotice.classList.add('hidden');
      if (dom.btnCancelCreds) dom.btnCancelCreds.classList.remove('hidden');
      if (dom.btnCloseModalCreds) dom.btnCloseModalCreds.classList.remove('hidden');
    }

    if (dom.modalAdminCreds) dom.modalAdminCreds.classList.remove('hidden');
    if (dom.txtNewAdminUsername) dom.txtNewAdminUsername.focus();
  }

  function closeAdminCredsModal() {
    if (isForcedFirstTimeCreds) {
      showToast('Please set your new admin username and password to proceed.', 'warning');
      return;
    }
    if (dom.modalAdminCreds) dom.modalAdminCreds.classList.add('hidden');
  }

  function handleSaveAdminCreds(e) {
    if (e) e.preventDefault();
    const newUsername = (dom.txtNewAdminUsername ? dom.txtNewAdminUsername.value : '').trim();
    const newPassword = (dom.txtNewAdminPassword ? dom.txtNewAdminPassword.value : '').trim();
    const confirmPassword = (dom.txtConfirmAdminPassword ? dom.txtConfirmAdminPassword.value : '').trim();

    if (!newUsername || newUsername.length < 3) {
      showCredsError('Username must be at least 3 characters.');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      showCredsError('Password must be at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showCredsError('Passwords do not match. Please re-enter.');
      return;
    }

    saveAdminCredentials(newUsername, newPassword);
    isForcedFirstTimeCreds = false;
    if (dom.modalAdminCreds) dom.modalAdminCreds.classList.add('hidden');
    updateAdminBadge();
    showToast(`Admin credentials updated successfully! New Username: "${newUsername}"`, 'success');
  }

  function showCredsError(msg) {
    if (dom.credsErrorBox && dom.credsErrorText) {
      dom.credsErrorText.textContent = msg;
      dom.credsErrorBox.classList.remove('hidden');
    } else {
      showToast(msg, 'error');
    }
  }

  // =========================================================================
  // QR CODE MOBILE ACCESS CONTROLLER
  // =========================================================================
  function openQrModal() {
    let url = window.location.href;
    if (url.startsWith('file://') || url.includes('localhost') || url.includes('127.0.0.1')) {
      url = 'https://attendm.netlify.app';
    }

    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(url)}`;
    if (dom.imgQrCode) dom.imgQrCode.src = qrApiUrl;
    if (dom.txtQrUrl) dom.txtQrUrl.value = url;
    if (dom.modalQrCode) dom.modalQrCode.classList.remove('hidden');
  }

  function closeQrModal() {
    if (dom.modalQrCode) dom.modalQrCode.classList.add('hidden');
  }

  function copyQrUrl() {
    const url = dom.txtQrUrl ? dom.txtQrUrl.value : window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!', 'success');
      }).catch(() => {
        fallbackCopyText(url);
      });
    } else {
      fallbackCopyText(url);
    }
  }

  function fallbackCopyText(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showToast('Link copied to clipboard!', 'success');
    } catch (err) {
      showToast('Failed to copy text. Please select and copy manually.', 'error');
    }
    document.body.removeChild(tempInput);
  }

  // =========================================================================
  // CLEAR ALL DATA CONTROLLER
  // =========================================================================
  function openClearAllModal() {
    if (dom.lblClearStudentCount) {
      dom.lblClearStudentCount.textContent = state.students.length;
    }
    if (dom.modalClearAll) dom.modalClearAll.classList.remove('hidden');
  }

  function closeClearAllModal() {
    if (dom.modalClearAll) dom.modalClearAll.classList.add('hidden');
  }

  function confirmClearAllData() {
    const count = state.students.length;
    Storage.clearAllStudents();
    closeClearAllModal();
    updateAllViews();
    showToast(`Successfully cleared all ${count} student records.`, 'info');
  }

  // =========================================================================
  // EXCEL / CSV IMPORT CONTROLLER
  // =========================================================================
  function openExcelModal() {
    resetExcelModal();
    if (dom.modalExcelImport) dom.modalExcelImport.classList.remove('hidden');
  }

  function closeExcelModal() {
    if (dom.modalExcelImport) dom.modalExcelImport.classList.add('hidden');
    resetExcelModal();
  }

  function resetExcelModal() {
    state.parsedExcelStudents = [];
    if (dom.fileExcelInput) dom.fileExcelInput.value = '';
    if (dom.excelDropzone) dom.excelDropzone.classList.remove('hidden');
    if (dom.excelFileLoaded) dom.excelFileLoaded.classList.add('hidden');
    if (dom.excelPreviewArea) dom.excelPreviewArea.classList.add('hidden');
    if (dom.tbodyExcelPreview) dom.tbodyExcelPreview.innerHTML = '';
    if (dom.chkIgnoreMobileNumbers) dom.chkIgnoreMobileNumbers.checked = false;
    if (dom.btnConfirmExcelImport) {
      dom.btnConfirmExcelImport.disabled = true;
      dom.btnConfirmExcelImport.innerHTML = `<span>Confirm &amp; Import Students</span>`;
    }
  }

  function downloadSampleExcelTemplate() {
    const csvContent =
      "Roll Number,Student Name,Student Mobile (Optional),Parent Name (Optional),Parent WhatsApp (Optional),Total Classes,Classes Attended\n" +
      "101,Aarav Sharma,9876543201,Rajesh Sharma,9876543202,50,44\n" +
      "102,Diya Patel,,Kirit Patel,,50,33\n" +
      "103,Rohan Gupta,,,50,42\n" +
      "104,Sneha Joshi,9876543207,Sunil Joshi,9876543208,50,31\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'attendease_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Sample CSV template downloaded.', 'success');
  }

  function parseCsvText(text) {
    if (!text || !text.trim()) return [];
    const lines = [];
    let currentLine = [];
    let currentField = '';
    let insideQuote = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuote && nextChar === '"') {
          currentField += '"';
          i++; // Skip escaped quote
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        currentLine.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !insideQuote) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentLine.push(currentField.trim());
        currentField = '';
        if (currentLine.some(f => f.length > 0)) {
          lines.push(currentLine);
        }
        currentLine = [];
      } else {
        currentField += char;
      }
    }
    if (currentField || currentLine.length > 0) {
      currentLine.push(currentField.trim());
      if (currentLine.some(f => f.length > 0)) {
        lines.push(currentLine);
      }
    }

    if (lines.length < 2) return [];

    const headers = lines[0];
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      const row = {};
      const line = lines[i];
      headers.forEach((header, colIdx) => {
        row[header] = line[colIdx] || '';
      });
      result.push(row);
    }
    return result;
  }

  function parseSpreadsheetFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const isCsv = file.name.toLowerCase().endsWith('.csv');

      if (isCsv) {
        reader.onload = function (e) {
          try {
            const rawRows = parseCsvText(e.target.result);
            resolve(rawRows);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsText(file);
      } else {
        // Excel (.xlsx, .xls)
        reader.onload = function (e) {
          try {
            if (typeof XLSX === 'undefined') {
              throw new Error('SheetJS library is not available. Please connect to the internet or save as .csv format.');
            }
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            // Use raw: false so phone numbers and codes are preserved as formatted strings
            const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
            resolve(rawRows);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      }
    });
  }

  function cleanPhoneNumber(val) {
    if (val === undefined || val === null) return '';
    let str = val.toString().trim();
    if (!str) return '';
    // Handle scientific notation e.g. 9.87654E+09
    if (/^[0-9.]+[eE][+]?[0-9]+$/.test(str)) {
      const num = Number(str);
      if (!isNaN(num)) str = num.toLocaleString('fullwide', { useGrouping: false });
    }
    // Remove trailing .0 from Excel float representations
    str = str.replace(/\.0+$/, '');
    // If it's a 10-digit number or +91 Indian phone
    const digitsOnly = str.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      return digitsOnly;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      return digitsOnly.substring(2);
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      return digitsOnly.substring(1);
    }
    return str.trim();
  }

  function classifyHeader(key) {
    if (!key) return null;
    const raw = key.toString().trim().toLowerCase().replace(/\(.*?\)/g, '');
    const clean = raw.replace(/[^a-z0-9]/g, '');

    // 1. ROLL NUMBER
    if (
      clean.includes('roll') ||
      clean.startsWith('rno') ||
      clean.startsWith('srno') ||
      clean.includes('regno') ||
      clean.includes('admission') ||
      clean.includes('enroll')
    ) {
      return 'rollNumber';
    }

    // Is this column referring to Parent/Guardian? (Handles parent, parant, father, mother, guardian, etc.)
    const isParent = clean.includes('parent') || clean.includes('parant') || clean.includes('father') || clean.includes('mother') || clean.includes('guardian') || clean.startsWith('pname') || clean.startsWith('pmob') || clean.startsWith('pno');

    // Is this column referring to Student?
    const isStudent = clean.includes('student') || clean.includes('stud') || clean.startsWith('sname') || clean.startsWith('smob') || clean.startsWith('sno');

    // Does this column indicate mobile, phone, whatsapp, contact, or number?
    const isContact = clean.includes('mob') || clean.includes('phone') || clean.includes('what') || clean.includes('contact') || clean.includes('cell') || clean.includes('tel') || clean.includes('number') || clean.includes('num') || clean.includes('no');

    // 2. PARENT MOBILE / WHATSAPP (e.g. "parants number", "parants mobile numbers", "parents whatsapp", "father mobile")
    if (isParent && isContact) {
      return 'parentWhatsApp';
    }

    // 3. PARENT NAME (e.g. "parants name", "father name", "parent name")
    if (isParent) {
      return 'parentName';
    }

    // 4. STUDENT MOBILE (e.g. "students number", "student mobile", "mobile number")
    if (isStudent && isContact) {
      return 'studentMobile';
    }

    // 5. ATTENDED CLASSES (e.g. "attend classes", "classes attended", "attended", "present")
    if (clean.includes('attend') || clean.includes('present')) {
      return 'attendedClasses';
    }

    // 6. TOTAL CLASSES (e.g. "total classes", "conducted", "classes conducted", "total")
    if (clean.includes('total') || clean.includes('conduct') || clean.includes('held') || clean.includes('period') || clean.includes('workingday')) {
      return 'totalClasses';
    }

    // 7. STUDENT NAME (e.g. "name", "student name", "students name", "full name")
    if (clean.includes('name') || clean === 'student' || clean === 'students') {
      return 'studentName';
    }

    // 8. GENERIC MOBILE / NUMBER (When "parent" or "student" is not explicitly in the header name)
    if (clean.includes('mob') || clean.includes('phone') || clean.includes('what') || clean.includes('contact') || clean.includes('cell') || clean.includes('tel') || clean === 'number' || clean === 'numbers') {
      return 'genericMobile';
    }

    return null;
  }

  function mapSpreadsheetRow(row, fallbackIndex) {
    let roll = '';
    let name = '';
    let studentMobile = '';
    let parentName = '';
    let parentWhatsApp = '';
    let totalClasses = 50;
    let attendedClasses = 0;

    for (const [key, val] of Object.entries(row)) {
      if (val === undefined || val === null) continue;
      const field = classifyHeader(key);
      const strVal = val.toString().trim();

      if (field === 'rollNumber') {
        roll = strVal.replace(/\.0+$/, '');
      } else if (field === 'studentName') {
        name = strVal;
      } else if (field === 'parentName') {
        parentName = strVal;
      } else if (field === 'studentMobile') {
        studentMobile = cleanPhoneNumber(val);
      } else if (field === 'parentWhatsApp') {
        parentWhatsApp = cleanPhoneNumber(val);
      } else if (field === 'genericMobile') {
        const cleanedPhone = cleanPhoneNumber(val);
        if (!studentMobile) {
          studentMobile = cleanedPhone;
        } else if (!parentWhatsApp) {
          parentWhatsApp = cleanedPhone;
        }
      } else if (field === 'totalClasses') {
        const num = Number(strVal);
        if (!isNaN(num) && num >= 0) totalClasses = Math.round(num);
      } else if (field === 'attendedClasses') {
        const num = Number(strVal);
        if (!isNaN(num) && num >= 0) attendedClasses = Math.round(num);
      }
    }

    if (!name && !roll) return null; // Skip completely empty rows
    if (!name && roll) name = `Student ${roll}`;
    if (!roll) roll = (fallbackIndex + 1).toString();

    if (attendedClasses > totalClasses) {
      attendedClasses = totalClasses;
    }

    return {
      id: 'stud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      rollNumber: roll,
      studentName: name,
      studentMobile: studentMobile,
      parentName: parentName,
      parentWhatsApp: parentWhatsApp,
      totalClasses: totalClasses,
      attendedClasses: attendedClasses
    };
  }

  async function handleExcelFile(file) {
    if (!file) return;
    try {
      showToast(`Reading ${file.name}...`, 'info');
      const rawRows = await parseSpreadsheetFile(file);
      if (!rawRows || rawRows.length === 0) {
        showToast('No data rows found in the selected file.', 'warning');
        return;
      }

      const validStudents = [];
      rawRows.forEach((row, idx) => {
        const mapped = mapSpreadsheetRow(row, idx);
        if (mapped) validStudents.push(mapped);
      });

      if (validStudents.length === 0) {
        showToast('No valid student records could be recognized. Please check column headers.', 'error');
        return;
      }

      state.parsedExcelStudents = validStudents;

      // Update loaded file UI
      dom.lblExcelFileName.textContent = file.name;
      dom.lblExcelParsedCount.textContent = `(${validStudents.length} students found)`;
      dom.excelFileLoaded.classList.remove('hidden');
      dom.excelDropzone.classList.add('hidden');

      // Render preview table
      renderExcelPreview(validStudents);
      dom.excelPreviewArea.classList.remove('hidden');
      dom.btnConfirmExcelImport.disabled = false;
      dom.btnConfirmExcelImport.innerHTML = `<span>Confirm &amp; Import ${validStudents.length} Students</span>`;

      showToast(`Successfully parsed ${validStudents.length} students from ${file.name}!`, 'success');
    } catch (err) {
      console.error('Spreadsheet parse error:', err);
      showToast(`Failed to parse file: ${err.message}`, 'error');
    }
  }

  function renderExcelPreview(students) {
    const omitMobile = dom.chkIgnoreMobileNumbers && dom.chkIgnoreMobileNumbers.checked;
    dom.tbodyExcelPreview.innerHTML = students.map(s => {
      const pct = calculateAttendance(s.attendedClasses, s.totalClasses);
      const isShort = isBelow75(pct);
      const statusBadge = isShort
        ? `<span class="badge-status badge-danger">Below 75%</span>`
        : `<span class="badge-status badge-success">Good (75%+)</span>`;
      const smob = omitMobile ? '<span style="color:#94a3b8; font-size:0.75rem;">(omitted)</span>' : escapeHtml(s.studentMobile || '—');
      const pmob = omitMobile ? '<span style="color:#94a3b8; font-size:0.75rem;">(omitted)</span>' : escapeHtml(s.parentWhatsApp || '—');
      return `
        <tr>
          <td><strong>${escapeHtml(s.rollNumber)}</strong></td>
          <td>${escapeHtml(s.studentName)}</td>
          <td>${smob}</td>
          <td>${escapeHtml(s.parentName || '—')}</td>
          <td>${pmob}</td>
          <td style="text-align:center;">${s.totalClasses}</td>
          <td style="text-align:center;">${s.attendedClasses}</td>
          <td style="text-align:center; font-weight:700;">${formatPercentage(pct)}</td>
          <td style="text-align:center;">${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }

  function commitExcelImport() {
    if (!state.parsedExcelStudents || state.parsedExcelStudents.length === 0) {
      showToast('No students to import.', 'warning');
      return;
    }

    const modeRadio = document.querySelector('input[name="excelImportMode"]:checked');
    const mode = modeRadio ? modeRadio.value : 'append';
    const omitMobile = dom.chkIgnoreMobileNumbers && dom.chkIgnoreMobileNumbers.checked;
    const count = state.parsedExcelStudents.length;

    // Apply omitMobile if selected
    const preparedList = state.parsedExcelStudents.map(s => {
      const copy = { ...s };
      if (omitMobile) {
        copy.studentMobile = '';
        copy.parentWhatsApp = '';
      }
      return copy;
    });

    if (mode === 'replace') {
      state.students = [...preparedList];
      state.selectedStudentIds.clear();
      state.activeNoticeStudentId = state.students.length > 0 ? state.students[0].id : null;
    } else {
      // Append mode: merge or update if same roll number
      preparedList.forEach(newStud => {
        const existingIdx = state.students.findIndex(s => s.rollNumber.trim().toLowerCase() === newStud.rollNumber.trim().toLowerCase());
        if (existingIdx !== -1) {
          state.students[existingIdx] = newStud;
        } else {
          state.students.push(newStud);
        }
      });
      if (!state.activeNoticeStudentId && state.students.length > 0) {
        state.activeNoticeStudentId = state.students[0].id;
      }
    }

    Storage.saveStudents();
    closeExcelModal();
    updateAllViews();
    showToast(`Successfully imported ${count} students from spreadsheet!`, 'success');
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // =========================================================================
  // APPLICATION BOOTSTRAP
  // =========================================================================
  function init() {
    Storage.load();

    // Check single admin authentication status
    initAdminAuth();

    // Populate template editor
    dom.txtNoticeTemplate.value = state.customTemplate;
    dom.txtCollegeName.value = state.collegeName;
    dom.txtSignatory.value = state.signatoryTitle;

    if (state.students.length > 0) {
      state.activeNoticeStudentId = state.students[0].id;
    }

    initEventListeners();
    updateAllViews();
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
