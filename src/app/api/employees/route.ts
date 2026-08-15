import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { statsCache } from '@/lib/cache';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const departmentId = searchParams.get('departmentId') || '';
    const permitFilter = searchParams.get('permitFilter') || '';
    const status = searchParams.get('status') || searchParams.get('statusKey') || '';
    const disciplineStatus = searchParams.get('disciplineStatus') || '';
    const educationFilter = searchParams.get('educationFilter') || '';
    const rewardFilter = searchParams.get('rewardFilter') || '';
    const medicalFilter = searchParams.get('medicalFilter') || '';
    const tenureFilter = searchParams.get('tenureFilter') || '';
    const demographicFilter = searchParams.get('demographicFilter') || '';

    const limitParam = searchParams.get('limit') || '20';
    const isAll = limitParam === 'all' || limitParam === '1000' || limitParam === '9999' || limitParam === '10000';
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = isAll ? 10000 : Math.max(1, Math.min(100, parseInt(limitParam, 10)));
    const skip = isAll ? 0 : (page - 1) * limit;

    const AND: any[] = [];
    const now = new Date();

    // 1. Department filter
    if (departmentId) {
      AND.push({ currentDepartmentId: departmentId });
    }

    // 2. Status filter
    if (status && status !== 'ALL') {
      AND.push({ status });
    }

    // 3. Permit & Certificate filter
    if (permitFilter && permitFilter !== 'ALL') {
      if (permitFilter === 'MILITARY') {
        AND.push({ militaryCertificate: { not: null } });
      } else {
        AND.push({
          permits: {
            some: {
              licenseType: permitFilter,
            },
          },
        });
      }
    }

    // 4. Discipline Status filter
    if (disciplineStatus && disciplineStatus !== 'ALL') {
      if (disciplineStatus === 'ACTIVE_PENALTY') {
        AND.push({
          disciplinaryActions: {
            some: { status: 'ACTIVE' },
          },
        });
      } else if (disciplineStatus === 'CLEAN') {
        AND.push({
          disciplinaryActions: {
            none: { status: 'ACTIVE' },
          },
        });
      }
    }

    // 5. Education filter ("Ma'lumoti bo'yicha")
    if (educationFilter && educationFilter !== 'ALL') {
      if (educationFilter === 'HIGHER') {
        AND.push({
          OR: [
            { educationLevel: 'HIGHER' },
            { educations: { some: { level: { in: ['HIGHER', 'OLIY'] } } } },
          ],
        });
      } else if (educationFilter === 'SPECIAL_SECONDARY') {
        AND.push({
          OR: [
            { educationLevel: { in: ['SPECIAL_SECONDARY', 'SECONDARY_SPECIAL'] } },
            { educations: { some: { level: { in: ['SPECIAL_SECONDARY', 'SECONDARY_SPECIAL', 'O\'RTA_MAXSUS', 'VOCATIONAL'] } } } },
          ],
        });
      } else if (educationFilter === 'SECONDARY') {
        AND.push({
          OR: [
            { educationLevel: 'SECONDARY' },
            { educations: { some: { level: { in: ['SECONDARY', 'O\'RTA'] } } } },
          ],
        });
      } else if (educationFilter === 'INCOMPLETE_HIGHER') {
        AND.push({
          OR: [
            { educationLevel: 'INCOMPLETE_HIGHER' },
            { educations: { some: { level: { in: ['INCOMPLETE_HIGHER', 'TUGALLANMAGAN_OLIY'] } } } },
          ],
        });
      }
    }

    // 6. Rewards & Financial Aid filter ("Mukofot va Rag'batlantirish")
    if (rewardFilter && rewardFilter !== 'ALL') {
      if (rewardFilter === 'REWARDED') {
        AND.push({ rewards: { some: { type: { in: ['REWARD', 'BONUS'] } } } });
      } else if (rewardFilter === 'FINANCIAL_AID') {
        AND.push({ rewards: { some: { type: 'FINANCIAL_AID' } } });
      } else if (rewardFilter === 'NO_REWARDS') {
        AND.push({ rewards: { none: {} } });
      }
    }

    // 7. Medical Checkup Status filter ("Tibbiy Ko'rik Holati")
    if (medicalFilter && medicalFilter !== 'ALL') {
      const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      if (medicalFilter === 'VALID') {
        AND.push({ medicalCheckups: { some: { expiryDate: { gte: in15Days } } } });
      } else if (medicalFilter === 'EXPIRING_SOON') {
        AND.push({ medicalCheckups: { some: { expiryDate: { gte: now, lte: in15Days } } } });
      } else if (medicalFilter === 'EXPIRED') {
        AND.push({
          OR: [
            { medicalCheckups: { some: { expiryDate: { lt: now } } } },
            { medicalCheckups: { some: { status: 'MUDDATI_TUGAGAN' } } },
            { medicalCheckups: { none: {} } },
          ],
        });
      }
    }

    // 8. Work Tenure filter ("Korxonadagi Ish Staji")
    if (tenureFilter && tenureFilter !== 'ALL') {
      const yr1Ago = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const yr3Ago = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
      const yr5Ago = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
      const yr10Ago = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());

      if (tenureFilter === 'UNDER_1_YEAR') {
        AND.push({ hireDate: { gte: yr1Ago } });
      } else if (tenureFilter === '1_TO_3_YEARS') {
        AND.push({ hireDate: { gte: yr3Ago, lt: yr1Ago } });
      } else if (tenureFilter === '3_TO_5_YEARS') {
        AND.push({ hireDate: { gte: yr5Ago, lt: yr3Ago } });
      } else if (tenureFilter === '5_TO_10_YEARS') {
        AND.push({ hireDate: { gte: yr10Ago, lt: yr5Ago } });
      } else if (tenureFilter === 'OVER_10_YEARS') {
        AND.push({ hireDate: { lt: yr10Ago } });
      }
    }

    // 9. Demographics & Pension filter ("Yoshi / Demografiya")
    if (demographicFilter && demographicFilter !== 'ALL') {
      const yr30Ago = new Date(now.getFullYear() - 30, now.getMonth(), now.getDate());
      const yr55Ago = new Date(now.getFullYear() - 55, now.getMonth(), now.getDate());
      const yr60Ago = new Date(now.getFullYear() - 60, now.getMonth(), now.getDate());

      if (demographicFilter === 'YOUTH_UNDER_30') {
        AND.push({ dateOfBirth: { gte: yr30Ago } });
      } else if (demographicFilter === 'PENSION_AGE') {
        AND.push({
          OR: [
            { gender: 'MALE', dateOfBirth: { lte: yr60Ago } },
            { gender: 'FEMALE', dateOfBirth: { lte: yr55Ago } },
          ],
        });
      }
    }

    // 10. Global live text search
    if (search) {
      AND.push({
        OR: [
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
        ],
      });
    }

    const where: any = AND.length > 0 ? { AND } : {};

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
          rewards: true,
          medicalCheckups: {
            orderBy: { expiryDate: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      data: employees,
      employees,
      totalCount: total,
      totalPages,
      currentPage: page,
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

      statsCache.invalidate();
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

    statsCache.invalidate();
    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
