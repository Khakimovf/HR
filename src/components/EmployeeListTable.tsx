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
    if (!raw) return "Ko'rsatilmagan";
    switch (raw) {
      case 'HIGHER':
      case 'OLIY':
        return 'Oliy';
      case 'SPECIAL_SECONDARY':
      case 'SECONDARY_SPECIAL':
      case "O'RTA_MAXSUS":
      case 'VOCATIONAL':
        return "O'rta-maxsus";
      case 'SECONDARY':
      case "O'RTA":
        return "O'rta";
      case 'INCOMPLETE_HIGHER':
      case 'TUGALLANMAGAN_OLIY':
        return 'Tugallanmagan oliy';
      default:
        return raw;
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-2xl">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
          <tr>
            <th className="px-4 py-3.5">Tabel № / F.I.O</th>
            <th className="px-4 py-3.5">Bo'lim & Lavozim</th>
            <th className="px-4 py-3.5">Ma'lumot & Staj</th>
            <th className="px-4 py-3.5">Med-Ko'rik & Mukofotlar</th>
            <th className="px-4 py-3.5">Ruxsatnomalar</th>
            <th className="px-4 py-3.5">Intizomiy Holat</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5 text-right">Harakatlar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
          {loading ? (
            <tr>
              <td colSpan={8} className="text-center py-12 text-slate-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <span>Xodimlar ma'lumoti yuklanmoqda...</span>
                </div>
              </td>
            </tr>
          ) : employees.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-12 text-slate-400">
                <p className="font-semibold text-slate-300">
                  Tanlangan analitik filtrlarga mos keluvchi xodimlar topilmadi
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Filtr parametrlarini o'zgartirib ko'ring yoki Reset tugmasini bosing
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
                    <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 text-[10px]" title="Med-ko'rik muddati o'tgan">
                      <Stethoscope className="h-3 w-3" /> O'tgan
                    </span>
                  );
                } else if (diffDays <= 15) {
                  medBadge = (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 text-[10px]" title={`Muddati tugayapti: ${diffDays} kun qoldi`}>
                      <Stethoscope className="h-3 w-3" /> {diffDays} kun
                    </span>
                  );
                } else {
                  medBadge = (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 text-[10px]">
                      <Stethoscope className="h-3 w-3" /> Amalda
                    </span>
                  );
                }
              }

              return (
                <tr key={emp.id} className="hover:bg-slate-900/60 transition group">
                  {/* Tabel & Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 font-bold text-indigo-400 border border-slate-700 shrink-0">
                        {emp.firstName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-indigo-400">
                            {emp.tabelNumber}
                          </span>
                          <span className="font-semibold text-slate-100">
                            {emp.lastName} {emp.firstName} {emp.middleName || ''}
                          </span>
                          <button
                            onClick={() => onSelectEmployee(emp.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-400 transition cursor-pointer p-0.5"
                            title="✏️ Profil kartasini va ma'lumotlarni tahrirlash"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">{emp.phone || "Telefon yo'q"}</p>
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

                  {/* Education & Tenure */}
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-[11px] text-indigo-300 font-medium">
                        <GraduationCap className="h-3 w-3 shrink-0 text-indigo-400" />
                        <span>{eduLabel}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <Clock className="h-3 w-3 shrink-0 text-amber-400" />
                        <span>Staj: {tenureYears} yil ({formatDate(emp.hireDate)})</span>
                      </div>
                    </div>
                  </td>

                  {/* Medical & Rewards */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {medBadge || <span className="text-slate-500 text-[10px]">Med-ko'rik yo'q</span>}
                      {hasRewards && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold">
                          <Award className="h-3 w-3" /> Rag'batlantirilgan
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Permits & Badges */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {emp.militaryCertificate && (
                        <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <ShieldCheck className="h-3 w-3" /> Harbiy
                        </span>
                      )}
                      {emp.permits && emp.permits.length > 0 ? (
                        emp.permits.map((p: any) => (
                          <span
                            key={p.id}
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium border ${
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
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400 border border-rose-500/20">
                        <AlertTriangle className="h-3 w-3" /> Hayfsan
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
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectEmployee(emp.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600/80 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-indigo-500 transition cursor-pointer active:scale-95"
                        title="✏️ Profil kartasini va 5 seksiyali ma'lumotlarni tahrirlash"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Profil</span>
                      </button>
                      <button
                        onClick={() => onTransferEmployee(emp.id)}
                        disabled={!canEditEmployee(emp.currentDepartment?.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                        title={
                          canEditEmployee(emp.currentDepartment?.id)
                            ? "Boshqa bo'limga ko'chirish (Rotatsiya)"
                            : "🔒 Faqat biriktirilgan bo'lim xodimlarini ko'chirishingiz mumkin"
                        }
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
  );
};
