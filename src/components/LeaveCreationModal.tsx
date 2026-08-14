'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  User,
  Hash,
  Check,
} from 'lucide-react';

// ─── Leave Type Definitions ──────────────────────────────────────────────────

export const LEAVE_TYPES = [
  { id: 'MEHNAT_TATILI',       label: "Mehnat ta'tili", short: 'M/T', color: 'blue', desc: 'Yillik mehnat ta\'tili', isHourly: false },
  { id: 'SICK_LEAVE_BL',       label: "Vaqtincha mehnatka layoqatsizlik", short: 'B/L', color: 'rose', desc: 'Vaqtincha mehnatka layoqatsizlik', isHourly: false },
  { id: 'BS_UNPAID',           label: "O'z hisobidan ta'til", short: 'B/S', color: 'amber', desc: 'O\'z hisobidan ta\'til', isHourly: false },
  { id: 'OQISH_TATILI',        label: "O'qish davri uchun qo'shimcha ta'til", short: "O'Q", color: 'purple', desc: "O'qish davri uchun qo'shimcha ta'til", isHourly: false },
  { id: 'OTGUL',               label: "Kechikish / soatli ruxsatnoma", short: 'OTG', color: 'teal', desc: 'Kechikish / soatli ruxsatnoma', isHourly: false },
  { id: 'ADMIN_TATIL',         label: "Administrativ ta'til", short: 'ADM', color: 'indigo', desc: 'Administrativ ta\'til', isHourly: false },
  { id: 'KECHIKISH_RUXSATNOMA', label: 'Kechikish / soatli ruxsatnoma', short: 'KECH', color: 'orange', desc: 'Kechikish / soatli ruxsatnoma', isHourly: true },
];

const TYPE_COLOR_MAP: Record<string, string> = {
  blue:   'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25',
  rose:   'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25',
  amber:  'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25',
  purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25',
  teal:   'bg-teal-500/15 text-teal-300 border-teal-500/30 hover:bg-teal-500/25',
  indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25',
  orange: 'bg-orange-500/15 text-orange-300 border-orange-500/30 hover:bg-orange-500/25',
};

const ACTIVE_TYPE_COLOR_MAP: Record<string, string> = {
  blue:   'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30',
  rose:   'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30',
  amber:  'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/30',
  purple: 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30',
  teal:   'bg-teal-600 text-white border-teal-500 shadow-lg shadow-teal-600/30',
  indigo: 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30',
  orange: 'bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-600/30',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.abs(e.getTime() - s.getTime());
  return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)) + 1);
}

function calcHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return Math.max(0, Math.round(((eh * 60 + em - sh * 60 - sm) / 60) * 10) / 10);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LeaveCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departments?: Array<{ id: string; name: string }>;
  preselectedEmployeeId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const LeaveCreationModal: React.FC<LeaveCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  departments = [],
  preselectedEmployeeId,
}) => {
  // Employee search state
  const [empSearch, setEmpSearch]         = useState('');
  const [empResults, setEmpResults]       = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp]     = useState<any>(null);
  const [empLoading, setEmpLoading]       = useState(false);
  const [showDropdown, setShowDropdown]   = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Form state
  const [selectedType, setSelectedType]   = useState<string>('');
  const [startDate, setStartDate]         = useState('');
  const [endDate, setEndDate]             = useState('');
  const [startTime, setStartTime]         = useState('09:00');
  const [endTime, setEndTime]             = useState('11:00');
  const [orderNumber, setOrderNumber]     = useState('');
  const [reason, setReason]               = useState('');

  // Submit state
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [conflictError, setConflictError] = useState('');
  const [success, setSuccess]             = useState(false);

  const selectedTypeObj = LEAVE_TYPES.find((t) => t.id === selectedType);
  const isHourly = selectedTypeObj?.isHourly ?? false;
  const totalDays  = !isHourly ? calcDays(startDate, endDate) : 0;
  const totalHours = isHourly  ? calcHours(startTime, endTime) : 0;

  // Pre-select employee if provided
  useEffect(() => {
    if (preselectedEmployeeId && isOpen) {
      fetch(`/api/employees/${preselectedEmployeeId}`)
        .then((r) => r.json())
        .then((d) => { if (d.success) setSelectedEmp(d.employee); });
    }
  }, [preselectedEmployeeId, isOpen]);

  // Debounced employee search
  useEffect(() => {
    if (!empSearch.trim() || empSearch.length < 2) {
      setEmpResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setEmpLoading(true);
      try {
        const res = await fetch(`/api/employees?search=${encodeURIComponent(empSearch)}&limit=8`);
        const data = await res.json();
        setEmpResults(data.employees || []);
        setShowDropdown(true);
      } finally {
        setEmpLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [empSearch]);

  const resetForm = () => {
    setEmpSearch('');
    setEmpResults([]);
    setSelectedEmp(preselectedEmployeeId ? selectedEmp : null);
    setShowDropdown(false);
    setSelectedType('');
    setStartDate('');
    setEndDate('');
    setStartTime('09:00');
    setEndTime('11:00');
    setOrderNumber('');
    setReason('');
    setError('');
    setConflictError('');
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedEmp) { setError("Xodim tanlanmagan"); return; }
    if (!selectedType) { setError("Ta'til turini tanlang"); return; }
    if (!startDate) { setError("Boshlanish sanasini kiriting"); return; }
    if (!isHourly && !endDate) { setError("Tugash sanasini kiriting"); return; }
    if (isHourly && (!startTime || !endTime)) { setError("Boshlanish va tugash vaqtini kiriting"); return; }

    setError('');
    setConflictError('');
    setLoading(true);

    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId:  selectedEmp.id,
          type:        selectedType,
          startDate,
          endDate:     isHourly ? startDate : endDate,
          startTime:   isHourly ? startTime : undefined,
          endTime:     isHourly ? endTime   : undefined,
          orderNumber: orderNumber || undefined,
          reason:      reason     || undefined,
        }),
      });

      const data = await res.json();

      if (data.conflict) {
        setConflictError(data.error);
        return;
      }
      if (!data.success) {
        setError(data.error || "Xatolik yuz berdi");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1200);
    } catch {
      setError("Tarmoq xatoligi. Qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0c1120 0%, #111827 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Yangi Ta'til / Ruxsatnoma</h3>
              <p className="text-[11px] text-slate-400">Davomat & Ta'tillar Boshqaruvi</p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-12 text-center space-y-3">
            <div className="flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
            <p className="text-lg font-bold text-white">Muvaffaqiyatli saqlandi!</p>
            <p className="text-sm text-slate-400">Ta'til yozuvi tizimga qo'shildi</p>
          </div>
        ) : (
          <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">

            {/* ── Employee Search ── */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Xodim Tanlash *
              </label>
              {selectedEmp ? (
                <div className="flex items-center justify-between rounded-xl bg-indigo-500/10 border border-indigo-500/30 p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {selectedEmp.firstName?.[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {selectedEmp.lastName} {selectedEmp.firstName} {selectedEmp.middleName || ''}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span className="font-mono text-indigo-400">{selectedEmp.tabelNumber}</span>
                        <span>•</span>
                        <span>{selectedEmp.position}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedEmp(null); setEmpSearch(''); }}
                    className="text-slate-500 hover:text-rose-400 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      ref={searchRef}
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                      onFocus={() => empResults.length > 0 && setShowDropdown(true)}
                      placeholder="Tabel raqami yoki F.I.O. bo'yicha qidiring..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/80 pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                    />
                    {empLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 animate-spin" />
                    )}
                  </div>

                  {showDropdown && empResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
                      {empResults.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => {
                            setSelectedEmp(emp);
                            setEmpSearch('');
                            setShowDropdown(false);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-800 transition"
                        >
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {emp.firstName?.[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate">
                              {emp.lastName} {emp.firstName}
                            </div>
                            <div className="text-[10px] text-slate-400 flex gap-2">
                              <span className="font-mono text-indigo-400">{emp.tabelNumber}</span>
                              <span className="truncate">{emp.currentDepartment?.name}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Leave Type Grid ── */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Ta'til / Ruxsatnoma Turi *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LEAVE_TYPES.map((lt) => {
                  const isActive = selectedType === lt.id;
                  return (
                    <button
                      key={lt.id}
                      onClick={() => { setSelectedType(lt.id); setConflictError(''); }}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                        isActive
                          ? ACTIVE_TYPE_COLOR_MAP[lt.color]
                          : TYPE_COLOR_MAP[lt.color]
                      }`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className={`text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20' : 'bg-black/20'}`}>
                          {lt.short}
                        </span>
                        {isActive && <Check className="h-3 w-3 ml-auto" />}
                      </div>
                      <div className="mt-1.5 text-[11px] font-semibold leading-tight">{lt.label.split('—').pop()?.trim() || lt.label}</div>
                      <div className={`mt-0.5 text-[9px] ${isActive ? 'text-white/70' : 'text-slate-500'}`}>{lt.desc}</div>
                      {lt.isHourly && (
                        <div className={`mt-1 text-[9px] font-bold flex items-center gap-1 ${isActive ? 'text-white/80' : 'text-orange-400'}`}>
                          <Clock className="h-2.5 w-2.5" /> Soatbay
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Date / Time Inputs ── */}
            {selectedType && (
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                  {isHourly ? <><Clock className="h-3 w-3" /> Sana va Vaqt</> : <><Calendar className="h-3 w-3" /> Sana Oralig'i</>}
                </label>

                {isHourly ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Sana</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Boshlanish vaqti</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Tugash vaqti</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none transition"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Boshlanish sanasi</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value); }}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Tugash sanasi</label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none transition"
                      />
                    </div>
                  </div>
                )}

                {/* Auto-calculated summary */}
                {((isHourly && startDate && startTime && endTime) || (!isHourly && startDate && endDate)) && (
                  <div className={`rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${
                    isHourly ? 'bg-orange-500/10 border border-orange-500/20 text-orange-300' : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300'
                  }`}>
                    {isHourly ? (
                      <><Clock className="h-4 w-4" /> Jami: <span className="font-black text-white ml-1">{totalHours} soat</span></>
                    ) : (
                      <><Calendar className="h-4 w-4" /> Jami: <span className="font-black text-white ml-1">{totalDays} ish kuni</span></>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Order Number & Reason ── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Buyruq / Ariza №
                </label>
                <input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="T-0412/2026"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 font-mono focus:border-indigo-500 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Sabab / Izoh
                </label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Asosiy sabab..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* ── Conflict Error Banner ── */}
            {conflictError && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/40 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-300 text-xs mb-1">Davomat Ziddiyati Aniqlandi!</div>
                  <p className="text-rose-200/80 text-[11px] leading-relaxed">{conflictError}</p>
                </div>
              </div>
            )}

            {/* ── General Error ── */}
            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 text-xs text-rose-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* ── Submit Button ── */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={handleClose}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedEmp || !selectedType || !startDate}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-500/30 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saqlanmoqda...</>
                ) : (
                  <><Check className="h-4 w-4" /> Tasdiqlash va Saqlash</>
                )}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
