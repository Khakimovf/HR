import { POST as handleImport } from '@/app/api/hse/import/route';

export async function POST(req: Request) {
  return handleImport(req);
}
