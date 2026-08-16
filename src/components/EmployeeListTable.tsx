'use client';

import React from 'react';
import {
  Eye,
  ArrowLeftRight,
  ShieldCheck,
  Car,
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  Edit,
  GraduationCap,
  Award,
  Stethoscope,
  Clock,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/utils';

export interface Employee {
  id: string;
  tabelNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  gender: string;
  dateOfBirth?: string | Date;
  position: string;
  status: string;
  hireDate: string | Date;
  phone?: string | null;
  militaryCertificate?: string | null;
  educationLevel?: string | null;
  currentDepartment: {
    id: string;
    name: string;
    code: string;
  };
  permits?: any[];
  educations?: any[];
  disciplinaryActions?: any[];
  rewards?: any[];
  medicalCheckups?: any[];
}

interface EmployeeListTableProps {
  employees: Employee[];
  loading: boolean;
  canEditEmployee: (deptId?: string) => boolean;
  onSelectEmployee: (employeeId: string) => void;
  onTransferEmployee: (employeeId: string) => void;
}

export const EmployeeListTable: React.FC<EmployeeListTableProps> = ({
  employees,
  loading,
  canEditEmployee,
  onSelectEmployee,
  onTransferEmployee,
}) => {
  const { t, language } = useLanguage();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {language === 'kr' ? '현재 출근' : 'FAOL'}
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
            {language === 'kr' ? '휴가 중' : "TA'TILDA"}
          </span>
        );
      case 'OFFBOARDED':
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {language === 'kr' ? '퇴사' : 'OFFBOARDED'}
          </span>
        );
      default:
        return null;
    }
  };

  const calculateTenureYears = (hireDate: string | Date): number => {
    if (!hireDate) return 0;
    const start = new Date(hireDate);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    const monthDiff = now.getMonth() - start.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < start.getDate())) {
      years--;
    }
    return Math.max(0, years);
  };

  const formatEducationLabel = (level?: string | null, educations?: any[]) => {
    const raw = level || (educations && educations[0]?.level);
    if (!raw) return language === 'kr' ? '미입력' : "Ko'rsatilmagan";
    switch (raw) {
      case 'HIGHER':
      case 'OLIY':
        return t('filter.edu_higher', "Oliy ma'lumotli");
      case 'SPECIAL_SECONDARY':
      case 'SECONDARY_SPECIAL':
      case "O'RTA_MAXSUS":
      case 'VOCATIONAL':
        return t('filter.edu_secondary', "O'rta maxsus / O'rta");
      case 'SECONDARY':
      case "O'RTA":
        return language === 'kr' ? '고졸' : "O'rta";
      case 'INCOMPLETE_HIGHER':
      case 'TUGALLANMAGAN_OLIY':
        return language === 'kr' ? '대재' : 'Tugallanmagan oliy';
      default:
        return raw;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-300 dark:border-slate-700 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-3 py-2.5">{t('table.tabel_no', 'Tabel №')} / {t('table.fio', 'F.I.O')}</th>
              <th className="px-3 py-2.5">{t('table.dept', "Bo'lim")} & {t('table.position', 'Lavozimi')}</th>
              <th className="px-3 py-2.5">{t('filter.by_edu', "Ma'lumoti")} & {language === 'kr' ? '근속년수' : 'Staj'}</th>
              <th className="px-3 py-2.5">{language === 'kr' ? '건강검진 및 포상' : "Med-Ko'rik & Mukofotlar"}</th>
              <th className="px-3 py-2.5">{language === 'kr' ? '자격증 / 허가서' : 'Ruxsatnomalar'}</th>
              <th className="px-3 py-2.5">{language === 'kr' ? '징계 처분' : 'Intizomiy Holat'}</th>
              <th className="px-3 py-2.5">{t('table.status', 'Status')}</th>
              <th className="px-3 py-2.5 text-right">{t('table.actions', 'Harakatlar')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950/40">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                    <span className="text-xs">{language === 'kr' ? '임직원 데이터를 불러오는 중...' : "Xodimlar ma'lumoti yuklanmoqda..."}</span>
                  </div>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-500 dark:text-slate-400">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                    {language === 'kr' ? '검색 조건에 일치하는 임직원이 없습니다.' : 'Tanlangan analitik filtrlarga mos keluvchi xodimlar topilmadi'}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    {language === 'kr' ? '필터 조건을 변경하거나 초기화 버튼을 눌러주세요.' : "Filtr parametrlarini o'zgartirib ko'ring yoki Reset tugmasini bosing"}
                  </p>
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const activePenalty = emp.disciplinaryActions && emp.disciplinaryActions.length > 0;
                const tenureYears = calculateTenureYears(emp.hireDate);
                const eduLabel = formatEducationLabel(emp.educationLevel, emp.educations);
                const hasRewards = emp.rewards && emp.rewards.length > 0;
                const medCheckup = emp.medicalCheckups && emp.medicalCheckups[0];

                let medBadge = null;
                if (medCheckup) {
                  const expiry = new Date(medCheckup.expiryDate);
                  const now = new Date();
                  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  if (diffDays < 0 || medCheckup.status === 'MUDDATI_TUGAGAN') {
                    medBadge = (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 px-1.5 py-0.5 text-[10px]" title="Med-ko'rik muddati o'tgan">
                        <Stethoscope className="h-3 w-3" /> {language === 'kr' ? '만료됨' : "O'tgan"}
                      </span>
                    );
                  } else if (diffDays <= 15) {
                    medBadge = (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-1.5 py-0.5 text-[10px]" title={`Muddati tugayapti: ${diffDays} kun qoldi`}>
                        <Stethoscope className="h-3 w-3" /> {diffDays} {language === 'kr' ? '일 남음' : 'kun'}
                      </span>
                    );
                  } else {
                    medBadge = (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-1.5 py-0.5 text-[10px]">
                        <Stethoscope className="h-3 w-3" /> {language === 'kr' ? '유효' : 'Amalda'}
                      </span>
                    );
                  }
                }

                return (
                  <tr key={emp.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors group">
                    {/* Tabel & Name */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-slate-800 font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-slate-700 shrink-0 text-xs">
                          {emp.firstName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                              {emp.tabelNumber}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                              {emp.lastName} {emp.firstName} {emp.middleName || ''}
                            </span>
                            <button
                              onClick={() => onSelectEmployee(emp.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer p-0.5"
                              title={t('btn.view_profile', 'Profilni ochish')}
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{emp.phone || "—"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Dept & Position */}
                    <td className="px-3 py-2">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{emp.position}</span>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                          {emp.currentDepartment?.name}
                        </p>
                      </div>
                    </td>

                    {/* Education & Tenure */}
                    <td className="px-3 py-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                          <GraduationCap className="h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />
                          <span>{eduLabel}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          <Clock className="h-3 w-3 shrink-0 text-amber-500 dark:text-amber-400" />
                          <span>{language === 'kr' ? `근속: ${tenureYears}년` : `Staj: ${tenureYears} yil`} ({formatDate(emp.hireDate)})</span>
                        </div>
                      </div>
                    </td>

                    {/* Medical & Rewards */}
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1">
                        {medBadge || <span className="text-slate-400 dark:text-slate-500 text-[10px]">{language === 'kr' ? '검진 미필' : "Med-ko'rik yo'q"}</span>}
                        {hasRewards && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold">
                            <Award className="h-3 w-3" /> {language === 'kr' ? '포상자' : 'Rag\'batlantirilgan'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Permits & Badges */}
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {emp.militaryCertificate && (
                          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            <ShieldCheck className="h-3 w-3" /> {language === 'kr' ? '군필' : 'Harbiy'}
                          </span>
                        )}
                        {emp.permits && emp.permits.length > 0 ? (
                          emp.permits.map((p: any) => (
                            <span
                              key={p.id}
                              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium border ${
                                p.licenseType === 'DRIVING'
                                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                                  : p.licenseType === 'FORKLIFT_KARA'
                                  ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20'
                                  : p.licenseType === 'MOBILE_PHONE_ON_SITE'
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                  : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                              }`}
                            >
                              {p.licenseType === 'DRIVING' && <Car className="h-3 w-3" />}
                              {p.licenseType === 'MOBILE_PHONE_ON_SITE' && <PhoneCall className="h-3 w-3" />}
                              <span>{p.category || p.licenseType}</span>
                            </span>
                          ))
                        ) : !emp.militaryCertificate ? (
                          <span className="text-slate-400 dark:text-slate-500 text-[10px]">—</span>
                        ) : null}
                      </div>
                    </td>

                    {/* Disciplinary status */}
                    <td className="px-3 py-2">
                      {activePenalty ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                          <AlertTriangle className="h-3 w-3" /> {language === 'kr' ? '징계 처분' : 'Hayfsan'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> {language === 'kr' ? '정상' : 'Intizomli'}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2">{getStatusBadge(emp.status)}</td>

                    {/* Actions */}
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectEmployee(emp.id)}
                          className="inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-700 px-2 py-1 text-[10px] font-medium text-white transition cursor-pointer active:scale-95"
                          title={t('btn.view_profile', 'Profilni ochish')}
                        >
                          <Eye className="h-3 w-3" />
                          <span>{language === 'kr' ? '프로필' : 'Profil'}</span>
                        </button>
                        <button
                          onClick={() => onTransferEmployee(emp.id)}
                          disabled={!canEditEmployee(emp.currentDepartment?.id)}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                        >
                          <ArrowLeftRight className="h-3 w-3 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400" />
                          <span>{language === 'kr' ? '부서이동' : "Ko'chirish"}</span>
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
    </div>
  );
};
