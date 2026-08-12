import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { APPROVAL_STEPS_CONFIG } from '@/lib/leaveConfig';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId   = searchParams.get('employeeId');
    const departmentId = searchParams.get('departmentId');
    const type         = searchParams.get('type');
    const status       = searchParams.get('status');
    const currentStep  = searchParams.get('currentStep');
    const approverRole = searchParams.get('approverRole');
    const search       = searchParams.get('search');
    const pendingForRole = searchParams.get('pendingForRole');

    const where: any = {};

    if (employeeId) where.employeeId = employeeId;
    if (type && type !== 'ALL') where.type = type;
    if (status && status !== 'ALL') where.status = status;
    if (currentStep) where.currentStep = parseInt(currentStep, 10);

    if (pendingForRole && pendingForRole !== 'ALL') {
      const stepConfig = APPROVAL_STEPS_CONFIG.find((s) => s.approverRole === pendingForRole);
      where.status = 'PENDING';
      if (stepConfig) {
        where.currentStep = stepConfig.stepNumber;
      }
    }

    if (departmentId && departmentId !== 'ALL') {
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

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          include: { currentDepartment: true },
        },
        approvalSteps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'PENDING').length,
      approved: requests.filter((r) => r.status === 'APPROVED').length,
      rejected: requests.filter((r) => r.status === 'REJECTED').length,
    };

    return NextResponse.json({ success: true, requests, stats });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, type, startDate, endDate, totalDays: daysInput, reason } = body;

    if (!employeeId || !type || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { success: false, error: "Barcha majburiy maydonlarni to'ldiring (Xodim, Ariza turi, Sanalar, Sabab)" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let totalDays = daysInput;
    if (!totalDays || totalDays <= 0) {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 3600 * 24)));
    }

    // Check overlapping requests
    const activeConflict = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: 'PENDING',
        AND: [
          { startDate: { lte: end } },
          { endDate: { gte: start } },
        ],
      },
    });

    if (activeConflict) {
      return NextResponse.json(
        {
          success: false,
          error: "Ushbu xodim uchun tanlangan sanalarda faol ko'rib chiqilayotgan ariza mavjud!",
        },
        { status: 409 }
      );
    }

    // Create LeaveRequest with 6 approval steps
    const newRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        type,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status: 'PENDING',
        currentStep: 1,
        approvalSteps: {
          create: APPROVAL_STEPS_CONFIG.map((step) => ({
            stepNumber: step.stepNumber,
            approverRole: step.approverRole,
            status: 'PENDING',
          })),
        },
      },
      include: {
        employee: { include: { currentDepartment: true } },
        approvalSteps: { orderBy: { stepNumber: 'asc' } },
      },
    });

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
