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
  UserCheck,
} from 'lucide-react';
import { APPROVAL_STEPS_CONFIG } from '@/lib/leaveConfig';
import { useLanguage } from '@/contexts/LanguageContext';

interface LeaveRequestWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departments?: Array<{ id: string; name: string }>;
}

export const LeaveRequestWizardModal: React.FC<LeaveRequestWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t, language } = useLanguage();

  const LEAVE_REQUEST_TYPES = [
    {
      id: 'BS_UNPAID',
      label: t('app_modal.type_unpaid', "O'z hisobidan ta'til (B/S)"),
      short: 'B/S',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
      desc: language === 'kr' ? '무급 휴가 (개인 사유 및 무급)' : "Ish haqi saqlanmagan holda oilaviy sharoitlarga ko'ra ta'til",
    },
    {
      id: 'MEHNAT_TATILI',
      label: t('app_modal.type_annual', "Mehnat ta'tili arizasi"),
      short: 'M/T',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border-blue-300 dark:border-blue-500/30',
      desc: language === 'kr' ? '연차 유급 휴가 (계획 일정 기준)' : "Yillik haq to'lanadigan mehnat ta'tili jadval bo'yicha",
    },
    {
      id: 'SICK_LEAVE_BL',
      label: t('app_modal.type_sick', 'Vaqtincha layoqatsizlik (B/L)'),
      short: 'B/L',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border-rose-300 dark:border-rose-500/30',
      desc: language === 'kr' ? '진단서 및 병가에 따른 휴가' : "Tibbiy ma'lumotnoma va kasallik varaqasi asosidagi ta'til",
    },
    {
      id: 'HOURLY_PERMIT',
      label: t('app_modal.type_study', "O'qish ta'tili arizasi"),
      short: 'RUX',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
      desc: language === 'kr' ? '교육 및 시험 참가에 따른 공가' : "Smena davomidagi 1-4 soatlik xizmat yoki shaxsiy ruxsatnoma",
    },
  ];

  const [employees, setEmployees] = useState<any[]>([]);
  const [searchEmp, setSearchEmp] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [type, setType] = useState('BS_UNPAID');
  const [step3ApproverType, setStep3ApproverType] = useState<'TEXNIK_DIREKTOR' | 'BOSHQARMA_BOSHLIGI'>('TEXNIK_DIREKTOR');
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
      setErrorMsg(language === 'kr' ? '신청자 임직원을 선택하세요.' : "Iltimos, arizachi xodimlarni tanlang!");
      return;
    }
    if (!startDate || !endDate) {
      setErrorMsg(language === 'kr' ? '시작일과 종료일을 선택하세요.' : "Boshlanish va tugash sanalarini tanlang!");
      return;
    }
    if (!reason || reason.trim().length < 5) {
      setErrorMsg(language === 'kr' ? '신청 사유를 최소 5자 이상 입력하세요.' : "Ariza sababi batafsil kiritilishi shart (kamida 5 belgi)!");
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
          step3ApproverType,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/90">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-indigo-600/20 border border-blue-200 dark:border-indigo-500/30 flex items-center justify-center text-blue-600 dark:text-indigo-400 font-bold">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {t('app_modal.title', 'Yangi Ariza Shakllantirish')}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/20">
                  {language === 'kr' ? '6단계 결재 라인' : '6-Bosqichli Ish Oqimi'}
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {language === 'kr' ? '전자 결재 신청서 작성 및 결재권자 승인 요청' : 'Elektron ariza yozish va rahbarlar tasdiqlashiga yuborish'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3 text-xs text-rose-800 dark:text-rose-400 font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Employee Selection & Auto-fill Details */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-blue-600 dark:text-indigo-400" />
              1. {t('workflow.col_applicant', 'F.I.O (Ariza beruvchi)')}
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Employee selector */}
              <div>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 mb-1 block font-medium">
                  {language === 'kr' ? '임직원 검색 및 선택:' : 'Xodimlardan Qidirish / Tanlash:'}
                </span>
                <input
                  type="text"
                  placeholder={language === 'kr' ? '성명 또는 사원번호...' : "Ism yoki tabel № bo'yicha..."}
                  value={searchEmp}
                  onChange={(e) => setSearchEmp(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 mb-2 focus:border-blue-500 focus:outline-none"
                />
                <select
                  value={selectedEmp?.id || ''}
                  onChange={(e) => {
                    const emp = employees.find((x) => x.id === e.target.value);
                    if (emp) setSelectedEmp(emp);
                  }}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none font-medium cursor-pointer"
                >
                  {loadingEmps ? (
                    <option>{language === 'kr' ? '불러오는 중...' : 'Yuklanmoqda...'}</option>
                  ) : (
                    filteredEmps.map((emp) => (
                      <option key={emp.id} value={emp.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                        [{emp.tabelNumber}] {emp.lastName} {emp.firstName} — {emp.position}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Auto-filled details card */}
              {selectedEmp && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3 space-y-1.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="font-mono text-blue-600 dark:text-indigo-400 font-bold">[{selectedEmp.tabelNumber}]</span>
                    {selectedEmp.lastName} {selectedEmp.firstName} {selectedEmp.middleName || ''}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
                    <Building2 className="h-3 w-3 text-slate-500" />
                    <span className="truncate">{selectedEmp.currentDepartment?.name || "Bo'lim ko'rsatilmadi"}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
                    <Briefcase className="h-3 w-3 text-slate-500" />
                    <span>{selectedEmp.position}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Leave Type Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-indigo-400" />
              2. {t('app_modal.type_and_reason', 'Ariza Turi va Sababi')}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {LEAVE_REQUEST_TYPES.map((lt) => (
                <div
                  key={lt.id}
                  onClick={() => setType(lt.id)}
                  className={`cursor-pointer rounded-xl border p-3 transition-all ${
                    type === lt.id
                      ? 'border-blue-500 dark:border-indigo-500 bg-blue-50 dark:bg-indigo-500/10 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{lt.label}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${lt.badgeClass}`}>
                      {lt.short}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{lt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Dates & Duration */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-indigo-400" />
              3. {language === 'kr' ? '휴가 기간 (시작일 및 종료일)' : "Ta'til Muddati (Boshlanish va Tugash)"}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 mb-1 block font-medium">{t('app_modal.start_date', "Ta'til Boshlanish Sanasi")}:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none font-medium"
                  required
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 mb-1 block font-medium">{t('app_modal.end_date', 'Tugash Sanasi')}:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none font-medium"
                  required
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 mb-1 block font-medium">{t('app_modal.total_days', 'Jami Kunlar Soni')}:</span>
                <div className="h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 flex items-center justify-between font-mono font-bold text-blue-600 dark:text-amber-400 text-xs">
                  <span>{computedDays > 0 ? `${computedDays} ${language === 'kr' ? '일' : 'kun'}` : '—'}</span>
                  <Clock className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Reason text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              4. {t('app_modal.reason', 'Ariza Mazmuni / Asos')}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={language === 'kr' ? '예: 개인 사정에 의해 3일간 무급 휴가를 신청합니다...' : "Masalan: Oilaviy sharoitlarga ko'ra 3 kun ish haqisiz ta'til berishingizni so'rayman..."}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:outline-none font-medium"
              required
            />
          </div>

          {/* Step 5: Dynamic Step 3 Approver Selection */}
          <div className="space-y-2 rounded-xl border border-blue-200 dark:border-indigo-500/30 bg-slate-50 dark:bg-slate-950/60 p-4">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-blue-600 dark:text-indigo-400" />
              5. {t('app_modal.step3_approver', '3-Bosqich Tasdiqlovchi Rahbarni Tanlang:')}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label
                onClick={() => setStep3ApproverType('TEXNIK_DIREKTOR')}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  step3ApproverType === 'TEXNIK_DIREKTOR'
                    ? 'border-blue-500 dark:border-indigo-500 bg-blue-100/60 dark:bg-indigo-500/15 text-slate-900 dark:text-white font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="step3Approver"
                  checked={step3ApproverType === 'TEXNIK_DIREKTOR'}
                  onChange={() => setStep3ApproverType('TEXNIK_DIREKTOR')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">🔘 {t('app_modal.approver_cto', 'Texnik Direktor')}</div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{language === 'kr' ? '생산 및 기술 이사 승인' : "Sanoat va texnik yo'nalish rahbarligi"}</div>
                </div>
              </label>

              <label
                onClick={() => setStep3ApproverType('BOSHQARMA_BOSHLIGI')}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  step3ApproverType === 'BOSHQARMA_BOSHLIGI'
                    ? 'border-cyan-500 dark:border-cyan-500 bg-cyan-100/60 dark:bg-cyan-500/15 text-slate-900 dark:text-white font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="step3Approver"
                  checked={step3ApproverType === 'BOSHQARMA_BOSHLIGI'}
                  onChange={() => setStep3ApproverType('BOSHQARMA_BOSHLIGI')}
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">🔘 {t('app_modal.approver_head', "Boshqarma Boshlig'i")}</div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{language === 'kr' ? '본부장 및 부서장 승인' : "Tarkibiy boshqarma va sexlar boshlig'i"}</div>
                </div>
              </label>
            </div>
          </div>

          {/* Step 6: Visual Approval Workflow Preview */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-2">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {t('app_modal.stepper_title', '6-Bosqichli Avtomatik Imzolash Marshruti')} (Preview):
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {APPROVAL_STEPS_CONFIG.map((st) => {
                let stepLabel = t(`app_modal.step${st.stepNumber}`, st.label);
                if (st.stepNumber === 3) {
                  stepLabel = step3ApproverType === 'BOSHQARMA_BOSHLIGI' ? t('app_modal.approver_head', "Boshqarma Boshlig'i") : t('app_modal.approver_cto', "Texnik Direktor");
                }
                return (
                  <div
                    key={st.stepNumber}
                    className={`rounded-lg border p-2 text-center text-[10px] transition ${
                      st.stepNumber === 3 ? 'border-blue-500 dark:border-indigo-500 bg-blue-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="font-mono font-bold text-blue-600 dark:text-indigo-400">#{st.stepNumber}</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate mt-0.5">{stepLabel}</div>
                    <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-1">{language === 'kr' ? '대기' : 'Kutilmoqda'}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              {t('app_modal.cancel', 'Bekor qilish')}
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 shadow-sm active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {language === 'kr' ? '제출 중...' : 'Yuborilmoqda...'}
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4" />
                  {t('app_modal.submit', 'Arizani Yuborish')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
