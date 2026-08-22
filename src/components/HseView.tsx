'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HeartPulse,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  X,
  Printer,
  Filter,
  Stethoscope,
  HardHat,
  Building2,
  Save,
  CheckSquare,
  Square,
  Calendar,
  UserCheck,
  Layers,
  ChevronRight,
  ShieldAlert,
  Edit,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { MedicalSafetyModal } from './MedicalSafetyModal';

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const { t, language } = useLanguage();

  if (status === "O'TGAN" || status === 'AMALDA' || status === 'VALID') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
        <ShieldCheck className="h-3 w-3" />
        {t('hse.badge_valid', "MED-KO'RIK AMALDA / VALID")}
      </span>
    );
  }

  if (status === 'YAQINLASHMOQDA' || status === 'EXPIRING') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800">
        <Clock className="h-3 w-3" />
        {t('hse.badge_expiring', "MUDDATI TUGAYOTGAN (15 KUN)")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800">
      <AlertTriangle className="h-3 w-3" />
      {t('hse.badge_expired', "MUDDATI O'TGAN / EXPIRED")}
    </span>
  );
}

// ─── Stat Card Component ──────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, colorClass, badgeText }: { label: string; value: number | string; icon: any; colorClass: string; badgeText?: string }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 hover:border-blue-500 transition-all flex items-center gap-4">
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colorClass}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <div className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
        {value}
        {badgeText && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {badgeText}
          </span>
        )}
      </div>
      <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{label}</div>
    </div>
  </div>
);

interface HseViewProps {
  departments?: Array<{ id: string; name: string }>;
  onOpenBulkModal?: () => void;
}

