import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { checkupDate, validityMonths, status, clinicName, orderRef, notes } = body;

    const data: any = {};
    if (status)      data.status = status;
    if (clinicName !== undefined) data.clinicName = clinicName;
    if (orderRef !== undefined)   data.orderRef   = orderRef;
    if (notes !== undefined)      data.notes      = notes;

    if (checkupDate) {
      const cDate = new Date(checkupDate);
      const months = validityMonths || 12;
      const eDate = new Date(cDate);
      eDate.setMonth(eDate.getMonth() + months);
      data.checkupDate    = cDate;
      data.expiryDate     = eDate;
      data.validityMonths = months;
    }

    const checkup = await prisma.medicalCheckup.update({
      where: { id: params.id },
      data,
      include: { employee: { include: { currentDepartment: true } } },
    });

    return NextResponse.json({ success: true, checkup });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.medicalCheckup.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
