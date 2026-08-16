'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Settings,
  PlusCircle,
  TrendingUp,
  Building2,
  CheckCircle2,
  FileText,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Users,
  Briefcase,
  GitBranch,
  Edit2,
  Save,
} from 'lucide-react';

interface PositionItem {
  id: string;
  title: string;
  quotaLimit: number;
  reportsToPositionId?: string | null;
  reportsToPosition?: { id: string; title: string } | null;
  _count?: { employees: number };
}

interface DepartmentItem {
  id: string;
  name: string;
  code?: string | null;
  staffLimit?: number | null;
  parentId?: string | null;
  positions?: PositionItem[];
  _count?: { employees: number };
}

interface DepartmentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDepartmentId?: string | null;
}

export const DepartmentConfigModal: React.FC<DepartmentConfigModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultDepartmentId,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'quota' | 'positions'>('create');
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loadingDepts, setLoadingDepts] = useState<boolean>(false);

  // Tab A: Create Dept State (Code is OPTIONAL)
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [parentId, setParentId] = useState<string>('');
  const [initialLimit, setInitialLimit] = useState<number>(25);
  const [createOrderNo, setCreateOrderNo] = useState<string>(`BUYRUK-DEPT-${Math.floor(Math.random() * 900) + 100}`);
  const [description, setDescription] = useState<string>('');

  // Tab B: Dept Quota State
  const [targetDeptId, setTargetDeptId] = useState<string>(defaultDepartmentId || '');
  const [newQuotaLimit, setNewQuotaLimit] = useState<number>(30);
  const [quotaOrderNo, setQuotaOrderNo] = useState<string>(`BUYRUK-QUOTA-${Math.floor(Math.random() * 900) + 100}`);
  const [quotaReason, setQuotaReason] = useState<string>('Shtat kengayishi va yangi bo\'sh o\'rinlar ochish');

  // Tab C: Position Management State
  const [posDeptId, setPosDeptId] = useState<string>(defaultDepartmentId || '');
  const [deptPositions, setDeptPositions] = useState<PositionItem[]>([]);
  const [posTitle, setPosTitle] = useState<string>('');
  const [posQuota, setPosQuota] = useState<number>(3);
  const [posReportsTo, setPosReportsTo] = useState<string>('');
  const [editingPosId, setEditingPosId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchDepts = () => {
    setLoadingDepts(true);
    fetch('/api/departments')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const list: DepartmentItem[] = data.departments || [];
          setDepartments(list);

          if (defaultDepartmentId) {
            const found = list.find((d) => d.id === defaultDepartmentId);
            if (found) {
              setTargetDeptId(found.id);
              setPosDeptId(found.id);
              const activeCount = found._count?.employees ?? 0;
              const curLimit = found.staffLimit ?? Math.ceil(activeCount * 1.12) + 2;
              setNewQuotaLimit(curLimit + 5);
            }
          }
        }
      })
      .finally(() => setLoadingDepts(false));
  };

  const fetchPositionsForDept = (deptId: string) => {
    if (!deptId) {
      setDeptPositions([]);
      return;
    }
    fetch(`/api/positions?departmentId=${deptId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setDeptPositions(data.positions || []);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchDepts();
      if (defaultDepartmentId) {
        setActiveTab('positions');
        fetchPositionsForDept(defaultDepartmentId);
      }
    }
  }, [isOpen, defaultDepartmentId]);

  useEffect(() => {
    if (posDeptId) {
      fetchPositionsForDept(posDeptId);
    }
  }, [posDeptId]);

  const targetDept = useMemo(() => {
    return departments.find((d) => d.id === targetDeptId) || null;
  }, [departments, targetDeptId]);

  if (!isOpen) return null;

  // Handle Tab A: Create Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !name.trim()) {
      alert('Bo\'lim nomi majburiy!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim() || undefined, // Optional!
          name: name.trim(),
          parentId: parentId || null,
          staffLimit: initialLimit,
          description: `${description} (Buyruq № ${createOrderNo})`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Yangi bo\'lim muvaffaqiyatli tashkil etildi!');
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

  // Handle Tab B: Quota Adjustment
  const handleUpdateQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDeptId || !newQuotaLimit) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/departments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: targetDeptId,
          staffLimit: newQuotaLimit,
          orderNumber: quotaOrderNo,
          reason: quotaReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Shtat limiti muvaffaqiyatli oshirildi!');
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

  // Handle Tab C: Add or Update Position
  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posDeptId || !posTitle.trim()) {
      alert('Bo\'lim va lavozim nomini kiriting!');
      return;
    }

    setSubmitting(true);
    try {
      const method = editingPosId ? 'PUT' : 'POST';
      const bodyPayload = editingPosId
        ? { id: editingPosId, title: posTitle, quotaLimit: posQuota, reportsToPositionId: posReportsTo }
        : { departmentId: posDeptId, title: posTitle, quotaLimit: posQuota, reportsToPositionId: posReportsTo };

      const res = await fetch('/api/positions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Lavozim saqlandi!');
        setPosTitle('');
        setEditingPosId(null);
        fetchPositionsForDept(posDeptId);
        fetchDepts();
      } else {
        alert(`Xatolik: ${data.error}`);
      }
    } catch {
      alert('Server bilan bog\'lanishda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditPosition = (pos: PositionItem) => {
    setEditingPosId(pos.id);
    setPosTitle(pos.title);
    setPosQuota(pos.quotaLimit);
    setPosReportsTo(pos.reportsToPositionId || '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-100 dark:bg-slate-800/90">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-600/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 font-bold">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Bo'lim va Lavozim Sozlamalari</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Tashkiliy ierarxiya, lavozimlar va shtat kvotalarini boshqarish</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-6 pt-3 gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'create'
                ? 'border-blue-600 text-blue-700 dark:text-indigo-400 bg-blue-50 dark:bg-indigo-500/10 rounded-t-xl'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Yangi Bo'lim Ochish</span>
          </button>

          <button
            onClick={() => setActiveTab('positions')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'positions'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 rounded-t-xl'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Lavozimlar & Eskalatsiya</span>
          </button>

          <button
            onClick={() => setActiveTab('quota')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'quota'
                ? 'border-amber-600 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-t-xl'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Bo'lim Shtat Limiti</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB A: Create Department */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateDepartment} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                    Bo'lim Nomi: *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masalan: Logistika va Ekspeditziya Bo'limi..."
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                    Bo'lim Kodi (Ixtiyoriy - Auto-generate):
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Avto-yaratiladi (masalan: DEPT-842)"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                    Yuqori Bo'lim (Parent Structure):
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Yuqori Bo'limni Tanlang (Direksiya) --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                        {d.code ? `[${d.code}] ` : ''}{d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                    Boshlang'ich Shtat Limiti:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={initialLimit}
                    onChange={(e) => setInitialLimit(Number(e.target.value))}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 text-slate-900 dark:text-slate-100 font-mono font-bold focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                  Buyruq Raqami (Order №):
                </label>
                <input
                  type="text"
                  value={createOrderNo}
                  onChange={(e) => setCreateOrderNo(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 text-slate-900 dark:text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                  Izoh / Bo'lim vazifasi:
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Bo'lim tashkil etilish maqsadi..."
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 font-bold text-white shadow-sm disabled:opacity-50 transition"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  <span>Yangi Bo'limni Saqlash</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB B: Position Management & Reporting Escalation */}
          {activeTab === 'positions' && (
            <div className="space-y-5 text-xs font-medium">
              <div>
                <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                  Lavozimlar Boshqariladigan Bo'limni Tanlang:
                </label>
                <select
                  value={posDeptId}
                  onChange={(e) => setPosDeptId(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Bo'limni Tanlang --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {d.code ? `[${d.code}] ` : ''}{d.name} ({d._count?.employees ?? 0} xodim)
                    </option>
                  ))}
                </select>
              </div>

              {/* Add / Edit Position Form */}
              {posDeptId && (
                <form onSubmit={handleSavePosition} className="rounded-xl border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      {editingPosId ? 'Lavozimni Tahrirlash' : 'Yangi Lavozim Qo\'shish'}
                    </span>
                    {editingPosId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPosId(null);
                          setPosTitle('');
                        }}
                        className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline"
                      >
                        Bekor qilish
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                        Lavozim Nomi (masalan: "Seksiya Boshlig'i", "Ekspeditor"):
                      </label>
                      <input
                        type="text"
                        value={posTitle}
                        onChange={(e) => setPosTitle(e.target.value)}
                        placeholder="Ekspeditor, Bo'linma Boshlig'i..."
                        className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                        Shtat Kvota Limiti:
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={posQuota}
                        onChange={(e) => setPosQuota(Number(e.target.value))}
                        className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 text-purple-700 dark:text-purple-300 font-mono font-bold focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                      Hisobot Beradigan Rahbar Lavozim (Eskalatsiya):
                    </label>
                    <select
                      value={posReportsTo}
                      onChange={(e) => setPosReportsTo(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none font-medium"
                    >
                      <option value="">-- Rahbar Lavozimi Yo'q (Bo'lim Boshlig'i) --</option>
                      {deptPositions
                        .filter((p) => p.id !== editingPosId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p._count?.employees ?? 0}/{p.quotaLimit} shtat)
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2 font-bold text-white shadow-sm disabled:opacity-50 transition"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      <span>{editingPosId ? 'Lavozimni Yangilash' : 'Lavozimni Qo\'shish'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Positions List */}
              {posDeptId && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                    Bo'limdagi Mavjud Lavozimlar ({deptPositions.length} ta):
                  </h4>

                  {deptPositions.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-slate-500 font-medium">
                      Ushbu bo'limda hali lavozimlar kiritilmagan. Yuqoridagi formadan qo'shing.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {deptPositions.map((p) => {
                        const filled = p._count?.employees ?? 0;
                        const isFull = filled >= p.quotaLimit;
                        return (
                          <div
                            key={p.id}
                            className={`p-3 rounded-xl border flex items-center justify-between transition shadow-sm ${
                              isFull
                                ? 'border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/5'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-slate-100">{p.title}</span>
                              </div>
                              {p.reportsToPosition && (
                                <p className="text-[10px] text-purple-700 dark:text-purple-400 font-bold flex items-center gap-1 mt-0.5">
                                  <GitBranch className="h-3 w-3" />
                                  Eskalatsiya: {p.reportsToPosition.title}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${
                                isFull
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border-rose-300 dark:border-rose-500/30'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                              }`}>
                                {filled} / {p.quotaLimit} shtat
                              </span>
                              <button
                                type="button"
                                onClick={() => startEditPosition(p)}
                                className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Tahrirlash"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
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

          {/* TAB C: Quota Adjustment */}
          {activeTab === 'quota' && (
            <form onSubmit={handleUpdateQuota} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                  Shtat Limiti Oshiriladigan Bo'limni Tanlang:
                </label>
                <select
                  value={targetDeptId}
                  onChange={(e) => setTargetDeptId(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- Bo'limni Tanlang --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {d.code ? `[${d.code}] ` : ''}{d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Status Preview */}
              {targetDept && (
                <div className="rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-800 dark:text-amber-300">{targetDept.name}</span>
                    <span className="font-mono text-xs font-bold text-amber-900 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-500/30">
                      Amaldagi ishchilar: {targetDept._count?.employees ?? 0} kishi
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-300 font-medium">
                    Joriy Limit: <strong className="text-slate-900 dark:text-white font-mono font-bold">{targetDept.staffLimit ?? Math.ceil((targetDept._count?.employees ?? 0) * 1.12) + 2} ta</strong>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                    Yangi Shtat Limiti (Quota Count):
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newQuotaLimit}
                    onChange={(e) => setNewQuotaLimit(Number(e.target.value))}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 text-blue-700 dark:text-indigo-400 font-mono font-bold focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                    Buyruq Raqami (Audit Order №):
                  </label>
                  <input
                    type="text"
                    value={quotaOrderNo}
                    onChange={(e) => setQuotaOrderNo(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 text-slate-900 dark:text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                  Shtat Kengaytirish Asosi / Sababi:
                </label>
                <textarea
                  rows={2}
                  value={quotaReason}
                  onChange={(e) => setQuotaReason(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting || !targetDeptId}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2 font-bold text-white shadow-sm disabled:opacity-50 transition"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                  <span>Shtat Limitini Oshirishni Tasdiqlash</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
