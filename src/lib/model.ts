import type { MoneylineEdge } from './types';

export function americanToProbability(odds: number | null): number | null {
  if (odds === null || Number.isNaN(odds)) return null;
  return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
}

export function probabilityToAmerican(prob: number): string {
  if (!prob || prob <= 0 || prob >= 1) return '—';
  if (prob >= 0.5) return String(Math.round((-prob / (1 - prob)) * 100));
  return `+${Math.round(((1 - prob) / prob) * 100)}`;
}

function stableHash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

export function simpleModelProbability(homeTeam: string, awayTeam: string): number {
  const h = stableHash(`${homeTeam}-${awayTeam}`);
  // Conservative fake model baseline until you wire in real team stats.
  return 0.46 + (h % 1400) / 10000; // 46% to 60%
}

export function generateMoneylineEdges(oddsData: any[]): MoneylineEdge[] {
  const edges: MoneylineEdge[] = [];

  for (const game of oddsData || []) {
    const home = game.home_team;
    const away = game.away_team;
    const bookmaker = game.bookmakers?.[0];
    const h2h = bookmaker?.markets?.find((m: any) => m.key === 'h2h');
    const outcomes = h2h?.outcomes || [];
    const homeOdds = outcomes.find((o: any) => o.name === home)?.price ?? null;
    const awayOdds = outcomes.find((o: any) => o.name === away)?.price ?? null;

    const homeModel = simpleModelProbability(home, away);
    const awayModel = 1 - homeModel;

    const homeImplied = americanToProbability(homeOdds);
    const awayImplied = americanToProbability(awayOdds);

    const homeEdge = homeImplied === null ? null : homeModel - homeImplied;
    const awayEdge = awayImplied === null ? null : awayModel - awayImplied;

    const homeRow = {
      id: `${game.id || home}-${home}`,
      game: `${away} @ ${home}`,
      commenceTime: game.commence_time,
      pick: `${home} ML`,
      odds: homeOdds,
      modelProb: homeModel,
      impliedProb: homeImplied,
      edgePct: homeEdge === null ? null : homeEdge * 100,
      qualified: homeEdge !== null && homeEdge >= 0.04,
    };

    const awayRow = {
      id: `${game.id || away}-${away}`,
      game: `${away} @ ${home}`,
      commenceTime: game.commence_time,
      pick: `${away} ML`,
      odds: awayOdds,
      modelProb: awayModel,
      impliedProb: awayImplied,
      edgePct: awayEdge === null ? null : awayEdge * 100,
      qualified: awayEdge !== null && awayEdge >= 0.04,
    };

    edges.push(homeRow, awayRow);
  }

  return edges.sort((a, b) => (b.edgePct ?? -999) - (a.edgePct ?? -999));
}
