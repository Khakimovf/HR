'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Loader2,
  ShieldCheck,
  Building2,
  User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LeaveApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: any | null;
  mode: 'APPROVE' | 'REJECT';
  currentApproverRoleLabel?: string;
}

export const LeaveApprovalModal: React.FC<LeaveApprovalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  request,
  mode,
  currentApproverRoleLabel = "Rahbar",
}) => {
  const { currentUser } = useAuth();
  const [approverName, setApproverName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      setApproverName(currentUser.fullName || '');
    } else {
      setApproverName("Mas'ul Rahbar");
    }
    setComment('');
    setErrorMsg('');
  }, [currentUser, isOpen]);

  if (!isOpen || !request) return null;

  const isApproveMode = mode === 'APPROVE';

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isApproveMode && (!comment || comment.trim().length < 3)) {
      setErrorMsg("Rad etish sababini kiritish majburiy! (kamida 3 belgi)");
      return;
    }

    setSubmitting(true);

    try {
      const endpoint = isApproveMode
        ? `/api/leave-requests/${request.id}/approve`
        : `/api/leave-requests/${request.id}/reject`;

      const payload = isApproveMode
        ? { approverName, comment }
        : { approverName, rejectionComment: comment };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || "Amalni bajarishda xatolik yuz berdi");
      }
    } catch (err: any) {
      setErrorMsg("Tarmoq xatoligi: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 ${
            isApproveMode
              ? 'bg-emerald-50 dark:bg-emerald-950/60'
              : 'bg-rose-50 dark:bg-rose-950/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center border font-bold ${
                isApproveMode
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
              }`}
            >
              {isApproveMode ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isApproveMode ? "Arizani Tasdiqlash" : "Arizani Rad Etish (To'xtatish)"}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Bosqich {request.currentStep}: <strong className="text-slate-900 dark:text-slate-200 font-bold">{currentApproverRoleLabel}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleAction} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3 text-xs text-rose-800 dark:text-rose-400 font-semibold">
              <AlertOctagon className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Request summary info */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Arizachi:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {request.employee?.lastName} {request.employee?.firstName} [{request.employee?.tabelNumber}]
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Bo'lim:</span>
              <span className="text-slate-800 dark:text-slate-300 font-medium">{request.employee?.currentDepartment?.name || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Muddati:</span>
              <span className="font-mono text-blue-600 dark:text-amber-400 font-bold">
                {new Date(request.startDate).toLocaleDateString('uz-UZ')} — {new Date(request.endDate).toLocaleDateString('uz-UZ')} ({request.totalDays} kun)
              </span>
            </div>
            <div className="pt-1 text-[11px] text-slate-600 dark:text-slate-400 italic font-medium">"{request.reason}"</div>
          </div>

          {/* Rejection stopper warning */}
          {!isApproveMode && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3 text-[11px] text-rose-800 dark:text-rose-300 space-y-1 font-medium">
              <div className="font-bold flex items-center gap-1.5 text-rose-800 dark:text-rose-400">
                <AlertOctagon className="h-4 w-4" />
                RAD ETISH WORKFLOW STOPPER
              </div>
              <p>
                Ushbu bosqichda rad etilsa, ariza holati <strong className="text-slate-900 dark:text-white font-bold">REJECTED</strong> ga o'tadi, keyingi bosqichlar to'xtatiladi va arizachiga bildirishnoma yuboriladi.
              </p>
            </div>
          )}

          {/* Approver Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-blue-600 dark:text-indigo-400" />
              Imzo Quyuvchi F.I.O / Mansab:
            </label>
            <input
              type="text"
              value={approverName}
              onChange={(e) => setApproverName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none font-medium"
              required
            />
          </div>

          {/* Comment / Reason */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {isApproveMode ? "Tasdiqlash Izohi (Ixtiyoriy):" : "Rad Etish Sababi (MAJBURIY):"}
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isApproveMode
                  ? "Masalan: Kelishildi, ma'qullandi..."
                  : "Iltimos, rad etish sababini aniq ko'rsating..."
              }
              className={`w-full rounded-xl border p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none font-medium ${
                !isApproveMode
                  ? 'border-rose-300 dark:border-rose-500/50 bg-rose-50/50 dark:bg-rose-950/20 focus:border-rose-500'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-emerald-500'
              }`}
              required={!isApproveMode}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
            >
              Bekor qilish
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50 ${
                isApproveMode
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Bajarilmoqda...
                </>
              ) : isApproveMode ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Tasdiqlash (Bosqich {request.currentStep})
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Rad Etish
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
