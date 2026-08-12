import { POST as handleImport } from '@/app/api/departments/import/route';

export async function POST(req: Request) {
  return handleImport(req);
}
