'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowLeftRight,
  Building,
  User,
  Search,
  CheckCircle2,
  AlertCircle,
  Settings,
  Calendar,
  FileText,
  Building2,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  Briefcase,
  GitBranch,
  UserCheck,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PositionItem {
  id: string;
  title: string;
  quotaLimit: number;
  reportsToPosition?: { id: string; title: string } | null;
  _count?: { employees: number };
}

interface DepartmentItem {
  id: string;
  name: string;
  code?: string | null;
  staffLimit?: number | null;
  positions?: PositionItem[];
  _count?: { employees: number };
}

interface EmployeeItem {
  id: string;
  tabelNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  position: string;
  positionRef?: {
    id: string;
    title: string;
    reportsToPosition?: { id: string; title: string } | null;
  } | null;
  currentDepartment: { id: string; name: string; code?: string | null };
}

interface TransferWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenDeptConfig: (deptId?: string) => void;
  preselectedEmployeeId?: string | null;
}

export const TransferWizardModal: React.FC<TransferWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenDeptConfig,
  preselectedEmployeeId,
}) => {
  const { t, language } = useLanguage();

  const [step, setStep] = useState<number>(1);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loadingEmps, setLoadingEmps] = useState<boolean>(false);

  // Form state
  const [empSearch, setEmpSearch] = useState<string>('');
  const [selectedEmp, setSelectedEmp] = useState<EmployeeItem | null>(null);
  const [targetDeptId, setTargetDeptId] = useState<string>('');
  const [selectedPosId, setSelectedPosId] = useState<string>('');
  const [customPosTitle, setCustomPosTitle] = useState<string>('');
  
  const [orderNumber, setOrderNumber] = useState<string>(`BUYRUK-TR-${Math.floor(Math.random() * 900) + 100}`);
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState<string>(language === 'kr' ? '인력 순환 및 부서 이동' : 'Ishlab chiqarish zaruriyati va ichki rotatsiya');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [empDropdownOpen, setEmpDropdownOpen] = useState<boolean>(false);

  // Target department positions state
  const [targetPositions, setTargetPositions] = useState<PositionItem[]>([]);

  // Fetch employees and departments when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setLoadingEmps(true);
      
      // Fetch employees
      fetch('/api/employees?limit=300')
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            const list: EmployeeItem[] = data.employees || [];
            setEmployees(list);

            if (preselectedEmployeeId) {
              const found = list.find((e) => e.id === preselectedEmployeeId);
              if (found) setSelectedEmp(found);
            }
          }
        })
        .finally(() => setLoadingEmps(false));

      // Fetch departments
      fetch('/api/departments')
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setDepartments(data.departments || []);
        });
    }
  }, [isOpen, preselectedEmployeeId]);

  // Fetch target department positions when targetDeptId changes
  useEffect(() => {
    if (targetDeptId) {
      setSelectedPosId('');
      setCustomPosTitle('');
      fetch(`/api/positions?departmentId=${targetDeptId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setTargetPositions(data.positions || []);
        });
    } else {
      setTargetPositions([]);
    }
  }, [targetDeptId]);

  const filteredEmployees = useMemo(() => {
    if (!empSearch) return employees.slice(0, 20);
    const q = empSearch.toLowerCase();
    return employees.filter(
      (e) =>
        e.tabelNumber.toLowerCase().includes(q) ||
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [employees, empSearch]);

  const targetDept = useMemo(() => {
    return departments.find((d) => d.id === targetDeptId) || null;
  }, [departments, targetDeptId]);

  const selectedPos = useMemo(() => {
    return targetPositions.find((p) => p.id === selectedPosId) || null;
  }, [targetPositions, selectedPosId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !targetDeptId || !orderNumber) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmp.id,
          toDepartmentId: targetDeptId,
          positionId: selectedPosId || null,
          positionTitle: selectedPos?.title || customPosTitle || selectedEmp.position,
          orderNumber,
          transferDate,
          reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(language === 'kr' ? '임직원이 성공적으로 발령 처리되었습니다!' : 'Xodim muvaffaqiyatli yangi bo\'lim va lavozimga ko\'chirildi!');
        onSuccess();
        onClose();
      } else {
        alert(`${language === 'kr' ? '오류' : 'Xatolik'}: ${data.error}`);
      }
    } catch {
      alert(language === 'kr' ? '서버 연결 중 오류가 발생했습니다.' : 'Server bilan bog\'lanishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Expanded Modal Width: max-w-4xl */}
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-8 py-5 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 dark:bg-gradient-to-br dark:from-indigo-600 dark:to-purple-600 text-white shadow-md">
              <ArrowLeftRight className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{t('transfer_modal.title', 'Yangi Ko\'chirish / Buyruq Shakllantirish')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('mobility.subtitle', 'Xodimlarning bo\'limlararo o\'tishi va lavozim o\'zgarishlari jurnali')}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-8 py-3.5 bg-slate-100/60 dark:bg-slate-950/50 text-xs font-bold">
          <div className={`flex items-center gap-2.5 ${step >= 1 ? 'text-blue-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= 1 ? 'bg-blue-600 dark:bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>1</span>
            <span className="text-sm">1. {t('transfer_modal.select_emp', 'Xodimni Tanlang')}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <div className={`flex items-center gap-2.5 ${step >= 2 ? 'text-blue-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= 2 ? 'bg-blue-600 dark:bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>2</span>
            <span className="text-sm">2. {t('transfer_modal.target_dept', "O'tkazilayotgan Yangi Bo'lim")}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <div className={`flex items-center gap-2.5 ${step >= 3 ? 'text-blue-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= 3 ? 'bg-blue-600 dark:bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>3</span>
            <span className="text-sm">3. {t('transfer_modal.order_no', 'Buyruq Raqami (№)')}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* STEP 1: Select Employee & View Full Details */}
          {step === 1 && (
            <div className="space-y-5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                1-Qadam: {t('transfer_modal.select_emp', 'Xodimni Tanlang')}:
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setEmpDropdownOpen(!empDropdownOpen)}
                  className="w-full flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-3.5 text-xs text-slate-900 dark:text-slate-100 text-left font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <span className="truncate">
                    {selectedEmp
                      ? `[${selectedEmp.tabelNumber}] ${selectedEmp.lastName} ${selectedEmp.firstName} ${selectedEmp.middleName || ''} (${selectedEmp.currentDepartment?.name})`
                      : `-- ${language === 'kr' ? '임직원을 선택하려면 클릭하세요' : "Xodimni tanlash uchun bosing"} --`
                    }
                  </span>
                  <User className="h-4 w-4 text-blue-600 dark:text-indigo-400 ml-2 shrink-0" />
                </button>

                {empDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-64 overflow-y-auto rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-2xl p-2 space-y-1">
                    <div className="relative mb-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={empSearch}
                        onChange={(e) => setEmpSearch(e.target.value)}
                        placeholder={language === 'kr' ? '사번, 성명 입력...' : 'Tabel №, Ism, Familiya yozing...'}
                        className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 py-2 pl-8 pr-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 font-medium focus:outline-none"
                        autoFocus
                      />
                    </div>
                    {filteredEmployees.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          setSelectedEmp(e);
                          setEmpDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition flex items-center justify-between cursor-pointer ${
                          selectedEmp?.id === e.id ? 'bg-blue-600 text-white font-bold' : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div>
                          <span className="font-mono text-blue-700 dark:text-indigo-300 mr-2 font-bold">[{e.tabelNumber}]</span>
                          <span>{e.lastName} {e.firstName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px] font-medium">{e.currentDepartment?.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Employee Detailed Profile Card */}
              {selectedEmp && (
                <div className="rounded-2xl border border-blue-200 dark:border-indigo-500/30 bg-blue-50/70 dark:bg-indigo-500/10 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg shadow-sm">
                        {selectedEmp.firstName[0]}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                          {selectedEmp.lastName} {selectedEmp.firstName} {selectedEmp.middleName || ''}
                        </h4>
                        <span className="font-mono text-xs text-blue-700 dark:text-indigo-300 font-bold">
                          {t('table.tabel_no', 'Tabel №')}: {selectedEmp.tabelNumber}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30">
                      ● {language === 'kr' ? '재직 중' : 'Faol Xodim'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-blue-200 dark:border-indigo-500/20 text-xs">
                    <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold">{t('transfer_modal.current_dept_pos', "Hozirgi Bo'lim va Lavozimi")}:</span>
                      <strong className="text-amber-800 dark:text-amber-400 font-bold text-sm">
                        {selectedEmp.currentDepartment?.code ? `[${selectedEmp.currentDepartment.code}] ` : ''}
                        {selectedEmp.currentDepartment?.name}
                      </strong>
                    </div>

                    <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold">{t('table.position', 'Lavozimi')}:</span>
                      <strong className="text-slate-900 dark:text-slate-100 font-bold text-sm">
                        {selectedEmp.positionRef?.title || selectedEmp.position}
                      </strong>
                    </div>

                    <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                        <GitBranch className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        {language === 'kr' ? '직속 상사:' : 'Eskalatsiya / Rahbar:'}
                      </span>
                      <strong className="text-purple-800 dark:text-purple-300 font-bold">
                        {selectedEmp.positionRef?.reportsToPosition?.title || (language === 'kr' ? '부서장' : "Bo'lim Boshlig'i")}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Select Target Department & Target Position Slots */}
          {step === 2 && (
            <div className="space-y-5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                2-Qadam: {t('transfer_modal.target_dept', "O'tkazilayotgan Yangi Bo'lim")} & {t('transfer_modal.new_pos', 'Yangi Lavozim')}:
              </label>

              <div>
                <label className="block text-[11px] text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  1. {t('transfer_modal.target_dept', "O'tkazilayotgan Yangi Bo'lim")}:
                </label>
                <select
                  value={targetDeptId}
                  onChange={(e) => setTargetDeptId(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 p-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">-- {language === 'kr' ? '발령 예정 부서를 선택하세요' : "Nishon Bo'limni Tanlang"} --</option>
                  {departments
                    .filter((d) => d.id !== selectedEmp?.currentDepartment?.id)
                    .map((d) => (
                      <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                        {d.code ? `[${d.code}] ` : ''}{d.name} ({d._count?.employees ?? 0} {language === 'kr' ? '명' : 'kishi'})
                      </option>
                    ))}
                </select>
              </div>

              {/* POSITIONS GRID IN TARGET DEPARTMENT */}
              {targetDept && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-blue-600 dark:text-indigo-400" />
                      2. {language === 'kr' ? '부서 내 공석 직위 카드:' : "Bo'limdagi Vakant Lavozimlar Gridi:"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenDeptConfig(targetDept.id);
                      }}
                      className="text-xs text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      ⚙️ {language === 'kr' ? '신규 직위 등록' : "Yangi Lavozim/Joy Ochish"}
                    </button>
                  </div>

                  {targetPositions.length === 0 ? (
                    <div className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 text-center text-slate-600 dark:text-slate-400 text-xs space-y-2 font-medium">
                      <p>{language === 'kr' ? '해당 부서에 등록된 직위 슬롯이 없습니다.' : "Ushbu bo'lim uchun hali maxsus lavozimlar sloti kiritilmagan."}</p>
                      <input
                        type="text"
                        value={customPosTitle}
                        onChange={(e) => setCustomPosTitle(e.target.value)}
                        placeholder={language === 'kr' ? '직위명을 직접 입력하세요 (예: Senior Specialist)...' : "Yangi lavozim nomini yozing (masalan: 'Katta Mutaxassis')..."}
                        className="max-w-md w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {targetPositions.map((p) => {
                        const filled = p._count?.employees ?? 0;
                        const available = Math.max(0, p.quotaLimit - filled);
                        const isFull = available === 0;
                        const isSelected = selectedPosId === p.id;

                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              if (!isFull) setSelectedPosId(p.id);
                            }}
                            className={`p-4 rounded-2xl border transition cursor-pointer select-none ${
                              isFull
                                ? 'border-rose-300 dark:border-rose-500/30 bg-rose-50/60 dark:bg-rose-500/5 opacity-70 cursor-not-allowed'
                                : isSelected
                                ? 'border-blue-600 dark:border-indigo-500 bg-blue-50 dark:bg-indigo-500/20 ring-2 ring-blue-500/50 shadow-sm'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{p.title}</h5>
                                {p.reportsToPosition && (
                                  <p className="text-[10px] text-purple-700 dark:text-purple-300 flex items-center gap-1 mt-1 font-semibold">
                                    <GitBranch className="h-3 w-3" />
                                    {language === 'kr' ? '보고 라인:' : 'Eskalatsiya:'} {p.reportsToPosition.title}
                                  </p>
                                )}
                              </div>
                              <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                                isFull
                                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/30'
                                  : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                              }`}>
                                {filled} / {p.quotaLimit} {language === 'kr' ? '명 정원' : 'shtat'}
                              </span>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                              {isFull ? (
                                <span className="text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1">
                                  <ShieldAlert className="h-3.5 w-3.5" /> {language === 'kr' ? '정원 초과 (공석 없음)' : "SHTAT TO'LIQ (0 o'rin)"}
                                </span>
                              ) : (
                                <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> {available} {language === 'kr' ? '개 공석 가능' : "ta bo'sh o'rin mavjud"}
                                </span>
                              )}

                              {isSelected && (
                                <span className="text-blue-700 dark:text-indigo-400 font-bold text-[11px] bg-blue-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded">
                                  {language === 'kr' ? '선택됨 ✓' : 'TANLANDI ✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Order Details */}
          {step === 3 && (
            <div className="space-y-5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                3-Qadam: {t('transfer_modal.order_no', 'Buyruq Raqami (№)')} & {t('transfer_modal.effective_date', 'Kuchga Kirish Sanasi')}:
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-700 dark:text-slate-300 font-bold mb-1">{t('transfer_modal.order_no', 'Buyruq Raqami (№)')}:</label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-3 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-700 dark:text-slate-300 font-bold mb-1">{t('transfer_modal.effective_date', 'Kuchga Kirish Sanasi')}:</label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-3 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-700 dark:text-slate-300 font-bold mb-1">{t('transfer_modal.reason', "Ko'chirish Asosi / Izoh")}:</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={language === 'kr' ? '발령 사유 입력 (예: 순환 근무, 승진 발령)...' : "Masalan: Ishlab chiqarish zaruriyati, malaka oshirish yoki rotatsiya..."}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-3 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Transfer Final Summary Card */}
              {selectedEmp && targetDept && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/80 p-5 space-y-3 text-xs text-slate-900 dark:text-slate-100 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">{language === 'kr' ? '발령 내역 요약:' : 'Tasdiqlash Xulosasi:'}</span>
                  <div className="flex items-center justify-between text-slate-900 dark:text-slate-100">
                    <span className="font-bold text-base">{selectedEmp.lastName} {selectedEmp.firstName}</span>
                    <span className="font-mono text-blue-700 dark:text-indigo-400 font-bold bg-blue-100 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-blue-300 dark:border-indigo-500/20">
                      № {orderNumber}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400 block text-[10px] font-semibold">{t('mobility.col_old', "Eski Bo'lim / Lavozim")}:</span>
                      <span className="text-rose-700 dark:text-rose-400 font-bold">{selectedEmp.currentDepartment?.name} ({selectedEmp.position})</span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400 block text-[10px] font-semibold">{t('mobility.col_new', "Yangi Bo'lim / Lavozim")}:</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">{targetDept.name} ({selectedPos?.title || customPosTitle || selectedEmp.position})</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-8 py-5 bg-slate-50 dark:bg-slate-900">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-xl bg-slate-200 dark:bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              ‹ {language === 'kr' ? '이전' : 'Orqaga'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-200 dark:bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              {t('transfer_modal.cancel', 'Bekor qilish')}
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              disabled={!selectedEmp}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 transition cursor-pointer"
            >
              <span>{language === 'kr' ? '다음 (발령 예정 부서 선택)' : "Keyingisi (Nishon Bo'lim va Lavozim)"}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              disabled={!targetDeptId || (!selectedPosId && !customPosTitle && targetPositions.length > 0)}
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 transition cursor-pointer"
            >
              <span>{language === 'kr' ? '다음 (발령 정보 입력)' : "Keyingisi (Buyruq)"}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-7 py-3 text-xs font-bold text-white shadow-sm disabled:opacity-50 transition cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{submitting ? (language === 'kr' ? '처리 중...' : 'Rasmiylashtirilmoqda...') : t('transfer_modal.submit', 'Saqlash va Buyruq Biriktirish')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
