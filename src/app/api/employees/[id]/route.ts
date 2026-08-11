import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        currentDepartment: true,
        educations: true,
        permits: {
          orderBy: { issueDate: 'desc' },
        },
        transfers: {
          include: {
            fromDepartment: true,
            toDepartment: true,
          },
          orderBy: { transferDate: 'desc' },
        },
        leaves: {
          orderBy: { startDate: 'desc' },
        },
        disciplinaryActions: {
          orderBy: { startDate: 'desc' },
        },
        rewards: {
          orderBy: { orderDate: 'desc' },
        },
        kpiRecords: {
          orderBy: { month: 'desc' },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Xodim topilmadi' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'OFFBOARD') {
      const employee = await prisma.employee.update({
        where: { id: params.id },
        data: {
          status: 'OFFBOARDED',
        },
      });
      return NextResponse.json({ success: true, message: 'Xodim mehnat shartnomasi bekor qilindi (Offboarded)', employee });
    }

    // Standard Profile Update
    const {
      firstName,
      lastName,
      middleName,
      phone,
      email,
      militaryCertificate,
      position,
      status,
    } = body;

    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        middleName,
        phone,
        email,
        militaryCertificate,
        position,
        status: status || 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.employee.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: 'Xodim tizimdan o\'chirildi' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
