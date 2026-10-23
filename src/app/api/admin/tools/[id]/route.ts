import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

async function guard(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

// PATCH /api/admin/tools/[id] — update fields or toggle isActive.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard(req);
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.tool.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: 'Tool name cannot be empty' }, { status: 400 });
      data.name = name;
    }

    if (body.slug !== undefined) {
      const slug = String(body.slug).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (!slug) return NextResponse.json({ error: 'A valid slug is required' }, { status: 400 });
      if (slug !== existing.slug) {
        const clash = await prisma.tool.findUnique({ where: { slug } });
        if (clash) return NextResponse.json({ error: `Slug "${slug}" is already in use` }, { status: 409 });
      }
      data.slug = slug;
    }

    if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
    if (body.category !== undefined) data.category = body.category ? String(body.category).toLowerCase() : null;
    if (body.iconUrl !== undefined) data.iconUrl = body.iconUrl ? String(body.iconUrl) : null;
    if (body.handlerCode !== undefined) data.handlerCode = body.handlerCode ? String(body.handlerCode) : null;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    if (body.creditCost !== undefined) {
      const creditCost = Number(body.creditCost);
      if (!Number.isFinite(creditCost) || creditCost < 0) {
        return NextResponse.json({ error: 'Credit cost must be a positive number' }, { status: 400 });
      }
      data.creditCost = Math.floor(creditCost);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const tool = await prisma.tool.update({ where: { id }, data });
    return NextResponse.json(tool);
  } catch (error) {
    console.error('Failed to update tool:', error);
    return NextResponse.json({ error: 'Failed to update tool' }, { status: 500 });
  }
}

// DELETE /api/admin/tools/[id] — remove a tool from the catalogue.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard(req);
  if (denied) return denied;

  try {
    const { id } = await params;
    const existing = await prisma.tool.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    await prisma.tool.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: existing.slug });
  } catch (error) {
    console.error('Failed to delete tool:', error);
    return NextResponse.json({ error: 'Failed to delete tool' }, { status: 500 });
  }
}
