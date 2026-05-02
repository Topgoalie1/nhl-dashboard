import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const url = `https://api-web.nhle.com/v1/schedule/${date}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return NextResponse.json({ error: 'NHL request failed' }, { status: 502 });
  const data = await res.json();
  return NextResponse.json(data);
}
