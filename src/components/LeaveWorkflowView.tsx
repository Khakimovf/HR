'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCheck,
  Plus,
  Inbox,
  Archive,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  ChevronRight,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Building2,
  UserCheck,
  ShieldCheck,
  FileText,
  Ban,
  User,
  Eye,
} from 'lucide-react';
import { LeaveRequestWizardModal } from './LeaveRequestWizardModal';
import { LeaveApprovalModal } from './LeaveApprovalModal';
import { LeaveDocumentPrintModal } from './LeaveDocumentPrintModal';
import { LeaveRequestDetailModal } from './LeaveRequestDetailModal';
import { APPROVAL_STEPS_CONFIG } from '@/lib/leaveConfig';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface LeaveWorkflowViewProps {
  departments?: Array<{ id: string; name: string }>;
}

export const LeaveWorkflowView: React.FC<LeaveWorkflowViewProps> = ({ departments = [] }) => {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();

  const TYPE_META: Record<string, { label: string; short: string; bgClass: string; textClass: string; borderClass: string }> = {
    BS_UNPAID:     { label: t('app_modal.type_unpaid', "O'z hisobidan ta'til (B/S)"), short: 'B/S', bgClass: 'bg-amber-100 dark:bg-amber-500/15', textClass: 'text-amber-800 dark:text-amber-300', borderClass: 'border-amber-300 dark:border-amber-500/30' },
    MEHNAT_TATILI: { label: t('app_modal.type_annual', "Mehnat ta'tili arizasi"), short: 'M/T', bgClass: 'bg-blue-100 dark:bg-blue-500/15', textClass: 'text-blue-800 dark:text-blue-300', borderClass: 'border-blue-300 dark:border-blue-500/30' },
    SICK_LEAVE_BL: { label: t('app_modal.type_sick', 'Vaqtincha layoqatsizlik (B/L)'), short: 'B/L', bgClass: 'bg-rose-100 dark:bg-rose-500/15', textClass: 'text-rose-800 dark:text-rose-300', borderClass: 'border-rose-300 dark:border-rose-500/30' },
    HOURLY_PERMIT: { label: t('app_modal.type_study', "O'qish ta'tili arizasi"), short: 'RUX', bgClass: 'bg-emerald-100 dark:bg-emerald-500/15', textClass: 'text-emerald-800 dark:text-emerald-300', borderClass: 'border-emerald-300 dark:border-emerald-500/30' },
  };

  const [activeTab, setActiveTab] = useState<'my' | 'inbox' | 'archive'>('my');

  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats]       = useState<any>({});
  const [loading, setLoading]   = useState(true);

  // Filters
  const [search, setSearch]             = useState('');
  const [filterType, setFilterType]     = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDept, setFilterDept]     = useState('ALL');
  const [inboxRoleFilter, setInboxRoleFilter] = useState('ALL');

  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<any | null>(null);
  const [printRequest, setPrintRequest]   = useState<any | null>(null);
  const [approvalRequest, setApprovalRequest] = useState<any | null>(null);
  const [approvalMode, setApprovalMode]   = useState<'APPROVE' | 'REJECT'>('APPROVE');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterType !== 'ALL') params.set('type', filterType);
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      if (filterDept !== 'ALL') params.set('departmentId', filterDept);
      if (activeTab === 'inbox' && inboxRoleFilter !== 'ALL') {
        params.set('pendingForRole', inboxRoleFilter);
      }

      const res = await fetch(`/api/leave-requests?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
        setStats(data.stats || {});
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterStatus, filterDept, activeTab, inboxRoleFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleOpenApproveModal = (req: any, mode: 'APPROVE' | 'REJECT') => {
    setApprovalRequest(req);
    setApprovalMode(mode);
  };

  // Workflow Filter Logic based on user role, department & tabel number
  const visibleRequests = requests.filter((app) => {
    // Super Admin & HR Director see ALL applications
    if (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HR_DIRECTOR') return true;

    // Stage 1: Department Head sees applications from THEIR department only
    if (app.currentStep === 1 && (currentUser?.role === 'DEPT_HEAD' || currentUser?.role === 'HEAD_OF_DEPT')) {
      const userDeptId = currentUser?.userDepartmentId || (currentUser as any)?.departmentId;
      return (
        (userDeptId && (app.employee?.departmentId === userDeptId || app.departmentId === userDeptId)) ||
        app.employee?.tabelNumber === currentUser?.tabelNumber
      );
    }

    // Stage 2: HR Officers see all applications at Stage 2
    if (app.currentStep === 2 && (currentUser?.role === 'HR_OFFICER' || currentUser?.role === 'HR')) {
      return true;
    }

    // Stage 3: Technical Director (CTO) or Division Head
    if (app.currentStep === 3) {
      if (currentUser?.role === 'CTO' && (app.approverChoice === 'CTO' || !app.approverChoice)) return true;
      if (currentUser?.role === 'DIVISION_HEAD') return true;
    }

    // Stage 4: Finance Department
    if (app.currentStep === 4 && currentUser?.role === 'FINANCE') {
      return true;
    }

    // Stage 5: HR Director
    if (app.currentStep === 5 && (currentUser?.role === 'HR_DIRECTOR' || currentUser?.role === 'SUPER_ADMIN')) {
      return true;
    }

    // Stage 6: CEO / Deputy CEO
    if (app.currentStep === 6 && (currentUser?.role === 'CEO' || currentUser?.role === 'DEPUTY_CEO' || currentUser?.role === 'EXECUTIVE_DIRECTOR')) {
      return true;
    }

    // Applicants always see their own submitted applications
    return (
      app.employee?.tabelNumber === currentUser?.tabelNumber ||
      app.tabelNumber === currentUser?.tabelNumber ||
      app.applicantTabelNo === currentUser?.tabelNumber
    );
  });

  // Compute inbox requests pending approval
  const inboxRequests = visibleRequests.filter((r) => r.status === 'PENDING');

  return (
    <div className="bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 space-y-6 text-xs p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 dark:bg-gradient-to-tr dark:from-cyan-600 dark:to-indigo-600 flex items-center justify-center shadow-md text-white">
              <FileCheck className="h-5 w-5 text-white" />
            </div>
            {t('workflow.title', 'Arizalar & Hujjat Aylanishi')}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            {language === 'kr' ? '전자 결재 신청, 6단계 승인 라인 및 디지털 직인 관리' : 'Elektron ariza topshirish, 6-bosqichli rahbarlar tasdiqlashi va raqamli muhrlar jurnali'}
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {t('workflow.new_btn', '+ Yangi Ariza Yaratish')}
        </button>
      </div>

      {/* ── Tab Switcher Bar ── */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* TAB 1 */}
          <button
            onClick={() => setActiveTab('my')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'my'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <User className="h-4 w-4" />
            {t('workflow.tab_all', 'Barcha Hujjatlar')}
            <span className="ml-1 rounded-md bg-white/20 px-1.5 py-0.5 text-[10px]">
              {requests.length}
            </span>
          </button>

          {/* TAB 2 */}
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'inbox'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Inbox className="h-4 w-4" />
            {t('workflow.tab_pending', 'Kutilmoqda (Navbatda)')}
            {stats.pending > 0 && (
              <span className="ml-1 rounded-md bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 text-[10px]">
                {stats.pending}
              </span>
            )}
          </button>

          {/* TAB 3 */}
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'archive'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Archive className="h-4 w-4" />
            {language === 'kr' ? '전체 결재 대장' : 'Barcha Arizalar Jurnali'}
          </button>
        </div>

        <button
          onClick={fetchRequests}
          className="rounded-xl p-2 text-slate-700 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition shadow-sm cursor-pointer"
          title={language === 'kr' ? '새로고침' : 'Yangilash'}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Toolbar / Filter Controls ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('workflow.search', 'Qidiruv (F.I.O, Hujjat №)...')}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:outline-none transition font-medium"
            />
          </div>

          <Filter className="h-4 w-4 text-slate-500 shrink-0" />

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none font-medium cursor-pointer"
          >
            <option value="ALL">{t('workflow.select_type', 'Ariza turini tanlang')} ({language === 'kr' ? '전체' : 'Barcha'})</option>
            <option value="BS_UNPAID">{t('app_modal.type_unpaid', "O'z hisobidan ta'til (B/S)")}</option>
            <option value="MEHNAT_TATILI">{t('app_modal.type_annual', "Mehnat ta'tili arizasi")}</option>
            <option value="SICK_LEAVE_BL">{t('app_modal.type_sick', 'Vaqtincha layoqatsizlik (B/L)')}</option>
            <option value="HOURLY_PERMIT">{t('app_modal.type_study', "O'qish ta'tili arizasi")}</option>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none font-medium cursor-pointer"
          >
            <option value="ALL">{language === 'kr' ? '전체 상태' : 'Barcha holat'}</option>
            <option value="PENDING">{t('workflow.tab_pending', 'Kutilmoqda (Navbatda)')}</option>
            <option value="APPROVED">{t('workflow.tab_approved', 'Tasdiqlandi (Muvaffaqiyatli)')}</option>
            <option value="REJECTED">{t('workflow.tab_rejected', 'Rad etildi')}</option>
          </select>
        </div>
      </div>

      {/* ── TAB 1: Mening Arizalarim & Live Visual Steppers ── */}
      {activeTab === 'my' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-16 gap-3">
              <Loader2 className="h-6 w-6 text-blue-600 dark:text-cyan-400 animate-spin" />
              <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">{language === 'kr' ? '데이터를 불러오는 중...' : 'Arizalar yuklanmoqda...'}</span>
            </div>
          ) : visibleRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 shadow-sm">
              <FileCheck className="h-12 w-12 text-slate-400 mx-auto" />
              <p className="text-slate-900 dark:text-slate-100 font-bold text-sm">{language === 'kr' ? '신청된 문서가 없습니다.' : 'Hozircha arizalar kiritilmagan'}</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">{language === 'kr' ? '신규 결재 신청서를 작성하려면 아래 버튼을 누르세요.' : 'Yangi ariza shakllantirish uchun pastdagi tugmani bosing'}</p>
              <button
                onClick={() => setIsWizardOpen(true)}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white px-4 py-2 shadow-sm cursor-pointer"
              >
                {t('workflow.new_btn', '+ Yangi Ariza Yaratish')}
              </button>
            </div>
          ) : (
            visibleRequests.map((req) => {
              const meta = TYPE_META[req.type] || TYPE_META.BS_UNPAID;
              const isRejected = req.status === 'REJECTED';
              const isApproved = req.status === 'APPROVED';

              return (
                <div
                  key={req.id}
                  className={`bg-white dark:bg-slate-900 rounded-xl border p-5 space-y-4 transition-all shadow-sm ${
                    isRejected
                      ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50/40 dark:bg-rose-950/10'
                      : isApproved
                      ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/10'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Top Row: Applicant Info & Badges */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 dark:bg-gradient-to-tr dark:from-indigo-600 dark:to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                        {req.employee?.firstName?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                          <span>
                            {req.employee?.lastName} {req.employee?.firstName} {req.employee?.middleName || ''}
                          </span>
                          <span className="font-mono text-blue-600 dark:text-indigo-400 text-xs font-bold">[{req.employee?.tabelNumber}]</span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                          <Building2 className="h-3 w-3 text-slate-500" />
                          <span>{req.employee?.currentDepartment?.name}</span>
                          <span>•</span>
                          <span>{req.employee?.position}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}>
                        {meta.label} ({req.totalDays} {language === 'kr' ? '일' : 'kun'})
                      </span>

                      <button
                        onClick={() => setDetailRequest(req)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-cyan-500/30 bg-blue-50 dark:bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-cyan-300 hover:bg-blue-100 dark:hover:bg-cyan-500/20 transition shadow-sm cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        👁️ {language === 'kr' ? '상세 보기' : "Ko'rish"}
                      </button>

                      <button
                        onClick={() => setPrintRequest(req)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition shadow-sm cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
                        {language === 'kr' ? '출력 / Print' : 'Hujjat / Print'}
                      </button>
                    </div>
                  </div>

                  {/* Dates & Reason */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 font-medium">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold">{t('workflow.date_range', "Sana oralig'i")}:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                        {new Date(req.startDate).toLocaleDateString(language === 'kr' ? 'ko-KR' : 'uz-UZ')} — {new Date(req.endDate).toLocaleDateString(language === 'kr' ? 'ko-KR' : 'uz-UZ')}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold">{t('app_modal.reason', 'Ariza Mazmuni / Asos')}:</span>
                      <span className="text-slate-800 dark:text-slate-300 italic">"{req.reason}"</span>
                    </div>
                  </div>

                  {/* Rejection Alert if rejected */}
                  {isRejected && (
                    <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2 font-medium">
                      <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-rose-800 dark:text-rose-400 font-bold">WORKFLOW STOPPER — {t('workflow.badge_rejected', 'RAD ETILDI / REJECTED')}:</strong>
                        <p className="mt-0.5">{req.rejectionComment || (language === 'kr' ? '사유 미입력' : "Sabab ko'rsatilmadi")}</p>
                      </div>
                    </div>
                  )}

                  {/* ── LIVE VISUAL STEPPER (6 Approval Steps) ── */}
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                        {t('app_modal.stepper_title', '6-Bosqichli Avtomatik Imzolash Marshruti')}:
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-cyan-400">
                        {isApproved ? (language === 'kr' ? '6/6 단계 (완료)' : 'Bosqich 6/6 (TUGALLANDI)') : isRejected ? (language === 'kr' ? `${req.currentStep}/6 단계 (반려)` : `Bosqich ${req.currentStep}/6 (RAD ETILDI)`) : (language === 'kr' ? `${req.currentStep}/6 단계 진행 중` : `Bosqich ${req.currentStep}/6 kutilmoqda`)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                      {APPROVAL_STEPS_CONFIG.map((cfg) => {
                        const stepData = req.approvalSteps?.find((s: any) => s.stepNumber === cfg.stepNumber);
                        const isStepDone = stepData?.status === 'APPROVED';
                        const isStepRejected = stepData?.status === 'REJECTED';
                        const isCurrentStep = req.currentStep === cfg.stepNumber && req.status === 'PENDING';

                        const stepLabelKey = `app_modal.step${cfg.stepNumber}`;
                        const stepLabel = t(stepLabelKey, cfg.label);

                        return (
                          <div
                            key={cfg.stepNumber}
                            className={`rounded-xl border p-2.5 transition-all text-xs ${
                              isStepDone
                                ? 'border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold'
                                : isStepRejected
                                ? 'border-rose-300 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300 font-bold'
                                : isCurrentStep
                                ? 'border-amber-300 dark:border-amber-500/60 bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold shadow-sm'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-500 font-medium'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-bold text-[10px]">#{cfg.stepNumber}</span>
                              {isStepDone ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              ) : isStepRejected ? (
                                <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                              ) : isCurrentStep ? (
                                <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                              ) : (
                                <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                              )}
                            </div>

                            <div className="font-bold truncate text-[11px]">{stepLabel}</div>

                            <div className="text-[9px] mt-1 truncate font-semibold">
                              {isStepDone ? (
                                <span className="text-emerald-700 dark:text-emerald-400">
                                  ✓ {stepData.approverName || (language === 'kr' ? '승인됨' : 'Tasdiqlandi')}
                                </span>
                              ) : isStepRejected ? (
                                <span className="text-rose-700 dark:text-rose-400">✕ {language === 'kr' ? '반려됨' : 'Rad etildi'}</span>
                              ) : isCurrentStep ? (
                                <span className="text-amber-700 dark:text-amber-300">{language === 'kr' ? '대기 중...' : 'Kutilmoqda...'}</span>
                              ) : (
                                <span className="text-slate-500 dark:text-slate-600">{language === 'kr' ? '대기' : 'Navbatda'}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TAB 2: Tasdiqlash Kutilayotgan Arizalar (Manager Inbox) ── */}
      {activeTab === 'inbox' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-4 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Inbox className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              <span>{t('workflow.tab_pending', 'Kutilmoqda (Navbatda)')}</span>
            </h3>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {language === 'kr' ? '총 대기 건수:' : "Jami ko'rib chiqilishi kerak:"} <strong className="text-amber-600 dark:text-amber-400 font-bold">{inboxRequests.length}</strong>
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-16 gap-3">
              <Loader2 className="h-6 w-6 text-blue-600 dark:text-cyan-400 animate-spin" />
              <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">{language === 'kr' ? '데이터를 불러오는 중...' : 'Inbox yuklanmoqda...'}</span>
            </div>
          ) : inboxRequests.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 className="h-12 w-12 text-emerald-500/60 mx-auto" />
              <p className="text-slate-900 dark:text-slate-100 font-bold text-sm">{language === 'kr' ? '대기 중인 신청서가 없습니다.' : 'Kutilayotgan arizalar mavjud emas!'}</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">{language === 'kr' ? '현재 단계의 모든 결재가 완료되었습니다.' : 'Sizning bosqichingizdagi barcha arizalar tasdiqlangan'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase tracking-wider border-b border-slate-300 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">{t('workflow.col_applicant', 'F.I.O (Ariza beruvchi)')}</th>
                    <th className="px-4 py-3">{t('workflow.col_dept', "Bo'lim")}</th>
                    <th className="px-4 py-3">{t('workflow.col_type', 'Ariza Turi')}</th>
                    <th className="px-4 py-3">{t('workflow.col_date', 'Yuborilgan Sana')}</th>
                    <th className="px-4 py-3">{t('app_modal.reason', 'Ariza Mazmuni / Asos')}</th>
                    <th className="px-4 py-3">{t('workflow.col_stage', 'Hozirgi Bosqich')}</th>
                    <th className="px-4 py-3 text-right">{t('workflow.col_actions', 'Harakatlar')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {inboxRequests.map((req) => {
                    const meta = TYPE_META[req.type] || TYPE_META.BS_UNPAID;
                    const stepCfg = APPROVAL_STEPS_CONFIG.find((s) => s.stepNumber === req.currentStep);

                    return (
                      <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border-b border-slate-200 dark:border-slate-800">
                        {/* Employee */}
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">[{req.employee?.tabelNumber}]</span>
                            <span>{req.employee?.lastName} {req.employee?.firstName}</span>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-300 font-medium max-w-[140px]">
                          <span className="truncate block">{req.employee?.currentDepartment?.name}</span>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}>
                            {meta.short}
                          </span>
                        </td>

                        {/* Dates */}
                        <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200 font-semibold">
                          {formatDate(req.startDate)} — {formatDate(req.endDate)}
                          <span className="ml-1 text-amber-600 dark:text-amber-400 font-bold">({req.totalDays}{language === 'kr' ? '일' : 'd'})</span>
                        </td>

                        {/* Reason */}
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-300 max-w-[180px]">
                          <span className="truncate block italic text-slate-600 dark:text-slate-400 font-medium">"{req.reason}"</span>
                        </td>

                        {/* Step badge */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                            <Clock className="h-3 w-3" />
                            #{req.currentStep}: {stepCfg?.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setDetailRequest(req)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-cyan-600/20 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-500/30 hover:bg-blue-100 dark:hover:bg-cyan-600 hover:text-blue-900 dark:hover:text-white font-semibold text-xs transition shadow-sm cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              👁️ {language === 'kr' ? '상세 보기' : "Ko'rish"}
                            </button>
                            <button
                              onClick={() => handleOpenApproveModal(req, 'APPROVE')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm active:scale-95 transition cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              ✅ {language === 'kr' ? '승인' : 'Tasdiqlash'}
                            </button>
                            <button
                              onClick={() => handleOpenApproveModal(req, 'REJECT')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm active:scale-95 transition cursor-pointer"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              ❌ {language === 'kr' ? '반려' : 'Rad Etish'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Barcha Arizalar Jurnali (HR Oversight & Svodka) ── */}
      {activeTab === 'archive' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Archive className="h-5 w-5 text-blue-600 dark:text-purple-400" />
              <span>{language === 'kr' ? '전체 결재 문서 대장' : 'Barcha Arizalar Umumiy Jurnali & Svodkasi'}</span>
            </h3>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">{language === 'kr' ? '총 건수:' : 'Jami topilgan:'} {visibleRequests.length}</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase tracking-wider border-b border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">{t('workflow.col_applicant', 'F.I.O (Ariza beruvchi)')}</th>
                  <th className="px-4 py-3">{t('workflow.col_dept', "Bo'lim")}</th>
                  <th className="px-4 py-3">{t('workflow.col_type', 'Ariza Turi')}</th>
                  <th className="px-4 py-3">{t('workflow.col_date', 'Yuborilgan Sana')}</th>
                  <th className="px-4 py-3">{t('workflow.date_range', "Sana oralig'i")}</th>
                  <th className="px-4 py-3">{t('app_modal.total_days', 'Jami Kunlar Soni')}</th>
                  <th className="px-4 py-3 text-center">{t('workflow.col_status', 'Status')}</th>
                  <th className="px-4 py-3 text-right">{t('workflow.col_actions', 'Harakatlar')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {visibleRequests.map((r) => {
                  const meta = TYPE_META[r.type] || TYPE_META.BS_UNPAID;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border-b border-slate-200 dark:border-slate-800">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                        <span className="font-mono text-blue-600 dark:text-purple-400 mr-2 font-bold">[{r.employee?.tabelNumber}]</span>
                        {r.employee?.lastName} {r.employee?.firstName}
                      </td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-300 font-medium">{r.employee?.currentDepartment?.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}>
                          {meta.short}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{formatDate(r.createdAt)}</td>
                      <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-300 font-semibold">
                        {formatDate(r.startDate)} — {formatDate(r.endDate)}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400">{r.totalDays} {language === 'kr' ? '일' : 'kun'}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            r.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : r.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {r.status === 'APPROVED' ? t('workflow.badge_approved', 'TASDIQLANDI / APPROVED') : r.status === 'REJECTED' ? t('workflow.badge_rejected', 'RAD ETILDI / REJECTED') : t('workflow.badge_pending', 'KUTILMOQDA / PENDING')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailRequest(r)}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 dark:border-cyan-500/30 bg-blue-50 dark:bg-cyan-500/10 px-2.5 py-1 text-xs text-blue-700 dark:text-cyan-300 hover:bg-blue-100 dark:hover:bg-cyan-500/20 font-semibold transition shadow-sm cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            👁️ {language === 'kr' ? '상세 보기' : "Ko'rish"}
                          </button>
                          <button
                            onClick={() => setPrintRequest(r)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold transition shadow-sm cursor-pointer"
                          >
                            <Printer className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
                            {language === 'kr' ? '출력' : 'Hujjat'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      <LeaveRequestWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => {
          setIsWizardOpen(false);
          fetchRequests();
        }}
        departments={departments}
      />

      <LeaveRequestDetailModal
        isOpen={Boolean(detailRequest)}
        onClose={() => setDetailRequest(null)}
        request={detailRequest}
        onApprove={(req) => handleOpenApproveModal(req, 'APPROVE')}
        onReject={(req) => handleOpenApproveModal(req, 'REJECT')}
        onPrint={(req) => setPrintRequest(req)}
      />

      <LeaveApprovalModal
        isOpen={Boolean(approvalRequest)}
        onClose={() => setApprovalRequest(null)}
        onSuccess={() => {
          setApprovalRequest(null);
          fetchRequests();
        }}
        request={approvalRequest}
        mode={approvalMode}
        currentApproverRoleLabel={
          APPROVAL_STEPS_CONFIG.find((s) => s.stepNumber === approvalRequest?.currentStep)?.label
        }
      />

      <LeaveDocumentPrintModal
        isOpen={Boolean(printRequest)}
        onClose={() => setPrintRequest(null)}
        request={printRequest}
      />
    </div>
  );
};
