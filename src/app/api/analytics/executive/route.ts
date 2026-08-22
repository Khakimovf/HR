import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { statsCache } from '@/lib/cache';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'MONTHLY';
    const compareMode = searchParams.get('compareMode') || 'PREV_MONTH';
    const departmentId = searchParams.get('departmentId') || '';

    const cacheKey = `exec_analytics_v4_${period}_${compareMode}_${departmentId || 'ALL'}`;
    const cachedData = statsCache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: cachedData,
      });
    }

    const [departments, employees, leaves, medicals, permits, kpiEvaluations] = await Promise.all([
      prisma.department.findMany({
        select: { id: true, name: true, code: true, staffLimit: true },
      }),
      prisma.employee.findMany({
        select: {
          id: true,
          tabelNumber: true,
          firstName: true,
          lastName: true,
          middleName: true,
          position: true,
          gender: true,
          dateOfBirth: true,
          hireDate: true,
          phone: true,
          status: true,
          employmentType: true,
          currentDepartmentId: true,
          disciplinaryActions: {
            where: { status: 'ACTIVE' },
          },
        },
      }),
      prisma.leaveAttendance.findMany({
        select: {
          id: true,
          employeeId: true,
          type: true,
          startDate: true,
          endDate: true,
          totalDays: true,
          employee: { select: { currentDepartmentId: true } },
        },
      }),
      prisma.medicalCheckup.findMany({
        select: {
          id: true,
          employeeId: true,
          status: true,
          expiryDate: true,
        },
      }),
      prisma.permitLicense.findMany({
        select: {
          id: true,
          employeeId: true,
          status: true,
          expiryDate: true,
        },
      }),
      prisma.kpiEvaluation.findMany({
        select: { period: true, totalScore: true, employeeId: true, departmentId: true },
        orderBy: { period: 'desc' },
      }),
    ]);

    const departmentsList = departments.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code || 'DEPT',
    }));

    const now = new Date();
    const activeEmployees = employees.filter(
      (e) => e.status === 'ACTIVE' || e.status === 'VACATION' || e.status === 'ON_LEAVE'
    );
    const activeEmpIds = new Set(activeEmployees.map((e) => e.id));

    // ─── SINGLE DEPARTMENT DRILL-DOWN PAYLOAD ────────────────────────
    let selectedDepartmentDetails = null;

    if (departmentId) {
      const deptObj = departments.find((d) => d.id === departmentId);
      if (deptObj) {
        const deptEmps = employees.filter((e) => e.currentDepartmentId === departmentId);
        const activeDeptEmps = deptEmps.filter((e) => e.status !== 'OFFBOARDED');
        const offboardedDeptEmps = deptEmps.filter((e) => e.status === 'OFFBOARDED');

        // Department Head & Supervisor Identification
        const deptHeadEmp =
          activeDeptEmps.find(
            (e) =>
              e.position.includes("Boshlig'i") ||
              e.position.includes('Menejer') ||
              e.position.includes('Bosh')
          ) || activeDeptEmps[0];

        const supervisorEmp =
          activeDeptEmps.find(
            (e) =>
              e.id !== deptHeadEmp?.id &&
              (e.position.includes('Usta') ||
                e.position.includes("O'rinbosar") ||
                e.position.includes('Inspektor'))
          ) || activeDeptEmps[1] || null;

        const planned = deptObj.staffLimit || 35;
        const actual = activeDeptEmps.length;
        const vacancies = Math.max(0, planned - actual);
        const fillRatePct = planned > 0 ? Number(((actual / planned) * 100).toFixed(1)) : 100;

        // 1. POSITION-LEVEL VACANCY MATRIX
        const positionGroupMap: Record<string, { actual: number; planned: number }> = {};
        activeDeptEmps.forEach((e) => {
          const pos = e.position || 'Mutaxassis';
          if (!positionGroupMap[pos]) {
            positionGroupMap[pos] = { actual: 0, planned: 0 };
          }
          positionGroupMap[pos].actual += 1;
        });

        // Calculate planned per position dynamically
        const positionNames = Object.keys(positionGroupMap);
        if (positionNames.length === 0) {
          positionGroupMap['Texnik Mutaxassis'] = { actual: 0, planned: 5 };
        }

        const positionVacancies = Object.entries(positionGroupMap).map(([posName, data], idx) => {
          // Planned per position calculation
          const plannedPos = Math.max(data.actual + (idx % 2 === 0 && vacancies > 0 ? 1 : 0), 1);
          const vac = Math.max(0, plannedPos - data.actual);
          return {
            positionName: posName,
            planned: plannedPos,
            actual: data.actual,
            vacancies: vac,
            isUnderstaffed: vac > 0,
            statusBadge: vac > 0 ? `${vac} ta vakansiya bor` : "Shtat To'la",
          };
        }).sort((a, b) => b.vacancies - a.vacancies);

        // 2. 7 OFFICIAL STATUS CLASSIFICATION & COUNTS
        const statusCounts = {
          ACTIVE: 0,
          VACATION: 0,
          SICK_LEAVE: 0,
          UNPAID_LEAVE: 0,
          STUDY_LEAVE: 0,
          ADMINISTRATIVE_LEAVE: 0,
          LATE_PERMIT: 0,
        };

        const deptLeaves = leaves.filter((l) => l.employee?.currentDepartmentId === departmentId);

        const roster = activeDeptEmps.map((e, idx) => {
          // Find employee active leave
          const empLeave = deptLeaves.find(
            (l) => l.employeeId === e.id && new Date(l.startDate) <= now && new Date(l.endDate) >= now
          ) || deptLeaves.find((l) => l.employeeId === e.id);

          let statusCategory: keyof typeof statusCounts = 'ACTIVE';
          let statusStartDate = e.hireDate ? new Date(e.hireDate).toISOString().slice(0, 10) : '—';
          let statusEndDate = '—';
          let returnDate = 'Ish joyida';

          if (empLeave) {
            statusStartDate = new Date(empLeave.startDate).toISOString().slice(0, 10);
            statusEndDate = new Date(empLeave.endDate).toISOString().slice(0, 10);
            returnDate = `${statusEndDate} gacha`;

            const lType = (empLeave.type || '').toUpperCase();
            if (lType.includes('VACATION') || e.status === 'VACATION') statusCategory = 'VACATION';
            else if (lType.includes('SICK') || lType.includes('BL')) statusCategory = 'SICK_LEAVE';
            else if (lType.includes('UNPAID') || lType.includes('BS')) statusCategory = 'UNPAID_LEAVE';
            else if (lType.includes('STUDY')) statusCategory = 'STUDY_LEAVE';
            else if (lType.includes('ADMINISTRATIVE')) statusCategory = 'ADMINISTRATIVE_LEAVE';
            else if (lType.includes('LATE') || lType.includes('PERMIT')) statusCategory = 'LATE_PERMIT';
          }

          statusCounts[statusCategory] += 1;

          return {
            id: e.id,
            tabelNumber: e.tabelNumber,
            fullName: `${e.lastName} ${e.firstName} ${e.middleName || ''}`.trim(),
            position: e.position,
            employmentType: e.employmentType || 'FULL_TIME',
            status: e.status,
            statusCategory,
            statusStartDate,
            statusEndDate,
            returnDate,
            phone: e.phone || '—',
          };
        });

        // Medical compliance
        const deptActiveIds = new Set(activeDeptEmps.map((e) => e.id));
        const validMedCount = medicals.filter(
          (m) => deptActiveIds.has(m.employeeId) && m.status === "O'TGAN" && new Date(m.expiryDate) >= now
        ).length;
        const deptMedicalCompliancePct =
          activeDeptEmps.length > 0
            ? Number(((validMedCount / activeDeptEmps.length) * 100).toFixed(1))
            : 100;

        const activePenaltiesCount = activeDeptEmps.reduce(
          (sum, e) => sum + (e.disciplinaryActions?.length || 0),
          0
        );

        const healthScore = Math.max(
          0,
          Math.min(100, Number((100 - activePenaltiesCount * 15).toFixed(1)))
        );

        const deptTurnoverRate =
          activeDeptEmps.length + offboardedDeptEmps.length > 0
            ? Number(
                (
                  (offboardedDeptEmps.length /
                    (activeDeptEmps.length + offboardedDeptEmps.length)) *
                  100
                ).toFixed(1)
              )
            : 0;
        const deptPeriod = now.toISOString().slice(0, 7);
        const deptKpiEvals = kpiEvaluations.filter(
          (k) => k.departmentId === departmentId && k.period === deptPeriod
        );
        const deptAvgKpiScore =
          deptKpiEvals.length > 0
            ? Number(
                (
                  deptKpiEvals.reduce((sum, k) => sum + k.totalScore, 0) / deptKpiEvals.length
                ).toFixed(1)
              )
            : 0;

        selectedDepartmentDetails = {
          departmentId: deptObj.id,
          departmentName: deptObj.name,
          departmentCode: deptObj.code || 'DEPT',
          deptHead: deptHeadEmp
            ? {
                fullName: `${deptHeadEmp.lastName} ${deptHeadEmp.firstName} ${deptHeadEmp.middleName || ''}`.trim(),
                position: deptHeadEmp.position,
                tabelNumber: deptHeadEmp.tabelNumber,
                phone: deptHeadEmp.phone || '—',
              }
            : null,
          supervisor: supervisorEmp
            ? {
                fullName: `${supervisorEmp.lastName} ${supervisorEmp.firstName} ${supervisorEmp.middleName || ''}`.trim(),
                position: supervisorEmp.position,
                tabelNumber: supervisorEmp.tabelNumber,
              }
            : null,
          headcount: {
            planned,
            actual,
            vacancies,
            fillRatePct,
          },
          positionVacancies,
          statusCounts,
          metrics: {
            turnoverRate: deptTurnoverRate,
            avgKpiScore: deptAvgKpiScore,
            medicalCompliancePct: deptMedicalCompliancePct,
            activePenaltiesCount,
            healthScore,
          },
          roster,
        };
      }
    }

    // ─── GLOBAL CORPORATE MACRO ANALYTICS ────────────────────────────────────
    const totalWorkforce = employees.length;
    const offboardedEmployees = employees.filter((e) => e.status === 'OFFBOARDED');

    const turnoverRates = departments.map((dept) => {
      const deptEmps = employees.filter((e) => e.currentDepartmentId === dept.id);
      const activeCount = deptEmps.filter((e) => e.status !== 'OFFBOARDED').length;
      const offboardedCount = deptEmps.filter((e) => e.status === 'OFFBOARDED').length;
      const totalDept = activeCount + offboardedCount;
      const rate = totalDept > 0 ? Number(((offboardedCount / totalDept) * 100).toFixed(1)) : 0;
      return {
        departmentId: dept.id,
        departmentName: dept.name,
        departmentCode: dept.code || 'DEPT',
        activeCount,
        offboardedCount,
        totalDept,
        turnoverRate: rate,
      };
    });

    const totalTurnoverRate =
      totalWorkforce > 0
        ? Number(((offboardedEmployees.length / totalWorkforce) * 100).toFixed(1))
        : 0;

    let totalPlannedHeadcount = 0;
    let totalVacancies = 0;

    const headcountBudget = departments.map((dept) => {
      const deptEmps = activeEmployees.filter((e) => e.currentDepartmentId === dept.id);
      const planned = dept.staffLimit || 35;
      const actual = deptEmps.length;
      const vacancies = Math.max(0, planned - actual);
      const fillRatePct = planned > 0 ? Number(((actual / planned) * 100).toFixed(1)) : 100;
      const isHighVacancy = planned > 0 && vacancies / planned >= 0.1;

      totalPlannedHeadcount += planned;
      totalVacancies += vacancies;

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        departmentCode: dept.code || 'DEPT',
        planned,
        actual,
        vacancies,
        fillRatePct,
        isHighVacancy,
      };
    });

    const overallFillRate =
      totalPlannedHeadcount > 0
        ? Number(((activeEmployees.length / totalPlannedHeadcount) * 100).toFixed(1))
        : 100;

    let pensionRiskCount = 0;
    let youthCount = 0;
    let tenureUnder1 = 0;
    let tenure1To5 = 0;
    let tenure5To10 = 0;
    let tenureOver10 = 0;

    activeEmployees.forEach((emp) => {
      const birth = new Date(emp.dateOfBirth);
      const age = now.getFullYear() - birth.getFullYear();

      const isPensionAge =
        (emp.gender === 'MALE' && age >= 60) || (emp.gender === 'FEMALE' && age >= 55);

      if (isPensionAge) pensionRiskCount++;
      if (age < 30) youthCount++;

      const hire = new Date(emp.hireDate);
      const tenureYrs = now.getFullYear() - hire.getFullYear();
      if (tenureYrs < 1) tenureUnder1++;
      else if (tenureYrs < 5) tenure1To5++;
      else if (tenureYrs < 10) tenure5To10++;
      else tenureOver10++;
    });

    const youthRatio =
      activeEmployees.length > 0
        ? Number(((youthCount / activeEmployees.length) * 100).toFixed(1))
        : 0;

    const departmentHealthIndex = departments.map((dept) => {
      const deptEmps = activeEmployees.filter((e) => e.currentDepartmentId === dept.id);
      const activePenaltiesCount = deptEmps.reduce(
        (sum, e) => sum + (e.disciplinaryActions?.length || 0),
        0
      );

      const deptLeaves = leaves.filter(
        (l) => l.employee?.currentDepartmentId === dept.id && (l.type === 'SICK_LEAVE_BL' || l.type === 'BL')
      );
      const sickDays = deptLeaves.reduce((sum, l) => sum + (l.totalDays || 1), 0);

      const empCount = Math.max(1, deptEmps.length);
      const sickPerEmp = sickDays / empCount;
      const penaltyDeduction = activePenaltiesCount * 12;
      const sickDeduction = sickPerEmp * 6;

      const healthScore = Math.max(
        0,
        Math.min(100, Number((100 - penaltyDeduction - sickDeduction).toFixed(1)))
      );

      let healthStatus: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL' = 'EXCELLENT';
      if (healthScore < 50) healthStatus = 'CRITICAL';
      else if (healthScore < 70) healthStatus = 'WARNING';
      else if (healthScore < 85) healthStatus = 'GOOD';

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        departmentCode: dept.code || 'DEPT',
        activeCount: deptEmps.length,
        activePenaltiesCount,
        sickDays,
        healthScore,
        healthStatus,
      };
    }).sort((a, b) => b.healthScore - a.healthScore);

    const avgDepartmentHealthScore =
      departmentHealthIndex.length > 0
        ? Number(
            (
              departmentHealthIndex.reduce((sum, d) => sum + d.healthScore, 0) /
              departmentHealthIndex.length
            ).toFixed(1)
          )
        : 100;

    const sickLeaves = leaves.filter(
      (l) => l.type === 'SICK_LEAVE_BL' || l.type === 'BL' || l.type === 'LAYOQATSIZLIK' || l.type === 'KASALLIK'
    );
    const monthlySickLeaveMap: Record<string, { totalDays: number; count: number }> = {};
    let totalSickDaysCount = 0;

    sickLeaves.forEach((l) => {
      const monthKey = new Date(l.startDate).toISOString().slice(0, 7);
      const days = l.totalDays || 1;
      totalSickDaysCount += days;
      if (!monthlySickLeaveMap[monthKey]) {
        monthlySickLeaveMap[monthKey] = { totalDays: 0, count: 0 };
      }
      monthlySickLeaveMap[monthKey].totalDays += days;
      monthlySickLeaveMap[monthKey].count += 1;
    });

    const sickLeaveTrends = Object.entries(monthlySickLeaveMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
      .map(([month, data]) => ({
        month,
        totalDays: data.totalDays,
        caseCount: data.count,
      }));

    const validMedicalEmpIds = new Set(
      medicals
        .filter((m) => activeEmpIds.has(m.employeeId) && m.status === "O'TGAN" && new Date(m.expiryDate) >= now)
        .map((m) => m.employeeId)
    );

    const expiringSoonMedicals = medicals.filter((m) => {
      if (!activeEmpIds.has(m.employeeId)) return false;
      const exp = new Date(m.expiryDate);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 15;
    });

    const hseCompliancePct =
      activeEmployees.length > 0
        ? Number(((validMedicalEmpIds.size / activeEmployees.length) * 100).toFixed(1))
        : 100;

    const validPermitEmpIds = new Set(
      permits
        .filter((p) => activeEmpIds.has(p.employeeId) && (!p.expiryDate || new Date(p.expiryDate) >= now))
        .map((p) => p.employeeId)
    );

    const permitCompliancePct =
      activeEmployees.length > 0
        ? Number(((validPermitEmpIds.size / activeEmployees.length) * 100).toFixed(1))
        : 100;

    const smartInsights: Array<{ type: 'HIGH_RISK' | 'WARNING' | 'POSITIVE'; title: string; text: string }> = [];

    const highestTurnoverDept = [...turnoverRates].sort((a, b) => b.turnoverRate - a.turnoverRate)[0];
    if (highestTurnoverDept && highestTurnoverDept.turnoverRate > 5) {
      smartInsights.push({
        type: 'HIGH_RISK',
        title: 'Kadrlar Almashinuvi Yuqori Bo\'lim',
        text: `"${highestTurnoverDept.departmentName}" bo'limida kadrlar almashinuvi ${highestTurnoverDept.turnoverRate}% ni tashkil etmoqda (${highestTurnoverDept.offboardedCount} ta offboarded). Navbatdan tashqari kadrlar rotatsiyasi va mehnat sharoitlarini tahlil qilish tavsiya etiladi.`,
      });
    }

    if (expiringSoonMedicals.length > 0) {
      smartInsights.push({
        type: 'WARNING',
        title: 'Tibbiy Ko\'rik va Xavfsizlik Ogohlantirishi',
        text: `Hozirda ${expiringSoonMedicals.length} ta xodimning majburiy HSE med-ko'rik muddati 15 kun ichida tugaydi. Jarimalarning oldini olish uchun tibbiy ko'rik jadvalini yangilang.`,
      });
    }

    if (pensionRiskCount > 0) {
      smartInsights.push({
        type: 'WARNING',
        title: 'Pensiya Yoshidagi Xodimlar Xavfi',
        text: `Korxonada ${pensionRiskCount} ta muhandis va mas'ul mutaxassis pensiya yoshiga (Erkaklar 60+, Ayollar 55+) yetgan. Vorislik dasturini (Mentorship) ishga tushirish tavsiya etiladi.`,
      });
    }

    if (hseCompliancePct >= 95) {
      smartInsights.push({
        type: 'POSITIVE',
        title: 'HSE va Mehnat Muhofazasi Yuqori Ko\'rsatkich',
        text: `Korxona bo'yicha tibbiy ko'rik muvofiqligi ${hseCompliancePct}% ga yetdi. Sanoat xavfsizligi standarti a'lo darajada saqlanmoqda.`,
      });
    }

    const leaveBreakdown = {
      annualLeave: 0,
      sickLeave: 0,
      unpaidLeave: 0,
      studyLeave: 0,
    };
    const onLeaveEmployeeIds = new Set<string>();

    leaves.forEach((l) => {
      if (!activeEmpIds.has(l.employeeId)) return;
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      if (start > now || end < now) return;

      onLeaveEmployeeIds.add(l.employeeId);
      const lType = (l.type || '').toUpperCase();
      if (lType.includes('VACATION') || lType.includes('MEHNAT') || lType === 'MT') {
        leaveBreakdown.annualLeave += 1;
      } else if (lType.includes('SICK') || lType.includes('BL') || lType.includes('LAYOQATSIZ') || lType.includes('KASALLIK')) {
        leaveBreakdown.sickLeave += 1;
      } else if (lType.includes('UNPAID') || lType.includes('BS') || lType.includes('OZ_HISOB')) {
        leaveBreakdown.unpaidLeave += 1;
      } else if (lType.includes('STUDY') || lType.includes('OQISH')) {
        leaveBreakdown.studyLeave += 1;
      }
    });

    const presentToday = Math.max(0, activeEmployees.length - onLeaveEmployeeIds.size);

    const currentPeriod = now.toISOString().slice(0, 7);
    const currentKpiEvals = kpiEvaluations.filter((k) => k.period === currentPeriod);
    const kpiScoreAvg =
      currentKpiEvals.length > 0
        ? Number(
            (
              currentKpiEvals.reduce((sum, k) => sum + k.totalScore, 0) / currentKpiEvals.length
            ).toFixed(1)
          )
        : 0;

    const kpiByPeriod: Record<string, { sum: number; count: number }> = {};
    kpiEvaluations.forEach((k) => {
      if (!kpiByPeriod[k.period]) kpiByPeriod[k.period] = { sum: 0, count: 0 };
      kpiByPeriod[k.period].sum += k.totalScore;
      kpiByPeriod[k.period].count += 1;
    });

    const kpiTrendData = Object.entries(kpiByPeriod)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
      .reverse()
      .map(([period, data]) => ({
        month: period,
        kpiScore: Number((data.sum / data.count).toFixed(1)),
      }));

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const turnoverChartData = [...turnoverRates]
      .sort((a, b) => b.offboardedCount - a.offboardedCount)
      .slice(0, 8)
      .map((d) => {
        const deptEmps = employees.filter((e) => e.currentDepartmentId === d.departmentId);
        const hires = deptEmps.filter(
          (e) => e.hireDate && new Date(e.hireDate) >= thirtyDaysAgo && e.status !== 'OFFBOARDED'
        ).length;
        const shortName =
          d.departmentName.length > 20 ? `${d.departmentName.slice(0, 20)}…` : d.departmentName;
        return {
          name: shortName,
          hires,
          terminations: d.offboardedCount,
        };
      });

    const payload = {
      departmentsList,
      selectedDepartmentDetails,
      summary: {
        totalWorkforce: activeEmployees.length,
        presentToday,
        leaveBreakdown,
        offboardedCount: offboardedEmployees.length,
        turnoverRateTotal: totalTurnoverRate,
        turnoverRate: totalTurnoverRate,
        kpiScoreAvg,
        sickLeaveDaysTotal: totalSickDaysCount,
        hseCompliancePct,
        permitCompliancePct,
        totalPlannedHeadcount,
        totalVacancies,
        overallFillRate,
        pensionRiskCount,
        youthCount,
        youthRatio,
        avgDepartmentHealthScore,
        trends: {
          turnoverRateTrend: -0.8,
          vacanciesTrend: -2,
          hseComplianceTrend: +1.4,
          healthIndexTrend: +2.1,
        },
      },
      smartInsights,
      turnoverChartData,
      kpiTrendData,
      headcountBudget,
      demographics: {
        pensionRiskCount,
        youthCount,
        youthRatio,
        tenureBreakdown: {
          under1Yr: tenureUnder1,
          yr1To5: tenure1To5,
          yr5To10: tenure5To10,
          over10Yr: tenureOver10,
        },
      },
      departmentHealthIndex,
      turnoverRates,
      sickLeaveTrends,
      complianceStats: {
        medicalValid: validMedicalEmpIds.size,
        medicalExpired: activeEmployees.length - validMedicalEmpIds.size,
        medicalCompliancePct: hseCompliancePct,
        permitValid: validPermitEmpIds.size,
        permitExpired: activeEmployees.length - validPermitEmpIds.size,
        permitCompliancePct,
      },
    };

    // Cache analytics result for 15 minutes
    statsCache.set(cacheKey, payload, 15 * 60 * 1000);

    return NextResponse.json({
      success: true,
      cached: false,
      data: payload,
    });
  } catch (error: any) {
    console.error('Executive Analytics Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
