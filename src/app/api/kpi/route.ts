import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateKpiScore, calculateKpiBonus } from '@/lib/kpi';

/* ── Period → date range helper ── */
function getPeriodRange(period: string, ref: string, startDate?: string, endDate?: string): { start: Date; end: Date } {
  if (period === 'custom' && startDate && endDate) {
    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    const e = new Date(endDate);
    e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }

  const now = new Date(ref || Date.now());
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-based

  switch (period) {
    case 'daily':
      return {
        start: new Date(y, m, now.getDate(), 0, 0, 0),
        end:   new Date(y, m, now.getDate(), 23, 59, 59),
      };
    case 'weekly': {
      const day = now.getDay() || 7; // Monday=1
      const mon = new Date(now); mon.setDate(now.getDate() - day + 1); mon.setHours(0, 0, 0, 0);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59, 999);
      return { start: mon, end: sun };
    }
    case 'monthly':
      return {
        start: new Date(y, m, 1),
        end:   new Date(y, m + 1, 0, 23, 59, 59),
      };
    case 'quarterly': {
      const q = Math.floor(m / 3);
      return {
        start: new Date(y, q * 3, 1),
        end:   new Date(y, q * 3 + 3, 0, 23, 59, 59),
      };
    }
    case 'annual':
      return {
        start: new Date(y, 0, 1),
        end:   new Date(y, 11, 31, 23, 59, 59),
      };
    default: // fallback: treat as YYYY-MM month string
      return {
        start: new Date(y, m, 1),
        end:   new Date(y, m + 1, 0, 23, 59, 59),
      };
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month     = searchParams.get('month') || '2026-08';
    const period    = searchParams.get('period') || 'monthly';
    const ref       = searchParams.get('ref')   || new Date().toISOString();
    const startDate = searchParams.get('startDate') || '';
    const endDate   = searchParams.get('endDate') || '';

    // ── If period != monthly, compute dynamically from live DB ──
    if (period !== 'monthly' || !searchParams.has('month')) {
      return await computeLivePeriodKpi(period, ref, startDate, endDate);
    }

    // ── Monthly mode: use stored KpiRecords ──
    const kpiRecords = await prisma.kpiRecord.findMany({
      where: { month },
      include: {
        employee: { include: { currentDepartment: true } },
      },
      orderBy: { attendanceRate: 'desc' },
    });

    const { deptStats, svodka } = buildDeptStats(kpiRecords, month);

    return NextResponse.json({
      success: true,
      period: 'monthly',
      month,
      records: kpiRecords,
      departmentStats: deptStats,
      svodka,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/* ── Live period computation (no stored KpiRecord needed) ── */
async function computeLivePeriodKpi(period: string, ref: string, startDate?: string, endDate?: string) {
  const { start, end } = getPeriodRange(period, ref, startDate, endDate);

  const employees = await prisma.employee.findMany({
    where: { status: { in: ['ACTIVE', 'ON_LEAVE'] } },
    include: {
      currentDepartment: true,
      leaves: {
        where: { startDate: { gte: start }, endDate: { lte: end } },
      },
      disciplinaryActions: {
        where: { status: 'ACTIVE', startDate: { lte: end }, expiryDate: { gte: start } },
      },
    },
  });

  const records = employees.map((emp) => {
    const bsDays     = emp.leaves.filter(l => l.type === 'BS').reduce((s, l) => s + l.totalDays, 0);
    const blDays     = emp.leaves.filter(l => l.type === 'BL').reduce((s, l) => s + l.totalDays, 0);
    const lateHours  = emp.leaves.filter(l => l.type === 'LATE_ARRIVAL').reduce((s, l) => s + (l.hoursLate || 0), 0);
    const progulDays = emp.leaves.filter(l => l.type === 'PROGUL').reduce((s, l) => s + l.totalDays, 0);
    const hasActiveDisciplinaryPenalty = emp.disciplinaryActions.length > 0;

    const kpi = calculateKpiScore({ hasActiveDisciplinaryPenalty, bsDays, blDays, lateHours, progulDays });

    return {
      id: emp.id,
      month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      employee: {
        id: emp.id,
        tabelNumber: emp.tabelNumber,
        firstName: emp.firstName,
        lastName: emp.lastName,
        currentDepartment: emp.currentDepartment,
        currentDepartmentId: emp.currentDepartmentId,
      },
      unworkedDays: bsDays,
      sickDays: blDays,
      lateHours,
      progulDays,
      deductionPercentage: kpi.totalDeductionPct,
      baseBonus: 100,         // KPI % base
      finalBonus: kpi.finalKpiPct, // repurposed field = KPI %
      finalKpiPct: kpi.finalKpiPct,
      attendanceRate: kpi.attendanceRate,
      disciplinaryLock: kpi.disciplinaryLock,
      bsDeductionPct: kpi.bsDeductionPct,
      blDeductionPct: kpi.blDeductionPct,
      lateDeductionPct: kpi.lateDeductionPct,
    };
  });

  const { deptStats, svodka } = buildDeptStats(records, period);

  return NextResponse.json({
    success: true,
    period,
    records,
    departmentStats: deptStats,
    svodka,
    dateRange: { start: start.toISOString(), end: end.toISOString() },
  });
}

/* ── Build dept stats + svodka from any record list ── */
function buildDeptStats(records: any[], label: string) {
  const deptMap = new Map<string, any[]>();

  for (const r of records) {
    const deptId = r.employee?.currentDepartmentId || r.employee?.currentDepartment?.id;
    if (!deptId) continue;
    if (!deptMap.has(deptId)) deptMap.set(deptId, []);
    deptMap.get(deptId)!.push(r);
  }

  const deptStats: any[] = [];
  const svodka: any[] = [];

  deptMap.forEach((recs, deptId) => {
    const dept = recs[0].employee.currentDepartment;
    if (!dept) return;
    const total = recs.length;
    const avgKpi = total > 0 ? recs.reduce((s, r) => s + (r.finalKpiPct ?? r.attendanceRate ?? 0), 0) / total : 0;
    const avgAttendance = total > 0 ? recs.reduce((s, r) => s + r.attendanceRate, 0) / total : 0;
    const penaltyCount = recs.filter(r => r.disciplinaryLock).length;
    const cleanCount = recs.filter(r => !r.disciplinaryLock && r.deductionPercentage === 0).length;
    const cleanPct = total > 0 ? Math.round((cleanCount / total) * 100) : 100;

    const avgKpiRounded = Math.round(avgKpi * 10) / 10;

    deptStats.push({
      id: deptId,
      name: dept.name,
      code: dept.code,
      avgKpi: avgKpiRounded,
      avgAttendance: Math.round(avgAttendance * 10) / 10,
      totalEmployees: total,
      penaltyCount,
      cleanPct,
    });

    const status = avgKpiRounded >= 90 ? "A'lo" : avgKpiRounded >= 70 ? 'Qoniqarli' : 'Quyi';
    svodka.push({
      deptId,
      deptName: dept.name,
      deptCode: dept.code,
      totalWorkers: total,
      avgKpiPct: avgKpiRounded,
      penaltyCount,
      cleanAttendancePct: cleanPct,
      execStatus: status,
    });
  });

  // Sort svodka: A'lo first
  svodka.sort((a, b) => b.avgKpiPct - a.avgKpiPct);

  return { deptStats, svodka };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { month, baseBonus = 3500000 } = body;

    if (!month) {
      return NextResponse.json({ success: false, error: 'Oyni tanlang (masalan, 2026-08)' }, { status: 400 });
    }

    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: {
        leaves: true,
        disciplinaryActions: { where: { status: 'ACTIVE' } },
      },
    });

    const generatedRecords = [];

    for (const emp of employees) {
      const monthLeaves = emp.leaves.filter((l) => {
        const d = new Date(l.startDate);
        const yyyyMm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return yyyyMm === month;
      });

      const unworkedDays = monthLeaves.filter(l => l.type === 'BS').reduce((s, l) => s + l.totalDays, 0);
      const sickDays     = monthLeaves.filter(l => l.type === 'BL').reduce((s, l) => s + l.totalDays, 0);
      const lateHours    = monthLeaves.filter(l => l.type === 'LATE_ARRIVAL').reduce((s, l) => s + (l.hoursLate || 0), 0);
      const progulDays   = monthLeaves.filter(l => l.type === 'PROGUL').reduce((s, l) => s + l.totalDays, 0);
      const hasActiveDisciplinaryPenalty = emp.disciplinaryActions.length > 0;

      // Use new KPI score engine
      const kpi = calculateKpiScore({ hasActiveDisciplinaryPenalty, bsDays: unworkedDays, blDays: sickDays, lateHours, progulDays });
      const finalBonus = kpi.disciplinaryLock ? 0 : Math.max(0, Math.round(baseBonus * (kpi.finalKpiPct / 100)));

      const existing = await prisma.kpiRecord.findFirst({ where: { employeeId: emp.id, month } });

      let record;
      if (existing) {
        record = await prisma.kpiRecord.update({
          where: { id: existing.id },
          data: {
            baseBonus,
            unworkedDays,
            sickDays,
            lateHours,
            deductionPercentage: kpi.totalDeductionPct,
            finalBonus,
            attendanceRate: kpi.attendanceRate,
          },
        });
      } else {
        record = await prisma.kpiRecord.create({
          data: {
            employeeId: emp.id,
            month,
            baseBonus,
            unworkedDays,
            sickDays,
            lateHours,
            deductionPercentage: kpi.totalDeductionPct,
            finalBonus,
            attendanceRate: kpi.attendanceRate,
          },
        });
      }
      generatedRecords.push(record);
    }

    return NextResponse.json({
      success: true,
      message: `${month} oyi uchun ${generatedRecords.length} ta xodim KPI ko'rsatkichi hisoblandi`,
      count: generatedRecords.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
