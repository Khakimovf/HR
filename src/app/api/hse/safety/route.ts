import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveHrUser, writeAuditLog } from '@/lib/rbac';

function computeBriefingStatus(record: any): string {
  const now = new Date();
  const expiry = new Date(record.expiryDate);
  if (expiry < now) return 'MUDDATI_TUGAGAN';
  const warnDate = new Date(now);
  warnDate.setDate(warnDate.getDate() + 30);
  if (expiry <= warnDate) return 'YAQINLASHMOQDA';
  return 'AMALDA';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');
    const search       = searchParams.get('search');
    const title        = searchParams.get('title');
    const incidentDate = searchParams.get('incidentDate'); // Safety audit: show briefings valid ON this date

    const where: any = {};
    if (departmentId) where.employee = { currentDepartmentId: departmentId };
    if (title) where.title = { contains: title };

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

    // Safety incident audit: briefings that were VALID on a specific date
    if (incidentDate) {
      const iDate = new Date(incidentDate);
      where.completionDate = { lte: iDate };
      where.expiryDate     = { gte: iDate };
    }

    const briefings = await prisma.safetyBriefing.findMany({
      where,
      include: {
        employee: { include: { currentDepartment: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });

    const enriched = briefings.map((b) => ({
      ...b,
      effectiveStatus: computeBriefingStatus(b),
    }));

    const ORDER: Record<string, number> = { 'MUDDATI_TUGAGAN': 0, 'YAQINLASHMOQDA': 1, 'AMALDA': 2 };
    enriched.sort((a, b) => (ORDER[a.effectiveStatus] ?? 2) - (ORDER[b.effectiveStatus] ?? 2));

    const stats = {
      total:    enriched.length,
      active:   enriched.filter((b) => b.effectiveStatus === 'AMALDA').length,
      expired:  enriched.filter((b) => b.effectiveStatus === 'MUDDATI_TUGAGAN').length,
      nearExpiry: enriched.filter((b) => b.effectiveStatus === 'YAQINLASHMOQDA').length,
    };

    return NextResponse.json({ success: true, briefings: enriched, stats });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, title, completionDate, validityDays = 365, instructorName, protocolNumber, notes } = body;

    if (!employeeId || !title || !completionDate) {
      return NextResponse.json(
        { success: false, error: 'Xodim, yo\'riqnoma sarlavhasi va o\'tkazish sanasi kiritilishi shart' },
        { status: 400 }
      );
    }

    const cDate = new Date(completionDate);
    const eDate = new Date(cDate);
    eDate.setDate(eDate.getDate() + parseInt(validityDays));

    const briefing = await prisma.safetyBriefing.create({
      data: {
        employeeId,
        title: title.trim(),
        completionDate: cDate,
        expiryDate:     eDate,
        validityDays:   parseInt(validityDays),
        instructorName: instructorName || null,
        protocolNumber: protocolNumber || null,
        notes:          notes         || null,
      },
      include: { employee: { include: { currentDepartment: true } } },
    });

    // Audit
    const hrUser = await resolveHrUser(req);
    await writeAuditLog({
      hrUserId: hrUser?.id,
      hrName:   hrUser?.fullName || 'Tizim',
      action:   "Xavfsizlik yo'riqnomasi yozuvi qo'shildi",
      targetEmployeeId: employeeId,
      departmentName: briefing.employee?.currentDepartment?.name,
      metadata: { title },
    });

    return NextResponse.json({ success: true, briefing: { ...briefing, effectiveStatus: computeBriefingStatus(briefing) } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
