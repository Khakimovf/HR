'use client';

import React from 'react';
import {
  X,
  User,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Printer,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { APPROVAL_STEPS_CONFIG } from '@/lib/leaveConfig';
import { formatDate } from '@/lib/utils';

const TYPE_META: Record<string, { label: string; short: string; bgClass: string; textClass: string; borderClass: string }> = {
  BS_UNPAID:     { label: "O'z hisobidan ta'til", short: 'B/S', bgClass: 'bg-amber-100 dark:bg-amber-500/20', textClass: 'text-amber-800 dark:text-amber-300', borderClass: 'border-amber-300 dark:border-amber-500/30' },
  MEHNAT_TATILI: { label: "Mehnat ta'tili", short: 'M/T', bgClass: 'bg-blue-100 dark:bg-blue-500/20', textClass: 'text-blue-800 dark:text-blue-300', borderClass: 'border-blue-300 dark:border-blue-500/30' },
  SICK_LEAVE_BL: { label: "Vaqtincha mehnatka layoqatsizlik", short: 'B/L', bgClass: 'bg-rose-100 dark:bg-rose-500/20', textClass: 'text-rose-800 dark:text-rose-300', borderClass: 'border-rose-300 dark:border-rose-500/30' },
  HOURLY_PERMIT: { label: "Kechikish / soatli ruxsatnoma", short: 'RUX', bgClass: 'bg-emerald-100 dark:bg-emerald-500/20', textClass: 'text-emerald-800 dark:text-emerald-300', borderClass: 'border-emerald-300 dark:border-emerald-500/30' },
};

interface LeaveRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any | null;
  onApprove?: (request: any) => void;
  onReject?: (request: any) => void;
  onPrint?: (request: any) => void;
}

