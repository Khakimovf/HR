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
  const [reason, setReason] = useState<string>('Ishlab chiqarish zaruriyati va ichki rotatsiya');

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
        alert('Xodim muvaffaqiyatli yangi bo\'lim va lavozimga ko\'chirildi!');
        onSuccess();
        onClose();
      } else {
        alert(`Xatolik: ${data.error}`);
      }
    } catch {
      alert('Server bilan bog\'lanishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Expanded Modal Width: max-w-4xl */}
      <div className="relative w-full max-w-4xl rounded-2xl glass-panel border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-8 py-5 bg-slate-900/80">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30">
              <ArrowLeftRight className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">Yangi Ko'chirish Buyrug'i Wizard</h3>
              <p className="text-xs text-slate-400">Xodimni yangi bo'lim va vakant lavozimga rasmiy rotatsiya qilish</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-8 py-3.5 bg-slate-950/50 text-xs font-semibold">
          <div className={`flex items-center gap-2.5 ${step >= 1 ? 'text-indigo-400' : 'text-slate-500'}`}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= 1 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40' : 'bg-slate-800 text-slate-400'}`}>1</span>
            <span className="text-sm">1. Xodimni Tanlash</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-600" />
          <div className={`flex items-center gap-2.5 ${step >= 2 ? 'text-indigo-400' : 'text-slate-500'}`}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= 2 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40' : 'bg-slate-800 text-slate-400'}`}>2</span>
            <span className="text-sm">2. Nishon Bo'lim va Lavozim</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-600" />
          <div className={`flex items-center gap-2.5 ${step >= 3 ? 'text-indigo-400' : 'text-slate-500'}`}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= 3 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40' : 'bg-slate-800 text-slate-400'}`}>3</span>
            <span className="text-sm">3. Buyruq Tafsiloti</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* STEP 1: Select Employee & View Full Details */}
          {step === 1 && (
            <div className="space-y-5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                1-Qadam: Ko'chiriladigan Xodimni Qidirib Tanlang:
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setEmpDropdownOpen(!empDropdownOpen)}
                  className="w-full flex items-center justify-between rounded-xl bg-slate-900 border border-slate-700 p-3.5 text-xs text-slate-100 text-left focus:border-indigo-500 focus:outline-none"
                >
                  <span className="truncate">
                    {selectedEmp
                      ? `[${selectedEmp.tabelNumber}] ${selectedEmp.lastName} ${selectedEmp.firstName} ${selectedEmp.middleName || ''} (${selectedEmp.currentDepartment?.name})`
                      : '-- Xodimni tanlash uchun bosing --'
                    }
                  </span>
                  <User className="h-4 w-4 text-indigo-400 ml-2 shrink-0" />
                </button>

                {empDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-64 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 space-y-1">
                    <div className="relative mb-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={empSearch}
                        onChange={(e) => setEmpSearch(e.target.value)}
                        placeholder="Tabel №, Ism, Familiya yozing..."
                        className="w-full rounded-lg bg-slate-950 border border-slate-700 py-2 pl-8 pr-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
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
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition flex items-center justify-between ${
                          selectedEmp?.id === e.id ? 'bg-indigo-600 text-white font-bold' : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <span className="font-mono text-indigo-300 mr-2">[{e.tabelNumber}]</span>
                          <span>{e.lastName} {e.firstName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate max-w-[180px]">{e.currentDepartment?.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Employee Detailed Profile Card */}
              {selectedEmp && (
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-md shadow-indigo-600/30">
                        {selectedEmp.firstName[0]}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">
                          {selectedEmp.lastName} {selectedEmp.firstName} {selectedEmp.middleName || ''}
                        </h4>
                        <span className="font-mono text-xs text-indigo-300 font-bold">
                          Tabel №: {selectedEmp.tabelNumber}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
                      ● Faol Xodim
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-indigo-500/20 text-xs">
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Hozirgi Bo'lim:</span>
                      <strong className="text-amber-400 font-semibold text-sm">
                        {selectedEmp.currentDepartment?.code ? `[${selectedEmp.currentDepartment.code}] ` : ''}
                        {selectedEmp.currentDepartment?.name}
                      </strong>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Hozirgi Lavozim:</span>
                      <strong className="text-slate-100 font-semibold text-sm">
                        {selectedEmp.positionRef?.title || selectedEmp.position}
                      </strong>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                        <GitBranch className="h-3 w-3 text-purple-400" />
                        Eskalatsiya / Rahbar:
                      </span>
                      <strong className="text-purple-300 font-semibold">
                        {selectedEmp.positionRef?.reportsToPosition?.title || "Bo'lim Boshlig'i"}
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
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                2-Qadam: Nishon Bo'lim va Ochik Vakant Lavozim Slotini Tanlang:
              </label>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  1. Nishon Bo'lim:
                </label>
                <select
                  value={targetDeptId}
                  onChange={(e) => setTargetDeptId(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Nishon Bo'limni Tanlang --</option>
                  {departments
                    .filter((d) => d.id !== selectedEmp?.currentDepartment?.id)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code ? `[${d.code}] ` : ''}{d.name} ({d._count?.employees ?? 0} kishi)
                      </option>
                    ))}
                </select>
              </div>

              {/* POSITIONS GRID IN TARGET DEPARTMENT */}
              {targetDept && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-indigo-400" />
                      2. Bo'limdagi Vakant Lavozimlar Gridi:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenDeptConfig(targetDept.id);
                      }}
                      className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      ⚙️ Yangi Lavozim/Joy Ochish
                    </button>
                  </div>

                  {targetPositions.length === 0 ? (
                    <div className="p-5 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-center text-slate-400 text-xs space-y-2">
                      <p>Ushbu bo'lim uchun hali maxsus lavozimlar sloti kiritilmagan.</p>
                      <input
                        type="text"
                        value={customPosTitle}
                        onChange={(e) => setCustomPosTitle(e.target.value)}
                        placeholder="Yangi lavozim nomini yozing (masalan: 'Katta Mutaxassis')..."
                        className="max-w-md w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-slate-100 focus:outline-none"
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
                                ? 'border-rose-500/30 bg-rose-500/5 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'border-indigo-500 bg-indigo-500/20 ring-2 ring-indigo-500/50 shadow-lg'
                                : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="font-bold text-slate-100 text-sm">{p.title}</h5>
                                {p.reportsToPosition && (
                                  <p className="text-[10px] text-purple-300 flex items-center gap-1 mt-1">
                                    <GitBranch className="h-3 w-3" />
                                    Eskalatsiya: {p.reportsToPosition.title}
                                  </p>
                                )}
                              </div>
                              <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                                isFull
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              }`}>
                                {filled} / {p.quotaLimit} shtat
                              </span>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                              {isFull ? (
                                <span className="text-rose-400 font-bold flex items-center gap-1">
                                  <ShieldAlert className="h-3.5 w-3.5" /> SHTAT TO'LIQ (0 o'rin)
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> {available} ta bo'sh o'rin mavjud
                                </span>
                              )}

                              {isSelected && (
                                <span className="text-indigo-400 font-bold text-[11px] bg-indigo-500/20 px-2 py-0.5 rounded">
                                  TANLANDI ✓
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
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                3-Qadam: Rasmiylashtirish va Buyruq Tafsiloti:
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Buyruq Raqami (Order №):</label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs font-mono text-slate-100 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Ko'chish Sanasi:</label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">Ko'chirish Asosi / Sababi:</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Masalan: Ishlab chiqarish zaruriyati, malaka oshirish yoki rotatsiya..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Transfer Final Summary Card */}
              {selectedEmp && targetDept && (
                <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-5 space-y-3 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tasdiqlash Xulosasi:</span>
                  <div className="flex items-center justify-between text-slate-100">
                    <span className="font-bold text-base">{selectedEmp.lastName} {selectedEmp.firstName}</span>
                    <span className="font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                      № {orderNumber}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Eski Joyi:</span>
                      <span className="text-rose-400 font-semibold">{selectedEmp.currentDepartment?.name} ({selectedEmp.position})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Yangi Joyi:</span>
                      <span className="text-emerald-400 font-semibold">{targetDept.name} ({selectedPos?.title || customPosTitle || selectedEmp.position})</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-8 py-5 bg-slate-900/80">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              ‹ Orqaga
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              Bekor Qilish
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              disabled={!selectedEmp}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-40 transition"
            >
              <span>Keyingisi (Nishon Bo'lim va Lavozim)</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              disabled={!targetDeptId || (!selectedPosId && !customPosTitle && targetPositions.length > 0)}
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-40 transition"
            >
              <span>Keyingisi (Buyruq)</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-7 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{submitting ? 'Rasmiylashtirilmoqda...' : 'Ko\'chirishni Tasdiqlash'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
