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
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t, language } = useLanguage();

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
    <div className="space-y-6 bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen p-1 transition-colors">
      {/* ── TOP HEADER & PRIMARY ACTIONS ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <ArrowLeftRight className="h-6 w-6 text-blue-600 dark:text-indigo-400" />
            <span>{t('mobility.title', "Bo'limlararo Ko'chish Tarixi")}</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            {t('mobility.subtitle', "Xodimlarning bo'limlararo o'tishi va lavozim o'zgarishlari jurnali")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Action 1: Config Modal */}
          <button
            onClick={() => handleOpenConfigWithDept()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2.5 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer shadow-sm"
          >
            <Settings className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>⚙️ {language === 'kr' ? '부서 및 정원 설정' : "Bo'lim va Shtat Sozlamalari"}</span>
          </button>

          {/* Action 2: New Transfer Wizard */}
          <button
            onClick={() => setIsWizardOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t('mobility.new_btn', "+ Yangi Ko'chirish Yozuvini Qo'shish")}</span>
          </button>
        </div>
      </div>

      {/* ── FILTERS BAR ── */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-blue-600 dark:text-indigo-400" />
            {language === 'kr' ? '전보 이력 검색 및 필터' : "Ko'chirish Loglarini Qidirish va Filtrlar"}
          </span>
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {language === 'kr' ? '필터 초기화' : 'Filtrlarni Tozalash'} ({activeFiltersCount})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Live Text Search */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('mobility.search', 'Qidiruv (F.I.O, Tabel №)...')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder={language === 'kr' ? '사번, 성명, 발령 번호...' : 'TB-8090, Ism, BUYRUK...'}
                className="w-full rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 py-2 pl-9 pr-3 text-xs placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* 2. From Department Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('mobility.col_old', "Eski Bo'lim / Lavozim")}:
            </label>
            <select
              value={fromDeptId}
              onChange={(e) => setFromDeptId(e.target.value)}
              className="w-full rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">-- {language === 'kr' ? '전체 이전 부서' : "Barcha Chiquvchi Bo'limlar"} --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  [{d.code}] {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. To Department Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('mobility.col_new', "Yangi Bo'lim / Lavozim")}:
            </label>
            <select
              value={toDeptId}
              onChange={(e) => setToDeptId(e.target.value)}
              className="w-full rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">-- {language === 'kr' ? '전체 발령 부서' : "Barcha Kiruvchi Bo'limlar"} --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  [{d.code}] {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Date From */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'kr' ? '시작 일자:' : 'Sanadan (Dan):'}
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 py-2 px-3 text-xs font-mono font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* 5. Date To */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'kr' ? '종료 일자:' : 'Sanagacha (Gacha):'}
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 py-2 px-3 text-xs font-mono font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── ENHANCED LOGS TABLE ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t('mobility.title', "Bo'limlararo Ko'chish Tarixi")}</span>
            <span className="text-xs font-mono font-bold text-blue-700 dark:text-indigo-400">({transfers.length} {language === 'kr' ? '건' : 'ta yozuv'})</span>
          </h3>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase tracking-wider border-b border-slate-300 dark:border-slate-700 text-[10px]">
              <tr>
                <th className="px-4 py-3.5">{t('mobility.col_fio', 'F.I.O')} ({t('mobility.col_tabel', 'Tabel №')})</th>
                <th className="px-4 py-3.5">{t('mobility.col_old', "Eski Bo'lim / Lavozim")}</th>
                <th className="px-4 py-3.5">{t('mobility.col_new', "Yangi Bo'lim / Lavozim")}</th>
                <th className="px-4 py-3.5">{t('mobility.col_order', 'Buyruq № va Sana')}</th>
                <th className="px-4 py-3.5">{t('transfer_modal.effective_date', 'Kuchga Kirish Sanasi')}</th>
                <th className="px-4 py-3.5">{t('mobility.col_reason', "Ko'chish Sababi / Asos")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-600 dark:text-slate-400 font-medium">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2 text-blue-600 dark:text-indigo-400" />
                    {language === 'kr' ? '부서 이동 데이터를 불러오는 중입니다...' : "Ko'chirish loglari yuklanmoqda..."}
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-600 dark:text-slate-400 font-medium">
                    {language === 'kr' ? '해당 필터에 일치하는 부서 이동 이력이 없습니다.' : "Tanlangan filtrlarga mos keluvchi ko'chirish yozuvlari topilmadi"}
                  </td>
                </tr>
              ) : (
                transfers.map((tr) => (
                  <tr key={tr.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                      <span className="font-mono text-blue-700 dark:text-indigo-400 font-bold mr-2 text-[11px]">[{tr.employee?.tabelNumber}]</span>
                      {tr.employee?.lastName} {tr.employee?.firstName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-medium px-2.5 py-1 rounded-md text-xs">
                        {tr.fromDepartment ? `[${tr.fromDepartment.code}] ${tr.fromDepartment.name}` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold px-2.5 py-1 rounded-md text-xs">
                        {tr.toDepartment ? `[${tr.toDepartment.code}] ${tr.toDepartment.name}` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">
                      <span className="bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold px-2 py-0.5 rounded text-xs">
                        {language === 'kr' ? `발령 번호 ${tr.orderNumber}` : tr.orderNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 text-xs font-bold">{formatDate(tr.transferDate)}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-xs italic font-medium">{tr.reason || (language === 'kr' ? '인력 순환 및 부서 이동' : "Kadrlar rotatsiyasi va ichki ko'chirish")}</td>
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
