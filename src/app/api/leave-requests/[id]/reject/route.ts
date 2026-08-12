import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const requestId = params.id;
    const body = await req.json();
    const { approverName, rejectionComment } = body;

    if (!requestId) {
      return NextResponse.json({ success: false, error: "Ariza ID ko'rsatilmadi" }, { status: 400 });
    }

    if (!rejectionComment || rejectionComment.trim() === '') {
      return NextResponse.json(
        { success: false, error: "Rad etish sababini kiritish majburiy!" },
        { status: 400 }
      );
    }

    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: true,
        approvalSteps: { orderBy: { stepNumber: 'asc' } },
      },
    });

    if (!request) {
      return NextResponse.json({ success: false, error: 'Ariza topilmadi' }, { status: 404 });
    }

    if (request.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: `Ushbu ariza holati allaqachon ${request.status} bo'lgan` },
        { status: 400 }
      );
    }

    const currentStepNum = request.currentStep;
    const currentStepObj = request.approvalSteps.find((s) => s.stepNumber === currentStepNum);

    const now = new Date();
    const finalApproverName = approverName || 'Rahbar';

    // Update step if step object exists
    if (currentStepObj) {
      await prisma.leaveApprovalStep.update({
        where: { id: currentStepObj.id },
        data: {
          status: 'REJECTED',
          approverName: finalApproverName,
          comment: rejectionComment,
          actionDate: now,
        },
      });
    }

    // Set request status to REJECTED and halt approval workflow
    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectionComment,
      },
      include: {
        employee: { include: { currentDepartment: true } },
        approvalSteps: { orderBy: { stepNumber: 'asc' } },
      },
    });

    // Log in audit log
    await prisma.auditLog.create({
      data: {
        hrName: finalApproverName,
        action: `Ta'til arizasi rad etildi (Bosqich ${currentStepNum}). Sabab: "${rejectionComment}"`,
        targetEmployeeId: request.employeeId,
        metadata: JSON.stringify({ requestId: request.id, stepNumber: currentStepNum, rejectionComment }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Ariza rad etildi va hujjat aylanishi to'xtatildi.`,
      request: updatedRequest,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
