'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldAlert,
  Award,
  PlusCircle,
  Search,
  Filter,
  RotateCcw,
  Calendar,
  FileText,
  User,
  CheckCircle2,
  X,
  Loader2,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface DepartmentItem {
  id: string;
  name: string;
  code?: string | null;
}

interface EmployeeItem {
  id: string;
  tabelNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
}

interface DisciplinaryRecord {
  id: string;
  employeeId: string;
  type: string;
  orderNumber: string;
  startDate: string;
  expiryDate?: string | null;
  notes?: string | null;
  status: string;
  employee?: {
    id: string;
    tabelNumber: string;
    firstName: string;
    lastName: string;
  };
}

interface RewardRecord {
  id: string;
  employeeId: string;
  type: string;
  orderNumber: string;
  orderDate: string;
  amount: number;
  reason?: string | null;
  employee?: {
    id: string;
    tabelNumber: string;
    firstName: string;
    lastName: string;
  };
}

interface DisciplineRewardsViewProps {
  departments?: DepartmentItem[];
}

export const DisciplineRewardsView: React.FC<DisciplineRewardsViewProps> = ({
  departments = [],
}) => {
  const { t, language } = useLanguage();

  const [subTab, setSubTab] = useState<'discipline' | 'rewards'>('discipline');
  const [disciplinaryList, setDisciplinaryList] = useState<DisciplinaryRecord[]>([]);
  const [rewardsList, setRewardsList] = useState<RewardRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters State
  const [searchVal, setSearchVal] = useState<string>('');
  const [deptId, setDeptId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals state
  const [isDisciplineModalOpen, setIsDisciplineModalOpen] = useState<boolean>(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState<boolean>(false);

  // Employees for modal selector
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form states for new discipline
  const [discEmpId, setDiscEmpId] = useState<string>('');
  const [discType, setDiscType] = useState<string>('Hayfsan');
  const [discOrderNo, setDiscOrderNo] = useState<string>(`BUYRUK-DS-${Math.floor(Math.random() * 900) + 100}`);
  const [discStartDate, setDiscStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [discExpiryDate, setDiscExpiryDate] = useState<string>('');
  const [discNotes, setDiscNotes] = useState<string>('');

  // Form states for new reward
  const [rewEmpId, setRewEmpId] = useState<string>('');
  const [rewType, setRewType] = useState<string>('MODDIY MUKOFOT');
  const [rewOrderNo, setRewOrderNo] = useState<string>(`BUYRUK-RW-${Math.floor(Math.random() * 900) + 100}`);
  const [rewOrderDate, setRewOrderDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [rewAmount, setRewAmount] = useState<string>('1500000');
  const [rewReason, setRewReason] = useState<string>('');

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch('/api/discipline-rewards')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDisciplinaryList(data.disciplinaryActions || []);
          setRewardsList(data.rewards || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchEmployeesList = () => {
    fetch('/api/employees?limit=300')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setEmployees(data.employees || []);
      });
  };

  useEffect(() => {
    fetchData();
    fetchEmployeesList();
  }, [fetchData]);

  // Filtered lists
  const filteredDiscipline = useMemo(() => {
    return disciplinaryList.filter((item) => {
      if (searchVal) {
        const q = searchVal.toLowerCase();
        const empName = `${item.employee?.lastName} ${item.employee?.firstName}`.toLowerCase();
        const tabel = item.employee?.tabelNumber?.toLowerCase() || '';
        const order = item.orderNumber.toLowerCase();
        if (!empName.includes(q) && !tabel.includes(q) && !order.includes(q)) return false;
      }
      if (statusFilter && item.status !== statusFilter) return false;
      return true;
    });
  }, [disciplinaryList, searchVal, statusFilter]);

  const filteredRewards = useMemo(() => {
    return rewardsList.filter((item) => {
      if (searchVal) {
        const q = searchVal.toLowerCase();
        const empName = `${item.employee?.lastName} ${item.employee?.firstName}`.toLowerCase();
        const tabel = item.employee?.tabelNumber?.toLowerCase() || '';
        const order = item.orderNumber.toLowerCase();
        if (!empName.includes(q) && !tabel.includes(q) && !order.includes(q)) return false;
      }
      if (statusFilter && item.type !== statusFilter) return false;
      return true;
    });
  }, [rewardsList, searchVal, statusFilter]);

  const resetFilters = () => {
    setSearchVal('');
    setDeptId('');
    setStatusFilter('');
  };

  // Submit Discipline Form
  const handleCreateDiscipline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discEmpId || !discOrderNo) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/discipline-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'DISCIPLINE',
          employeeId: discEmpId,
          type: discType,
          orderNumber: discOrderNo,
          startDate: discStartDate,
          expiryDate: discExpiryDate || null,
          notes: discNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(language === 'kr' ? '징계 처분이 성공적으로 등록되었습니다!' : 'Intizomiy chora yozuvi muvaffaqiyatli saqlandi!');
        setIsDisciplineModalOpen(false);
        fetchData();
      } else {
        alert(`${language === 'kr' ? '오류' : 'Xatolik'}: ${data.error}`);
      }
    } catch {
      alert(language === 'kr' ? '서버 연결 중 오류가 발생했습니다.' : 'Server bilan bog\'lanishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Reward Form
  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewEmpId || !rewOrderNo || !rewAmount) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/discipline-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'REWARD',
          employeeId: rewEmpId,
          type: rewType,
          orderNumber: rewOrderNo,
          orderDate: rewOrderDate,
          amount: parseFloat(rewAmount),
          reason: rewReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(language === 'kr' ? '포상금/지원금이 성공적으로 등록되었습니다!' : 'Mukofot/Moddiy yordam yozuvi muvaffaqiyatli saqlandi!');
        setIsRewardModalOpen(false);
        fetchData();
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
    <div className="space-y-6 bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen p-1 transition-colors">
      {/* ── MAIN PAGE HEADER & CATEGORY SWITCHER ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            <span>{t('disc.title', 'Intizomiy Choralar va Mukofotlar Boshqaruvi')}</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            {t('disc.subtitle', "Xodimlarning intizomiy jazolari (hayfsanlar), moddiy mukofotlar va ijtimoiy yordamlar jurnali")}
          </p>
        </div>

        {/* Sub-Category Switcher Tabs */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 shadow-sm">
          <button
            onClick={() => setSubTab('discipline')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              subTab === 'discipline'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>{t('disc.tab_discipline', '⚠️ Intizomiy Choralar / Hayfsanlar')} ({disciplinaryList.length})</span>
          </button>

          <button
            onClick={() => setSubTab('rewards')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              subTab === 'rewards'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>{t('disc.tab_rewards', '🏆 Moddiy Mukofot va Yordam')} ({rewardsList.length})</span>
          </button>
        </div>
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-blue-600 dark:text-indigo-400" />
              {t('filter.search', 'Filtrlar va Qidiruv')}
            </span>
            {(searchVal || statusFilter || deptId) && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline transition cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t('filter.reset', 'Tozalash')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {subTab === 'discipline' ? (
              <button
                onClick={() => setIsDisciplineModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{t('disc.new_discipline', '+ Yangi Intizomiy Chora')}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsRewardModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{t('disc.new_reward', '+ Yangi Mukofot / Yordam')}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Search */}
          <div>
            <label className="block text-slate-800 dark:text-slate-200 font-bold text-xs mb-1">
              {t('disc.search', 'Qidiruv (F.I.O, Tabel №)...')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder={language === 'kr' ? '성명, 사원번호 또는 문서 번호...' : 'F.I.O yoki Buyruq raqami...'}
                className="w-full rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 py-2.5 pl-9 pr-3 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-slate-800 dark:text-slate-200 font-bold text-xs mb-1">
              {t('disc.dept_filter', "Bo'lim bo'yicha filter")}:
            </label>
            <select
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              className="w-full rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 p-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">-- {t('analytics.all_depts', "Barcha Bo'limlar")} --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-slate-800 dark:text-slate-200 font-bold text-xs mb-1">
              {t('disc.status_filter', "Status bo'yicha filter")}:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 p-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">-- {language === 'kr' ? '전체 구분 / 상태' : 'Barcha Turlar / Statuslar'} --</option>
              {subTab === 'discipline' ? (
                <>
                  <option value="FAOL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t('disc.badge_active', 'FAOL HAYFSAN')}</option>
                  <option value="EXPIRED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t('disc.badge_expired', 'BEKOR QILINGAN / EXPIRED')}</option>
                </>
              ) : (
                <>
                  <option value="MODDIY MUKOFOT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t('reward.badge_reward', 'MODDIY MUKOFOT')}</option>
                  <option value="MODDIY YORDAM" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t('reward.badge_aid', 'MODDIY YORDAM')}</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* ── CONTENT SECTION 1: DISCIPLINARY ACTIONS TABLE ── */}
      {subTab === 'discipline' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span>{language === 'kr' ? '징계 처분 및 경고 이력 목록' : 'Intizomiy Jazo Choralari Jurnali'}</span>
              <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">({filteredDiscipline.length} {language === 'kr' ? '건' : 'yozuv'})</span>
            </h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase tracking-wider border-b border-slate-300 dark:border-slate-700 text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">{t('mobility.col_fio', 'F.I.O')} ({t('mobility.col_tabel', 'Tabel №')})</th>
                  <th className="px-4 py-3.5">{t('disc_modal.record_type', 'Jazo Turi')}</th>
                  <th className="px-4 py-3.5">{t('mobility.col_order', 'Buyruq №')}</th>
                  <th className="px-4 py-3.5">{t('table.date', 'Berilgan Sana')}</th>
                  <th className="px-4 py-3.5">{t('disc.col_expiry', 'Amal Qilish Muddati')}</th>
                  <th className="px-4 py-3.5">{t('disc.col_reason', 'Hayfsan Sababi / Asosi')}</th>
                  <th className="px-4 py-3.5 text-right">{t('disc.col_status', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-600 dark:text-slate-400 font-medium">
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2 text-rose-600 dark:text-rose-400" />
                      {language === 'kr' ? '징계 처분 데이터를 불러오는 중입니다...' : "Intizomiy jazo ma'lumotlari yuklanmoqda..."}
                    </td>
                  </tr>
                ) : filteredDiscipline.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-600 dark:text-slate-400 font-medium">
                      {language === 'kr' ? '등록된 징계 처분 내역이 없습니다.' : 'Intizomiy chora yozuvlari topilmadi'}
                    </td>
                  </tr>
                ) : (
                  filteredDiscipline.map((d) => {
                    const isActive = d.status === 'FAOL' || d.status === 'ACTIVE' || !d.expiryDate || new Date(d.expiryDate) > new Date();
                    return (
                      <tr key={d.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                          <span className="font-mono text-blue-700 dark:text-indigo-400 mr-2 text-[11px]">[{d.employee?.tabelNumber}]</span>
                          {d.employee?.lastName} {d.employee?.firstName}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-rose-700 dark:text-rose-400">{d.type}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300 font-bold">{d.orderNumber}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400 font-semibold">{formatDate(d.startDate)}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400 font-semibold">{d.expiryDate ? formatDate(d.expiryDate) : '—'}</td>
                        <td className="px-4 py-3.5 text-slate-800 dark:text-slate-200 font-medium italic">{d.notes || '—'}</td>
                        <td className="px-4 py-3.5 text-right">
                          {isActive ? (
                            <span className="inline-flex items-center bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold px-2.5 py-0.5 rounded-full text-xs">
                              ● {t('disc.badge_active', 'FAOL HAYFSAN')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-medium px-2.5 py-0.5 rounded-full text-xs">
                              {t('disc.badge_expired', 'BEKOR QILINGAN / EXPIRED')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CONTENT SECTION 2: REWARDS & FINANCIAL AID TABLE ── */}
      {subTab === 'rewards' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'kr' ? '포상금 및 복지 지원금 지급 이력' : 'Moddiy Mukofot va Ijtimoiy Yordam Jurnali'}</span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">({filteredRewards.length} {language === 'kr' ? '건' : 'yozuv'})</span>
            </h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase tracking-wider border-b border-slate-300 dark:border-slate-700 text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">{t('mobility.col_fio', 'F.I.O')} ({t('mobility.col_tabel', 'Tabel №')})</th>
                  <th className="px-4 py-3.5">{t('reward.type_col', 'Mukofot / Yordam Turi')}</th>
                  <th className="px-4 py-3.5">{t('mobility.col_order', 'Buyruq №')}</th>
                  <th className="px-4 py-3.5">{t('reward.date_col', "To'langan Sana")}</th>
                  <th className="px-4 py-3.5">{t('reward.reason_col', 'Ajratilish Sababi / Ariza №')}</th>
                  <th className="px-4 py-3.5 text-right">{t('reward.amount_col', "To'langan Summa (UZS)")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-600 dark:text-slate-400 font-medium">
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2 text-emerald-600 dark:text-emerald-400" />
                      {language === 'kr' ? '포상 및 지원금 데이터를 불러오는 중입니다...' : "Mukofot ma'lumotlari yuklanmoqda..."}
                    </td>
                  </tr>
                ) : filteredRewards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-600 dark:text-slate-400 font-medium">
                      {language === 'kr' ? '등록된 포상금 및 지원금 내역이 없습니다.' : 'Mukofot va moddiy yordam yozuvlari topilmadi'}
                    </td>
                  </tr>
                ) : (
                  filteredRewards.map((r) => {
                    const isAid = r.type.includes('YORDAM');
                    return (
                      <tr key={r.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                          <span className="font-mono text-blue-700 dark:text-indigo-400 mr-2 text-[11px]">[{r.employee?.tabelNumber}]</span>
                          {r.employee?.lastName} {r.employee?.firstName}
                        </td>
                        <td className="px-4 py-3.5">
                          {isAid ? (
                            <span className="inline-flex items-center bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold px-2.5 py-0.5 rounded-md text-xs">
                              {t('reward.badge_aid', 'MODDIY YORDAM')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold px-2.5 py-0.5 rounded-md text-xs">
                              {t('reward.badge_reward', 'MODDIY MUKOFOT')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300 font-bold">{r.orderNumber}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400 font-semibold">{formatDate(r.orderDate)}</td>
                        <td className="px-4 py-3.5 text-slate-800 dark:text-slate-200 text-xs font-medium">{r.reason || (language === 'kr' ? '임직원 포상 및 격려' : "Kadrlar rag'batlantirishi")}</td>
                        <td className="px-4 py-3.5 text-right text-emerald-600 dark:text-emerald-400 font-extrabold text-sm font-mono">
                          {formatCurrency(r.amount)} UZS
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL 1: CREATE DISCIPLINE RECORD ── */}
      {isDisciplineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                <span>{t('disc_modal.title_discipline', 'Yangi Intizomiy Chora Rasmiylashtirish')}</span>
              </h3>
              <button
                onClick={() => setIsDisciplineModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDiscipline} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">
                  1. {t('disc_modal.select_emp', 'Xodimni Tanlang')}:
                </label>
                <select
                  value={discEmpId}
                  onChange={(e) => setDiscEmpId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  required
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">-- {t('disc_modal.select_emp', 'Xodimni Tanlang')} --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      [{e.tabelNumber}] {e.lastName} {e.firstName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">
                    2. {t('disc_modal.record_type', 'Jazo Turi')}:
                  </label>
                  <select
                    value={discType}
                    onChange={(e) => setDiscType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Hayfsan" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '견책 / 경고 (Hayfsan)' : 'Hayfsan'}</option>
                    <option value="Jarima (Oylikdan ushlash)" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '감봉 (Jarima)' : 'Jarima (Oylikdan ushlash)'}</option>
                    <option value="Ogohlantirish" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '서면 경고' : 'Ogohlantirish'}</option>
                    <option value="Mehnat shartnomasini bekor qilish" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '징계 해고' : 'Mehnat shartnomasini bekor qilish'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">
                    3. {t('disc_modal.order_no_date', 'Buyruq Raqami va Sana')}:
                  </label>
                  <input
                    type="text"
                    value={discOrderNo}
                    onChange={(e) => setDiscOrderNo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">
                    4. {t('table.date', 'Berilgan Sana')}:
                  </label>
                  <input
                    type="date"
                    value={discStartDate}
                    onChange={(e) => setDiscStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">
                    5. {t('disc.col_expiry', 'Amal Qilish Muddati')}:
                  </label>
                  <input
                    type="date"
                    value={discExpiryDate}
                    onChange={(e) => setDiscExpiryDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">
                  6. {t('disc_modal.reason', 'Sababi / Izoh')}:
                </label>
                <textarea
                  rows={3}
                  value={discNotes}
                  onChange={(e) => setDiscNotes(e.target.value)}
                  placeholder={language === 'kr' ? '징계 사유 및 상세 내용 입력 (예: 근태 위반, 지각)...' : "Masalan: Mehnat intizomini buzish yoki kechikish..."}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDisciplineModalOpen(false)}
                  className="rounded-xl bg-slate-200 dark:bg-slate-800 px-4 py-2 font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  {t('disc_modal.cancel', 'Bekor qilish')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2 font-bold text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (language === 'kr' ? '저장 중...' : 'Saqlanmoqda...') : t('disc_modal.save', 'Saqlash')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CREATE REWARD RECORD ── */}
      {isRewardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>{t('disc_modal.title_reward', 'Yangi Mukofot / Moddiy Yordam Rasmiylashtirish')}</span>
              </h3>
              <button
                onClick={() => setIsRewardModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReward} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">
                  1. {t('disc_modal.select_emp', 'Xodimni Tanlang')}:
                </label>
                <select
                  value={rewEmpId}
                  onChange={(e) => setRewEmpId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  required
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">-- {t('disc_modal.select_emp', 'Xodimni Tanlang')} --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      [{e.tabelNumber}] {e.lastName} {e.firstName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">
                    2. {t('reward.type_col', 'Mukofot / Yordam Turi')}:
                  </label>
                  <select
                    value={rewType}
                    onChange={(e) => setRewType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="MODDIY MUKOFOT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t('reward.badge_reward', 'MODDIY MUKOFOT')}</option>
                    <option value="MODDIY YORDAM" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t('reward.badge_aid', 'MODDIY YORDAM')}</option>
                    <option value="BAYRAM MUKOFOTI" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{language === 'kr' ? '명절 포상금' : 'BAYRAM MUKOFOTI'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">
                    3. {t('disc_modal.order_no_date', 'Buyruq Raqami va Sana')}:
                  </label>
                  <input
                    type="text"
                    value={rewOrderNo}
                    onChange={(e) => setRewOrderNo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">
                    4. {t('reward.date_col', "To'langan Sana")}:
                  </label>
                  <input
                    type="date"
                    value={rewOrderDate}
                    onChange={(e) => setRewOrderDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">
                    5. {t('disc_modal.amount', 'Summa (UZS)')}:
                  </label>
                  <input
                    type="number"
                    value={rewAmount}
                    onChange={(e) => setRewAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">
                  6. {t('disc_modal.reason', 'Sababi / Izoh')}:
                </label>
                <textarea
                  rows={3}
                  value={rewReason}
                  onChange={(e) => setRewReason(e.target.value)}
                  placeholder={language === 'kr' ? '포상 사유 입력 (예: 우수 성과 달성, 경조금 지원)...' : "Masalan: Yillik KPI ko'rsatkichlarini a'lo darajada bajarganligi uchun..."}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRewardModalOpen(false)}
                  className="rounded-xl bg-slate-200 dark:bg-slate-800 px-4 py-2 font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  {t('disc_modal.cancel', 'Bekor qilish')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 font-bold text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (language === 'kr' ? '저장 중...' : 'Saqlanmoqda...') : t('disc_modal.save', 'Saqlash')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
