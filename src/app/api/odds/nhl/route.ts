import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const key = process.env.ODDS_API_KEY;
  if (!key) return NextResponse.json({ error: 'Missing ODDS_API_KEY environment variable' }, { status: 200 });

  const url = `https://api.the-odds-api.com/v4/sports/icehockey_nhl/odds/?apiKey=${key}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.ok ? 200 : 502 });
}
