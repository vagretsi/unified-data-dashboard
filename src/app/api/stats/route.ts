import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const dbMetrics = await prisma.metric.findMany({ orderBy: { updated_at: 'desc' } });
    const stats = dbMetrics.map(m => ({
      id: m.id,
      label: m.metric_label,
      value: Number(m.metric_value).toLocaleString(),
      status: m.status,
      source: m.source_name.replace('_', ' ')
    }));
    return NextResponse.json({ stats });
  } catch (error) {
    return NextResponse.json({ error: 'DB Error' }, { status: 500 });
  }
}
