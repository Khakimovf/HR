'use client';

import React, { useState } from 'react';
import { X, ArrowLeftRight, Building, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TransferModalProps {
  employeeId: string | null;
  onClose: () => void;
  departments: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  employeeId,
  onClose,
  departments,
  onSuccess,
}) => {
  const { t, language } = useLanguage();

  const [toDepartmentId, setToDepartmentId] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>(`BUYRUK-TR-${Math.floor(Math.random() * 900) + 100}`);
  const [reason, setReason] = useState<string>(language === 'kr' ? '인력 순환 및 부서 이동' : 'Ishlab chiqarish zaruriyati va ichki rotatsiya');
  const [loading, setLoading] = useState<boolean>(false);

  if (!employeeId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toDepartmentId) {
      alert(language === 'kr' ? '발령 예정 부서를 선택하세요!' : 'Yangi bo\'limni tanlang!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          toDepartmentId,
          orderNumber,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(language === 'kr' ? '임직원이 성공적으로 발령 처리되었습니다!' : 'Xodim muvaffaqiyatli yangi bo\'limga o\'tkazildi va rotatsiya tarixi saqlandi!');
        onSuccess();
        onClose();
      } else {
        alert(`${language === 'kr' ? '오류' : 'Xatolik'}: ${data.error}`);
      }
    } catch (err) {
      alert(language === 'kr' ? '서버 연결 중 오류가 발생했습니다.' : 'Server bilan bog\'lanishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-indigo-600/20 text-blue-700 dark:text-indigo-400 border border-blue-300 dark:border-indigo-500/30">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('transfer_modal.title', 'Yangi Ko\'chirish / Buyruq Shakllantirish')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('mobility.subtitle', 'Xodimlarning bo\'limlararo o\'tishi va lavozim o\'zgarishlari jurnali')}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">
              {t('transfer_modal.target_dept', "O'tkazilayotgan Yangi Bo'lim")}:
            </label>
            <select
              value={toDepartmentId}
              onChange={(e) => setToDepartmentId(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 p-2.5 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              required
            >
              <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">-- {language === 'kr' ? '발령 예정 부서를 선택하세요' : "Yangi Bo'limni Tanlang"} --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">
              {t('transfer_modal.order_no', 'Buyruq Raqami (№)')}:
            </label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 p-2.5 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">
              {t('transfer_modal.reason', "Ko'chirish Asosi / Izoh")}:
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 p-2.5 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-200 dark:bg-slate-800 px-4 py-2 font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              {t('transfer_modal.cancel', 'Bekor qilish')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 font-bold text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (language === 'kr' ? '처리 중...' : "Ko'chirilmoqda...") : t('transfer_modal.submit', 'Saqlash va Buyruq Biriktirish')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
