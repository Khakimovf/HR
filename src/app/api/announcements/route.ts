import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeUnpublished = searchParams.get('all') === 'true';

  try {
    const dbAnnouncements = await (prisma as any).announcement.findMany({
      where: includeUnpublished ? {} : { is_published: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, announcements: dbAnnouncements || [] });
  } catch (error: any) {
    return NextResponse.json({ success: true, announcements: [] });
  }
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

    const created = await (prisma as any).announcement.create({
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

    return NextResponse.json({ success: true, announcement: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Xatolik' }, { status: 500 });
  }
}
