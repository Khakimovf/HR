'use client';

import React, { useState } from 'react';
import { X, UserPlus, Users, Sparkles, CheckCircle, FileSpreadsheet } from 'lucide-react';

interface BulkOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

export const BulkOnboardingModal: React.FC<BulkOnboardingModalProps> = ({
  isOpen,
  onClose,
  departments,
  onSuccess,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [batchCount, setBatchCount] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleBulkOnboard = async () => {
    if (!selectedDeptId) {
      alert('Iltimos, ishga qabul qilinadigan bo\'limni tanlang!');
      return;
    }

    setLoading(true);

    const firstNames = ['Jamshid', 'Otabek', 'Sardor', 'Javohir', 'Dilshod', 'Feruz', 'Nodir', 'Rustam', 'Bekzod', 'Shaxboz', 'Madina', 'Sevara', 'Zuhra', 'Malika', 'Kamola'];
    const lastNames = ['Karimov', 'Tashmatov', 'Abdullayev', 'Usmanov', 'Raximov', 'Sultanov', 'Ismoilov', 'Yusupov', 'Nazarov', 'Tursunov'];
    const positions = ['Konveyer Yig\'uvchisi', 'Shtamplash Operatori', 'Sifat Nazoratchisi (QC)', 'Omborxona Ishchisi', 'Mехаnik Yordamchisi'];
    const educations = ['HIGHER', 'SECONDARY_SPECIAL', 'VOCATIONAL'];

    const employees = [];
    const baseTabel = Math.floor(Math.random() * 8000) + 2000;

    for (let i = 0; i < batchCount; i++) {
      const isFemale = i % 4 === 0;
      const fn = isFemale ? firstNames[10 + (i % 5)] : firstNames[i % 10];
      const ln = lastNames[i % lastNames.length];
      const pos = positions[i % positions.length];

      employees.push({
        tabelNumber: `TB-${baseTabel + i}`,
        firstName: fn,
        lastName: ln,
        middleName: 'Qobilovich',
        gender: isFemale ? 'FEMALE' : 'MALE',
        dateOfBirth: new Date(1988 + (i % 12), (i % 11), 15).toISOString(),
        hireDate: new Date().toISOString(),
        currentDepartmentId: selectedDeptId,
        position: pos,
        phone: `+998 93 ${500 + i} 12 34`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}@enterprise-hr.uz`,
        militaryCertificate: !isFemale ? `HBI-${900000 + i}` : null,
        educationLevel: educations[i % educations.length],
        institutionName: 'Toshkent Sanoat va Kasb-Hunar Kolleji',
        fieldOfStudy: 'Sanoat Muhandisligi va Mexanika',
      });
    }

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Muvaffaqiyatli: ${data.count} nafar yangi xodim bitta bosishda shtatga qabul qilindi!`);
        onSuccess();
        onClose();
      } else {
        alert(`Xatolik: ${data.error}`);
      }
    } catch (e: any) {
      alert('Tarmoq xatoligi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl glass-panel border border-slate-700 shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ommaviy Ishga Qabul Qilish Engine</h3>
              <p className="text-xs text-slate-400">30+ nafar xodimni bir vaqtning o'zida shtatga biriktirish</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Qabul Qilinadigan Bo'lim:
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-slate-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">-- Bo'limni tanlang --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Bir vaqtning o'zida qabul qilinadigan ishchilar soni:
            </label>
            <div className="flex gap-3">
              {[10, 30, 50].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setBatchCount(count)}
                  className={`flex-1 py-2 rounded-xl font-bold border transition ${
                    batchCount === count
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  +{count} kishi
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <Sparkles className="h-4 w-4" /> Avtomatik Generatsiya Parametrlari:
            </div>
            <ul className="list-disc pl-4 space-y-1">
              <li>Noyob Tabel raqami (`TB-2000` seriyasida) biriktiriladi</li>
              <li>Avtomatik harbiy guvohnoma va shaxsiy ma'lumotlar to'ldiriladi</li>
              <li>TDTU va Kollej mutaxassislik diplomlari auto-generatsiya qilinadi</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleBulkOnboard}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Shtat shakllantirilmoqda...' : `Shtatga qabul qilish (+${batchCount})`}
          </button>
        </div>
      </div>
    </div>
  );
};
