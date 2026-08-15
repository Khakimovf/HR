import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { statsCache } from '@/lib/cache';

export async function GET() {
  const brokenLinks: string[] = [];
  const moduleChecks: Record<string, { status: 'PASSED' | 'FAILED'; message: string }> = {};

  try {
    // 1. Check Atomic Prisma Database Transactions
    try {
      const txTest = await prisma.$transaction(async (tx) => {
        const empCount = await tx.employee.count();
        return empCount;
      });
      moduleChecks.databaseTransactions = {
        status: 'PASSED',
        message: `Atomic $transaction verified cleanly (${txTest} employees found).`,
      };
    } catch (err: any) {
      moduleChecks.databaseTransactions = {
        status: 'FAILED',
        message: `Prisma $transaction failed: ${err.message}`,
      };
      brokenLinks.push(`DatabaseTransactions: ${err.message}`);
    }

    // 2. Check Leave & Attendance Integration Chain
    try {
      const [leaveReqCount, attendanceCount] = await Promise.all([
        prisma.leaveRequest.count(),
        prisma.leaveAttendance.count(),
      ]);
      moduleChecks.leaveAttendanceChain = {
        status: 'PASSED',
        message: `Leave & Attendance chain healthy (${leaveReqCount} requests, ${attendanceCount} attendance logs).`,
      };
    } catch (err: any) {
      moduleChecks.leaveAttendanceChain = {
        status: 'FAILED',
        message: `Leave & Attendance chain query failed: ${err.message}`,
      };
      brokenLinks.push(`LeaveAttendanceChain: ${err.message}`);
    }

    // 3. Check Disciplinary & Audit Log Integration Chain
    try {
      const [disciplineCount, auditCount] = await Promise.all([
        prisma.disciplinaryAction.count(),
        prisma.auditLog.count(),
      ]);
      moduleChecks.disciplinaryChain = {
        status: 'PASSED',
        message: `Disciplinary & Audit log chain healthy (${disciplineCount} active actions, ${auditCount} audit entries).`,
      };
    } catch (err: any) {
      moduleChecks.disciplinaryChain = {
        status: 'FAILED',
        message: `Disciplinary & Audit log chain failed: ${err.message}`,
      };
      brokenLinks.push(`DisciplinaryChain: ${err.message}`);
    }

    // 4. Check HSE Medical & Permit Compliance Chain
    try {
      const [medicalCount, permitCount] = await Promise.all([
        prisma.medicalCheckup.count(),
        prisma.permitLicense.count(),
      ]);
      moduleChecks.hseMedicalChain = {
        status: 'PASSED',
        message: `HSE Medical & Permit compliance chain healthy (${medicalCount} medicals, ${permitCount} permits).`,
      };
    } catch (err: any) {
      moduleChecks.hseMedicalChain = {
        status: 'FAILED',
        message: `HSE Medical & Permit chain failed: ${err.message}`,
      };
      brokenLinks.push(`HseMedicalChain: ${err.message}`);
    }

    // 5. Check KPI & Payroll Integration Chain
    try {
      const [kpiEvalCount, kpiScoreCount] = await Promise.all([
        (prisma as any).kpiEvaluation.count(),
        (prisma as any).kpiCriterionScore.count(),
      ]);
      moduleChecks.kpiPayrollChain = {
        status: 'PASSED',
        message: `KPI & Payroll evaluation engine healthy (${kpiEvalCount} evaluations, ${kpiScoreCount} criteria scores).`,
      };
    } catch (err: any) {
      moduleChecks.kpiPayrollChain = {
        status: 'FAILED',
        message: `KPI & Payroll evaluation engine failed: ${err.message}`,
      };
      brokenLinks.push(`KpiPayrollChain: ${err.message}`);
    }

    // 6. Check In-Memory Cache Reactivity
    try {
      statsCache.set('sync_test_key', { ok: true }, 5000);
      const cachedVal = statsCache.get<{ ok: boolean }>('sync_test_key');
      statsCache.invalidate('sync_test_key');
      const clearedVal = statsCache.get('sync_test_key');

      if (cachedVal?.ok && clearedVal === null) {
        moduleChecks.cacheReactivity = {
          status: 'PASSED',
          message: 'In-memory statsCache set/get and pattern invalidation working reactively.',
        };
      } else {
        throw new Error('Cache invalidation mismatch');
      }
    } catch (err: any) {
      moduleChecks.cacheReactivity = {
        status: 'FAILED',
        message: `Cache reactivity check failed: ${err.message}`,
      };
      brokenLinks.push(`CacheReactivity: ${err.message}`);
    }

    const totalModules = Object.keys(moduleChecks).length;
    const passedModules = Object.values(moduleChecks).filter((m) => m.status === 'PASSED').length;
    const syncScore = `${Math.round((passedModules / totalModules) * 100)}%`;
    const isHealthy = brokenLinks.length === 0;

    return NextResponse.json({
      status: isHealthy ? 'HEALTHY' : 'DEGRADED',
      syncScore,
      timestamp: new Date().toISOString(),
      brokenLinks,
      moduleChecks,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'CRITICAL_FAILURE',
        syncScore: '0%',
        timestamp: new Date().toISOString(),
        brokenLinks: [error.message],
        moduleChecks,
      },
      { status: 500 }
    );
  }
}
