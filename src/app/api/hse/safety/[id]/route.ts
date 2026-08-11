import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { title, completionDate, validityDays, instructorName, protocolNumber, notes } = body;

    const data: any = {};
    if (title)           data.title           = title;
    if (instructorName !== undefined) data.instructorName = instructorName;
    if (protocolNumber !== undefined) data.protocolNumber = protocolNumber;
    if (notes !== undefined)          data.notes          = notes;

    if (completionDate) {
      const cDate = new Date(completionDate);
      const days = validityDays || 365;
      const eDate = new Date(cDate);
      eDate.setDate(eDate.getDate() + days);
      data.completionDate = cDate;
      data.expiryDate     = eDate;
      data.validityDays   = days;
    }

    const briefing = await prisma.safetyBriefing.update({
      where: { id: params.id },
      data,
      include: { employee: { include: { currentDepartment: true } } },
    });

    return NextResponse.json({ success: true, briefing });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.safetyBriefing.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
