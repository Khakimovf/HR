'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  ArrowLeftRight,
  ShieldAlert,
  Award,
  UserPlus,
  Car,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Building,
  RotateCcw,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface Employee {
  id: string;
  tabelNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  gender: string;
  position: string;
  status: string;
  hireDate: string;
  phone?: string | null;
  militaryCertificate?: string | null;
  currentDepartment: {
    id: string;
    name: string;
    code: string;
  };
  permits?: any[];
  disciplinaryActions?: any[];
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

interface EmployeeDirectoryProps {
  departments: Array<{ id: string; name: string; code: string }>;
  onSelectEmployee: (employeeId: string) => void;
  onTransferEmployee: (employeeId: string) => void;
  onOpenBulkModal: () => void;
  selectedDepartmentId?: string;
  onSelectDepartmentId?: (deptId: string) => void;
}

export const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({
  departments,
  onSelectEmployee,
  onTransferEmployee,
  onOpenBulkModal,
  selectedDepartmentId = '',
  onSelectDepartmentId,
}) => {
  const { canEditEmployee, isReadOnly } = useAuth();
  // State for search and filters
  const [searchVal, setSearchVal] = useState<string>('');
  const [deptSearch, setDeptSearch] = useState<string>('');
  const [deptDropdownOpen, setDeptDropdownOpen] = useState<boolean>(false);
  
  const [filterPermit, setFilterPermit] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDiscipline, setFilterDiscipline] = useState<string>('ALL');

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 1500,
    page: 1,
    limit: 20,
    totalPages: 75,
    hasPrev: false,
    hasNext: true,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch employees whenever query params change
  const fetchEmployeesData = () => {
    setLoading(true);
    const params = new URLSearchParams({
      search: searchVal,
      departmentId: selectedDepartmentId,
      permitFilter: filterPermit,
      status: filterStatus,
      disciplineStatus: filterDiscipline,
      page: page.toString(),
      limit: limit.toString(),
    });

    fetch(`/api/employees?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEmployees(data.employees || []);
          setPagination(data.pagination);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployeesData();
  }, [searchVal, selectedDepartmentId, filterPermit, filterStatus, filterDiscipline, page, limit]);

  // Active filters count
  const activeFiltersCount = [
    searchVal ? 1 : 0,
    selectedDepartmentId ? 1 : 0,
    filterPermit !== 'ALL' ? 1 : 0,
    filterStatus !== 'ALL' ? 1 : 0,
    filterDiscipline !== 'ALL' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const resetAllFilters = () => {
    setSearchVal('');
    if (onSelectDepartmentId) onSelectDepartmentId('');
    setFilterPermit('ALL');
    setFilterStatus('ALL');
    setFilterDiscipline('ALL');
    setPage(1);
  };

  // Filtered departments for the searchable Combobox
  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    d.code.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const selectedDepartmentObj = departments.find((d) => d.id === selectedDepartmentId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> FAOL
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" /> TA'TILDA
          </span>
        );
      case 'OFFBOARDED':
        return (
          <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400 border border-slate-700">
            OFFBOARDED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
      {/* Header Title & Bulk Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Xodimlar Baza va Profil Kartalari</h2>
              <p className="text-xs text-slate-400">
                1500+ Xodimlar, 52 ta bo'lim va barcha ruxsatnomalar bo'yicha jonli qidiruv
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeFiltersCount > 0 && (
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-2 text-xs font-semibold hover:bg-rose-500/20 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Filtrlarni Tozalash ({activeFiltersCount})</span>
            </button>
          )}

          <button
            onClick={onOpenBulkModal}
            disabled={isReadOnly}
            title={isReadOnly ? "🔒 Faqat o'zingizga biriktirilgan bo'lim xodimlarini tahrirlashingiz mumkin" : "Excel orqali ommaviy yuklash"}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-200" />
            <span>📥 Excel Orqali Ommaviy Yuklash</span>
          </button>
        </div>
      </div>

      {/* Dynamic Search & Multi-Filter Control Bar */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Live Text Search */}
          <div className="relative">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Qidiruv (Tabel / FIO / Tel):
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => {
                  setSearchVal(e.target.value);
                  setPage(1);
                }}
                placeholder="TB-8090, Ism, Tel..."
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Searchable Department Combobox (50+ Depts) */}
          <div className="relative">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Bo'lim (52 ta Bo'lim):
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDeptDropdownOpen(!deptDropdownOpen)}
                className="w-full flex items-center justify-between rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2 text-xs text-slate-100 text-left focus:border-indigo-500 focus:outline-none"
              >
                <span className="truncate">
                  {selectedDepartmentObj ? `[${selectedDepartmentObj.code}] ${selectedDepartmentObj.name}` : 'Barcha 52 ta Bo\'lim'}
                </span>
                <Building2 className="h-3.5 w-3.5 text-slate-400 ml-1 shrink-0" />
              </button>

              {/* Combobox Dropdown */}
              {deptDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-60 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 space-y-1">
                  <input
                    type="text"
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    placeholder="Bo'lim nomini yozing..."
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 p-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none mb-1"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (onSelectDepartmentId) onSelectDepartmentId('');
                      setDeptDropdownOpen(false);
                      setPage(1);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-indigo-400 hover:bg-slate-800 rounded-lg font-semibold"
                  >
                    -- Barcha Bo'limlar --
                  </button>
                  {filteredDepartments.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        if (onSelectDepartmentId) onSelectDepartmentId(d.id);
                        setDeptDropdownOpen(false);
                        setPage(1);
                      }}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded-lg truncate transition ${
                        selectedDepartmentId === d.id
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-mono text-indigo-300 mr-1.5">[{d.code}]</span>
                      {d.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Permit & Certificate Multi-Select Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Ruxsatnoma / Guvohnoma:
            </label>
            <select
              value={filterPermit}
              onChange={(e) => {
                setFilterPermit(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 py-2 px-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">Barcha Ruxsatnomalar</option>
              <option value="FORKLIFT_KARA">KARA / Forklift Operator</option>
              <option value="MOBILE_PHONE_ON_SITE">Ruxsat etilgan Telefon</option>
              <option value="DRIVING">Haydovchilik (A, B, C, D, E, F)</option>
              <option value="MILITARY">Harbiy Guvohnoma (Mavjud)</option>
              <option value="PROFESSIONAL_CERT">Sanoat Xavfsizligi (HSE)</option>
            </select>
          </div>

          {/* 4. Employee Status Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Shtat Holati:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 py-2 px-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">Barcha Holatlar</option>
              <option value="ACTIVE">Faol Ishchilar</option>
              <option value="ON_LEAVE">Ta'tildagilar (M/T, B/S, B/L)</option>
              <option value="OFFBOARDED">Shartnoma Bekor Qilingan</option>
            </select>
          </div>

          {/* 5. Discipline Status Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Intizomiy Holat:
            </label>
            <select
              value={filterDiscipline}
              onChange={(e) => {
                setFilterDiscipline(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 py-2 px-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">Barcha Intizom</option>
              <option value="ACTIVE_PENALTY">Intizomiy Hayfsan (Faol)</option>
              <option value="CLEAN">Toza / Intizomli Xodimlari</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Employee Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-4 py-3.5">Tabel № / F.I.O</th>
              <th className="px-4 py-3.5">Bo'lim & Lavozim</th>
              <th className="px-4 py-3.5">Ishga Kirgan</th>
              <th className="px-4 py-3.5">Ruxsatnomalar & Guvohnomalar</th>
              <th className="px-4 py-3.5">Intizomiy Holat</th>
              <th className="px-4 py-3.5">Holati</th>
              <th className="px-4 py-3.5 text-right">Harakatlar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  Xodimlar ma'lumoti yuklanmoqda...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  Tanlangan filtrlarga mos keluvchi xodimlar topilmadi
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const activePenalty = emp.disciplinaryActions && emp.disciplinaryActions.length > 0;
                return (
                  <tr key={emp.id} className="hover:bg-slate-900/60 transition group">
                    {/* Tabel & Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 font-bold text-indigo-400 border border-slate-700">
                          {emp.firstName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-400">
                              {emp.tabelNumber}
                            </span>
                            <span className="font-semibold text-slate-100">
                              {emp.lastName} {emp.firstName} {emp.middleName || ''}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">{emp.phone || 'Telefon yo\'q'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Dept & Position */}
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-slate-200">{emp.position}</span>
                        <p className="text-[11px] text-indigo-300 font-semibold">
                          {emp.currentDepartment?.name}
                        </p>
                      </div>
                    </td>

                    {/* Hire Date */}
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {formatDate(emp.hireDate)}
                    </td>

                    {/* Permits & Badges */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {emp.militaryCertificate && (
                          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck className="h-3 w-3" /> Harbiy
                          </span>
                        )}
                        {emp.permits && emp.permits.length > 0 ? (
                          emp.permits.map((p: any) => (
                            <span
                              key={p.id}
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium border ${
                                p.licenseType === 'DRIVING'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : p.licenseType === 'FORKLIFT_KARA'
                                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                  : p.licenseType === 'MOBILE_PHONE_ON_SITE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {p.licenseType === 'DRIVING' && <Car className="h-3 w-3" />}
                              {p.licenseType === 'MOBILE_PHONE_ON_SITE' && <PhoneCall className="h-3 w-3" />}
                              <span>{p.category || p.licenseType}</span>
                            </span>
                          ))
                        ) : !emp.militaryCertificate ? (
                          <span className="text-slate-500 text-[11px]">—</span>
                        ) : null}
                      </div>
                    </td>

                    {/* Disciplinary status */}
                    <td className="px-4 py-3">
                      {activePenalty ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="h-3 w-3" /> Intizomiy Hayfsan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Intizomli
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">{getStatusBadge(emp.status)}</td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectEmployee(emp.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/80 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-indigo-500 transition"
                          title="Profil kartasini ochish"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Profil Karta</span>
                        </button>
                        <button
                          onClick={() => onTransferEmployee(emp.id)}
                          disabled={!canEditEmployee(emp.currentDepartment?.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                          title={canEditEmployee(emp.currentDepartment?.id) ? "Boshqa bo'limga ko'chirish" : "🔒 Faqat o'zingizga biriktirilgan bo'lim xodimlarini tahrirlashingiz mumkin"}
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                          <span>Ko'chirish</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* High-Performance Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Sahifadagi yozuvlar:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 focus:outline-none"
          >
            <option value={20}>20 ta</option>
            <option value={50}>50 ta</option>
            <option value={100}>100 ta</option>
          </select>
          <span className="ml-2 font-mono">
            Jami: <strong className="text-white">{pagination.total}</strong> ta xodimdan{' '}
            <strong className="text-indigo-400">
              {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}
            </strong>{' '}
            ko'rsatilyapti
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={() => setPage(1)}
            disabled={!pagination.hasPrev}
            className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            « Birinchi
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrev}
            className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            ‹ Oldingi
          </button>
          <span className="px-3 py-1 font-semibold text-slate-200">
            Sahifa <span className="text-indigo-400">{pagination.page}</span> / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={!pagination.hasNext}
            className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            Keyingi ›
          </button>
          <button
            onClick={() => setPage(pagination.totalPages)}
            disabled={!pagination.hasNext}
            className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            Oxirgi »
          </button>
        </div>
      </div>
    </div>
  );
};
