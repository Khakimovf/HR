import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUTCDateStart, parseUTCDateEnd } from '@/lib/date-utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search    = searchParams.get('search');
    const action    = searchParams.get('action');
    const hrUserId  = searchParams.get('hrUserId');
    const startDate = searchParams.get('startDate');
    const endDate   = searchParams.get('endDate');

    // ── True server-side pagination ───────────────────────────────────────
    // Previously: only `take: limit` with no `skip` — page 2 was impossible.
    const page  = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(200, parseInt(searchParams.get('limit') || '50', 10)));
    const skip  = (page - 1) * limit;

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
      // UTC-safe date range
      if (startDate) {
        const s = parseUTCDateStart(startDate);
        if (s) where.createdAt.gte = s;
      }
      if (endDate) {
        const e = parseUTCDateEnd(endDate);
        if (e) where.createdAt.lte = e;
      }
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          hrUser: {
            select: { id: true, username: true, fullName: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const actionTypes = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: true,
      orderBy: { _count: { action: 'desc' } },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      logs,
      actionTypes: actionTypes.map((a) => a.action),
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
      hrUserId,
      hrName,
      action,
      targetEmployeeId,
      departmentName,
      ipAddress,
      metadata,
    } = body;

    const log = await prisma.auditLog.create({
      data: {
        hrUserId:         hrUserId         || null,
        hrName:           hrName           || 'Tizim',
        action:           action           || "Noma'lum amal",
        targetEmployeeId: targetEmployeeId || null,
        departmentName:   departmentName   || null,
        ipAddress:        ipAddress        || null,
        metadata:         metadata         ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
