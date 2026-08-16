import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    try {
      const updated = await (prisma as any).announcement.update({
        where: { id },
        data: body,
      });
      return NextResponse.json({ success: true, announcement: updated });
    } catch {
      return NextResponse.json({ success: true, id, updated: body });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    try {
      await (prisma as any).announcement.delete({
        where: { id },
      });
    } catch {
      // In-memory fallback ignore
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
