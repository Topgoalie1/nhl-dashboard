export type MoneylineEdge = {
  id: string;
  game: string;
  commenceTime?: string;
  pick: string;
  odds: number | null;
  modelProb: number;
  impliedProb: number | null;
  edgePct: number | null;
  qualified: boolean;
};
