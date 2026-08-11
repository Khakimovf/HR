'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeftRight,
  PlusCircle,
  Settings,
  Search,
  Filter,
  RotateCcw,
  Building2,
  Calendar,
  FileText,
  User,
  Loader2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { TransferWizardModal } from '@/components/TransferWizardModal';
import { DepartmentConfigModal } from '@/components/DepartmentConfigModal';

interface DepartmentItem {
  id: string;
  name: string;
  code: string;
}

interface TransferRecord {
  id: string;
  orderNumber: string;
  transferDate: string;
  reason?: string | null;
  employee?: {
    id: string;
    tabelNumber: string;
    firstName: string;
    lastName: string;
  };
  fromDepartment?: {
    id: string;
    name: string;
    code: string;
  };
  toDepartment?: {
    id: string;
    name: string;
    code: string;
  };
}

export const InternalMobilityView: React.FC = () => {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters State
  const [searchVal, setSearchVal] = useState<string>('');
  const [fromDeptId, setFromDeptId] = useState<string>('');
  const [toDeptId, setToDeptId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Modals State
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [configDeptId, setConfigDeptId] = useState<string | null>(null);

  // Fetch departments
  const fetchDepartments = () => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDepartments(data.departments || []);
      });
  };

  // Fetch transfers with search parameters
  const fetchTransfersData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchVal) params.set('search', searchVal);
    if (fromDeptId) params.set('fromDeptId', fromDeptId);
    if (toDeptId) params.set('toDeptId', toDeptId);
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);

    fetch(`/api/transfers?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTransfers(data.transfers || []);
        }
      })
      .finally(() => setLoading(false));
  }, [searchVal, fromDeptId, toDeptId, fromDate, toDate]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchTransfersData();
  }, [fetchTransfersData]);

  const activeFiltersCount = useMemo(() => {
    return [
      searchVal ? 1 : 0,
      fromDeptId ? 1 : 0,
      toDeptId ? 1 : 0,
      fromDate ? 1 : 0,
      toDate ? 1 : 0,
    ].reduce((a, b) => a + b, 0);
  }, [searchVal, fromDeptId, toDeptId, fromDate, toDate]);

  const resetFilters = () => {
    setSearchVal('');
    setFromDeptId('');
    setToDeptId('');
    setFromDate('');
    setToDate('');
  };

  const handleOpenConfigWithDept = (deptId?: string) => {
    if (deptId) setConfigDeptId(deptId);
    else setConfigDeptId(null);
    setIsConfigOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER & PRIMARY ACTIONS ── */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <ArrowLeftRight className="h-6 w-6 text-indigo-400" />
            <span>Bo'limlararo Ko'chish Tarixi (Internal Mobility Logs)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Xodimlarning bir bo'limdan boshqasiga o'tkazilish tarixi, shtat sig'imi nazorati va buyruqlar logi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Action 1: Config Modal */}
          <button
            onClick={() => handleOpenConfigWithDept()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 px-4 py-2.5 text-xs font-bold hover:bg-amber-500/10 hover:border-amber-500/60 transition active:scale-95"
          >
            <Settings className="h-4 w-4" />
            <span>⚙️ Bo'lim va Shtat Sozlamalari</span>
          </button>

          {/* Action 2: New Transfer Wizard */}
          <button
            onClick={() => setIsWizardOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Yangi Ko'chirish Buyrug'i</span>
          </button>
        </div>
      </div>

      {/* ── FILTERS BAR ── */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-indigo-400" />
            Ko'chirish Loglarini Qidirish va Filtrlar
          </span>
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Filtrlarni Tozalash ({activeFiltersCount})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Live Text Search */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Qidiruv (Tabel / FIO / Buyruq №):
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="TB-8090, Ism, BUYRUK..."
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 2. From Department Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Qaysi Bo'limdan:
            </label>
            <select
              value={fromDeptId}
              onChange={(e) => setFromDeptId(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 py-2 px-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">-- Barcha Chiquvchi Bo'limlar --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.code}] {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. To Department Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Qaysi Bo'limga (Nishon):
            </label>
            <select
              value={toDeptId}
              onChange={(e) => setToDeptId(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 py-2 px-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">-- Barcha Kiruvchi Bo'limlar --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.code}] {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Date From */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Sanadan (Dan):
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 py-2 px-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* 5. Date To */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Sanagacha (Gacha):
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 py-2 px-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── ENHANCED LOGS TABLE ── */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Bo'limlararo Ko'chirish Jurnali</span>
            <span className="text-xs font-mono text-indigo-400">({transfers.length} ta yozuv)</span>
          </h3>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Xodim (Tabel №)</th>
                <th className="px-4 py-3.5">Qaysi Bo'limdan</th>
                <th className="px-4 py-3.5">Qaysi Bo'limga</th>
                <th className="px-4 py-3.5">Buyruq Raqami</th>
                <th className="px-4 py-3.5">Ko'chish Sanasi</th>
                <th className="px-4 py-3.5">Asosi / Sababi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2 text-indigo-400" />
                    Ko'chirish loglari yuklanmoqda...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Tanlangan filtrlarga mos keluvchi ko'chirish yozuvlari topilmadi
                  </td>
                </tr>
              ) : (
                transfers.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-900/60 transition group">
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      <span className="font-mono text-indigo-400 mr-2">[{tr.employee?.tabelNumber}]</span>
                      {tr.employee?.lastName} {tr.employee?.firstName}
                    </td>
                    <td className="px-4 py-3 font-medium text-rose-300">
                      {tr.fromDepartment ? `[${tr.fromDepartment.code}] ${tr.fromDepartment.name}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-300">
                      {tr.toDepartment ? `[${tr.toDepartment.code}] ${tr.toDepartment.name}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-300">{tr.orderNumber}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{formatDate(tr.transferDate)}</td>
                    <td className="px-4 py-3 text-slate-300">{tr.reason || 'Kadrlar rotatsiyasi va ichki ko\'chirish'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODALS INTEGRATION ── */}
      <TransferWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => {
          fetchTransfersData();
          fetchDepartments();
        }}
        onOpenDeptConfig={(deptId) => handleOpenConfigWithDept(deptId)}
      />

      <DepartmentConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSuccess={() => {
          fetchDepartments();
          fetchTransfersData();
        }}
        defaultDepartmentId={configDeptId}
      />
    </div>
  );
};
