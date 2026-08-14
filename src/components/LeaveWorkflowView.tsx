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

const TYPE_META: Record<string, { label: string; short: string; bgClass: string; textClass: string; borderClass: string }> = {
  BS_UNPAID:     { label: "O'z hisobidan ta'til", short: 'B/S', bgClass: 'bg-amber-500/15', textClass: 'text-amber-300', borderClass: 'border-amber-500/30' },
  MEHNAT_TATILI: { label: "Mehnat ta'tili", short: 'M/T', bgClass: 'bg-blue-500/15', textClass: 'text-blue-300', borderClass: 'border-blue-500/30' },
  SICK_LEAVE_BL: { label: "Vaqtincha mehnatka layoqatsizlik", short: 'B/L', bgClass: 'bg-rose-500/15', textClass: 'text-rose-300', borderClass: 'border-rose-500/30' },
  HOURLY_PERMIT: { label: "Kechikish / soatli ruxsatnoma", short: 'RUX', bgClass: 'bg-emerald-500/15', textClass: 'text-emerald-300', borderClass: 'border-emerald-500/30' },
};

interface LeaveWorkflowViewProps {
  departments?: Array<{ id: string; name: string }>;
}

export const LeaveWorkflowView: React.FC<LeaveWorkflowViewProps> = ({ departments = [] }) => {
  const { currentUser } = useAuth();
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

  // Compute inbox requests pending approval
  const inboxRequests = requests.filter((r) => r.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <FileCheck className="h-5 w-5 text-white" />
            </div>
            Arizalar & Hujjat Aylanishi
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Elektron ariza topshirish, 6-bosqichli rahbarlar tasdiqlashi va raqamli muhrlar jurnali
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-indigo-500 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          + Yangi Ta'til Ariza Yozish
        </button>
      </div>

      {/* ── Tab Switcher Bar ── */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* TAB 1 */}
          <button
            onClick={() => setActiveTab('my')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'my'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <User className="h-4 w-4" />
            Mening Arizalarim
            <span className="ml-1 rounded-md bg-white/20 px-1.5 py-0.5 text-[10px]">
              {requests.length}
            </span>
          </button>

          {/* TAB 2 */}
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'inbox'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Inbox className="h-4 w-4" />
            Tasdiqlash Kutilayotgan Arizalar
            {stats.pending > 0 && (
              <span className="ml-1 rounded-md bg-amber-500/80 text-slate-950 font-black px-1.5 py-0.5 text-[10px] animate-pulse">
                {stats.pending}
              </span>
            )}
          </button>

          {/* TAB 3 */}
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'archive'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Archive className="h-4 w-4" />
            Barcha Arizalar Jurnali
          </button>
        </div>

        <button
          onClick={fetchRequests}
          className="rounded-xl p-2 text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-white transition"
          title="Yangilash"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Toolbar / Filter Controls ── */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Arizachi F.I.O yoki tabel raqami bo'yicha qidirish..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition"
            />
          </div>

          <Filter className="h-4 w-4 text-slate-500 shrink-0" />

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">Barcha ariza turlari</option>
            <option value="BS_UNPAID">O'z hisobidan ta'til</option>
            <option value="MEHNAT_TATILI">Mehnat ta'tili</option>
            <option value="SICK_LEAVE_BL">Vaqtincha mehnatka layoqatsizlik</option>
            <option value="HOURLY_PERMIT">Kechikish / soatli ruxsatnoma</option>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">Barcha holat</option>
            <option value="PENDING">Ko'rib chiqilmoqda (PENDING)</option>
            <option value="APPROVED">Tasdiqlangan (APPROVED)</option>
            <option value="REJECTED">Rad etilgan (REJECTED)</option>
          </select>

          {/* Role filter (for Inbox tab testing & manager scoping) */}
          {activeTab === 'inbox' && (
            <select
              value={inboxRoleFilter}
              onChange={(e) => setInboxRoleFilter(e.target.value)}
              className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none"
            >
              <option value="ALL">★ Barcha Rahbarlar Bosqichi Inbox</option>
              {APPROVAL_STEPS_CONFIG.map((s) => (
                <option key={s.approverRole} value={s.approverRole}>
                  Bosqich #{s.stepNumber}: {s.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── TAB 1: Mening Arizalarim & Live Visual Steppers ── */}
      {activeTab === 'my' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-16 gap-3">
              <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
              <span className="text-slate-400 text-sm">Arizalar yuklanmoqda...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center space-y-3">
              <FileCheck className="h-12 w-12 text-slate-700 mx-auto" />
              <p className="text-slate-300 font-bold">Hozircha arizalar kiritilmagan</p>
              <p className="text-slate-500 text-xs">Yangi ariza shakllantirish uchun pastdagi tugmani bosing</p>
              <button
                onClick={() => setIsWizardOpen(true)}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30"
              >
                + Yangi Ariza Yozish
              </button>
            </div>
          ) : (
            requests.map((req) => {
              const meta = TYPE_META[req.type] || TYPE_META.BS_UNPAID;
              const isRejected = req.status === 'REJECTED';
              const isApproved = req.status === 'APPROVED';

              return (
                <div
                  key={req.id}
                  className={`glass-panel rounded-2xl border p-5 space-y-4 transition-all ${
                    isRejected
                      ? 'border-rose-500/40 bg-rose-950/10'
                      : isApproved
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  {/* Top Row: Applicant Info & Badges */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {req.employee?.firstName?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>
                            {req.employee?.lastName} {req.employee?.firstName} {req.employee?.middleName || ''}
                          </span>
                          <span className="font-mono text-indigo-400 text-xs">[{req.employee?.tabelNumber}]</span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <Building2 className="h-3 w-3 text-slate-500" />
                          <span>{req.employee?.currentDepartment?.name}</span>
                          <span>•</span>
                          <span>{req.employee?.position}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}>
                        {meta.label} ({req.totalDays} kun)
                      </span>

                      <button
                        onClick={() => setDetailRequest(req)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        👁️ Ko'rish
                      </button>

                      <button
                        onClick={() => setPrintRequest(req)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                      >
                        <Printer className="h-3.5 w-3.5 text-cyan-400" />
                        Hujjat / Print
                      </button>
                    </div>
                  </div>

                  {/* Dates & Reason */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Ta'til Sanalari:</span>
                      <span className="font-mono font-bold text-slate-200">
                        {new Date(req.startDate).toLocaleDateString('uz-UZ')} — {new Date(req.endDate).toLocaleDateString('uz-UZ')}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-slate-500 block text-[10px]">Ariza Sababi:</span>
                      <span className="text-slate-300 italic">"{req.reason}"</span>
                    </div>
                  </div>

                  {/* Rejection Alert if rejected */}
                  {isRejected && (
                    <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-rose-400 font-bold">WORKFLOW STOPPER — ARIZA RAD ETILDI:</strong>
                        <p className="mt-0.5">{req.rejectionComment || 'Sabab ko\'rsatilmadi'}</p>
                      </div>
                    </div>
                  )}

                  {/* ── LIVE VISUAL STEPPER (6 Approval Steps) ── */}
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">
                        6-Bosqichli Imzolash Holati:
                      </span>
                      <span className="font-mono font-bold text-cyan-400">
                        {isApproved ? 'Bosqich 6/6 (TUGALLANDI)' : isRejected ? `Bosqich ${req.currentStep}/6 (RAD ETILDI)` : `Bosqich ${req.currentStep}/6 kutilmoqda`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                      {APPROVAL_STEPS_CONFIG.map((cfg) => {
                        const stepData = req.approvalSteps?.find((s: any) => s.stepNumber === cfg.stepNumber);
                        const isStepDone = stepData?.status === 'APPROVED';
                        const isStepRejected = stepData?.status === 'REJECTED';
                        const isCurrentStep = req.currentStep === cfg.stepNumber && req.status === 'PENDING';

                        return (
                          <div
                            key={cfg.stepNumber}
                            className={`rounded-xl border p-2.5 transition-all text-xs ${
                              isStepDone
                                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                                : isStepRejected
                                ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                                : isCurrentStep
                                ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 shadow-md shadow-amber-500/10 animate-pulse'
                                : 'border-slate-800 bg-slate-950/40 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-black text-[10px]">#{cfg.stepNumber}</span>
                              {isStepDone ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              ) : isStepRejected ? (
                                <XCircle className="h-3.5 w-3.5 text-rose-400" />
                              ) : isCurrentStep ? (
                                <Clock className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                              ) : (
                                <div className="h-2 w-2 rounded-full bg-slate-700" />
                              )}
                            </div>

                            <div className="font-bold truncate text-[11px]">{cfg.label}</div>

                            <div className="text-[9px] mt-1 truncate">
                              {isStepDone ? (
                                <span className="text-emerald-400 font-medium">
                                  ✓ {stepData.approverName || 'Tasdiqlandi'}
                                </span>
                              ) : isStepRejected ? (
                                <span className="text-rose-400 font-medium">✕ Rad etildi</span>
                              ) : isCurrentStep ? (
                                <span className="text-amber-300 font-bold">Kutilmoqda...</span>
                              ) : (
                                <span className="text-slate-600">Navbatda</span>
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
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Inbox className="h-5 w-5 text-cyan-400" />
              <span>Rahbarlar Uchun Tasdiqlash Kutilayotgan Arizalar Inboxi</span>
            </h3>
            <span className="text-xs text-slate-400">
              Jami ko'rib chiqilishi kerak: <strong className="text-amber-400">{inboxRequests.length} ta</strong>
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-16 gap-3">
              <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
              <span className="text-slate-400 text-sm">Inbox yuklanmoqda...</span>
            </div>
          ) : inboxRequests.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 className="h-12 w-12 text-emerald-500/40 mx-auto" />
              <p className="text-slate-300 font-bold">Kutilayotgan arizalar mavjud emas!</p>
              <p className="text-slate-500 text-xs">Sizning bosqichingizdagi barcha arizalar tasdiqlangan</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Arizachi Xodim</th>
                    <th className="px-4 py-3">Bo'lim / Lavozim</th>
                    <th className="px-4 py-3">Ariza Turi</th>
                    <th className="px-4 py-3">Sanalari / Kun</th>
                    <th className="px-4 py-3">Ariza Sababi</th>
                    <th className="px-4 py-3">Joriy Bosqich</th>
                    <th className="px-4 py-3 text-right">Boshqaruv Amali</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {inboxRequests.map((req) => {
                    const meta = TYPE_META[req.type] || TYPE_META.BS_UNPAID;
                    const stepCfg = APPROVAL_STEPS_CONFIG.find((s) => s.stepNumber === req.currentStep);

                    return (
                      <tr key={req.id} className="hover:bg-slate-900/60 transition">
                        {/* Employee */}
                        <td className="px-4 py-3 font-semibold text-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-cyan-400 font-bold">[{req.employee?.tabelNumber}]</span>
                            <span>{req.employee?.lastName} {req.employee?.firstName}</span>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-4 py-3 text-slate-400 max-w-[140px]">
                          <span className="truncate block">{req.employee?.currentDepartment?.name}</span>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}>
                            {meta.short}
                          </span>
                        </td>

                        {/* Dates */}
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {formatDate(req.startDate)} — {formatDate(req.endDate)}
                          <span className="ml-1 text-amber-400 font-bold">({req.totalDays}d)</span>
                        </td>

                        {/* Reason */}
                        <td className="px-4 py-3 text-slate-300 max-w-[180px]">
                          <span className="truncate block italic text-slate-400">"{req.reason}"</span>
                        </td>

                        {/* Step badge */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse">
                            <Clock className="h-3 w-3" />
                            #{req.currentStep}: {stepCfg?.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setDetailRequest(req)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600 hover:text-white font-semibold text-xs transition"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              👁️ Ko'rish
                            </button>
                            <button
                              onClick={() => handleOpenApproveModal(req, 'APPROVE')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              ✅ Tasdiqlash
                            </button>
                            <button
                              onClick={() => handleOpenApproveModal(req, 'REJECT')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              ❌ Rad Etish
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
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Archive className="h-5 w-5 text-purple-400" />
              <span>Barcha Arizalar Umumiy Jurnali & Svodkasi</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Jami topilgan: {requests.length} ta</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Arizachi</th>
                  <th className="px-4 py-3">Bo'lim</th>
                  <th className="px-4 py-3">Ariza Turi</th>
                  <th className="px-4 py-3">Topshirilgan Sana</th>
                  <th className="px-4 py-3">Ta'til Muddati</th>
                  <th className="px-4 py-3">Kun</th>
                  <th className="px-4 py-3 text-center">Holati</th>
                  <th className="px-4 py-3 text-right">Imzolar Hujjati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {requests.map((r) => {
                  const meta = TYPE_META[r.type] || TYPE_META.BS_UNPAID;
                  return (
                    <tr key={r.id} className="hover:bg-slate-900/60 transition">
                      <td className="px-4 py-3 font-semibold text-slate-200">
                        <span className="font-mono text-purple-400 mr-2">[{r.employee?.tabelNumber}]</span>
                        {r.employee?.lastName} {r.employee?.firstName}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{r.employee?.currentDepartment?.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}>
                          {meta.short}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">{formatDate(r.createdAt)}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {formatDate(r.startDate)} — {formatDate(r.endDate)}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-amber-400">{r.totalDays} kun</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            r.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : r.status === 'REJECTED'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailRequest(r)}
                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            👁️ Ko'rish
                          </button>
                          <button
                            onClick={() => setPrintRequest(r)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white transition"
                          >
                            <Printer className="h-3.5 w-3.5 text-cyan-400" />
                            Hujjat
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
