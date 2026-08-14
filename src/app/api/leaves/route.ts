import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Leave types that participate in KPI deduction (mapped to legacy type names for KPI engine)
const KPI_TYPE_MAP: Record<string, string> = {
  BS_UNPAID: 'BS',
  SICK_LEAVE_BL: 'BL',
  KECHIKISH_RUXSATNOMA: 'LATE_ARRIVAL',
  PROGUL: 'PROGUL',
};

// Hourly leave types (don't count as full days)
const HOURLY_TYPES = ['KECHIKISH_RUXSATNOMA'];

// Status-updating types
const LONG_LEAVE_TYPES = ['MEHNAT_TATILI', 'BS_UNPAID', 'SICK_LEAVE_BL', 'OQISH_TATILI', 'ADMIN_TATIL'];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId   = searchParams.get('employeeId');
    const departmentId = searchParams.get('departmentId');
    const type         = searchParams.get('type');
    const startDate    = searchParams.get('startDate');
    const endDate      = searchParams.get('endDate');
    const status       = searchParams.get('status');
    const search       = searchParams.get('search');

    const where: any = {};

    if (employeeId)   where.employeeId = employeeId;
    if (type && type !== 'ALL') {
      if (['KECHIKISH_RUXSATNOMA', 'KECH', 'OTGUL', 'HOURLY_PERMIT', 'LATE_ARRIVAL', 'HOURLY_PERMISSION', 'LATE'].includes(type)) {
        where.type = { in: ['KECHIKISH_RUXSATNOMA', 'KECH', 'OTGUL', 'HOURLY_PERMIT', 'HOURLY_PERMISSION', 'LATE', 'LATE_ARRIVAL'] };
      } else if (['MEHNAT_TATILI', 'MT'].includes(type)) {
        where.type = { in: ['MEHNAT_TATILI', 'MT'] };
      } else if (['SICK_LEAVE_BL', 'BL'].includes(type)) {
        where.type = { in: ['SICK_LEAVE_BL', 'BL'] };
      } else if (['BS_UNPAID', 'BS'].includes(type)) {
        where.type = { in: ['BS_UNPAID', 'BS'] };
      } else if (['ADMIN_TATIL', 'ADMIN'].includes(type)) {
        where.type = { in: ['ADMIN_TATIL', 'ADMIN'] };
      } else {
        where.type = type;
      }
    }
    if (status && status !== 'ALL') where.status = status;

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate)   where.startDate.lte = new Date(endDate + 'T23:59:59');
    }

    if (departmentId) {
      where.employee = { currentDepartmentId: departmentId };
    }

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

    const leaves = await prisma.leaveAttendance.findMany({
      where,
      include: {
        employee: {
          include: { currentDepartment: true },
          select: {
            id: true,
            tabelNumber: true,
            firstName: true,
            lastName: true,
            middleName: true,
            position: true,
            status: true,
            currentDepartment: true,
          } as any,
        },
      },
      orderBy: { startDate: 'desc' },
    });

    // Stats summary
    const stats = {
      total: leaves.length,
      active: leaves.filter((l) => l.status === 'ACTIVE' || l.status === 'APPROVED').length,
      mehnatTatil: leaves.filter((l) => l.type === 'MEHNAT_TATILI' || l.type === 'MT').length,
      sickLeave:   leaves.filter((l) => l.type === 'SICK_LEAVE_BL' || l.type === 'BL').length,
      bsUnpaid:    leaves.filter((l) => l.type === 'BS_UNPAID' || l.type === 'BS').length,
      kechikish:   leaves.filter((l) => l.type === 'KECHIKISH_RUXSATNOMA' || l.type === 'LATE_ARRIVAL').length,
    };

    return NextResponse.json({ success: true, leaves, stats });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      employeeId,
      type,
      startDate,
      endDate,
      startTime,
      endTime,
      orderNumber,
      reason,
    } = body;

    if (!employeeId || !type || !startDate) {
      return NextResponse.json(
        { success: false, error: "Xodim, ta'til turi va boshlanish sanasi ko'rsatilishi shart" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date(startDate);
    end.setHours(23, 59, 59, 999);

    // ── Conflict Guard: Check overlapping active leaves ────────────────────────
    const conflictTypes = ['MEHNAT_TATILI', 'BS_UNPAID', 'SICK_LEAVE_BL', 'MT', 'BS', 'BL', 'OQISH_TATILI', 'ADMIN_TATIL'];
    if (conflictTypes.includes(type)) {
      const overlap = await prisma.leaveAttendance.findFirst({
        where: {
          employeeId,
          status: { in: ['ACTIVE', 'APPROVED'] },
          type: { in: conflictTypes },
          AND: [
            { startDate: { lte: end } },
            { endDate:   { gte: start } },
          ],
        },
        include: { employee: true },
      });

      if (overlap) {
        return NextResponse.json(
          {
            success: false,
            conflict: true,
            error: `Ushbu xodim tanlangan sanalarda allaqachon ta'tilda (${overlap.type})! Sana: ${overlap.startDate.toLocaleDateString('uz-UZ')} — ${overlap.endDate.toLocaleDateString('uz-UZ')}`,
          },
          { status: 409 }
        );
      }
    }

    // ── Compute totalDays / totalHours ─────────────────────────────────────────
    const isHourly = HOURLY_TYPES.includes(type);
    let totalDays = 0;
    let totalHours: number | null = null;
    let hoursLate: number | null = null;

    if (isHourly && startTime && endTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      totalHours = Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
      hoursLate  = totalHours; // Mirror to legacy field for KPI engine
      totalDays  = 0;
    } else {
      const timeDiff = Math.abs(end.getTime() - start.getTime());
      totalDays = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);
    }

    // ── Create record ──────────────────────────────────────────────────────────
    const kpiType = KPI_TYPE_MAP[type] || type; // For KPI engine compatibility

    const leaveRecord = await prisma.leaveAttendance.create({
      data: {
        employeeId,
        type,               // Store new type name
        startDate: start,
        endDate:   end,
        totalDays,
        totalHours,
        startTime:   startTime || null,
        endTime:     endTime   || null,
        hoursLate,
        orderNumber: orderNumber || null,
        reason:      reason     || null,
        status: 'ACTIVE',
      },
      include: {
        employee: { include: { currentDepartment: true } },
      },
    });

    // ── Update employee status if on long leave ────────────────────────────────
    if (LONG_LEAVE_TYPES.includes(type)) {
      await prisma.employee.update({
        where: { id: employeeId },
        data:  { status: 'ON_LEAVE' },
      });
    }

    return NextResponse.json({ success: true, leave: leaveRecord });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID talab qilinadi' }, { status: 400 });

    await prisma.leaveAttendance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
