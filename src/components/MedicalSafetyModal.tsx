'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  HeartPulse,
  ShieldCheck,
  Calendar,
  Building2,
  CheckCircle2,
  Loader2,
  FileText,
  Truck,
  Smartphone,
  CreditCard,
  ShieldAlert,
  Check,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MedicalSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedEmployeeId?: string;
}

export const MedicalSafetyModal: React.FC<MedicalSafetyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedEmployeeId,
}) => {
  const { t, language } = useLanguage();

  // Employee search
  const [empSearch, setEmpSearch]       = useState('');
  const [empResults, setEmpResults]     = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp]   = useState<any>(null);
  const [empLoading, setEmpLoading]     = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Form fields
  const [checkupDate, setCheckupDate]     = useState(new Date().toISOString().split('T')[0]);
  const [validityMonths, setValidityMonths] = useState('12');
  const [clinicName, setClinicName]       = useState("Toshkent Shoshilinch Tibbiy Markazi #4");

  // Safety Permits
  const [hasForklift, setHasForklift]     = useState(false);
  const [hasPhonePermit, setHasPhonePermit] = useState(false);
  const [driverLicense, setDriverLicense] = useState('');
  const [militaryCard, setMilitaryCard]   = useState('');

  // Submit state
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (preselectedEmployeeId && isOpen) {
      fetch(`/api/employees/${preselectedEmployeeId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.employee) {
            setSelectedEmp(d.employee);
          }
        });
    }
  }, [preselectedEmployeeId, isOpen]);

  // Debounced search
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
    setCheckupDate(new Date().toISOString().split('T')[0]);
    setValidityMonths('12');
    setClinicName("Toshkent Shoshilinch Tibbiy Markazi #4");
    setHasForklift(false);
    setHasPhonePermit(false);
    setDriverLicense('');
    setMilitaryCard('');
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedEmp) {
      setError(language === 'kr' ? '대상 임직원을 선택하세요' : "Xodim tanlanmagan");
      return;
    }
    setError('');
    setLoading(true);

    try {
      // 1. Save Medical Checkup
      const medRes = await fetch('/api/hse/medical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds: [selectedEmp.id],
          checkupDate,
          validityMonths,
          status: "O'TGAN",
          clinicName,
          orderRef: `MED-${new Date().getFullYear()}-EDIT`,
        }),
      });

      // 2. Save Safety Permits / Employee updates if needed
      await fetch(`/api/employees/${selectedEmp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasForkliftPermit: hasForklift,
          hasPhonePermit: hasPhonePermit,
          driverLicenseNumber: driverLicense || undefined,
          militaryCardNumber: militaryCard || undefined,
        }),
      }).catch(() => {});

      const data = await medRes.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1200);
      } else {
        setError(data.error || (language === 'kr' ? '저장 실패' : "Saqlashda xatolik"));
      }
    } catch {
      setError(language === 'kr' ? '네트워크 오류가 발생했습니다.' : "Tarmoq xatoligi");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('med_modal.title', "Med-ko'rik va Ruxsatnomalarni Tahrirlash")}
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                {t('hse.title', "Mehnat Muhofazasi va Tibbiy Ko'rik (HSE)")}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-12 text-center space-y-3">
            <div className="flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{language === 'kr' ? '성공적으로 저장되었습니다!' : 'Muvaffaqiyatli saqlandi!'}</p>
          </div>
        ) : (
          <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
            {/* Employee Search */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                {t('med_modal.select_emp', 'Xodimni Tanlang')} *
              </label>
              {selectedEmp ? (
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                      {selectedEmp.firstName?.[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {selectedEmp.lastName} {selectedEmp.firstName}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">[{selectedEmp.tabelNumber}]</span> • {selectedEmp.position}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedEmp(null)} className="text-slate-500 hover:text-rose-600 transition cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                      placeholder={language === 'kr' ? '성명 또는 사원번호 검색...' : "Tabel raqami yoki F.I.O..."}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                    />
                    {empLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 animate-spin" />}
                  </div>
                  {showDropdown && empResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden">
                      {empResults.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => { setSelectedEmp(emp); setEmpSearch(''); setShowDropdown(false); }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                        >
                          <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {emp.firstName?.[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{emp.lastName} {emp.firstName}</div>
                            <div className="text-[10px] text-slate-500 font-medium">[{emp.tabelNumber}] • {emp.currentDepartment?.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Medical Checkup Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1 block">
                  {t('med_modal.checkup_date', "Tibbiy Ko'rikdan O'tgan Sana")}
                </label>
                <input
                  type="date"
                  value={checkupDate}
                  onChange={(e) => setCheckupDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1 block">
                  {t('med_modal.next_date', "Keyingi Ko'rik Muddati (Amal qilish sanasi)")}
                </label>
                <select
                  value={validityMonths}
                  onChange={(e) => setValidityMonths(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition cursor-pointer"
                >
                  <option value="6" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">6 oy (Har 6 oyda)</option>
                  <option value="12" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">12 oy (1 yil)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1 block">
                {t('med_modal.clinic_notes', "Tibbiy Muassasa Xulosasi / Bino №")}
              </label>
              <input
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
              />
            </div>

            {/* Safety Permits Checkboxes & Texts */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                {t('hse.col_permits', "Maxsus Ruxsatnomalar")}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${hasForklift ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-300 text-purple-900 dark:text-purple-300 font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                  <input type="checkbox" checked={hasForklift} onChange={(e) => setHasForklift(e.target.checked)} className="rounded border-slate-300 text-purple-600 focus:ring-0 h-4 w-4" />
                  <Truck className="h-4 w-4 text-purple-600" />
                  <span className="text-xs">{t('med_modal.forklift_has', "Kara Minish Ruxsatnomasi Bor")}</span>
                </label>

                <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${hasPhonePermit ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 text-blue-900 dark:text-blue-300 font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                  <input type="checkbox" checked={hasPhonePermit} onChange={(e) => setHasPhonePermit(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-0 h-4 w-4" />
                  <Smartphone className="h-4 w-4 text-blue-600" />
                  <span className="text-xs">{t('med_modal.phone_has', "Telefon Ishlatish Ruxsatnomasi Bor")}</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    {t('med_modal.driver_no', "Haydovchilik Guvohnomasi Seriya va №")}
                  </label>
                  <input
                    value={driverLicense}
                    onChange={(e) => setDriverLicense(e.target.value)}
                    placeholder="AA 1234567"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    {t('med_modal.military_no', "Harbiy Guvohnoma Raqami va Matn")}
                  </label>
                  <input
                    value={militaryCard}
                    onChange={(e) => setMilitaryCard(e.target.value)}
                    placeholder="HB-987654"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-300 px-4 py-2 text-xs font-bold text-rose-800">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleClose}
                className="rounded-xl bg-slate-200 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {t('med_modal.cancel', 'Bekor qilish')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedEmp}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 text-xs font-bold shadow-sm disabled:opacity-40 transition active:scale-95 cursor-pointer"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {t('med_modal.save', 'Saqlash')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
