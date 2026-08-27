import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { APPROVAL_STEPS_CONFIG } from '@/lib/leaveConfig';
import { parseUTCDateStart, parseUTCDateEnd, calcDaysDiff } from '@/lib/date-utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId     = searchParams.get('employeeId');
    const departmentId   = searchParams.get('departmentId');
    const type           = searchParams.get('type');
    const status         = searchParams.get('status');
    const currentStep    = searchParams.get('currentStep');
    const approverRole   = searchParams.get('approverRole');
    const search         = searchParams.get('search');
    const pendingForRole = searchParams.get('pendingForRole');

    // ── Server-side pagination ────────────────────────────────────────────
    const page  = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));
    const skip  = (page - 1) * limit;

    const where: any = {};

    if (employeeId) where.employeeId = employeeId;

    if (type && type !== 'ALL') {
      if (['HOURLY_PERMIT', 'KECHIKISH_RUXSATNOMA', 'KECH', 'OTGUL', 'LATE_ARRIVAL', 'HOURLY_PERMISSION', 'LATE'].includes(type)) {
        where.type = { in: ['HOURLY_PERMIT', 'KECHIKISH_RUXSATNOMA', 'KECH', 'OTGUL', 'HOURLY_PERMISSION', 'LATE', 'LATE_ARRIVAL'] };
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
    if (currentStep) where.currentStep = parseInt(currentStep, 10);

    if (pendingForRole && pendingForRole !== 'ALL') {
      where.status = 'PENDING';
      if (pendingForRole === 'BOSHQARMA_BOSHLIGI') {
        where.currentStep = 3;
        where.step3ApproverType = 'BOSHQARMA_BOSHLIGI';
      } else if (pendingForRole === 'TECHNICAL_DIRECTOR') {
        where.currentStep = 3;
        where.NOT = { step3ApproverType: 'BOSHQARMA_BOSHLIGI' };
      } else {
        const stepConfig = APPROVAL_STEPS_CONFIG.find((s) => s.approverRole === pendingForRole);
        if (stepConfig) {
          where.currentStep = stepConfig.stepNumber;
        }
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

    const [total, requests] = await Promise.all([
      prisma.leaveRequest.count({ where }),
      prisma.leaveRequest.findMany({
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
          approvalSteps: {
            orderBy: { stepNumber: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const stats = {
      total:    requests.length,
      pending:  requests.filter((r) => r.status === 'PENDING').length,
      approved: requests.filter((r) => r.status === 'APPROVED').length,
      rejected: requests.filter((r) => r.status === 'REJECTED').length,
    };

    return NextResponse.json({
      success: true,
      requests,
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
      totalDays: daysInput,
      reason,
      step3ApproverType: step3Input,
    } = body;

    const step3ApproverType =
      step3Input === 'BOSHQARMA_BOSHLIGI' ? 'BOSHQARMA_BOSHLIGI' : 'TEXNIK_DIREKTOR';

    if (!employeeId || !type || !startDate || !endDate || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: "Barcha majburiy maydonlarni to'ldiring (Xodim, Ariza turi, Sanalar, Sabab)",
        },
        { status: 400 }
      );
    }

    // ── UTC-safe date parsing ─────────────────────────────────────────────
    const start = parseUTCDateStart(startDate);
    const end   = parseUTCDateEnd(endDate);

    if (!start || !end) {
      return NextResponse.json(
        { success: false, error: "Noto'g'ri sana formati" },
        { status: 400 }
      );
    }

    // Calculate days using UTC-aware helper (avoids floating-point rounding)
    let totalDays = daysInput;
    if (!totalDays || totalDays <= 0) {
      totalDays = calcDaysDiff(start, end);
    }

    // ── Check overlapping pending requests ────────────────────────────────
    const activeConflict = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: 'PENDING',
        AND: [
          { startDate: { lte: end } },
          { endDate:   { gte: start } },
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

    // Create LeaveRequest with 6 approval steps and dynamic Step 3 approver
    const newRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        type,
        startDate: start,
        endDate:   end,
        totalDays,
        reason,
        status: 'PENDING',
        currentStep: 1,
        step3ApproverType,
        approvalSteps: {
          create: APPROVAL_STEPS_CONFIG.map((step) => {
            let approverRole = step.approverRole;
            if (step.stepNumber === 3) {
              approverRole =
                step3ApproverType === 'BOSHQARMA_BOSHLIGI'
                  ? 'BOSHQARMA_BOSHLIGI'
                  : 'TECHNICAL_DIRECTOR';
            }
            return {
              stepNumber: step.stepNumber,
              approverRole,
              status: 'PENDING',
            };
          }),
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            tabelNumber: true,
            firstName: true,
            lastName: true,
            currentDepartment: { select: { id: true, name: true } },
          },
        },
        approvalSteps: { orderBy: { stepNumber: 'asc' } },
      },
    });

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
