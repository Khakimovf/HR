'use client';

import React, { useState } from 'react';
import {
  X,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  Briefcase,
  ClipboardCheck,
  Phone,
  Mail,
  Calendar,
  Hash,
  Building2,
  GraduationCap,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface SingleEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Array<{ id: string; name: string; code?: string }>;
  onSuccess: () => void;
}

interface FormData {
  // Step 1 – Personal
  firstName: string;
  lastName: string;
  middleName: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth: string;
  phone: string;
  email: string;
  militaryCertificate: string;
  // Step 2 – Job
  tabelNumber: string;
  currentDepartmentId: string;
  position: string;
  hireDate: string;
  educationLevel: string;
  institutionName: string;
  fieldOfStudy: string;
}

const INITIAL: FormData = {
  firstName: '',
  lastName: '',
  middleName: '',
  gender: 'MALE',
  dateOfBirth: '',
  phone: '',
  email: '',
  militaryCertificate: '',
  tabelNumber: '',
  currentDepartmentId: '',
  position: '',
  hireDate: new Date().toISOString().split('T')[0],
  educationLevel: 'HIGHER',
  institutionName: '',
  fieldOfStudy: '',
};

const EDUCATION_LABELS: Record<string, string> = {
  HIGHER: 'Oliy ta\'lim',
  SECONDARY_SPECIAL: 'O\'rta maxsus',
  VOCATIONAL: 'Kasb-hunar',
  SECONDARY: 'O\'rta ta\'lim',
};

const STEPS = [
  { id: 1, label: 'Shaxsiy Ma\'lumotlar', icon: User },
  { id: 2, label: 'Ish Ma\'lumotlari', icon: Briefcase },
  { id: 3, label: 'Tasdiqlash', icon: ClipboardCheck },
];

