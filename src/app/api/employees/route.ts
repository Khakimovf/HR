import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const departmentId = searchParams.get('departmentId') || '';
    const permitFilter = searchParams.get('permitFilter') || '';
    const status = searchParams.get('status') || '';
    const disciplineStatus = searchParams.get('disciplineStatus') || '';
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. Department filter
    if (departmentId) {
      where.currentDepartmentId = departmentId;
    }

    // 2. Status filter
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // 3. Permit & Certificate filter
    if (permitFilter && permitFilter !== 'ALL') {
      if (permitFilter === 'MILITARY') {
        where.militaryCertificate = { not: null };
      } else {
        where.permits = {
          some: {
            licenseType: permitFilter,
          },
        };
      }
    }

    // 4. Discipline Status filter
    if (disciplineStatus && disciplineStatus !== 'ALL') {
      if (disciplineStatus === 'ACTIVE_PENALTY') {
        where.disciplinaryActions = {
          some: { status: 'ACTIVE' },
        };
      } else if (disciplineStatus === 'CLEAN') {
        where.disciplinaryActions = {
          none: { status: 'ACTIVE' },
        };
      }
    }

    // 5. Global live text search
    if (search) {
      where.OR = [
        { tabelNumber: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { middleName: { contains: search } },
        { position: { contains: search } },
        { phone: { contains: search } },
        { currentDepartment: { name: { contains: search } } },
        {
          permits: {
            some: {
              OR: [
                { category: { contains: search } },
                { certificateNo: { contains: search } },
              ],
            },
          },
        },
      ];
    }

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        include: {
          currentDepartment: true,
          permits: true,
          educations: true,
          disciplinaryActions: {
            where: { status: 'ACTIVE' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      employees,
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

    // Check if bulk onboarding payload
    if (Array.isArray(body.employees)) {
      const createdList = [];

      for (const emp of body.employees) {
        const {
          tabelNumber,
          firstName,
          lastName,
          middleName,
          gender,
          dateOfBirth,
          hireDate,
          militaryCertificate,
          currentDepartmentId,
          position,
          phone,
          email,
          educationLevel,
          institutionName,
          fieldOfStudy,
        } = emp;

        const finalTabel = tabelNumber || `TB-${8000 + Math.floor(Math.random() * 9000)}`;

        const created = await prisma.employee.create({
          data: {
            tabelNumber: finalTabel,
            firstName,
            lastName,
            middleName: middleName || null,
            gender: gender || 'MALE',
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(1990, 0, 1),
            hireDate: hireDate ? new Date(hireDate) : new Date(),
            militaryCertificate: militaryCertificate || null,
            currentDepartmentId,
            position,
            phone: phone || null,
            email: email || null,
            educations: educationLevel
              ? {
                  create: {
                    level: educationLevel,
                    institutionName: institutionName || 'Noma\'lum dargoh',
                    fieldOfStudy: fieldOfStudy || 'Mutaxassislik',
                    graduationYear: new Date().getFullYear() - 2,
                  },
                }
              : undefined,
          },
        });
        createdList.push(created);
      }

      return NextResponse.json({
        success: true,
        count: createdList.length,
        employees: createdList,
      });
    }

    // Single creation
    const {
      tabelNumber,
      firstName,
      lastName,
      middleName,
      gender,
      dateOfBirth,
      hireDate,
      militaryCertificate,
      currentDepartmentId,
      position,
      phone,
      email,
      educationLevel,
      institutionName,
      fieldOfStudy,
    } = body;

    const employee = await prisma.employee.create({
      data: {
        tabelNumber,
        firstName,
        lastName,
        middleName: middleName || null,
        gender: gender || 'MALE',
        dateOfBirth: new Date(dateOfBirth),
        hireDate: new Date(hireDate),
        militaryCertificate: militaryCertificate || null,
        currentDepartmentId,
        position,
        phone: phone || null,
        email: email || null,
        educations: educationLevel
          ? {
              create: {
                level: educationLevel,
                institutionName: institutionName || '',
                fieldOfStudy: fieldOfStudy || '',
                graduationYear: new Date().getFullYear() - 3,
              },
            }
          : undefined,
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
