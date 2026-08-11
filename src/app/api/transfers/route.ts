import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const fromDeptId = searchParams.get('fromDeptId') || '';
    const toDeptId = searchParams.get('toDeptId') || '';
    const fromDate = searchParams.get('fromDate') || '';
    const toDate = searchParams.get('toDate') || '';

    const where: any = {};

    if (fromDeptId) {
      where.fromDepartmentId = fromDeptId;
    }

    if (toDeptId) {
      where.toDepartmentId = toDeptId;
    }

    if (fromDate || toDate) {
      where.transferDate = {};
      if (fromDate) {
        where.transferDate.gte = new Date(fromDate);
      }
      if (toDate) {
        const e = new Date(toDate);
        e.setHours(23, 59, 59, 999);
        where.transferDate.lte = e;
      }
    }

    if (search) {
      where.OR = [
        { employee: { tabelNumber: { contains: search } } },
        { employee: { firstName: { contains: search } } },
        { employee: { lastName: { contains: search } } },
        { orderNumber: { contains: search } },
        { reason: { contains: search } },
      ];
    }

    const transfers = await prisma.departmentTransfer.findMany({
      where,
      include: {
        employee: {
          include: {
            positionRef: {
              include: { reportsToPosition: true },
            },
          },
        },
        fromDepartment: true,
        toDepartment: true,
      },
      orderBy: { transferDate: 'desc' },
    });

    return NextResponse.json({ success: true, transfers });
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
    const { employeeId, toDepartmentId, positionId, positionTitle, orderNumber, reason, transferDate, force } = body;

    if (!employeeId || !toDepartmentId || !orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Xodim, nishon bo\'lim va buyruq raqami kiritilishi shart' },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { currentDepartment: true },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Xodim topilmadi' },
        { status: 404 }
      );
    }

    const fromDepartmentId = employee.currentDepartmentId;

    // Check target position if positionId provided
    let targetPositionObj = null;
    if (positionId) {
      targetPositionObj = await prisma.position.findUnique({
        where: { id: positionId },
        include: { _count: { select: { employees: true } } },
      });

      if (targetPositionObj && !force) {
        const filled = targetPositionObj._count.employees;
        const quota = targetPositionObj.quotaLimit;
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

    // Capacity Check on Target Department
    const targetDept = await prisma.department.findUnique({
      where: { id: toDepartmentId },
      include: { _count: { select: { employees: true } } },
    });

    if (targetDept && !force) {
      const activeCount = targetDept._count.employees;
      const staffLimit = targetDept.staffLimit ?? Math.ceil(activeCount * 1.12) + 2;
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

    // Execute transaction: create transfer log & update employee department + position
    const [transferRecord, updatedEmployee] = await prisma.$transaction([
      prisma.departmentTransfer.create({
        data: {
          employeeId,
          fromDepartmentId,
          toDepartmentId,
          orderNumber,
          reason: reason || 'Kadrlar rotatsiyasi va ichki ko\'chirish',
          transferDate: transferDate ? new Date(transferDate) : new Date(),
        },
      }),
      prisma.employee.update({
        where: { id: employeeId },
        data: {
          currentDepartmentId: toDepartmentId,
          position: newPositionTitle,
          positionId: positionId || null,
          status: 'ACTIVE',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Xodim boshqa bo\'lim va lavozimga muvaffaqiyatli ko\'chirildi',
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
