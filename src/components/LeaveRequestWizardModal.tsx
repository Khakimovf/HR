'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileCheck,
  User,
  Calendar,
  Clock,
  Building2,
  Briefcase,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { APPROVAL_STEPS_CONFIG } from '@/lib/leaveConfig';

interface LeaveRequestWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departments?: Array<{ id: string; name: string }>;
}

export const LEAVE_REQUEST_TYPES = [
  {
    id: 'BS_UNPAID',
    label: "Harajatsiz Ta'til (B/S - O'z Hisobidan)",
    short: 'B/S',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    desc: "Ish haqi saqlanmagan holda oilaviy sharoitlarga ko'ra ta'til",
  },
  {
    id: 'MEHNAT_TATILI',
    label: "Mehnat Ta'tili (M/T - Yillik)",
    short: 'M/T',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    desc: "Yillik haq to'lanadigan mehnat ta'tili jadval bo'yicha",
  },
  {
    id: 'SICK_LEAVE_BL',
    label: "Kasallik Varag'i (B/L - Mehnat Qobiliyatsizligi)",
    short: 'B/L',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    desc: "Tibbiy ma'lumotnoma va kasallik varaqasi asosidagi ta'til",
  },
  {
    id: 'HOURLY_PERMIT',
    label: "Soatbay Ruxsatnoma (Kechikish / Erta Ketish)",
    short: 'RUX',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    desc: "Smena davomidagi 1-4 soatlik xizmat yoki shaxsiy ruxsatnoma",
  },
];

export const LeaveRequestWizardModal: React.FC<LeaveRequestWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchEmp, setSearchEmp] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [type, setType] = useState('BS_UNPAID');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loadingEmps, setLoadingEmps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch employee candidates for dropdown
  useEffect(() => {
    if (isOpen) {
      setLoadingEmps(true);
      fetch('/api/employees?limit=200')
        .then((res) => res.json())
        .then((data) => {
          if (data.employees) {
            setEmployees(data.employees);
            if (data.employees.length > 0 && !selectedEmp) {
              setSelectedEmp(data.employees[0]);
            }
          }
        })
        .finally(() => setLoadingEmps(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Auto calculate total days
  let computedDays = 0;
  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e >= s) {
      const diffTime = Math.abs(e.getTime() - s.getTime());
      computedDays = Math.max(1, Math.ceil(diffTime / (1000 * 3600 * 24)) + 1);
    }
  }

  const filteredEmps = employees.filter(
    (emp) =>
      emp.firstName.toLowerCase().includes(searchEmp.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchEmp.toLowerCase()) ||
      emp.tabelNumber.toLowerCase().includes(searchEmp.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) {
      setErrorMsg("Iltimos, arizachi xodimlarni tanlang!");
      return;
    }
    if (!startDate || !endDate) {
      setErrorMsg("Boshlanish va tugash sanalarini tanlang!");
      return;
    }
    if (!reason || reason.trim().length < 5) {
      setErrorMsg("Ariza sababi batafsil kiritilishi shart (kamida 5 belgi)!");
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmp.id,
          type,
          startDate,
          endDate,
          totalDays: computedDays,
          reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || "Ariza yuborishda xatolik yuz berdi");
      }
    } catch (err: any) {
      setErrorMsg("Tarmoq xatoligi: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl glass-panel rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Yangi BS / Ta'til Arizasini Shakllantirish
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  6-Bosqichli Ish Oqimi
                </span>
              </h3>
              <p className="text-xs text-slate-400">Elektron ariza yozish va rahbarlar tasdiqlashiga yuborish</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Employee Selection & Auto-fill Details */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-indigo-400" />
              1. Arizachi Xodim (Auto-fill)
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Employee selector */}
              <div>
                <span className="text-[11px] text-slate-400 mb-1 block">Xodimlardan Qidirish / Tanlash:</span>
                <input
                  type="text"
                  placeholder="Ism yoki tabel № bo'yicha..."
                  value={searchEmp}
                  onChange={(e) => setSearchEmp(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 mb-2 focus:border-indigo-500 focus:outline-none"
                />
                <select
                  value={selectedEmp?.id || ''}
                  onChange={(e) => {
                    const emp = employees.find((x) => x.id === e.target.value);
                    if (emp) setSelectedEmp(emp);
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  {loadingEmps ? (
                    <option>Yuklanmoqda...</option>
                  ) : (
                    filteredEmps.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        [{emp.tabelNumber}] {emp.lastName} {emp.firstName} — {emp.position}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Auto-filled details card */}
              {selectedEmp && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="font-mono text-indigo-400">[{selectedEmp.tabelNumber}]</span>
                    {selectedEmp.lastName} {selectedEmp.firstName} {selectedEmp.middleName || ''}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <Building2 className="h-3 w-3 text-slate-500" />
                    <span className="truncate">{selectedEmp.currentDepartment?.name || "Bo'lim ko'rsatilmadi"}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <Briefcase className="h-3 w-3 text-slate-500" />
                    <span>{selectedEmp.position}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Leave Type Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              2. Ariza va Ta'til Turi
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {LEAVE_REQUEST_TYPES.map((lt) => (
                <div
                  key={lt.id}
                  onClick={() => setType(lt.id)}
                  className={`cursor-pointer rounded-xl border p-3 transition-all ${
                    type === lt.id
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{lt.label}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${lt.badgeClass}`}>
                      {lt.short}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{lt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Dates & Duration */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              3. Ta'til Muddati (Boshlanish va Tugash)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-slate-400 mb-1 block">Boshlanish Sanasi:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-400 mb-1 block">Tugash Sanasi:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-400 mb-1 block">Jami Kunlar:</span>
                <div className="h-9 rounded-xl border border-slate-800 bg-slate-950/80 px-3 flex items-center justify-between font-mono font-bold text-amber-400 text-xs">
                  <span>{computedDays > 0 ? `${computedDays} kun` : '—'}</span>
                  <Clock className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Reason text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              4. Ariza Sababi va Izohi
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masalan: Oilaviy sharoitlarga ko'ra 3 kun ish haqisiz ta'til berishingizni so'rayman..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Step 5: Visual Approval Workflow Preview */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              6-Bosqichli Avtomatik Imzolash Marshruti:
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {APPROVAL_STEPS_CONFIG.map((st) => (
                <div
                  key={st.stepNumber}
                  className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-center text-[10px]"
                >
                  <div className="font-mono font-bold text-indigo-400">#{st.stepNumber}</div>
                  <div className="font-semibold text-slate-300 truncate mt-0.5">{st.label}</div>
                  <div className="text-[9px] text-amber-400/80 mt-1">Kutilmoqda</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              Bekor qilish
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Yuborilmoqda...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4" />
                  Arizani Yuborish (Bosqich 1 ga)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
