export interface TenureResult {
  years: number;
  months: number;
  days: number;
  formatted: string;
}

export function calculateTenure(hireDateInput: Date | string): TenureResult {
  const hireDate = new Date(hireDateInput);
  const now = new Date();

  if (isNaN(hireDate.getTime())) {
    return { years: 0, months: 0, days: 0, formatted: '0 yil, 0 oy' };
  }

  let years = now.getFullYear() - hireDate.getFullYear();
  let months = now.getMonth() - hireDate.getMonth();
  let days = now.getDate() - hireDate.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += previousMonth.getDate();
  }
  if (months < 0) { years -= 1; months += 12; }
  if (years < 0) { years = 0; months = 0; days = 0; }

  const parts = [];
  if (years > 0) parts.push(`${years} yil`);
  if (months > 0) parts.push(`${months} oy`);
  if (days > 0 || parts.length === 0) parts.push(`${days} kun`);

  return { years, months, days, formatted: parts.join(' ') };
}

/* ═══════════════════════════════════════════════════════════════
   KPI ENGINE — Performance Score (%) based, not salary-based
   ═══════════════════════════════════════════════════════════════ */

export type KpiPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

export interface KpiScoreInput {
  /** true if employee has ANY active disciplinary action in the period */
  hasActiveDisciplinaryPenalty: boolean;
  /** B/S: unpaid / own-expense leave days in period */
  bsDays: number;
  /** B/L: sick leave days in period (first 3 days free) */
  blDays: number;
  /** Late arrival hours in period */
  lateHours: number;
  /** PROGUL (unexcused absence) days */
  progulDays: number;
}

export interface KpiScoreResult {
  /** Base KPI is always 100% */
  baseKpiPct: number;
  /** Deduction from B/S days */
  bsDeductionPct: number;
  /** Deduction from B/L days (after 3 free days) */
  blDeductionPct: number;
  /** Deduction from late hours */
  lateDeductionPct: number;
  /** Deduction from unexcused absences */
  progulDeductionPct: number;
  /** Total deduction % (capped at 100) */
  totalDeductionPct: number;
  /** FINAL KPI score (0-100%) */
  finalKpiPct: number;
  /** true if forfeited due to disciplinary lock */
  disciplinaryLock: boolean;
  /** attendance rate as % of working hours used */
  attendanceRate: number;
}

// ── Rate constants (easily tunable) ──
const BS_RATE_PER_DAY   = 2.5;   // % per unpaid leave day
const BL_RATE_PER_DAY   = 1.5;   // % per sick day (after 3-day threshold)
const BL_FREE_DAYS      = 3;     // first N sick days are free
const LATE_RATE_PER_HR  = 0.8;   // % per hour of late arrival
const PROGUL_RATE_PER_DAY = 15;  // % per unexcused absence day

export function calculateKpiScore(input: KpiScoreInput): KpiScoreResult {
  const { hasActiveDisciplinaryPenalty, bsDays, blDays, lateHours, progulDays } = input;

  // ── STRICT RULE: Disciplinary Lock → KPI = 0% immediately ──
  if (hasActiveDisciplinaryPenalty) {
    return {
      baseKpiPct: 100,
      bsDeductionPct: 0,
      blDeductionPct: 0,
      lateDeductionPct: 0,
      progulDeductionPct: 0,
      totalDeductionPct: 100,
      finalKpiPct: 0,
      disciplinaryLock: true,
      attendanceRate: 0,
    };
  }

  // ── Bug fix: zero inputs → zero deduction, 100% KPI ──
  if (bsDays === 0 && blDays === 0 && lateHours === 0 && progulDays === 0) {
    return {
      baseKpiPct: 100,
      bsDeductionPct: 0,
      blDeductionPct: 0,
      lateDeductionPct: 0,
      progulDeductionPct: 0,
      totalDeductionPct: 0,
      finalKpiPct: 100,
      disciplinaryLock: false,
      attendanceRate: 100,
    };
  }

  const bsDeductionPct    = Math.min(bsDays * BS_RATE_PER_DAY, 50);
  const excessBlDays      = Math.max(0, blDays - BL_FREE_DAYS);
  const blDeductionPct    = Math.min(excessBlDays * BL_RATE_PER_DAY, 30);
  const lateDeductionPct  = Math.min(lateHours * LATE_RATE_PER_HR, 25);
  const progulDeductionPct = Math.min(progulDays * PROGUL_RATE_PER_DAY, 100);

  const totalDeductionPct = Math.min(
    100,
    Number((bsDeductionPct + blDeductionPct + lateDeductionPct + progulDeductionPct).toFixed(1))
  );

  const finalKpiPct = Math.max(0, Number((100 - totalDeductionPct).toFixed(1)));

  // Attendance rate based on estimated 176 working hrs/month
  const totalWorkingHours = 176;
  const lostHours = (bsDays + progulDays) * 8 + blDays * 4 + lateHours;
  const attendanceRate = Math.max(
    0,
    Math.min(100, Number((((totalWorkingHours - lostHours) / totalWorkingHours) * 100).toFixed(1)))
  );

  return {
    baseKpiPct: 100,
    bsDeductionPct: Number(bsDeductionPct.toFixed(1)),
    blDeductionPct: Number(blDeductionPct.toFixed(1)),
    lateDeductionPct: Number(lateDeductionPct.toFixed(1)),
    progulDeductionPct: Number(progulDeductionPct.toFixed(1)),
    totalDeductionPct,
    finalKpiPct,
    disciplinaryLock: false,
    attendanceRate,
  };
}

/** Legacy shim so existing API route still compiles without changes */
export interface KpiCalculationInput {
  baseBonus: number;
  unworkedDays: number;
  sickDays: number;
  lateHours: number;
  unexcusedAbsences: number;
}
export interface KpiCalculationResult {
  baseBonus: number;
  unworkedPenaltyPct: number;
  sickPenaltyPct: number;
  latePenaltyPct: number;
  unexcusedPenaltyPct: number;
  totalDeductionPct: number;
  finalBonus: number;
  attendanceRate: number;
}
export function calculateKpiBonus(input: KpiCalculationInput): KpiCalculationResult {
  const result = calculateKpiScore({
    hasActiveDisciplinaryPenalty: false,
    bsDays: input.unworkedDays,
    blDays: input.sickDays,
    lateHours: input.lateHours,
    progulDays: input.unexcusedAbsences,
  });
  const finalBonus = Math.max(0, Math.round(input.baseBonus * (result.finalKpiPct / 100)));
  return {
    baseBonus: input.baseBonus,
    unworkedPenaltyPct: result.bsDeductionPct,
    sickPenaltyPct: result.blDeductionPct,
    latePenaltyPct: result.lateDeductionPct,
    unexcusedPenaltyPct: result.progulDeductionPct,
    totalDeductionPct: result.totalDeductionPct,
    finalBonus,
    attendanceRate: result.attendanceRate,
  };
}