export const SingleEmployeeModal: React.FC<SingleEmployeeModalProps> = ({
  isOpen,
  onClose,
  departments,
  onSuccess,
}) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!isOpen) return null;

  const set = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateStep1 = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.lastName.trim()) errs.lastName = 'Familiya kiritilishi shart';
    if (!form.firstName.trim()) errs.firstName = 'Ism kiritilishi shart';
    if (!form.dateOfBirth) errs.dateOfBirth = 'Tug\'ilgan sana kiritilishi shart';
    if (form.phone && !/^\+?[\d\s\-()]{9,15}$/.test(form.phone))
      errs.phone = 'Telefon raqami noto\'g\'ri formatda';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Email manzil noto\'g\'ri';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.tabelNumber.trim()) errs.tabelNumber = 'Tabel raqami kiritilishi shart';
    if (!form.currentDepartmentId) errs.currentDepartmentId = 'Bo\'lim tanlanishi shart';
    if (!form.position.trim()) errs.position = 'Lavozim kiritilishi shart';
    if (!form.hireDate) errs.hireDate = 'Ishga kirgan sana kiritilishi shart';
    if (!form.institutionName.trim()) errs.institutionName = 'Ta\'lim muassasasi kiritilishi shart';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const back = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError('');
    try {
      const payload = {
        employees: [
          {
            tabelNumber: form.tabelNumber,
            firstName: form.firstName,
            lastName: form.lastName,
            middleName: form.middleName || null,
            gender: form.gender,
            dateOfBirth: new Date(form.dateOfBirth).toISOString(),
            hireDate: new Date(form.hireDate).toISOString(),
            currentDepartmentId: form.currentDepartmentId,
            position: form.position,
            phone: form.phone || null,
            email: form.email || null,
            militaryCertificate: form.gender === 'MALE' && form.militaryCertificate ? form.militaryCertificate : null,
            educationLevel: form.educationLevel,
            institutionName: form.institutionName,
            fieldOfStudy: form.fieldOfStudy || 'Umumiy mutaxassislik',
          },
        ],
      };

      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        onSuccess();
        handleClose();
      } else {
        setSubmitError(data.error || 'Noma\'lum xatolik yuz berdi');
      }
    } catch {
      setSubmitError('Tarmoq xatoligi. Qaytadan urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setForm(INITIAL);
    setErrors({});
    setSubmitError('');
    onClose();
  };

  const selectedDept = departments.find((d) => d.id === form.currentDepartmentId);

  const FieldError = ({ field }: { field: keyof FormData }) =>
    errors[field] ? (
      <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-400">
        <AlertCircle className="h-3 w-3" />
        {errors[field]}
      </p>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f1526 0%, #141d35 100%)' }}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-600/30">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Yangi Xodim Ro'yxatga Olish</h3>
              <p className="text-[11px] text-slate-400">Qadam {step} / 3 — {STEPS[step - 1].label}</p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-0 px-6 pt-5 pb-2">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                    done ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                      : active ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                      : 'border-slate-700 bg-slate-900/60 text-slate-600'
                  }`}>
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-[10px] font-medium ${active ? 'text-indigo-400' : done ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {s.label.split(' ')[0]}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 rounded transition-all ${done ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Form Body */}
        <div className="px-6 pb-2 pt-3 space-y-3 max-h-[55vh] overflow-y-auto">

          {/* ── STEP 1: Personal Info ── */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Familiya *</label>
                  <input value={form.lastName} onChange={(e) => set('lastName', e.target.value)}
                    placeholder="Karimov" className="input-field" />
                  <FieldError field="lastName" />
                </div>
                <div>
                  <label className="label-field">Ism *</label>
                  <input value={form.firstName} onChange={(e) => set('firstName', e.target.value)}
                    placeholder="Jamshid" className="input-field" />
                  <FieldError field="firstName" />
                </div>
              </div>

              <div>
                <label className="label-field">Otasining ismi</label>
                <input value={form.middleName} onChange={(e) => set('middleName', e.target.value)}
                  placeholder="Qobilovich" className="input-field" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Jinsi *</label>
                  <select value={form.gender} onChange={(e) => set('gender', e.target.value as 'MALE' | 'FEMALE')}
                    className="input-field">
                    <option value="MALE">Erkak</option>
                    <option value="FEMALE">Ayol</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">Tug'ilgan sana *</label>
                  <input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)}
                    className="input-field" />
                  <FieldError field="dateOfBirth" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">
                    <Phone className="inline h-3 w-3 mr-1" />Telefon
                  </label>
                  <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
                    placeholder="+998 90 123 45 67" className="input-field" />
                  <FieldError field="phone" />
                </div>
                <div>
                  <label className="label-field">
                    <Mail className="inline h-3 w-3 mr-1" />Email
                  </label>
                  <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                    placeholder="ism@enterprise.uz" className="input-field" />
                  <FieldError field="email" />
                </div>
              </div>

              {form.gender === 'MALE' && (
                <div>
                  <label className="label-field">Harbiy Guvohnoma raqami</label>
                  <input value={form.militaryCertificate} onChange={(e) => set('militaryCertificate', e.target.value)}
                    placeholder="HBI-900123" className="input-field" />
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Job Details ── */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">
                    <Hash className="inline h-3 w-3 mr-1" />Tabel raqami *
                  </label>
                  <input value={form.tabelNumber} onChange={(e) => set('tabelNumber', e.target.value)}
                    placeholder="TB-2541" className="input-field font-mono" />
                  <FieldError field="tabelNumber" />
                </div>
                <div>
                  <label className="label-field">
                    <Calendar className="inline h-3 w-3 mr-1" />Ishga kirgan sana *
                  </label>
                  <input type="date" value={form.hireDate} onChange={(e) => set('hireDate', e.target.value)}
                    className="input-field" />
                  <FieldError field="hireDate" />
                </div>
              </div>

              <div>
                <label className="label-field">
                  <Building2 className="inline h-3 w-3 mr-1" />Bo'lim *
                </label>
                <select value={form.currentDepartmentId} onChange={(e) => set('currentDepartmentId', e.target.value)}
                  className="input-field">
                  <option value="">-- Bo'lim tanlang --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <FieldError field="currentDepartmentId" />
              </div>

              <div>
                <label className="label-field">Lavozim *</label>
                <input value={form.position} onChange={(e) => set('position', e.target.value)}
                  placeholder="Konveyer Yig'uvchisi" className="input-field" />
                <FieldError field="position" />
              </div>

              <div>
                <label className="label-field">
                  <GraduationCap className="inline h-3 w-3 mr-1" />Ta'lim darajasi *
                </label>
                <select value={form.educationLevel} onChange={(e) => set('educationLevel', e.target.value)}
                  className="input-field">
                  {Object.entries(EDUCATION_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-field">Ta'lim muassasasi *</label>
                <input value={form.institutionName} onChange={(e) => set('institutionName', e.target.value)}
                  placeholder="Toshkent Sanoat Kolleji" className="input-field" />
                <FieldError field="institutionName" />
              </div>

              <div>
                <label className="label-field">Mutaxassislik yo'nalishi</label>
                <input value={form.fieldOfStudy} onChange={(e) => set('fieldOfStudy', e.target.value)}
                  placeholder="Sanoat Muhandisligi" className="input-field" />
              </div>
            </div>
          )}

          {/* ── STEP 3: Confirm ── */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">Shaxsiy Ma'lumotlar</p>
                <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-300">
                  <span className="text-slate-500">F.I.O.</span>
                  <span className="font-semibold text-white">{form.lastName} {form.firstName} {form.middleName}</span>
                  <span className="text-slate-500">Jinsi</span>
                  <span>{form.gender === 'MALE' ? 'Erkak' : 'Ayol'}</span>
                  <span className="text-slate-500">Tug'ilgan sana</span>
                  <span>{form.dateOfBirth}</span>
                  <span className="text-slate-500">Telefon</span>
                  <span>{form.phone || '—'}</span>
                  <span className="text-slate-500">Email</span>
                  <span className="truncate">{form.email || '—'}</span>
                  {form.gender === 'MALE' && (
                    <>
                      <span className="text-slate-500">Harbiy Guvohnoma</span>
                      <span className="font-mono">{form.militaryCertificate || '—'}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-400">Ish Ma'lumotlari</p>
                <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-300">
                  <span className="text-slate-500">Tabel №</span>
                  <span className="font-mono font-semibold text-indigo-300">{form.tabelNumber}</span>
                  <span className="text-slate-500">Bo'lim</span>
                  <span className="font-semibold text-white">{selectedDept?.name || '—'}</span>
                  <span className="text-slate-500">Lavozim</span>
                  <span>{form.position}</span>
                  <span className="text-slate-500">Ishga kirgan</span>
                  <span>{form.hireDate}</span>
                  <span className="text-slate-500">Ta'lim</span>
                  <span>{EDUCATION_LABELS[form.educationLevel]}</span>
                  <span className="text-slate-500">Muassasa</span>
                  <span className="truncate">{form.institutionName}</span>
                </div>
              </div>

              {submitError && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 flex items-center gap-2 text-rose-400 text-xs">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {submitError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 mt-2">
          <button
            onClick={back}
            disabled={step === 1}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="h-4 w-4" />
            Orqaga
          </button>

          <div className="flex items-center gap-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`h-1.5 rounded-full transition-all ${
                step === n ? 'w-6 bg-indigo-500' : step > n ? 'w-1.5 bg-emerald-500' : 'w-1.5 bg-slate-700'
              }`} />
            ))}
          </div>

          {step < 3 ? (
            <button
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition"
            >
              Keyingisi
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50 active:scale-95 transition"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {loading ? 'Saqlanmoqda...' : 'Xodimni Ro\'yxatga Olish'}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          border-radius: 0.75rem;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgb(51, 65, 85);
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          color: rgb(226, 232, 240);
          transition: border-color 0.15s;
          outline: none;
        }
        .input-field:focus {
          border-color: rgb(99, 102, 241);
          box-shadow: 0 0 0 1px rgb(99, 102, 241);
        }
        .input-field option {
          background: rgb(15, 23, 42);
        }
        .label-field {
          display: block;
          font-size: 0.6875rem;
          font-weight: 600;
          color: rgb(148, 163, 184);
          margin-bottom: 0.375rem;
        }
      `}</style>
    </div>
  );
};
