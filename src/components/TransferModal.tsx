'use client';

import React, { useState } from 'react';
import { X, ArrowLeftRight, Building, FileText } from 'lucide-react';

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
  const [toDepartmentId, setToDepartmentId] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>(`BUYRUK-TR-${Math.floor(Math.random() * 900) + 100}`);
  const [reason, setReason] = useState<string>('Ishlab chiqarish zaruriyati va ichki rotatsiya');
  const [loading, setLoading] = useState<boolean>(false);

  if (!employeeId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toDepartmentId) {
      alert('Yangi bo\'limni tanlang!');
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
        alert('Xodim muvaffaqiyatli yangi bo\'limga o\'tkazildi va rotatsiya tarixi saqlandi!');
        onSuccess();
        onClose();
      } else {
        alert(`Xatolik: ${data.error}`);
      }
    } catch (err) {
      alert('Server bilan bog\'lanishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl glass-panel border border-slate-700 shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Bo'limlararo Ko'chirish (Rotatsiya)</h3>
              <p className="text-xs text-slate-400">Buyruq va o'tkazish tarixini rasmiylashtirish</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Ko'chiriladigan Yangi Bo'lim:
            </label>
            <select
              value={toDepartmentId}
              onChange={(e) => setToDepartmentId(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-slate-100 focus:border-indigo-500 focus:outline-none"
              required
            >
              <option value="">-- Yangi Bo'limni Tanlang --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Ichki Buyruq Raqami (Order №):
            </label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Ko'chirish Asosi / Sababi:
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Ko\'chirilmoqda...' : 'Ko\'chirishni Tasdiqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
