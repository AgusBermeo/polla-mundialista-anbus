"use client";

type Team = { id: string; name: string; code: string; group: string };

export type MatchForTable = {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  counted: boolean;
};

export type Standing = {
  teamId: string;
  teamName: string;
  teamCode: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

export function computeStandings(matches: MatchForTable[]): Standing[] {
  const standings: Record<string, Standing> = {};

  for (const match of matches) {
    for (const team of [match.homeTeam, match.awayTeam]) {
      if (!standings[team.id]) {
        standings[team.id] = {
          teamId: team.id,
          teamName: team.name,
          teamCode: team.code,
          played: 0, won: 0, drawn: 0, lost: 0,
          gf: 0, ga: 0, gd: 0, points: 0,
        };
      }
    }

    if (!match.counted || match.homeScore === null || match.awayScore === null) continue;

    const home = standings[match.homeTeam.id];
    const away = standings[match.awayTeam.id];
    const hs = match.homeScore;
    const as_ = match.awayScore;

    home.played++; away.played++;
    home.gf += hs; home.ga += as_;
    away.gf += as_; away.ga += hs;

    if (hs > as_) {
      home.won++; home.points += 3; away.lost++;
    } else if (hs < as_) {
      away.won++; away.points += 3; home.lost++;
    } else {
      home.drawn++; away.drawn++;
      home.points += 1; away.points += 1;
    }
  }

  return Object.values(standings)
    .map((s) => ({ ...s, gd: s.gf - s.ga }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.teamName.localeCompare(b.teamName);
    });
}

/** Compare two third-place standings to decide which is "better" (for sorting). */
export function compareThird(a: Standing, b: Standing): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.gd !== a.gd) return b.gd - a.gd;
  if (b.gf !== a.gf) return b.gf - a.gf;
  return a.teamName.localeCompare(b.teamName);
}

type Accent = "cyan" | "violet";

const accentClasses: Record<Accent, {
  tab: string; badge: string; dot: string; row: string; thirdRow: string; thirdBadge: string;
}> = {
  cyan: {
    tab:        "bg-cyan-600 text-white",
    badge:      "bg-cyan-600 text-white",
    dot:        "bg-cyan-600",
    row:        "bg-cyan-50/50",
    thirdRow:   "bg-amber-50/60",
    thirdBadge: "border-2 border-amber-400 text-amber-600",
  },
  violet: {
    tab:        "bg-violet-600 text-white",
    badge:      "bg-violet-600 text-white",
    dot:        "bg-violet-600",
    row:        "bg-violet-50/50",
    thirdRow:   "bg-amber-50/60",
    thirdBadge: "border-2 border-amber-400 text-amber-600",
  },
};

export default function GroupTable({
  matches,
  title,
  emptyLabel = "Sin datos aún",
  accent = "cyan",
  thirdQualifies = false,
}: {
  matches: MatchForTable[];
  title: string;
  emptyLabel?: string;
  accent?: Accent;
  /** Whether this group's 3rd-place team is among the best 8 thirds across all groups */
  thirdQualifies?: boolean;
}) {
  const standings = computeStandings(matches);
  const hasAny = matches.some((m) => m.counted);
  const ac = accentClasses[accent];

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ac.tab}`}>
          {title}
        </span>
        {!hasAny && (
          <span className="text-xs text-gray-400 italic">{emptyLabel}</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-400 w-6">#</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Equipo</th>
              <th className="text-center px-2 py-2 text-xs font-medium text-gray-400 w-8" title="Partidos jugados">PJ</th>
              <th className="text-center px-2 py-2 text-xs font-medium text-gray-400 w-8" title="Ganados">G</th>
              <th className="text-center px-2 py-2 text-xs font-medium text-gray-400 w-8" title="Empatados">E</th>
              <th className="text-center px-2 py-2 text-xs font-medium text-gray-400 w-8" title="Perdidos">P</th>
              <th className="text-center px-2 py-2 text-xs font-medium text-gray-400 w-8" title="Goles a favor">GF</th>
              <th className="text-center px-2 py-2 text-xs font-medium text-gray-400 w-8" title="Goles en contra">GC</th>
              <th className="text-center px-2 py-2 text-xs font-medium text-gray-400 w-10" title="Diferencia de goles">DG</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-gray-400 w-10" title="Puntos">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const top2 = i < 2 && hasAny;
              const isThird = i === 2 && hasAny;
              const thirdIn = isThird && thirdQualifies;

              let rowBg = "";
              if (top2) rowBg = ac.row;
              else if (thirdIn) rowBg = ac.thirdRow;

              return (
                <tr key={s.teamId} className={`border-b border-gray-50 last:border-0 transition-colors ${rowBg}`}>
                  <td className="px-4 py-2.5 text-xs font-medium">
                    {top2 ? (
                      <span className={`inline-flex w-4 h-4 rounded-full text-[10px] items-center justify-center font-bold ${ac.badge}`}>
                        {i + 1}
                      </span>
                    ) : thirdIn ? (
                      <span className={`inline-flex w-4 h-4 rounded-full text-[10px] items-center justify-center font-bold bg-transparent ${ac.thirdBadge}`}>
                        3
                      </span>
                    ) : (
                      <span className="text-gray-400">{i + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-700">
                    <span className="text-xs text-gray-400 font-normal mr-1.5">{s.teamCode}</span>
                    {s.teamName}
                  </td>
                  <td className="text-center px-2 py-2.5 text-gray-600">{s.played}</td>
                  <td className="text-center px-2 py-2.5 text-gray-600">{s.won}</td>
                  <td className="text-center px-2 py-2.5 text-gray-600">{s.drawn}</td>
                  <td className="text-center px-2 py-2.5 text-gray-600">{s.lost}</td>
                  <td className="text-center px-2 py-2.5 text-gray-600">{s.gf}</td>
                  <td className="text-center px-2 py-2.5 text-gray-600">{s.ga}</td>
                  <td className="text-center px-2 py-2.5 font-medium text-gray-700">
                    {s.gd > 0 ? `+${s.gd}` : s.gd}
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <span className="font-bold text-gray-900">{s.points}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasAny && (
        <div className="px-4 py-2 border-t border-gray-100 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 rounded-full ${ac.dot}`} />
            <span className="text-xs text-gray-400">Clasifican directamente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-amber-400" />
            <span className="text-xs text-gray-400">
              Clasifican como mejor 3.° (entre los 8 mejores)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}