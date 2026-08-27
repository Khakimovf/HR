import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveHrUser } from '@/lib/rbac';
import { parseUTCDate, parseUTCDateStart, parseUTCDateEnd } from '@/lib/date-utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search      = searchParams.get('search')?.trim() || '';
    const fromDeptId  = searchParams.get('fromDeptId') || '';
    const toDeptId    = searchParams.get('toDeptId') || '';
    const fromDate    = searchParams.get('fromDate') || '';
    const toDate      = searchParams.get('toDate') || '';

    // ── Server-side pagination ────────────────────────────────────────────
    const page  = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));
    const skip  = (page - 1) * limit;

    const where: any = {
      // Soft-delete filter
      deletedAt: null,
    };

    if (fromDeptId) where.fromDepartmentId = fromDeptId;
    if (toDeptId)   where.toDepartmentId   = toDeptId;

    if (fromDate || toDate) {
      where.transferDate = {};
      // UTC-safe date parsing — prevents 1-day timezone shifts
      if (fromDate) {
        const start = parseUTCDateStart(fromDate);
        if (start) where.transferDate.gte = start;
      }
      if (toDate) {
        const end = parseUTCDateEnd(toDate);
        if (end) where.transferDate.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { employee: { tabelNumber: { contains: search } } },
        { employee: { firstName:   { contains: search } } },
        { employee: { lastName:    { contains: search } } },
        { orderNumber: { contains: search } },
        { reason:      { contains: search } },
      ];
    }

    const [total, transfers] = await Promise.all([
      prisma.departmentTransfer.count({ where }),
      prisma.departmentTransfer.findMany({
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
              positionRef: {
                select: {
                  id: true,
                  title: true,
                  reportsToPosition: { select: { id: true, title: true } },
                },
              },
            },
          },
          fromDepartment: { select: { id: true, name: true, code: true } },
          toDepartment:   { select: { id: true, name: true, code: true } },
        },
        orderBy: { transferDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      transfers,
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
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      employeeId,
      toDepartmentId,
      positionId,
      positionTitle,
      orderNumber,
      reason,
      transferDate,
      force,
    } = body;

    if (!employeeId || !toDepartmentId || !orderNumber) {
      return NextResponse.json(
        { success: false, error: "Xodim, nishon bo'lim va buyruq raqami kiritilishi shart" },
        { status: 400 }
      );
    }

    // Resolve session for audit log
    const session = await resolveHrUser(req);

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null },
      include: { currentDepartment: true },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Xodim topilmadi' },
        { status: 404 }
      );
    }

    const fromDepartmentId = employee.currentDepartmentId;

    // ── Check target position quota ───────────────────────────────────────
    let targetPositionObj = null;
    if (positionId) {
      targetPositionObj = await prisma.position.findUnique({
        where: { id: positionId },
        include: { _count: { select: { employees: true } } },
      });

      if (targetPositionObj && !force) {
        const filled = targetPositionObj._count.employees;
        const quota  = targetPositionObj.quotaLimit;
        if (filled >= quota) {
          return NextResponse.json(
            {
              success: false,
              error: `Ushbu lavozimda bo'sh shtat birligi yo'q! ("${targetPositionObj.title}": ${filled}/${quota} to'liq)`,
              isPositionFull: true,
            },
            { status: 400 }
          );
        }
      }
    }

    // ── Capacity Check on Target Department ───────────────────────────────
    const targetDept = await prisma.department.findUnique({
      where: { id: toDepartmentId },
      include: { _count: { select: { employees: true } } },
    });

    if (targetDept && !force) {
      const activeCount    = targetDept._count.employees;
      const staffLimit     = targetDept.staffLimit ?? Math.ceil(activeCount * 1.12) + 2;
      const seatsAvailable = Math.max(0, staffLimit - activeCount);

      if (seatsAvailable <= 0 && !positionId) {
        return NextResponse.json(
          {
            success: false,
            error: `Ushbu bo'limda bo'sh shtat birligi yo'q! (Amaldagi: ${activeCount} / Limit: ${staffLimit})`,
            isFull: true,
          },
          { status: 400 }
        );
      }
    }

    const newPositionTitle = positionTitle || targetPositionObj?.title || employee.position;

    // UTC-safe parse of transferDate
    const parsedTransferDate = parseUTCDate(transferDate) ?? new Date();

    // ── Interactive transaction: transfer log + employee update + audit ────
    // All three writes succeed or all three roll back together.
    const { transferRecord, updatedEmployee } = await prisma.$transaction(async (tx) => {
      const transferRecord = await tx.departmentTransfer.create({
        data: {
          employeeId,
          fromDepartmentId,
          toDepartmentId,
          orderNumber,
          reason: reason || "Kadrlar rotatsiyasi va ichki ko'chirish",
          transferDate: parsedTransferDate,
        },
      });

      const updatedEmployee = await tx.employee.update({
        where: { id: employeeId },
        data: {
          currentDepartmentId: toDepartmentId,
          position: newPositionTitle,
          positionId: positionId || null,
          status: 'ACTIVE',
        },
      });

      // Write audit log inside the same transaction so it either all commits
      // or all rolls back — no orphaned audit entries
      await tx.auditLog.create({
        data: {
          hrUserId: session?.id || null,
          hrName: session?.fullName || session?.username || 'HR Operator',
          action: `Xodim [${employee.tabelNumber}] ${employee.lastName} ${employee.firstName} ko'chirildi: ${employee.currentDepartment?.name ?? fromDepartmentId} → ${targetDept?.name ?? toDepartmentId}`,
          targetEmployeeId: employeeId,
          fieldChanged: 'currentDepartmentId',
          oldValue: fromDepartmentId,
          newValue: toDepartmentId,
          departmentName: targetDept?.name,
          ipAddress:
            req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            '127.0.0.1',
          metadata: JSON.stringify({
            action: 'DEPARTMENT_TRANSFER',
            orderNumber,
            transferDate: parsedTransferDate.toISOString(),
            fromDepartmentId,
            toDepartmentId,
            fromDepartmentName: employee.currentDepartment?.name,
            toDepartmentName: targetDept?.name,
            newPosition: newPositionTitle,
          }),
        },
      });

      return { transferRecord, updatedEmployee };
    });

    return NextResponse.json({
      success: true,
      message: "Xodim boshqa bo'lim va lavozimga muvaffaqiyatli ko'chirildi",
      transfer: transferRecord,
      employee: updatedEmployee,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
