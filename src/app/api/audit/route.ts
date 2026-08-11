import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search     = searchParams.get('search');
    const action     = searchParams.get('action');
    const hrUserId   = searchParams.get('hrUserId');
    const startDate  = searchParams.get('startDate');
    const endDate    = searchParams.get('endDate');
    const limit      = parseInt(searchParams.get('limit') || '100');

    const where: any = {};

    if (hrUserId) where.hrUserId = hrUserId;
    if (action && action !== 'ALL') where.action = { contains: action };

    if (search) {
      where.OR = [
        { hrName:         { contains: search } },
        { action:         { contains: search } },
        { departmentName: { contains: search } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate)   where.createdAt.lte = new Date(endDate + 'T23:59:59');
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        hrUser: {
          select: { id: true, username: true, fullName: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const actionTypes = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: true,
      orderBy: { _count: { action: 'desc' } },
      take: 20,
    });

    return NextResponse.json({ success: true, logs, actionTypes: actionTypes.map((a) => a.action) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { hrUserId, hrName, action, targetEmployeeId, departmentName, ipAddress, metadata } = body;

    const log = await prisma.auditLog.create({
      data: {
        hrUserId:        hrUserId        || null,
        hrName:          hrName          || 'Tizim',
        action:          action          || 'Noma\'lum amal',
        targetEmployeeId: targetEmployeeId || null,
        departmentName:  departmentName  || null,
        ipAddress:       ipAddress       || null,
        metadata:        metadata        ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