export const LeaveRequestDetailModal: React.FC<LeaveRequestDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
  onPrint,
}) => {
  if (!isOpen || !request) return null;

  const typeMeta = TYPE_META[request.type] || TYPE_META.BS_UNPAID;
  const isApproved = request.status === 'APPROVED';
  const isRejected = request.status === 'REJECTED';
  const isPending  = request.status === 'PENDING';

  const stepsMap = new Map<number, any>();
  if (request.approvalSteps) {
    request.approvalSteps.forEach((s: any) => {
      stepsMap.set(s.stepNumber, s);
    });
  }

  const currentStepConfig = APPROVAL_STEPS_CONFIG.find((s) => s.stepNumber === request.currentStep);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/90">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-cyan-500/20 border border-blue-200 dark:border-cyan-500/30 flex items-center justify-center text-blue-600 dark:text-cyan-400 font-bold">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Ariza Tafsilotlari & Ish Oqimi</h3>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-blue-700 dark:text-indigo-300 border border-slate-300 dark:border-slate-700 font-bold">
                  #ARIZ-{request.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">6-Bosqichli rahbarlar tasdiqlashi va to'liq ma'lumot jurnali</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                isApproved
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                  : isRejected
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
              }`}
            >
              {request.status}
            </span>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          
          {/* SECTION 1: APPLICANT PROFILE SUMMARY */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-blue-600 dark:text-indigo-400" />
              1. Arizachi Xodim Profili
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-blue-600 dark:bg-gradient-to-tr dark:from-indigo-600 dark:to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                  {request.employee?.firstName?.[0]}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>
                      {request.employee?.lastName} {request.employee?.firstName} {request.employee?.middleName || ''}
                    </span>
                    <span className="font-mono text-xs text-blue-600 dark:text-indigo-400 font-bold">
                      [{request.employee?.tabelNumber}]
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-0.5 font-medium">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    <span>{request.employee?.currentDepartment?.name || "Bo'lim biriktirilmagan"}</span>
                    <span>•</span>
                    <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                    <span>{request.employee?.position || 'Xodim'}</span>
                  </div>
                </div>
              </div>

              {request.employee?.hireDate && (
                <div className="text-right text-xs text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] block font-medium">Ishga Kirgan Sana:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-200">{formatDate(request.employee.hireDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: APPLICATION SPECIFICS */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
              2. Ariza Parametrlari va Muddati
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1 font-medium">Ariza Turi:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${typeMeta.bgClass} ${typeMeta.textClass} ${typeMeta.borderClass}`}>
                  {typeMeta.label}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1 font-medium">Ta'til Muddati:</span>
                <div className="font-mono font-bold text-slate-900 dark:text-slate-200">
                  {formatDate(request.startDate)} — {formatDate(request.endDate)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5 font-medium">Jami Kunlar:</span>
                  <span className="font-mono text-base font-extrabold text-blue-600 dark:text-amber-400">
                    {request.totalDays} kun
                  </span>
                </div>
                <div className="text-right text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                  Submitted:
                  <div className="text-slate-900 dark:text-slate-300 font-bold">{formatDate(request.requestDate || request.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: FULL REASON & DESCRIPTION (UNLIMITED TEXT VIEW) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-purple-400" />
              3. Ariza Sababi va Matni (To'liq Ko'rinish)
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 p-4 text-xs text-slate-900 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words max-h-48 overflow-y-auto shadow-inner font-medium">
              {request.reason || "Sabab ko'rsatilmadi"}
            </div>
          </div>

          {/* SECTION 4: INTERACTIVE 6-STEP APPROVAL TIMELINE */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-emerald-400" />
                4. 6-Bosqichli Imzo Ish Oqimi Taymlayni
              </div>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-cyan-400">
                {isApproved
                  ? '6/6 Bosqich Yakunlandi'
                  : isRejected
                  ? `Bosqich #${request.currentStep} da Rad Etildi`
                  : `Bosqich #${request.currentStep} Ko'rib Chiqilmoqda`}
              </span>
            </div>

            {/* Stepper Timeline Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {APPROVAL_STEPS_CONFIG.map((cfg) => {
                const stepData = stepsMap.get(cfg.stepNumber);
                const isStepDone = stepData?.status === 'APPROVED';
                const isStepRejected = stepData?.status === 'REJECTED';
                const isCurrentStep = request.currentStep === cfg.stepNumber && isPending;

                const stepLabel =
                  cfg.stepNumber === 3
                    ? request.step3ApproverType === 'BOSHQARMA_BOSHLIGI'
                      ? "Boshqarma Boshlig'i"
                      : "Texnik Direktor"
                    : cfg.label;

                return (
                  <div
                    key={cfg.stepNumber}
                    className={`rounded-xl border p-3.5 transition-all text-xs space-y-1.5 ${
                      isStepDone
                        ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200 font-bold'
                        : isStepRejected
                        ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200 font-bold'
                        : isCurrentStep
                        ? 'border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 text-slate-600 dark:text-slate-500 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[11px] text-blue-600 dark:text-indigo-400">
                          #{cfg.stepNumber}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-200">{stepLabel}</span>
                      </div>

                      {isStepDone ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" /> TASDIQLANDI
                        </span>
                      ) : isStepRejected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30">
                          <XCircle className="h-3 w-3" /> RAD ETILDI
                        </span>
                      ) : isCurrentStep ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                          <Clock className="h-3 w-3 animate-spin" /> KUTILMOQDA
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 dark:text-slate-600 font-medium">Navbatda</span>
                      )}
                    </div>

                    {/* Step Approver Details */}
                    {isStepDone && (
                      <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-300 dark:border-emerald-500/20 space-y-0.5">
                        <div className="font-bold">Imzoladi: {stepData.approverName || 'Rahbar'}</div>
                        <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400/80">
                          Sana: {stepData.actionDate ? new Date(stepData.actionDate).toLocaleString('uz-UZ') : '—'}
                        </div>
                        {stepData.comment && (
                          <div className="text-[10px] italic text-emerald-900 dark:text-emerald-200">"{stepData.comment}"</div>
                        )}
                      </div>
                    )}

                    {isStepRejected && (
                      <div className="text-[11px] text-rose-800 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-300 dark:border-rose-500/20 space-y-0.5">
                        <div className="font-bold">Rad etdi: {stepData.approverName || 'Rahbar'}</div>
                        <div className="text-[10px] font-mono text-rose-700 dark:text-rose-400/80">
                          Sana: {stepData.actionDate ? new Date(stepData.actionDate).toLocaleString('uz-UZ') : '—'}
                        </div>
                        <div className="text-[11px] font-bold text-rose-900 dark:text-rose-400 mt-1">
                          Rad Etish Sababi: "{stepData.comment || request.rejectionComment}"
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 5: MODAL ACTION FOOTER (Context-Aware) */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
          >
            Yopish
          </button>

          <div className="flex items-center gap-3">
            {/* Inline approval actions if PENDING */}
            {isPending && (
              <>
                {onReject && (
                  <button
                    onClick={() => {
                      onClose();
                      onReject(request);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition"
                  >
                    <XCircle className="h-4 w-4" />
                    ❌ Rad Etish (Bosqich #{request.currentStep})
                  </button>
                )}

                {onApprove && (
                  <button
                    onClick={() => {
                      onClose();
                      onApprove(request);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    ✅ Tasdiqlash (Bosqich #{request.currentStep})
                  </button>
                )}
              </>
            )}

            {/* Print button if APPROVED or for all view */}
            {onPrint && (
              <button
                onClick={() => {
                  onClose();
                  onPrint(request);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition"
              >
                <Printer className="h-4 w-4 text-white" />
                🖨️ Arizani Chop Etish / PDF
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
