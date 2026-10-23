import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// Admin-only guard. The admin app already gates the UI behind /api/login,
// but every mutating endpoint must re-check the session cookie itself.
async function guard(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// GET /api/admin/tools — full catalogue, including disabled tools.
export async function GET(req: NextRequest) {
  const denied = await guard(req);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category && category !== 'all') where.category = category;
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    const [tools, total, active] = await Promise.all([
      prisma.tool.findMany({ where, orderBy: [{ category: 'asc' }, { name: 'asc' }] }),
      prisma.tool.count(),
      prisma.tool.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({ tools, total, active });
  } catch (error) {
    console.error('Failed to fetch tools:', error);
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
  }
}

// POST /api/admin/tools — create a tool.
export async function POST(req: NextRequest) {
  const denied = await guard(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const slug = slugify(body.slug || name);

    if (!name) {
      return NextResponse.json({ error: 'Tool name is required' }, { status: 400 });
    }
    if (!slug) {
      return NextResponse.json({ error: 'A valid slug is required' }, { status: 400 });
    }

    const existing = await prisma.tool.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: `Slug "${slug}" is already in use` }, { status: 409 });
    }

    const creditCost = Number(body.creditCost);
    const tool = await prisma.tool.create({
      data: {
        name,
        slug,
        description: body.description ? String(body.description) : null,
        category: body.category ? String(body.category).toLowerCase() : null,
        creditCost: Number.isFinite(creditCost) && creditCost >= 0 ? Math.floor(creditCost) : 1,
        isActive: body.isActive !== false,
        iconUrl: body.iconUrl ? String(body.iconUrl) : null,
        handlerCode: body.handlerCode ? String(body.handlerCode) : null,
      },
    });

    return NextResponse.json(tool, { status: 201 });
  } catch (error) {
    console.error('Failed to create tool:', error);
    return NextResponse.json({ error: 'Failed to create tool' }, { status: 500 });
  }
}
