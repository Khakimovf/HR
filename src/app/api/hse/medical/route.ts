import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveHrUser, writeAuditLog } from '@/lib/rbac';

// Compute effective status from expiryDate
function computeStatus(record: any): string {
  if (record.status === "O'TMAGAN") return "O'TMAGAN";
  const now = new Date();
  const expiry = new Date(record.expiryDate);
  if (expiry < now) return "MUDDATI_TUGAGAN";
  // Warn if expires within 30 days
  const warnDate = new Date(now);
  warnDate.setDate(warnDate.getDate() + 30);
  if (expiry <= warnDate) return 'YAQINLASHMOQDA';
  return "O'TGAN";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');
    const status       = searchParams.get('status');
    const search       = searchParams.get('search');
    const alertsOnly   = searchParams.get('alertsOnly') === 'true';

    const where: any = {};
    if (departmentId) where.employee = { currentDepartmentId: departmentId };
    if (search) {
      where.employee = {
        ...(where.employee || {}),
        OR: [
          { firstName:   { contains: search } },
          { lastName:    { contains: search } },
          { tabelNumber: { contains: search } },
        ],
      };
    }

    const checkups = await prisma.medicalCheckup.findMany({
      where,
      include: {
        employee: { include: { currentDepartment: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });

    // Compute effective status dynamically
    const enriched = checkups.map((c) => ({
      ...c,
      effectiveStatus: computeStatus(c),
    }));

    // If alertsOnly, return only expired / not passed / near expiry
    const filtered = alertsOnly
      ? enriched.filter((c) => ['MUDDATI_TUGAGAN', "O'TMAGAN", 'YAQINLASHMOQDA'].includes(c.effectiveStatus))
      : (status && status !== 'ALL' ? enriched.filter((c) => c.effectiveStatus === status) : enriched);

    // Sort: expired first, then near-expiry, then valid
    const ORDER: Record<string, number> = { "O'TMAGAN": 0, 'MUDDATI_TUGAGAN': 1, 'YAQINLASHMOQDA': 2, "O'TGAN": 3 };
    filtered.sort((a, b) => (ORDER[a.effectiveStatus] ?? 3) - (ORDER[b.effectiveStatus] ?? 3));

    const stats = {
      total: enriched.length,
      passed: enriched.filter((c) => c.effectiveStatus === "O'TGAN").length,
      failed: enriched.filter((c) => c.effectiveStatus === "O'TMAGAN").length,
      expired: enriched.filter((c) => c.effectiveStatus === 'MUDDATI_TUGAGAN').length,
      nearExpiry: enriched.filter((c) => c.effectiveStatus === 'YAQINLASHMOQDA').length,
    };

    return NextResponse.json({ success: true, checkups: filtered, stats });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, employeeIds, checkupDate, validityMonths = 12, status, clinicName, orderRef, notes } = body;

    const idsToProcess: string[] = employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0
      ? employeeIds
      : (employeeId ? [employeeId] : []);

    if (idsToProcess.length === 0 || !checkupDate) {
      return NextResponse.json(
        { success: false, error: 'Xodim(lar) va ko\'rik sanasi kiritilishi shart' },
        { status: 400 }
      );
    }

    const cDate = new Date(checkupDate);
    const eDate = new Date(cDate);
    eDate.setMonth(eDate.getMonth() + parseInt(validityMonths));

    const createdRecords: any[] = [];
    for (const empId of idsToProcess) {
      const checkup = await prisma.medicalCheckup.create({
        data: {
          employeeId: empId,
          checkupDate: cDate,
          expiryDate:  eDate,
          validityMonths: parseInt(validityMonths),
          status: status || "O'TGAN",
          clinicName: clinicName || null,
          orderRef:   orderRef   || null,
          notes:      notes      || null,
        },
        include: { employee: { include: { currentDepartment: true } } },
      });
      createdRecords.push(checkup);
    }

    // Audit
    const hrUser = await resolveHrUser(req);
    await writeAuditLog({
      hrUserId: hrUser?.id,
      hrName:   hrUser?.fullName || 'Tizim',
      action:   `Tibbiy ko'rik yozuvi paketli (${createdRecords.length} ta xodim) qo'shildi`,
      metadata: { count: createdRecords.length, idsToProcess },
    });

    return NextResponse.json({
      success: true,
      count: createdRecords.length,
      checkup: createdRecords[0] ? { ...createdRecords[0], effectiveStatus: computeStatus(createdRecords[0]) } : null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
