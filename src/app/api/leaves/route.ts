import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveHrUser } from '@/lib/rbac';
import { parseUTCDateStart, parseUTCDateEnd, calcDaysDiff } from '@/lib/date-utils';

// Leave types that participate in KPI deduction (mapped to legacy type names for KPI engine)
const KPI_TYPE_MAP: Record<string, string> = {
  BS_UNPAID:            'BS',
  SICK_LEAVE_BL:        'BL',
  KECHIKISH_RUXSATNOMA: 'LATE_ARRIVAL',
  PROGUL:               'PROGUL',
};

// Hourly leave types (don't count as full days)
const HOURLY_TYPES = ['KECHIKISH_RUXSATNOMA'];

// Long leave types that flip employee status to ON_LEAVE
const LONG_LEAVE_TYPES = [
  'MEHNAT_TATILI',
  'BS_UNPAID',
  'SICK_LEAVE_BL',
  'OQISH_TATILI',
  'ADMIN_TATIL',
];

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

    // ── Server-side pagination ────────────────────────────────────────────
    const page  = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));
    const skip  = (page - 1) * limit;

    const where: any = {
      // Exclude soft-deleted records
      deletedAt: null,
    };

    if (employeeId) where.employeeId = employeeId;

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
      // UTC-safe — avoids 1-day shift in UTC+5 environments
      if (startDate) {
        const s = parseUTCDateStart(startDate);
        if (s) where.startDate.gte = s;
      }
      if (endDate) {
        const e = parseUTCDateEnd(endDate);
        if (e) where.startDate.lte = e;
      }
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

    const [total, leaves] = await Promise.all([
      prisma.leaveAttendance.count({ where }),
      prisma.leaveAttendance.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              tabelNumber: true,
              firstName: true,
              lastName: true,
              middleName: true,
              position: true,
              status: true,
              currentDepartment: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    // Stats summary (from current page — use totals for summary widget)
    const stats = {
      total: leaves.length,
      active:      leaves.filter((l) => l.status === 'ACTIVE' || l.status === 'APPROVED').length,
      mehnatTatil: leaves.filter((l) => l.type === 'MEHNAT_TATILI' || l.type === 'MT').length,
      sickLeave:   leaves.filter((l) => l.type === 'SICK_LEAVE_BL' || l.type === 'BL').length,
      bsUnpaid:    leaves.filter((l) => l.type === 'BS_UNPAID' || l.type === 'BS').length,
      kechikish:   leaves.filter((l) => l.type === 'KECHIKISH_RUXSATNOMA' || l.type === 'LATE_ARRIVAL').length,
    };

    return NextResponse.json({
      success: true,
      leaves,
      stats,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    });
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

    // ── UTC-safe date parsing ─────────────────────────────────────────────
    // Fixes: "2026-08-27" → 2026-08-27T00:00:00.000Z (not local midnight)
    const start = parseUTCDateStart(startDate);
    const end   = endDate ? parseUTCDateEnd(endDate) : parseUTCDateEnd(startDate);

    if (!start || !end) {
      return NextResponse.json(
        { success: false, error: 'Noto\'g\'ri sana formati' },
        { status: 400 }
      );
    }

    // ── Conflict Guard: Check overlapping active leaves ───────────────────
    const conflictTypes = [
      'MEHNAT_TATILI', 'BS_UNPAID', 'SICK_LEAVE_BL',
      'MT', 'BS', 'BL', 'OQISH_TATILI', 'ADMIN_TATIL',
    ];
    if (conflictTypes.includes(type)) {
      const overlap = await prisma.leaveAttendance.findFirst({
        where: {
          employeeId,
          deletedAt: null,
          status:    { in: ['ACTIVE', 'APPROVED'] },
          type:      { in: conflictTypes },
          AND: [
            { startDate: { lte: end } },
            { endDate:   { gte: start } },
          ],
        },
        include: { employee: { select: { firstName: true, lastName: true } } },
      });

      if (overlap) {
        return NextResponse.json(
          {
            success: false,
            conflict: true,
            error: `Ushbu xodim tanlangan sanalarda allaqachon ta'tilda (${overlap.type})! Sana: ${overlap.startDate.toISOString().split('T')[0]} — ${overlap.endDate.toISOString().split('T')[0]}`,
          },
          { status: 409 }
        );
      }
    }

    // ── Compute totalDays / totalHours ────────────────────────────────────
    const isHourly = HOURLY_TYPES.includes(type);
    let totalDays:  number       = 0;
    let totalHours: number | null = null;
    let hoursLate:  number | null = null;

    if (isHourly && startTime && endTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      totalHours = Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
      hoursLate  = totalHours; // Mirror to legacy field for KPI engine
      totalDays  = 0;
    } else {
      // Use UTC-aware day diff helper (avoids floating-point rounding errors)
      totalDays = calcDaysDiff(start, end);
    }

    // ── Resolve session for audit log ─────────────────────────────────────
    const session = await resolveHrUser(req);
    const kpiType = KPI_TYPE_MAP[type] || type;

    // ── ATOMIC TRANSACTION: create leave + update employee status ─────────
    // Previously these were two separate DB writes — a crash between them
    // would leave the employee in the wrong state with no leave record.
    const leaveRecord = await prisma.$transaction(async (tx) => {
      // 1. Create leave record
      const leave = await tx.leaveAttendance.create({
        data: {
          employeeId,
          type,
          startDate: start,
          endDate:   end,
          totalDays,
          totalHours,
          startTime: startTime || null,
          endTime:   endTime   || null,
          hoursLate,
          orderNumber: orderNumber || null,
          reason:      reason      || null,
          status: 'ACTIVE',
        },
        include: {
          employee: {
            include: { currentDepartment: { select: { id: true, name: true } } },
          },
        },
      });

      // 2. Update employee status if this is a long leave
      if (LONG_LEAVE_TYPES.includes(type)) {
        await tx.employee.update({
          where: { id: employeeId },
          data:  { status: 'ON_LEAVE' },
        });
      }

      // 3. Write audit log inside the same transaction
      await tx.auditLog.create({
        data: {
          hrUserId: session?.id || null,
          hrName:   session?.fullName || session?.username || 'HR Operator',
          action:   `Xodim [${leave.employee.tabelNumber}] ${leave.employee.lastName} ${leave.employee.firstName} uchun ta'til qayd etildi: ${type}`,
          targetEmployeeId: employeeId,
          fieldChanged: 'status',
          oldValue: leave.employee.status,
          newValue: LONG_LEAVE_TYPES.includes(type) ? 'ON_LEAVE' : leave.employee.status,
          departmentName: leave.employee.currentDepartment?.name,
          ipAddress:
            req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            '127.0.0.1',
          metadata: JSON.stringify({
            action: 'LEAVE_CREATED',
            leaveType: type,
            kpiType,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            totalDays,
            totalHours,
            orderNumber,
          }),
        },
      });

      return leave;
    });

    return NextResponse.json({ success: true, leave: leaveRecord });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * SOFT DELETE a leave record.
 *
 * Sets `deletedAt = now()` and `status = CANCELLED`.
 * If the employee has no other active LONG_LEAVE_TYPES after this,
 * their status is automatically reverted to ACTIVE.
 * All changes are atomic (single transaction).
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID talab qilinadi' },
        { status: 400 }
      );
    }

    const session = await resolveHrUser(req);
    const now = new Date();

    // Verify existence and not already deleted
    const leave = await prisma.leaveAttendance.findFirst({
      where: { id, deletedAt: null },
      include: {
        employee: {
          include: { currentDepartment: { select: { id: true, name: true } } },
        },
      },
    });

    if (!leave) {
      return NextResponse.json(
        { success: false, error: "Ta'til yozuvi topilmadi yoki allaqachon o'chirilgan" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Soft-delete the leave record
      await tx.leaveAttendance.update({
        where: { id },
        data: {
          deletedAt: now,
          status: 'CANCELLED',
        },
      });

      // 2. Check if employee has any other active long leave
      //    Only revert status if this was a long-leave type
      if (LONG_LEAVE_TYPES.includes(leave.type)) {
        const otherActiveLongLeave = await tx.leaveAttendance.findFirst({
          where: {
            employeeId: leave.employeeId,
            id:         { not: id },         // Exclude this one
            deletedAt:  null,
            status:     { in: ['ACTIVE', 'APPROVED'] },
            type:       { in: LONG_LEAVE_TYPES },
          },
        });

        // If no other active leaves, revert employee status to ACTIVE
        if (!otherActiveLongLeave) {
          await tx.employee.update({
            where: { id: leave.employeeId },
            data:  { status: 'ACTIVE' },
          });
        }
      }

      // 3. Audit log
      await tx.auditLog.create({
        data: {
          hrUserId: session?.id || null,
          hrName:   session?.fullName || session?.username || 'HR Operator',
          action:   `Xodim [${leave.employee.tabelNumber}] ${leave.employee.lastName} ${leave.employee.firstName} ta'til yozuvi bekor qilindi: ${leave.type}`,
          targetEmployeeId: leave.employeeId,
          fieldChanged: 'leave.status',
          oldValue: leave.status,
          newValue: 'CANCELLED',
          departmentName: leave.employee.currentDepartment?.name,
          ipAddress:
            req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            '127.0.0.1',
          metadata: JSON.stringify({
            action: 'LEAVE_CANCELLED',
            leaveId: id,
            leaveType: leave.type,
            originalStartDate: leave.startDate.toISOString(),
            originalEndDate:   leave.endDate.toISOString(),
            cancelledAt: now.toISOString(),
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Ta'til yozuvi bekor qilindi",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
