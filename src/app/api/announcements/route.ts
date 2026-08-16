import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Fallback in-memory store if DB query fails during dynamic migration
let inMemoryAnnouncements = [
  {
    id: 'ann-1',
    title_uz: "V2.4 Tizim Yangilanishi: Med-ko'rik va HSE Avtomatlashtirish Moduli",
    title_kr: 'V2.4 시스템 업데이트: 보건 안전 및 건강검진 (HSE) 자동화 모듈 출시',
    content_uz: "Hurmatli HR mutaxassislari! Tizimga yangi HSE (Mehnat muhofazasi) va Tibbiy ko'rik monitoring moduli qo'shildi. Endi siz 15 kun qolganda ogohlantirish ruxsatnomalarini va batch checkup loglarini bir joyda boshqarishingiz mumkin.",
    content_kr: '수신: 인사 담당자 및 경영진. 보건 안전 (HSE) 및 정기 건강검진 관리 모듈이 새롭게 출시되었습니다. 15일 전 자동 만료 알림 및 일괄 검진 이력 등록 기능을 제공합니다.',
    category: 'FEATURE',
    affectedModule: 'SAFETY',
    priority: 'HIGH',
    created_by: 'Ergashev J. (Bosh Admin)',
    is_published: true,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'ann-2',
    title_uz: '6-Bosqichli Avtomatik Ariza Tasdiqlash va Imzo Marshruti',
    title_kr: '6단계 자동 결재 라인 및 전자 서명 프로세스 업데이트',
    content_uz: "Arizalar va Hujjat aylanishi modulida sex boshlig'idan Bosh direktor avto-buyrug'igacha bo'lgan 6 bosqichli marshrut to'liq ishga tushirildi.",
    content_kr: '신청 및 결재 문서 관리 모듈에 현장 책임자부터 대표이사까지 이어지는 6단계 자동 결재 라인이 적용되었습니다.',
    category: 'UPDATE',
    affectedModule: 'APPLICATIONS',
    priority: 'MEDIUM',
    created_by: 'Khakimov F. (HR Director)',
    is_published: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'ann-3',
    title_uz: 'Tizim Profilaktika Ishlari Ogohlantirishi (Texnik Ishlar)',
    title_kr: '시스템 정기 점검 및 서버 점검 안내',
    content_uz: "Shu yakshanba soat 02:00 dan 04:00 gacha tizimda rejali profilaktika ishlari olib boriladi. Ishga ta'sir qilmaydi.",
    content_kr: '이번 주 일요일 02:00 ~ 04:00 시스템 정기 백업 및 데이터베이스 점검이 진행됩니다.',
    category: 'MAINTENANCE',
    affectedModule: 'ALL',
    priority: 'LOW',
    created_by: 'System Admin',
    is_published: true,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeUnpublished = searchParams.get('all') === 'true';

  try {
    // Try querying Prisma table first
    const dbAnnouncements = await (prisma as any).announcement.findMany({
      where: includeUnpublished ? {} : { is_published: true },
      orderBy: { createdAt: 'desc' },
    });

    if (dbAnnouncements && dbAnnouncements.length > 0) {
      return NextResponse.json({ success: true, announcements: dbAnnouncements });
    }
  } catch {
    // Fallback to inMemory Store
  }

  const filtered = includeUnpublished
    ? inMemoryAnnouncements
    : inMemoryAnnouncements.filter((a) => a.is_published);

  return NextResponse.json({ success: true, announcements: filtered });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title_uz,
      title_kr,
      content_uz,
      content_kr,
      category = 'UPDATE',
      affectedModule = 'ALL',
      priority = 'MEDIUM',
      created_by = 'Admin HR',
      is_published = true,
    } = body;

    if (!title_uz || !title_kr || !content_uz || !content_kr) {
      return NextResponse.json(
        { success: false, error: "Barcha sarlavha va mazmun maydonlarini to'ldiring (UZ/KR)" },
        { status: 400 }
      );
    }

    let created: any;
    try {
      created = await (prisma as any).announcement.create({
        data: {
          title_uz,
          title_kr,
          content_uz,
          content_kr,
          category,
          affectedModule,
          priority,
          created_by,
          is_published: Boolean(is_published),
        },
      });
    } catch {
      // In-memory fallback
      created = {
        id: `ann-${Date.now()}`,
        title_uz,
        title_kr,
        content_uz,
        content_kr,
        category,
        affectedModule,
        priority,
        created_by,
        is_published: Boolean(is_published),
        createdAt: new Date().toISOString(),
      };
      inMemoryAnnouncements.unshift(created);
    }

    return NextResponse.json({ success: true, announcement: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Xatolik' }, { status: 500 });
  }
}
