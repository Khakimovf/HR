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
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
    "O'TGAN":          { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: CheckCircle2,  label: "O'TGAN" },
    "O'TMAGAN":        { bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/30',    icon: X,             label: "O'TMAGAN" },
    'MUDDATI_TUGAGAN': { bg: 'bg-red-600/15',     text: 'text-red-400',     border: 'border-red-500/30',     icon: AlertTriangle,  label: 'MUDDATI TUGAGAN' },
    'YAQINLASHMOQDA':  { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30',   icon: Clock,         label: 'YAQIN MUDDATI' },
    'AMALDA':          { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: ShieldCheck,   label: 'AMALDA' },
  };
  const meta = cfg[status] || { bg: 'bg-slate-700', text: 'text-slate-300', border: 'border-slate-600', icon: Clock, label: status };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${meta.bg} ${meta.text} ${meta.border}`}>
      <Icon className="h-3 w-3" />{meta.label}
    </span>
  );
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const d   = new Date(dateStr);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 3600 * 24));
}

interface HseViewProps {
  departments?: Array<{ id: string; name: string }>;
  onOpenBulkModal?: () => void;
}

export const HseView: React.FC<HseViewProps> = ({ departments = [], onOpenBulkModal }) => {
  const [activeTab, setActiveTab] = useState<'medical' | 'safety'>('medical');

  // ─── TOP CASCADING FILTERS (Bo'lim -> Sex -> Uchastka) ──────────────────────
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [selectedShop, setSelectedShop]     = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');

  // Workers Data for Batch Operations
  const [employees, setEmployees]   = useState<any[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Batch Checkbox Selections (Set of Employee IDs)
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
    "Qo'lda Ko'tarish Texnikasi",
    "Shaxsiy Himoya Vositalarini Taqish",
  ];

  // ─── FETCH EMPLOYEES ACCORDING TO CASCADING FILTERS ─────────────────────────
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
    } catch {
      // Fallback empty
    }
    setEmpLoading(false);
  }, [selectedDeptId, searchQuery]);

  // ─── FETCH MEDICAL CHECKUPS DATA ───────────────────────────────────────────
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

  // ─── FETCH SAFETY BRIEFINGS DATA ───────────────────────────────────────────
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

  // Reset selections when tab or filter changes
  useEffect(() => {
    setSelectedEmpIds(new Set());
  }, [activeTab, selectedDeptId, selectedShop, selectedSection]);

  // ─── DERIVED FILTERED WORKERS FOR TABLE ────────────────────────────────────
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Shop filter matching position/department text if specific
      if (selectedShop !== 'ALL' && !emp.position?.toLowerCase().includes(selectedShop.toLowerCase()) && !emp.currentDepartment?.name.toLowerCase().includes(selectedShop.toLowerCase())) {
        return false;
      }
      // Section filter
      if (selectedSection !== 'ALL' && !emp.position?.toLowerCase().includes(selectedSection.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [employees, selectedShop, selectedSection]);

  // Map employee ID to latest Medical Checkup record
  const latestMedMap = useMemo(() => {
    const map = new Map<string, any>();
    medCheckups.forEach((c) => {
      if (!map.has(c.employeeId)) map.set(c.employeeId, c);
    });
    return map;
  }, [medCheckups]);

  // Map employee ID to latest Safety Briefing record
  const latestSafetyMap = useMemo(() => {
    const map = new Map<string, any>();
    safetyBriefings.forEach((b) => {
      if (!map.has(b.employeeId)) map.set(b.employeeId, b);
    });
    return map;
  }, [safetyBriefings]);

  // ─── CHECKBOX SELECTION TOGGLERS ───────────────────────────────────────────
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

  // ─── BATCH SAVE HANDLER 1: MEDICAL CHECKUPS ────────────────────────────────
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
        setMedSuccessMsg(`✅ ${selectedEmpIds.size} ta xodim uchun tibbiy ko'rik natijalari muvaffaqiyatli saqlandi!`);
        setSelectedEmpIds(new Set());
        fetchMedical();
        setTimeout(() => setMedSuccessMsg(''), 5000);
      }
    } catch {}
    setSavingMed(false);
  };

  // ─── BATCH SAVE HANDLER 2: SAFETY BRIEFINGS ────────────────────────────────
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
        setSafetySuccessMsg(`✅ ${selectedEmpIds.size} ta xodim uchun xavfsizlik yo'riqnomasi muvaffaqiyatli ro'yxatga olindi!`);
        setSelectedEmpIds(new Set());
        fetchSafety();
        setTimeout(() => setSafetySuccessMsg(''), 5000);
      }
    } catch {}
    setSavingSafety(false);
  };

  return (
    <div className="space-y-5">
      {/* Module Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            Mehnat Muhofazasi & Tibbiy Ko'rik (HSE)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Bo'limlar va sexlar kesimida tezkor med-ko'rik hamda xavfsizlik yo'riqnomalarini paketli (batch) tasdiqlash tizimi
          </p>
        </div>

        {onOpenBulkModal && (
          <button
            onClick={onOpenBulkModal}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition active:scale-95"
          >
            <span>📥 Excel Orqali Ommaviy Yuklash</span>
          </button>
        )}
      </div>

      {/* ── 1. TOP CASCADING FILTER BAR (Bo'lim -> Sex -> Uchastka) ──────────────── */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-4 bg-slate-900/90 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
          <Filter className="h-4 w-4" />
          Tashkiliy Tuzilma Bo'yicha Filtr (Cascading Filters)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Bo'lim Selector */}
          <div>
            <label className="text-slate-400 font-semibold mb-1 block">1. Bo'lim (Department)</label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">Barcha Bo'limlar ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sex (Shop) Selector */}
          <div>
            <label className="text-slate-400 font-semibold mb-1 block">2. Sex / Sub-Department</label>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">Barcha Sexlar</option>
              <option value="Shtamplash">Shtamplash Sexi</option>
              <option value="Payvandlash">Payvandlash Sexi (Weld)</option>
              <option value="Bo'yoqlash">Bo'yoqlash Sexi (Paint)</option>
              <option value="Yig'uv">Yig'uv Line A/B</option>
              <option value="Logistika">Logistika & KARA</option>
              <option value="Dvigatel">Dvigatel Sexi</option>
            </select>
          </div>

          {/* Uchastka (Section / Shift) Selector */}
          <div>
            <label className="text-slate-400 font-semibold mb-1 block">3. Uchastka / Smena (Section)</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">Barcha Uchastkalar</option>
              <option value="Master">Master Smena Unit #1</option>
              <option value="Operator">Operatorlar Guruhi</option>
              <option value="Payvandchi">Payvandchilar Uchastkasi</option>
              <option value="Inspector">QC Nazoratchilar</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="text-slate-400 font-semibold mb-1 block">Qidiruv (Ism / Tabel №)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="TB-1001 yoki F.I.O..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-3 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60 p-1">
        <button
          onClick={() => setActiveTab('medical')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'medical'
              ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 text-emerald-300 border border-emerald-500/40 shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Stethoscope className="h-4 w-4 text-emerald-400" />
          TAB 1: Tibbiy Ko'rik Registeri (Tezkor Checkbox)
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'safety'
              ? 'bg-gradient-to-r from-amber-600/30 to-orange-600/30 text-amber-300 border border-amber-500/40 shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <HardHat className="h-4 w-4 text-amber-400" />
          TAB 2: Mehnat Muhofazasi Yo'riqnomalari (Batch Log)
        </button>
      </div>

      {/* ── TAB 1: TIBBIY KO'RIK REGISTERI ───────────────────────────────────────── */}
      {activeTab === 'medical' && (
        <div className="space-y-4">
          {/* Top Batch Controls Toolbar */}
          <div className="glass-card rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-emerald-300 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                Med-Ko'rik Natijalarini Paketli Kiritish (Batch Checkbox System)
              </h3>
              {medSuccessMsg && (
                <div className="text-xs font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 rounded-lg animate-pulse">
                  {medSuccessMsg}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Ko'rik O'tkazilgan Sana</label>
                <input
                  type="date"
                  value={medDate}
                  onChange={(e) => setMedDate(e.target.value)}
                  className="w-full rounded-xl border border-emerald-500/40 bg-slate-950 px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Amal Qilish Muddati</label>
                <select
                  value={medValidityMonths}
                  onChange={(e) => setMedValidityMonths(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none"
                >
                  <option value="6">6 oy (Har 6 oyda)</option>
                  <option value="12">12 oy (Yillik ko'rik)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Klinika / Shifoxona</label>
                <input
                  value={medClinic}
                  onChange={(e) => setMedClinic(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Buyruq / Yo'llanma №</label>
                <input
                  value={medOrderRef}
                  onChange={(e) => setMedOrderRef(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Employee Worker Table with Checkboxes */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition"
                >
                  {selectedEmpIds.size === filteredEmployees.length && filteredEmployees.length > 0 ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  Barchasini Belgilash / Tozalash
                </button>
                <span className="text-xs text-slate-400">
                  Tanlandi: <strong className="text-emerald-400 font-mono">{selectedEmpIds.size}</strong> / {filteredEmployees.length} ta xodim
                </span>
              </div>

              <button
                onClick={handleBatchSaveMedical}
                disabled={selectedEmpIds.size === 0 || savingMed}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 transition"
              >
                {savingMed ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                💾 Med-Ko'rik Natijalarini Saqlash ({selectedEmpIds.size})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wide text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">
                      <input
                        type="checkbox"
                        checked={selectedEmpIds.size === filteredEmployees.length && filteredEmployees.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 h-4 w-4 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">Tabel №</th>
                    <th className="px-4 py-3 text-left">F.I.O (Xodim)</th>
                    <th className="px-4 py-3 text-left">Tarkibiy Bo'limi</th>
                    <th className="px-4 py-3 text-left">Egallagan Lavozimi</th>
                    <th className="px-4 py-3 text-left">Oxirgi Med-Ko'rik Sanasi</th>
                    <th className="px-4 py-3 text-center">Oxirgi Status</th>
                    <th className="px-4 py-3 text-right">CHECKBOX TOGGLE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {empLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-400" />
                        Xodimlar ro'yxati yuklanmoqda...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Tanlangan filtrlar bo'yicha xodimlar topilmadi
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const isSelected = selectedEmpIds.has(emp.id);
                      const lastRecord = latestMedMap.get(emp.id);

                      return (
                        <tr
                          key={emp.id}
                          onClick={() => toggleSelectEmp(emp.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-500/10' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectEmp(emp.id)}
                              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 h-4 w-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-indigo-400">{emp.tabelNumber}</td>
                          <td className="px-4 py-3 font-semibold text-slate-200">
                            {emp.lastName} {emp.firstName} {emp.middleName || ''}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{emp.currentDepartment?.name}</td>
                          <td className="px-4 py-3 text-slate-400">{emp.position}</td>
                          <td className="px-4 py-3 font-mono text-slate-400">
                            {lastRecord ? formatDate(lastRecord.checkupDate) : "Kiritilmagan"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {lastRecord ? (
                              <StatusBadge status={lastRecord.effectiveStatus} />
                            ) : (
                              <span className="text-[10px] text-slate-500 border border-slate-700 rounded px-2 py-0.5">Yangi</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {isSelected ? "✓ Med-ko'rikdan o'tdi" : "Belgilash"}
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

      {/* ── TAB 2: MEHNAT MUHOFAZASI YO'RIQNOMALARI ───────────────────────────── */}
      {activeTab === 'safety' && (
        <div className="space-y-4">
          {/* Top Batch Controls Toolbar */}
          <div className="glass-card rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
                <HardHat className="h-4 w-4 text-amber-400" />
                Yo'riqnoma Loglarini Paketli Ro'yxatga Olish (Briefing Batch Log)
              </h3>
              {safetySuccessMsg && (
                <div className="text-xs font-bold text-amber-400 bg-amber-500/20 border border-amber-500/40 px-3 py-1 rounded-lg animate-pulse">
                  {safetySuccessMsg}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <div className="md:col-span-2">
                <label className="text-slate-400 font-semibold mb-1 block">Yo'riqnoma Turi (Briefing Topic)</label>
                <select
                  value={briefingTopic}
                  onChange={(e) => setBriefingTopic(e.target.value)}
                  className="w-full rounded-xl border border-amber-500/40 bg-slate-950 px-3 py-2 text-white font-semibold focus:outline-none"
                >
                  {PREDEFINED_TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Davriylik (Periodicity)</label>
                <select
                  value={briefingPeriodicity}
                  onChange={(e) => setBriefingPeriodicity(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none"
                >
                  <option value="90">90 kun (Kvartallik)</option>
                  <option value="180">180 kun (Yarim yillik)</option>
                  <option value="365">365 kun (Yillik)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">O'tkazilgan Sana</label>
                <input
                  type="date"
                  value={briefingDate}
                  onChange={(e) => setBriefingDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Yo'riqchi (Instructor)</label>
                <input
                  value={briefingInstructor}
                  onChange={(e) => setBriefingInstructor(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Employee Worker Table with Checkboxes */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 transition"
                >
                  {selectedEmpIds.size === filteredEmployees.length && filteredEmployees.length > 0 ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  Barchasini Belgilash / Tozalash
                </button>
                <span className="text-xs text-slate-400">
                  Tanlandi: <strong className="text-amber-400 font-mono">{selectedEmpIds.size}</strong> / {filteredEmployees.length} ta xodim
                </span>
              </div>

              <button
                onClick={handleBatchSaveSafety}
                disabled={selectedEmpIds.size === 0 || savingSafety}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-amber-600/30 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 transition"
              >
                {savingSafety ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardHat className="h-4 w-4" />}
                ✅ Yo'riqnoma Logini Tasdiqlash va Saqlash ({selectedEmpIds.size})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wide text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">
                      <input
                        type="checkbox"
                        checked={selectedEmpIds.size === filteredEmployees.length && filteredEmployees.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 h-4 w-4 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">Tabel №</th>
                    <th className="px-4 py-3 text-left">F.I.O (Xodim)</th>
                    <th className="px-4 py-3 text-left">Tarkibiy Bo'limi</th>
                    <th className="px-4 py-3 text-left">Egallagan Lavozimi</th>
                    <th className="px-4 py-3 text-left">Oxirgi Yo'riqnoma Sanasi</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">CHECKBOX TOGGLE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {empLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-400" />
                        Xodimlar ro'yxati yuklanmoqda...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Tanlangan filtrlar bo'yicha xodimlar topilmadi
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const isSelected = selectedEmpIds.has(emp.id);
                      const lastRecord = latestSafetyMap.get(emp.id);

                      return (
                        <tr
                          key={emp.id}
                          onClick={() => toggleSelectEmp(emp.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-amber-500/10' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectEmp(emp.id)}
                              className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 h-4 w-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-amber-400">{emp.tabelNumber}</td>
                          <td className="px-4 py-3 font-semibold text-slate-200">
                            {emp.lastName} {emp.firstName} {emp.middleName || ''}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{emp.currentDepartment?.name}</td>
                          <td className="px-4 py-3 text-slate-400">{emp.position}</td>
                          <td className="px-4 py-3 font-mono text-slate-400">
                            {lastRecord ? formatDate(lastRecord.completionDate) : "Kiritilmagan"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {lastRecord ? (
                              <StatusBadge status={lastRecord.effectiveStatus} />
                            ) : (
                              <span className="text-[10px] text-slate-500 border border-slate-700 rounded px-2 py-0.5">Yangi</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                                isSelected
                                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              {isSelected ? "✓ Yo'riqnoma bilan tanishdi" : "Belgilash"}
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
    </div>
  );
};
