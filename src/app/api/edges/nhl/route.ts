import { NextResponse } from 'next/server';
import { generateMoneylineEdges } from '@/lib/model';

export const dynamic = 'force-dynamic';

export async function GET() {
  const key = process.env.ODDS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Missing ODDS_API_KEY. Add it in Vercel Settings > Environment Variables.', edges: [] });
  }

  const url = `https://api.the-odds-api.com/v4/sports/icehockey_nhl/odds/?apiKey=${key}&regions=us&markets=h2h&oddsFormat=american`;
  const res = await fetch(url, { cache: 'no-store' });
  const odds = await res.json();
  if (!res.ok) return NextResponse.json({ error: odds?.message || 'Odds API request failed', edges: [] }, { status: 200 });

  return NextResponse.json({ edges: generateMoneylineEdges(odds), count: odds.length });
}
