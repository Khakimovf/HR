'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Building2,
  RotateCcw,
  GraduationCap,
  Award,
  Stethoscope,
  Clock,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface FilterState {
  searchVal: string;
  selectedDepartmentId: string;
  educationFilter: string;
  rewardFilter: string;
  medicalFilter: string;
  tenureFilter: string;
  demographicFilter: string;
  permitFilter: string;
  filterStatus: string;
  filterDiscipline: string;
}

export const initialFilterState: FilterState = {
  searchVal: '',
  selectedDepartmentId: '',
  educationFilter: 'ALL',
  rewardFilter: 'ALL',
  medicalFilter: 'ALL',
  tenureFilter: 'ALL',
  demographicFilter: 'ALL',
  permitFilter: 'ALL',
  filterStatus: 'ALL',
  filterDiscipline: 'ALL',
};

interface EmployeeFilterBarProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onResetFilters: () => void;
  departments: Array<{ id: string; name: string; code: string }>;
  activeFiltersCount: number;
}

export const EmployeeFilterBar: React.FC<EmployeeFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  departments,
  activeFiltersCount,
}) => {
  const [deptSearch, setDeptSearch] = useState<string>('');
  const [deptDropdownOpen, setDeptDropdownOpen] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(true);

  const selectedDepartmentObj = departments.find((d) => d.id === filters.selectedDepartmentId);

  const filteredDepartments = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(deptSearch.toLowerCase())
  );

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-4 shadow-xl">
      {/* Header Bar with Toggle & Reset Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Filter className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            Kengaytirilgan Filterlar & Analitika
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {activeFiltersCount} ta faol
              </span>
            )}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-2.5 py-1.5 text-xs font-medium transition cursor-pointer active:scale-95"
              title="Barcha filtrlarni tozalash"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Filterlarni Tozalash / Reset</span>
            </button>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            type="button"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 text-xs font-medium transition cursor-pointer"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Yashirish</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Barchasini ko'rsatish</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Row 1: Primary Controls (Search, Dept, Education) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* 1. Live Text Search */}
        <div>
          <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
            Qidiruv (Tabel № / F.I.O / Telefon):
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={filters.searchVal}
              onChange={(e) => onFilterChange('searchVal', e.target.value)}
              placeholder="Tabel №, F.I.O, Tel..."
              className="w-full bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg pl-9 pr-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
            />
          </div>
        </div>

        {/* 2. Department Combobox */}
        <div className="relative">
          <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
            Bo'lim (52 ta Bo'lim):
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDeptDropdownOpen(!deptDropdownOpen)}
              className="w-full flex items-center justify-between bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
            >
              <span className="truncate">
                {selectedDepartmentObj
                  ? `[${selectedDepartmentObj.code}] ${selectedDepartmentObj.name}`
                  : "Barcha 52 ta Bo'lim"}
              </span>
              <Building2 className="h-3.5 w-3.5 text-slate-400 ml-1 shrink-0" />
            </button>

            {deptDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-60 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 space-y-1">
                <input
                  type="text"
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  placeholder="Bo'lim nomini yozing..."
                  className="w-full bg-slate-800 text-slate-200 border border-slate-700 p-1.5 text-xs rounded-lg focus:outline-none mb-1"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange('selectedDepartmentId', '');
                    setDeptDropdownOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-xs text-indigo-400 hover:bg-slate-800 rounded-lg font-semibold"
                >
                  -- Barcha Bo'limlar --
                </button>
                {filteredDepartments.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      onFilterChange('selectedDepartmentId', d.id);
                      setDeptDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded-lg truncate transition ${
                      filters.selectedDepartmentId === d.id
                        ? 'bg-blue-600 text-white font-bold'
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

        {/* 3. Education Filter ("Ma'lumoti bo'yicha") */}
        <div>
          <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1">
            <GraduationCap className="h-3 w-3 text-indigo-400" />
            Ma'lumoti bo'yicha:
          </label>
          <select
            value={filters.educationFilter}
            onChange={(e) => onFilterChange('educationFilter', e.target.value)}
            className="w-full bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">Barcha ma'lumot turlari</option>
            <option value="HIGHER">Oliy ma'lumotli</option>
            <option value="SPECIAL_SECONDARY">O'rta-maxsus</option>
            <option value="SECONDARY">O'rta ma'lumotli</option>
            <option value="INCOMPLETE_HIGHER">Tugallanmagan oliy</option>
          </select>
        </div>
      </div>

      {/* Row 2 & 3: Expanded Analytical Filters */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 animate-fadeIn">
          {/* 4. Rewards & Financial Aid Filter ("Mukofot va Rag'batlantirish") */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Award className="h-3 w-3 text-emerald-400" />
              Mukofot va Rag'batlantirish:
            </label>
            <select
              value={filters.rewardFilter}
              onChange={(e) => onFilterChange('rewardFilter', e.target.value)}
              className="w-full bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">Barchasi (Mukofotlar)</option>
              <option value="REWARDED">Moddiy mukofot olganlar</option>
              <option value="FINANCIAL_AID">Moddiy yordam olganlar</option>
              <option value="NO_REWARDS">Rag'batlantirilmaganlar</option>
            </select>
          </div>

          {/* 5. Medical Checkup Status Filter ("Tibbiy Ko'rik Holati") */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Stethoscope className="h-3 w-3 text-rose-400" />
              Tibbiy Ko'rik Holati:
            </label>
            <select
              value={filters.medicalFilter}
              onChange={(e) => onFilterChange('medicalFilter', e.target.value)}
              className="w-full bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">Barchasi (Med-ko'rik)</option>
              <option value="VALID">Med-ko'rik amalda</option>
              <option value="EXPIRING_SOON">Muddati tugayotgan (15 kun)</option>
              <option value="EXPIRED">Med-ko'rik muddati o'tgan</option>
            </select>
          </div>

          {/* 6. Work Tenure Filter ("Korxonadagi Ish Staji") */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-400" />
              Korxonadagi Ish Staji:
            </label>
            <select
              value={filters.tenureFilter}
              onChange={(e) => onFilterChange('tenureFilter', e.target.value)}
              className="w-full bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">Barcha stajlar</option>
              <option value="UNDER_1_YEAR">1 yildan kam (Yangi xodimlar)</option>
              <option value="1_TO_3_YEARS">1 - 3 yil</option>
              <option value="3_TO_5_YEARS">3 - 5 yil</option>
              <option value="5_TO_10_YEARS">5 - 10 yil</option>
              <option value="OVER_10_YEARS">10+ yil (Faxriy xodimlar)</option>
            </select>
          </div>

          {/* 7. Demographics & Pension Filter ("Yoshi / Demografiya") */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-cyan-400" />
              Yoshi / Demografiya:
            </label>
            <select
              value={filters.demographicFilter}
              onChange={(e) => onFilterChange('demographicFilter', e.target.value)}
              className="w-full bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">Barcha yosh dagilari</option>
              <option value="YOUTH_UNDER_30">30 yoshgacha bo'lgan yoshlar</option>
              <option value="PENSION_AGE">Pensiya yoshidagilar (Erkaklar 60+, Ayollar 55+)</option>
            </select>
          </div>

          {/* 8. Permits & Certificates Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Ruxsatnoma / Guvohnoma:
            </label>
            <select
              value={filters.permitFilter}
              onChange={(e) => onFilterChange('permitFilter', e.target.value)}
              className="w-full bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">Barcha Ruxsatnomalar</option>
              <option value="FORKLIFT_KARA">KARA / Forklift Operator</option>
              <option value="MOBILE_PHONE_ON_SITE">Ruxsat etilgan Telefon</option>
              <option value="DRIVING">Haydovchilik (A, B, C, D, E, F)</option>
              <option value="MILITARY">Harbiy Guvohnoma (Mavjud)</option>
              <option value="PROFESSIONAL_CERT">Sanoat Xavfsizligi (HSE)</option>
            </select>
          </div>

          {/* 9. Discipline / Status Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-rose-400" />
              Intizomiy Holat & Shtat:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filters.filterDiscipline}
                onChange={(e) => onFilterChange('filterDiscipline', e.target.value)}
                className="w-full bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ALL">Barcha Intizom</option>
                <option value="ACTIVE_PENALTY">Intizomiy Hayfsan (Faol)</option>
                <option value="CLEAN">Toza / Intizomli</option>
              </select>

              <select
                value={filters.filterStatus}
                onChange={(e) => onFilterChange('filterStatus', e.target.value)}
                className="w-full bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ALL">Barcha Shtat</option>
                <option value="ACTIVE">Faol Ishchilar</option>
                <option value="ON_LEAVE">Ta'tildagilar</option>
                <option value="OFFBOARDED">Offboarded</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
