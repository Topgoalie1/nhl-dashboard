'use client';

import { useEffect, useMemo, useState } from 'react';

type Game = {
  id: number | string;
  gameDate?: string;
  startTimeUTC?: string;
  gameState?: string;
  awayTeam?: { abbrev?: string; score?: number; name?: { default?: string } };
  homeTeam?: { abbrev?: string; score?: number; name?: { default?: string } };
};

type Edge = {
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

const fallbackPicks = [
  { date: '2026-04-28', game: 'BOS @ BUF', pick: 'Sabres ML', odds: '-170', edgePct: 2.1, qualified: false, result: 'Loss', units: -1, note: 'Lean only.' },
  { date: '2026-04-28', game: 'ANA @ EDM', pick: 'Ducks ML', odds: '+150', edgePct: 5.4, qualified: true, result: 'Loss', units: -1, note: 'Qualified edge.' },
  { date: '2026-04-29', game: 'PIT @ PHI', pick: 'Penguins ML', odds: '-120', edgePct: 4.2, qualified: true, result: 'Loss', units: -1, note: 'Flyers won 1-0 OT.' },
  { date: '2026-04-30', game: 'EDM @ ANA', pick: 'Over 6.5', odds: '-105', edgePct: 4.1, qualified: true, result: 'Win', units: 0.95, note: 'Ducks won 5-2.' },
  { date: '2026-05-01', game: 'BUF @ BOS', pick: 'Sabres ML', odds: '-125', edgePct: 4.4, qualified: true, result: 'Win', units: 0.8, note: 'Sabres won 4-1.' },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="text-lg font-bold">{value}</p></div>;
}

export default function Dashboard() {
  const [date, setDate] = useState(todayISO());
  const [games, setGames] = useState<Game[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'all' | 'qualified'>('qualified');

  async function loadData() {
    setLoading(true);
    setMessage('');
    try {
      const [scheduleRes, edgeRes] = await Promise.all([
        fetch(`/api/nhl/schedule?date=${date}`, { cache: 'no-store' }),
        fetch('/api/edges/nhl', { cache: 'no-store' }),
      ]);
      const scheduleData = await scheduleRes.json();
      const edgeData = await edgeRes.json();
      const fetchedGames = (scheduleData.gameWeek || []).flatMap((d: any) => d.games || []);
      setGames(fetchedGames);
      setEdges(edgeData.edges || []);
      if (edgeData.error) setMessage(edgeData.error);
    } catch (e) {
      setMessage('Could not load live data. Try refreshing.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const visiblePicks = tab === 'qualified' ? fallbackPicks.filter(p => p.qualified) : fallbackPicks;
  const wins = visiblePicks.filter(p => p.result === 'Win').length;
  const losses = visiblePicks.filter(p => p.result === 'Loss').length;
  const units = visiblePicks.reduce((sum, p) => sum + p.units, 0);
  const roi = visiblePicks.length ? (units / visiblePicks.length) * 100 : 0;
  const qualifiedEdges = useMemo(() => edges.filter(e => e.qualified).slice(0, 12), [edges]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">NHL Live Betting Dashboard</p>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Daily edges, odds, and pick tracker</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Auto-loads NHL schedule/results and live moneyline edges. Add your Odds API key in Vercel to activate live odds.</p>
          </div>
          <div className="flex gap-2 rounded-2xl border bg-white p-3 shadow-sm">
            <input className="rounded-xl border px-3 py-2" type="date" value={date} onChange={e => setDate(e.target.value)} />
            <button onClick={loadData} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white">{loading ? 'Loading...' : 'Refresh'}</button>
          </div>
        </div>

        {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{message}</div>}

        <Card className="p-5">
          <h2 className="text-xl font-bold">Lean vs Qualified Edge</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="font-bold">Lean</p><p className="text-sm text-slate-600">A lean is something the model likes, but it does not clear the full bet threshold. Tracked for learning.</p></div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="font-bold text-blue-900">Qualified Edge</p><p className="text-sm text-blue-900">A qualified edge clears the 4% threshold. This is the tab to judge the model.</p></div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold">Record Tracker</h2>
            <div className="inline-flex rounded-2xl bg-slate-100 p-1">
              <button onClick={() => setTab('all')} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'all' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>All Leans</button>
              <button onClick={() => setTab('qualified')} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'qualified' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>Qualified Edges</button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Record" value={`${wins}-${losses}`} />
            <Stat label="Units" value={units.toFixed(2)} />
            <Stat label="ROI" value={`${roi.toFixed(1)}%`} />
            <Stat label="Tracked" value={String(visiblePicks.length)} />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-slate-500"><th className="py-2 pr-3">Date</th><th className="pr-3">Game</th><th className="pr-3">Pick</th><th className="pr-3">Odds</th><th className="pr-3">Edge</th><th className="pr-3">Result</th><th>Note</th></tr></thead>
              <tbody>{visiblePicks.map((p, i) => <tr key={i} className="border-b"><td className="py-3 pr-3">{p.date}</td><td className="pr-3 font-semibold">{p.game}</td><td className="pr-3">{p.pick}</td><td className="pr-3">{p.odds}</td><td className="pr-3">{p.edgePct}%</td><td className="pr-3 font-bold">{p.result}</td><td className="text-slate-500">{p.note}</td></tr>)}</tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-xl font-bold">Today’s NHL Games</h2>
            <div className="mt-4 space-y-2">
              {games.length === 0 && <p className="text-sm text-slate-500">No games found for this date.</p>}
              {games.map(g => (
                <div key={g.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between"><p className="font-bold">{g.awayTeam?.abbrev} @ {g.homeTeam?.abbrev}</p><p className="text-xs text-slate-500">{g.gameState}</p></div>
                  <p className="text-sm text-slate-500">{g.awayTeam?.score ?? 0} - {g.homeTeam?.score ?? 0} · {g.startTimeUTC ? new Date(g.startTimeUTC).toLocaleString() : g.gameDate}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-bold">Auto Daily Moneyline Edges</h2>
            <p className="mt-1 text-sm text-slate-500">Requires ODDS_API_KEY. Model is a starter baseline until team stats are wired in.</p>
            <div className="mt-4 space-y-2">
              {qualifiedEdges.length === 0 && <p className="text-sm text-slate-500">No qualified edges loaded yet.</p>}
              {qualifiedEdges.map(e => (
                <div key={e.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-3"><p className="font-bold">{e.pick}</p><p className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-800">{e.edgePct?.toFixed(1)}%</p></div>
                  <p className="text-sm text-slate-500">{e.game} · Odds {e.odds ?? '—'} · Model {(e.modelProb * 100).toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