export const HseView: React.FC<HseViewProps> = ({ departments = [], onOpenBulkModal }) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'medical' | 'safety'>('medical');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmpForModal, setSelectedEmpForModal] = useState<string | undefined>(undefined);

  // ─── TOP CASCADING FILTERS (Bo'lim -> Sex -> Uchastka) ──────────────────────
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [selectedShop, setSelectedShop]     = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');

  // Workers Data for Batch Operations
  const [employees, setEmployees]   = useState<any[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Batch Checkbox Selections
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<string>>(new Set());

  // ─── TAB 1: MEDICAL CHECKUP BATCH STATE ───
  const [medCheckups, setMedCheckups] = useState<any[]>([]);
  const [medStats, setMedStats]       = useState<any>({});
  const [medLoading, setMedLoading]   = useState(true);
  const [medDate, setMedDate]         = useState(new Date().toISOString().split('T')[0]);
  const [medValidityMonths, setMedValidityMonths] = useState('12');
  const [medClinic, setMedClinic]     = useState("Toshkent Shoshilinch Tibbiy Markazi #4");
  const [medOrderRef, setMedOrderRef] = useState(`MED-${new Date().getFullYear()}-001`);
  const [savingMed, setSavingMed]     = useState(false);
  const [medSuccessMsg, setMedSuccessMsg] = useState('');

  // ─── TAB 2: SAFETY BRIEFING BATCH STATE ───
  const [safetyBriefings, setSafetyBriefings] = useState<any[]>([]);
  const [safetyStats, setSafetyStats]         = useState<any>({});
  const [safetyLoading, setSafetyLoading]     = useState(true);
  const [briefingTopic, setBriefingTopic]     = useState('Elektr Xavfsizligi');
  const [briefingPeriodicity, setBriefingPeriodicity] = useState('90');
  const [briefingDate, setBriefingDate]       = useState(new Date().toISOString().split('T')[0]);
  const [briefingInstructor, setBriefingInstructor]   = useState("Ergashev Jamshid (Bosh HSE Inspektor)");
  const [briefingProtocol, setBriefingProtocol]       = useState(`XAVF-${new Date().getFullYear()}-001`);
  const [savingSafety, setSavingSafety]       = useState(false);
  const [safetySuccessMsg, setSafetySuccessMsg] = useState('');

  const PREDEFINED_TOPICS = [
    'Elektr Xavfsizligi',
    "Stanok Boshqarish Yo'riqnomasi",
    "Yong'in Xavfsizligi",
    'OSH Umumiy Yo\'riqnomasi',
    "Kimyoviy Moddalar Bilan Ishlash",
    "Balandlikda Ishlash Xavfsizligi",
    "Qo'lda Ko'tarish Texnicasi",
    "Shaxsiy Himoya Vositalarini Taqish",
  ];

  const fetchEmployees = useCallback(async () => {
    setEmpLoading(true);
    const params = new URLSearchParams();
    if (selectedDeptId !== 'ALL') params.set('departmentId', selectedDeptId);
    if (searchQuery) params.set('search', searchQuery);
    params.set('limit', '300');

    try {
      const res = await fetch(`/api/employees?${params}`);
      const data = await res.json();
      if (data.employees) {
        setEmployees(data.employees || []);
      }
    } catch {}
    setEmpLoading(false);
  }, [selectedDeptId, searchQuery]);

  const fetchMedical = useCallback(async () => {
    setMedLoading(true);
    const params = new URLSearchParams();
    if (selectedDeptId !== 'ALL') params.set('departmentId', selectedDeptId);
    if (searchQuery) params.set('search', searchQuery);
    try {
      const res = await fetch(`/api/hse/medical?${params}`);
      const data = await res.json();
      if (data.success) {
        setMedCheckups(data.checkups || []);
        setMedStats(data.stats || {});
      }
    } catch {}
    setMedLoading(false);
  }, [selectedDeptId, searchQuery]);

  const fetchSafety = useCallback(async () => {
    setSafetyLoading(true);
    const params = new URLSearchParams();
    if (selectedDeptId !== 'ALL') params.set('departmentId', selectedDeptId);
    if (searchQuery) params.set('search', searchQuery);
    try {
      const res = await fetch(`/api/hse/safety?${params}`);
      const data = await res.json();
      if (data.success) {
        setSafetyBriefings(data.briefings || []);
        setSafetyStats(data.stats || {});
      }
    } catch {}
    setSafetyLoading(false);
  }, [selectedDeptId, searchQuery]);

  useEffect(() => {
    fetchEmployees();
    fetchMedical();
    fetchSafety();
  }, [fetchEmployees, fetchMedical, fetchSafety]);

  useEffect(() => {
    setSelectedEmpIds(new Set());
  }, [activeTab, selectedDeptId, selectedShop, selectedSection]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedShop !== 'ALL' && !emp.position?.toLowerCase().includes(selectedShop.toLowerCase()) && !emp.currentDepartment?.name.toLowerCase().includes(selectedShop.toLowerCase())) {
        return false;
      }
      if (selectedSection !== 'ALL' && !emp.position?.toLowerCase().includes(selectedSection.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [employees, selectedShop, selectedSection]);

  const latestMedMap = useMemo(() => {
    const map = new Map<string, any>();
    medCheckups.forEach((c) => {
      if (!map.has(c.employeeId)) map.set(c.employeeId, c);
    });
    return map;
  }, [medCheckups]);

  const latestSafetyMap = useMemo(() => {
    const map = new Map<string, any>();
    safetyBriefings.forEach((b) => {
      if (!map.has(b.employeeId)) map.set(b.employeeId, b);
    });
    return map;
  }, [safetyBriefings]);

  const toggleSelectAll = () => {
    if (selectedEmpIds.size === filteredEmployees.length && filteredEmployees.length > 0) {
      setSelectedEmpIds(new Set());
    } else {
      const allIds = new Set(filteredEmployees.map((e) => e.id));
      setSelectedEmpIds(allIds);
    }
  };

  const toggleSelectEmp = (empId: string) => {
    const next = new Set(selectedEmpIds);
    if (next.has(empId)) next.delete(empId);
    else next.add(empId);
    setSelectedEmpIds(next);
  };

  const handleBatchSaveMedical = async () => {
    if (selectedEmpIds.size === 0) return;
    setSavingMed(true);
    setMedSuccessMsg('');
    try {
      const res = await fetch('/api/hse/medical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds: Array.from(selectedEmpIds),
          checkupDate: medDate,
          validityMonths: medValidityMonths,
          status: "O'TGAN",
          clinicName: medClinic,
          orderRef: medOrderRef,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMedSuccessMsg(`✅ ${selectedEmpIds.size}${language === 'kr' ? '명의 임직원 건강검진 내역이 저장되었습니다!' : " ta xodim uchun tibbiy ko'rik natijalari saqlandi!"}`);
        setSelectedEmpIds(new Set());
        fetchMedical();
        setTimeout(() => setMedSuccessMsg(''), 5000);
      }
    } catch {}
    setSavingMed(false);
  };

  const handleBatchSaveSafety = async () => {
    if (selectedEmpIds.size === 0) return;
    setSavingSafety(true);
    setSafetySuccessMsg('');
    try {
      const res = await fetch('/api/hse/safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds: Array.from(selectedEmpIds),
          title: briefingTopic,
          completionDate: briefingDate,
          validityDays: briefingPeriodicity,
          instructorName: briefingInstructor,
          protocolNumber: briefingProtocol,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSafetySuccessMsg(`✅ ${selectedEmpIds.size}${language === 'kr' ? '명의 임직원 안전교육 이력이 등록되었습니다!' : " ta xodim uchun xavfsizlik yo'riqnomasi saqlandi!"}`);
        setSelectedEmpIds(new Set());
        fetchSafety();
        setTimeout(() => setSafetySuccessMsg(''), 5000);
      }
    } catch {}
    setSavingSafety(false);
  };

  return (
    <div className="space-y-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen p-1 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <HeartPulse className="h-4 w-4 text-white" />
            </div>
            {t('hse.title', "Mehnat Muhofazasi va Tibbiy Ko'rik (HSE)")}
          </h2>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
            {t('hse.subtitle', "Xodimlarning davriy tibbiy ko'riklari va maxsus ruxsatnomalar jurnali")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedEmpForModal(undefined); setIsModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {t('hse.new_btn', "+ Yangi Med-ko'rik / Ruxsatnoma Biriktirish")}
          </button>

          {onOpenBulkModal && (
            <button
              onClick={onOpenBulkModal}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2.5 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
            >
              <span>📥 Excel Import</span>
            </button>
          )}
        </div>
      </div>

      {/* Statistical Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('hse.stat_valid', "Med-ko'rik Amalda")}
          value={activeTab === 'medical' ? (medStats.passed || 0) : (safetyStats.passed || 0)}
          icon={ShieldCheck}
          colorClass="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
        />
        <StatCard
          label={t('hse.stat_expiring', "Muddati Tugayotgan (15 kun)")}
          value={activeTab === 'medical' ? (medStats.nearExpiry || 0) : (safetyStats.nearExpiry || 0)}
          icon={Clock}
          colorClass="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
        />
        <StatCard
          label={t('hse.stat_expired', "Muddati O'tganlar")}
          value={activeTab === 'medical' ? ((medStats.expired || 0) + (medStats.failed || 0)) : (safetyStats.expired || 0)}
          icon={AlertTriangle}
          colorClass="bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400"
        />
        <StatCard
          label={t('hse.stat_coverage', "Faol Ruxsatnomalar Qamrovi %")}
          value={activeTab === 'medical' ? `${medStats.passedPct ?? 0}%` : `${safetyStats.passedPct ?? 0}%`}
          icon={UserCheck}
          colorClass="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400"
        />
      </div>

      {/* Cascading Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
          <Filter className="h-4 w-4" />
          {t('filter.by_status', "Status va Bo'limlar Bo'yicha Filter")}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">{t('hse.dept_filter', "Bo'lim bo'yicha filter")}</label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">-- {t('analytics.all_depts', "Barcha Bo'limlar")} --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">{t('hse.permit_filter', "Ruxsatnoma turi bo'yicha filter")}</label>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '전체 허가서 / 작업장' : 'Barcha Sex va Ruxsatlar'}</option>
              <option value="Shtamplash" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Shtamplash Sexi</option>
              <option value="Payvandlash" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Payvandlash Sexi</option>
              <option value="Logistika" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Logistika & KARA</option>
            </select>
          </div>

          <div>
            <label className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">{language === 'kr' ? '검진 상태 필터' : "Status bo'yicha"}</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '전체 상태' : 'Barcha holat'}</option>
              <option value="Master" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Master Smena</option>
              <option value="Operator" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Operatorlar</option>
            </select>
          </div>

          <div>
            <label className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">{t('hse.search', 'Qidiruv (F.I.O, Tabel №)...')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('hse.search', 'Qidiruv (F.I.O, Tabel №)...')}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 pl-8 pr-3 py-2 font-bold placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('medical')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'medical'
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-sm font-extrabold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
          }`}
        >
          <Stethoscope className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
          {language === 'kr' ? '1. 정기 건강검진 대장 (Batch Log)' : "1. Tibbiy Ko'rik Registeri"}
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'safety'
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-sm font-extrabold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
          }`}
        >
          <HardHat className="h-4 w-4 text-amber-700 dark:text-amber-400" />
          {language === 'kr' ? '2. 안전 교육 및 허가서 관리 (Batch Log)' : "2. Mehnat Muhofazasi Yo'riqnomalari"}
        </button>
      </div>

      {/* TAB 1: MEDICAL CHECKUP REGISTER */}
      {activeTab === 'medical' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-800 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                {language === 'kr' ? '건강검진 결과 일괄 입력 (Batch Checkbox System)' : "Med-Ko'rik Natijalarini Paketli Kiritish"}
              </h3>
              {medSuccessMsg && (
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-lg animate-pulse">
                  {medSuccessMsg}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">{t('med_modal.checkup_date', "Tibbiy Ko'rikdan O'tgan Sana")}</label>
                <input
                  type="date"
                  value={medDate}
                  onChange={(e) => setMedDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">{t('med_modal.next_date', 'Keyingi Ko\'rik Muddati')}</label>
                <select
                  value={medValidityMonths}
                  onChange={(e) => setMedValidityMonths(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
                >
                  <option value="6" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">6 oy (Har 6 oyda)</option>
                  <option value="12" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">12 oy (Yillik ko'rik)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">{t('med_modal.clinic_notes', 'Klinika / Shifoxona')}</label>
                <input
                  value={medClinic}
                  onChange={(e) => setMedClinic(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">{language === 'kr' ? '문서 번호' : "Buyruq / Yo'llanma №"}</label>
                <input
                  value={medOrderRef}
                  onChange={(e) => setMedOrderRef(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  {selectedEmpIds.size === filteredEmployees.length && filteredEmployees.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-400" />
                  )}
                  {language === 'kr' ? '전체 선택 / 해제' : 'Barchasini Belgilash / Tozalash'}
                </button>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {language === 'kr' ? '선택됨: ' : 'Tanlandi: '}<strong className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">{selectedEmpIds.size}</strong> / {filteredEmployees.length} {language === 'kr' ? '명' : 'ta xodim'}
                </span>
              </div>

              <button
                onClick={handleBatchSaveMedical}
                disabled={selectedEmpIds.size === 0 || savingMed}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold shadow-sm disabled:opacity-40 transition active:scale-95 cursor-pointer"
              >
                {savingMed ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('med_modal.save', 'Saqlash')} ({selectedEmpIds.size})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase tracking-wider text-[10px] border-b border-slate-300 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">
                      <input
                        type="checkbox"
                        checked={selectedEmpIds.size === filteredEmployees.length && filteredEmployees.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-emerald-600 focus:ring-0 h-4 w-4 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3.5 text-left">{t('hse.col_tabel', 'Tabel №')}</th>
                    <th className="px-4 py-3.5 text-left">{t('hse.col_fio', 'F.I.O')}</th>
                    <th className="px-4 py-3.5 text-left">{t('hse.col_dept_pos', "Bo'lim / Lavozim")}</th>
                    <th className="px-4 py-3.5 text-left">{t('hse.col_last_date', "Oxirgi Med-ko'rik Sanasi")}</th>
                    <th className="px-4 py-3.5 text-center">{t('hse.col_status', "Med-ko'rik Statusi")}</th>
                    <th className="px-4 py-3.5 text-left">{t('hse.col_permits', 'Maxsus Ruxsatnomalar')}</th>
                    <th className="px-4 py-3.5 text-right">{t('hse.col_actions', 'Harakatlar')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {empLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-600 dark:text-slate-400">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
                        {language === 'kr' ? '임직원 목록을 불러오는 중입니다...' : "Xodimlar ro'yxati yuklanmoqda..."}
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                        {language === 'kr' ? '해당 조건의 임직원이 없습니다' : "Tanlangan filtrlar bo'yicha xodimlar topilmadi"}
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const isSelected = selectedEmpIds.has(emp.id);
                      const lastRecord = latestMedMap.get(emp.id);

                      return (
                        <tr
                          key={emp.id}
                          className={`cursor-pointer border-b border-slate-200 dark:border-slate-800 transition-colors ${
                            isSelected ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectEmp(emp.id)}
                              className="rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-emerald-600 focus:ring-0 h-4 w-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-blue-700 dark:text-indigo-400">{emp.tabelNumber}</td>
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                            {emp.lastName} {emp.firstName} {emp.middleName || ''}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                            <div>{emp.currentDepartment?.name}</div>
                            <div className="text-[10px] text-slate-500">{emp.position}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200 font-semibold text-xs">
                            {lastRecord ? formatDate(lastRecord.checkupDate) : (language === 'kr' ? '미등록' : 'Kiritilmagan')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {lastRecord ? (
                              <StatusBadge status={lastRecord.effectiveStatus} />
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5">{language === 'kr' ? '신규' : 'Yangi'}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {emp.hasForkliftPermit && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                                  {t('hse.permit_forklift', 'Kara minish ruxsatnomasi')}
                                </span>
                              )}
                              {emp.hasPhonePermit && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                  {t('hse.permit_phone', 'Telefon ishlatish ruxsatnomasi')}
                                </span>
                              )}
                              {!emp.hasForkliftPermit && !emp.hasPhonePermit && (
                                <span className="text-slate-400 italic text-[11px]">{t('hse.permit_none', "Mavjud emas / Ruxsat yo'q")}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEmpForModal(emp.id);
                                setIsModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              {t('hse.col_actions', 'Harakatlar')}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SAFETY BRIEFINGS */}
      {activeTab === 'safety' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-800 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <HardHat className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                {language === 'kr' ? '안전 교육 이력 일괄 등록 (Briefing Batch Log)' : "Yo'riqnoma Loglarini Paketli Ro'yxatga Olish"}
              </h3>
              {safetySuccessMsg && (
                <div className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 px-3 py-1 rounded-lg animate-pulse">
                  {safetySuccessMsg}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <div className="md:col-span-2">
                <label className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">{language === 'kr' ? '안전 교육 항목' : "Yo'riqnoma Turi"}</label>
                <select
                  value={briefingTopic}
                  onChange={(e) => setBriefingTopic(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
                >
                  {PREDEFINED_TOPICS.map((topic) => (
                    <option key={topic} value={topic} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {topic}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">{language === 'kr' ? '주기 (일)' : 'Davriylik'}</label>
                <select
                  value={briefingPeriodicity}
                  onChange={(e) => setBriefingPeriodicity(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
                >
                  <option value="90" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">90 kun (Kvartallik)</option>
                  <option value="180" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">180 kun (Yarim yillik)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">{language === 'kr' ? '교육 실시 일자' : "O'tkazilgan Sana"}</label>
                <input
                  type="date"
                  value={briefingDate}
                  onChange={(e) => setBriefingDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">{language === 'kr' ? '교육 담당자' : "Yo'riqchi"}</label>
                <input
                  value={briefingInstructor}
                  onChange={(e) => setBriefingInstructor(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  {selectedEmpIds.size === filteredEmployees.length && filteredEmployees.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-400" />
                  )}
                  {language === 'kr' ? '전체 선택 / 해제' : 'Barchasini Belgilash / Tozalash'}
                </button>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {language === 'kr' ? '선택됨: ' : 'Tanlandi: '}<strong className="text-amber-700 dark:text-amber-400 font-mono font-bold">{selectedEmpIds.size}</strong> / {filteredEmployees.length} {language === 'kr' ? '명' : 'ta xodim'}
                </span>
              </div>

              <button
                onClick={handleBatchSaveSafety}
                disabled={selectedEmpIds.size === 0 || savingSafety}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 text-xs font-bold shadow-sm disabled:opacity-40 transition active:scale-95 cursor-pointer"
              >
                {savingSafety ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardHat className="h-4 w-4" />}
                {t('med_modal.save', 'Saqlash')} ({selectedEmpIds.size})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase tracking-wider text-[10px] border-b border-slate-300 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">
                      <input
                        type="checkbox"
                        checked={selectedEmpIds.size === filteredEmployees.length && filteredEmployees.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-amber-600 focus:ring-0 h-4 w-4 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3.5 text-left">{t('hse.col_tabel', 'Tabel №')}</th>
                    <th className="px-4 py-3.5 text-left">{t('hse.col_fio', 'F.I.O')}</th>
                    <th className="px-4 py-3.5 text-left">{t('hse.col_dept_pos', "Bo'lim / Lavozim")}</th>
                    <th className="px-4 py-3.5 text-left">{language === 'kr' ? '최종 안전 교육 일자' : "Oxirgi Yo'riqnoma Sanasi"}</th>
                    <th className="px-4 py-3.5 text-center">{t('table.status', 'Status')}</th>
                    <th className="px-4 py-3.5 text-right">{t('hse.col_actions', 'Harakatlar')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {empLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-600 dark:text-slate-400">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-600 dark:text-amber-400" />
                        {language === 'kr' ? '임직원 목록을 불러오는 중입니다...' : "Xodimlar ro'yxati yuklanmoqda..."}
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                        {language === 'kr' ? '해당 조건의 임직원이 없습니다' : "Tanlangan filtrlar bo'yicha xodimlar topilmadi"}
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const isSelected = selectedEmpIds.has(emp.id);
                      const lastRecord = latestSafetyMap.get(emp.id);

                      return (
                        <tr
                          key={emp.id}
                          className={`cursor-pointer border-b border-slate-200 dark:border-slate-800 transition-colors ${
                            isSelected ? 'bg-amber-50 dark:bg-amber-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectEmp(emp.id)}
                              className="rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-amber-600 focus:ring-0 h-4 w-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-amber-700 dark:text-amber-400">{emp.tabelNumber}</td>
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                            {emp.lastName} {emp.firstName} {emp.middleName || ''}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                            <div>{emp.currentDepartment?.name}</div>
                            <div className="text-[10px] text-slate-500">{emp.position}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200 font-semibold text-xs">
                            {lastRecord ? formatDate(lastRecord.completionDate) : (language === 'kr' ? '미등록' : 'Kiritilmagan')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {lastRecord ? (
                              <StatusBadge status={lastRecord.effectiveStatus} />
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5">{language === 'kr' ? '신규' : 'Yangi'}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                                isSelected
                                  ? 'bg-amber-600 text-white shadow-sm'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                              }`}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              {isSelected ? (language === 'kr' ? '✓ 이수 완료' : "✓ Yo'riqnoma bilan tanishdi") : (language === 'kr' ? '선택' : "Belgilash")}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Medical Safety Modal */}
      <MedicalSafetyModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedEmpForModal(undefined); }}
        onSuccess={() => {
          setIsModalOpen(false);
          setSelectedEmpForModal(undefined);
          fetchMedical();
          fetchSafety();
        }}
        preselectedEmployeeId={selectedEmpForModal}
      />
    </div>
  );
};

// Aliases as requested in user prompt
export const MedicalSafetyView = HseView;
export const MedicalCheckupsModule = HseView;
