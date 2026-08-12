import { POST as handleImport } from '@/app/api/employees/import/route';

export async function POST(req: Request) {
  return handleImport(req);
}
