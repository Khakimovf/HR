'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  GraduationCap,
  Award,
  ArrowLeftRight,
  Calendar,
  ShieldAlert,
  Clock,
  Car,
  PhoneCall,
  Trash2,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { calculateTenure } from '@/lib/kpi';
import { formatDate, formatCurrency } from '@/lib/utils';

interface EmployeeProfileModalProps {
  employeeId: string | null;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employeeId,
  onClose,
  onRefreshData,
}) => {
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal_edu' | 'transfers' | 'leaves' | 'discipline_rewards' | 'permits'>('personal_edu');

  React.useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    fetch(`/api/employees/${employeeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEmployee(data.employee);
        }
      })
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (!employeeId) return null;

  const tenure = employee ? calculateTenure(employee.hireDate) : { formatted: '...' };

  const handleOffboard = async () => {
    if (!confirm('Ushbu xodim bilan mehnat shartnomasini bekor qilishni (Offboard) tasdiqlaysizmi?')) return;
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'OFFBOARD' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Xodim muvaffaqiyatli mehnat shartnomasi bekor qilindi (Offboarded)');
        if (onRefreshData) onRefreshData();
        onClose();
      }
    } catch (e) {
      alert('Xatolik yuz berdi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl glass-panel border border-slate-700/80 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-lg font-bold text-white shadow-lg shadow-indigo-600/30">
              {employee ? employee.firstName[0] : 'X'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  {employee ? `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}` : 'Yuklanmoqda...'}
                </h3>
                {employee && (
                  <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {employee.tabelNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {employee?.position} • {employee?.currentDepartment?.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Profil ma'lumotlari yuklanmoqda...
          </div>
        ) : !employee ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Xodim topilmadi
          </div>
        ) : (
          <div>
            {/* 5-Tab Navigation Header */}
            <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/60 px-6">
              {[
                { id: 'personal_edu', label: "1. Shaxsiy Ma'lumotlar & Ta'lim", icon: User },
                { id: 'transfers', label: "2. Bo'limlar Rotatsiya Tarixi", icon: ArrowLeftRight },
                { id: 'leaves', label: "3. Ta'til va Davomat Log", icon: Calendar },
                { id: 'discipline_rewards', label: "4. Intizomiy Jazo & Mukofotlar", icon: ShieldAlert },
                { id: 'permits', label: "5. Ruxsatnoma & Guvohnomalar", icon: Award },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-xs font-semibold whitespace-nowrap transition ${
                      isActive
                        ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Tab 1: Personal Data & Education */}
              {activeTab === 'personal_edu' && (
                <div className="space-y-6 text-xs">
                  {/* Tenure / Staj Banner */}
                  <div className="rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-xs uppercase font-bold tracking-wider text-indigo-300">
                          Umumiy Mehnat Staji (Auto-Calculated)
                        </span>
                        <div className="text-xl font-extrabold text-white mt-0.5">
                          {tenure.formatted}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400">Ishga qabul qilingan sana:</span>
                      <div className="font-mono text-sm font-semibold text-slate-200">
                        {formatDate(employee.hireDate)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card rounded-xl p-4 space-y-3">
                      <h4 className="font-bold text-slate-200 border-b border-slate-700/60 pb-2 flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-400" /> Shaxsiy Ma'lumotlar
                      </h4>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Jinsi:</span>
                        <span className="font-semibold text-slate-200">
                          {employee.gender === 'MALE' ? 'Erkak' : 'Ayol'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Tug'ilgan sanasi:</span>
                        <span className="font-semibold text-slate-200 font-mono">
                          {formatDate(employee.dateOfBirth)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Telefon:</span>
                        <span className="font-semibold text-indigo-300 font-mono">
                          {employee.phone || 'Kiritilmagan'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Elektron pochta:</span>
                        <span className="font-semibold text-slate-200 font-mono">
                          {employee.email || 'Kiritilmagan'}
                        </span>
                      </div>
                    </div>

                    <div className="glass-card rounded-xl p-4 space-y-3">
                      <h4 className="font-bold text-slate-200 border-b border-slate-700/60 pb-2 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" /> Harbiylik & Shtat
                      </h4>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Harbiy guvohnoma:</span>
                        <span className="font-semibold text-emerald-400">
                          {employee.militaryCertificate || 'Mavjud emas'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Hozirgi Bo'lim:</span>
                        <span className="font-semibold text-slate-200">
                          {employee.currentDepartment?.name}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Shtat holati:</span>
                        <span className="font-bold text-emerald-400">{employee.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Education details */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-200 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-purple-400" /> Oliy va Maxsus Ta'lim Dargohi
                    </h4>
                    {employee.educations && employee.educations.length > 0 ? (
                      employee.educations.map((edu: any) => (
                        <div key={edu.id} className="glass-card rounded-xl p-4 border border-slate-800 flex justify-between items-center">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-indigo-500/20 text-indigo-300 px-2 py-0.5 font-semibold text-[10px]">
                                {edu.level}
                              </span>
                              <span className="font-bold text-slate-100">{edu.institutionName}</span>
                            </div>
                            <p className="text-slate-300">Mutaxassislik: <span className="font-semibold text-white">{edu.fieldOfStudy}</span></p>
                          </div>
                          <div className="text-right font-mono text-slate-400">
                            Bitirgan yili: <span className="font-bold text-indigo-400">{edu.graduationYear}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400">Ta'lim ma'lumotlari kiritilmagan</p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={handleOffboard}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 px-4 py-2 text-xs font-semibold hover:bg-rose-600 hover:text-white transition"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Mehnat Shartnomasini Bekor Qilish (Offboard)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Department Transfer & Mobility History */}
              {activeTab === 'transfers' && (
                <div className="space-y-4 text-xs">
                  <h4 className="font-bold text-slate-200 mb-2">Bo'limlararo Ko'chish Tarixi (Internal Mobility Logs)</h4>
                  {employee.transfers && employee.transfers.length > 0 ? (
                    employee.transfers.map((tr: any) => (
                      <div key={tr.id} className="glass-card rounded-xl p-4 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="text-rose-300">{tr.fromDepartment?.name}</span>
                            <ArrowLeftRight className="h-4 w-4 text-indigo-400" />
                            <span className="text-emerald-300">{tr.toDepartment?.name}</span>
                          </div>
                          <span className="font-mono text-slate-400">{formatDate(tr.transferDate)}</span>
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          Buyruq №: <span className="font-mono text-slate-200">{tr.orderNumber}</span> • Sababi: {tr.reason || 'Kadrlar rotatsiyasi'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400">Xodim boshqa bo'limga ko'chirilmagan</p>
                  )}
                </div>
              )}

              {/* Tab 3: Leaves & Absences (M/T, B/S, B/L) */}
              {activeTab === 'leaves' && (
                <div className="space-y-4 text-xs">
                  <h4 className="font-bold text-slate-200 mb-2">Ta'til va Davomat Tarixi (M/T, B/S, B/L, Otgul, Kechikishlar)</h4>
                  {employee.leaves && employee.leaves.length > 0 ? (
                    <div className="space-y-2">
                      {employee.leaves.map((lv: any) => (
                        <div key={lv.id} className="glass-card rounded-xl p-3.5 flex items-center justify-between border border-slate-800">
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                              lv.type === 'MT' ? 'bg-blue-500/20 text-blue-300' :
                              lv.type === 'BS' ? 'bg-amber-500/20 text-amber-300' :
                              lv.type === 'BL' ? 'bg-rose-500/20 text-rose-300' :
                              'bg-purple-500/20 text-purple-300'
                            }`}>
                              {lv.type}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-200">
                                {formatDate(lv.startDate)} — {formatDate(lv.endDate)} ({lv.totalDays} kun)
                              </div>
                              <p className="text-[11px] text-slate-400">{lv.reason || 'Izohsiz'}</p>
                            </div>
                          </div>

                          {lv.hoursLate && (
                            <span className="font-mono text-rose-400 font-bold text-xs">
                              +{lv.hoursLate} soat kechikish
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400">Ta'til va davomat yozuvlari mavjud emas</p>
                  )}
                </div>
              )}

              {/* Tab 4: Penalties & Rewards */}
              {activeTab === 'discipline_rewards' && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h4 className="font-bold text-rose-400 mb-2 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4" /> Intizomiy Jazo Choralari va Hayfsanlar
                    </h4>
                    {employee.disciplinaryActions && employee.disciplinaryActions.length > 0 ? (
                      <div className="space-y-2">
                        {employee.disciplinaryActions.map((d: any) => (
                          <div key={d.id} className="glass-card rounded-xl p-3.5 border border-rose-500/30 bg-rose-500/5 flex justify-between items-center">
                            <div>
                              <div className="font-bold text-rose-300">{d.type} — Buyruq № {d.orderNumber}</div>
                              <p className="text-slate-400">{d.notes}</p>
                            </div>
                            <div className="text-right font-mono text-[11px] text-slate-400">
                              <div>Berilgan: {formatDate(d.startDate)}</div>
                              <div>Muddati: {formatDate(d.expiryDate)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400">Intizomiy jazolar mavjud emas</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-2">
                      <Award className="h-4 w-4" /> Mukofotlar va Moddiy Yordam Logi
                    </h4>
                    {employee.rewards && employee.rewards.length > 0 ? (
                      <div className="space-y-2">
                        {employee.rewards.map((r: any) => (
                          <div key={r.id} className="glass-card rounded-xl p-3.5 border border-emerald-500/30 bg-emerald-500/5 flex justify-between items-center">
                            <div>
                              <div className="font-bold text-emerald-300">{r.type} — Buyruq № {r.orderNumber}</div>
                              <p className="text-slate-400">{r.reason}</p>
                            </div>
                            <div className="text-right font-mono">
                              <div className="font-bold text-emerald-400 text-sm">{formatCurrency(r.amount)}</div>
                              <span className="text-[10px] text-slate-400">{formatDate(r.orderDate)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400">Mukofotlar kiritilmagan</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 5: Permits & Licenses */}
              {activeTab === 'permits' && (
                <div className="space-y-4 text-xs">
                  <h4 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-400" /> Special Permits, Driving Licenses & Access Badges
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {employee.permits && employee.permits.length > 0 ? (
                      employee.permits.map((p: any) => (
                        <div key={p.id} className="glass-card rounded-xl p-4 border border-slate-800 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-indigo-300 text-sm">{p.licenseType}</span>
                            <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold border border-emerald-500/20">
                              {p.status}
                            </span>
                          </div>
                          <div className="text-slate-300">
                            Kategoriya / Turi: <span className="font-semibold text-white">{p.category || 'N/A'}</span>
                          </div>
                          <div className="text-slate-400 font-mono text-[11px]">
                            Guvohnoma №: {p.certificateNo}
                          </div>
                          <div className="flex justify-between text-slate-400 text-[10px] pt-2 border-t border-slate-800">
                            <span>Berilgan: {formatDate(p.issueDate)}</span>
                            <span>Amal qilish: {formatDate(p.expiryDate)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 col-span-2">Ruxsatnomalar kiritilmagan</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
