"use client";

import { useState } from "react";
import GroupTable, { MatchForTable, computeStandings } from "@/components/GroupTable";

type Team = { id: string; name: string; code: string; group: string };
type Match = {
  id: string;
  matchDate: Date;
  isFinished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: Team;
  awayTeam: Team;
  stage: string;
};

// ─── helpers ────────────────────────────────────────────────────────────────

function toMatchForTable(m: Match): MatchForTable {
  return {
    id: m.id,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    counted: m.isFinished,
  };
}

/** Returns top-2 qualifiers (and the 3rd-place team) for a group */
function groupQualifiers(matches: Match[]) {
  const forTable = matches.map(toMatchForTable);
  const standings = computeStandings(forTable);
  return standings; // standings[0] = 1st, standings[1] = 2nd, standings[2] = 3rd
}

// ─── Bracket slot ────────────────────────────────────────────────────────────

function Slot({
  label,
  teamName,
  score,
  winner,
  accent = false,
}: {
  label: string;
  teamName?: string;
  score?: number | null;
  winner?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors
        ${winner ? "bg-cyan-600 border-cyan-600 text-white" : "bg-white border-gray-200 text-gray-700"}
        ${!teamName ? "italic text-gray-400 border-dashed" : ""}
      `}
    >
      <span className={`text-[10px] shrink-0 w-14 truncate ${winner ? "text-cyan-100" : "text-gray-400"}`}>
        {label}
      </span>
      <span className="flex-1 truncate">{teamName ?? "Por definir"}</span>
      {score != null && (
        <span className={`font-bold ml-1 ${winner ? "text-white" : "text-gray-900"}`}>{score}</span>
      )}
    </div>
  );
}

// ─── Bracket match ────────────────────────────────────────────────────────────

function BracketMatch({
  matchLabel,
  homeLabel,
  awayLabel,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  isFinished,
}: {
  matchLabel: string;
  homeLabel: string;
  awayLabel: string;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  isFinished?: boolean;
}) {
  const homeWins = isFinished && homeScore != null && awayScore != null && homeScore > awayScore;
  const awayWins = isFinished && homeScore != null && awayScore != null && awayScore > homeScore;

  return (
    <div className="flex flex-col gap-0.5 w-52">
      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1 px-1">
        {matchLabel}
      </span>
      <Slot label={homeLabel} teamName={homeTeam} score={isFinished ? homeScore : undefined} winner={homeWins} />
      <Slot label={awayLabel} teamName={awayTeam} score={isFinished ? awayScore : undefined} winner={awayWins} />
    </div>
  );
}

// ─── Connector line ───────────────────────────────────────────────────────────

function Connector() {
  return (
    <div className="flex items-center self-center">
      <div className="w-4 h-px bg-gray-300" />
    </div>
  );
}

// ─── Vertical bracket line ────────────────────────────────────────────────────

function VConnector() {
  return (
    <div className="flex flex-col items-center justify-center self-stretch w-4">
      <div className="flex-1 border-r border-gray-300" />
      <div className="w-4 h-px bg-gray-300" />
      <div className="flex-1 border-r border-gray-300" />
    </div>
  );
}

// ─── Knockout bracket component ───────────────────────────────────────────────

interface KnockoutMatch {
  id: string;
  matchDate: Date;
  isFinished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: Team;
  awayTeam: Team;
  stage: string;
}

function KnockoutBracket({
  matchesByGroup,
  knockoutMatches,
}: {
  matchesByGroup: Record<string, Match[]>;
  knockoutMatches: KnockoutMatch[];
}) {
  // Derive group qualifiers from standings
  const qualifiers: Record<string, { first?: string; second?: string; third?: string }> = {};
  for (const [group, matches] of Object.entries(matchesByGroup)) {
    const standings = groupQualifiers(matches);
    qualifiers[group] = {
      first: standings[0]?.teamName,
      second: standings[1]?.teamName,
      third: standings[2]?.teamName,
    };
  }

  // Helper: get knockout match by stage index
  const byStage = (stage: string) =>
    knockoutMatches.filter((m) => m.stage === stage);

  const r16 = byStage("ROUND_OF_16");
  const qf = byStage("QUARTER_FINAL");
  const sf = byStage("SEMI_FINAL");
  const tp = byStage("THIRD_PLACE");
  const fin = byStage("FINAL");

  // Derive a team name for a knockout match slot
  function kTeam(match?: KnockoutMatch, side?: "home" | "away") {
    if (!match) return undefined;
    return side === "home" ? match.homeTeam?.name : match.awayTeam?.name;
  }

  // Round of 16 slot labels based on FIFA 2026 bracket seeding
  // Groups: A-L, 48 teams, 8 best thirds qualify
  // Standard bracket pairings (approximate):
  const r16Pairings = [
    { matchLabel: "R16-1", homeLabel: "1A", awayLabel: "2B", home: qualifiers["A"]?.first, away: qualifiers["B"]?.second },
    { matchLabel: "R16-2", homeLabel: "1C", awayLabel: "2D", home: qualifiers["C"]?.first, away: qualifiers["D"]?.second },
    { matchLabel: "R16-3", homeLabel: "1E", awayLabel: "2F", home: qualifiers["E"]?.first, away: qualifiers["F"]?.second },
    { matchLabel: "R16-4", homeLabel: "1G", awayLabel: "2H", home: qualifiers["G"]?.first, away: qualifiers["H"]?.second },
    { matchLabel: "R16-5", homeLabel: "1I", awayLabel: "2J", home: qualifiers["I"]?.first, away: qualifiers["J"]?.second },
    { matchLabel: "R16-6", homeLabel: "1K", awayLabel: "2L", home: qualifiers["K"]?.first, away: qualifiers["L"]?.second },
    { matchLabel: "R16-7", homeLabel: "1B", awayLabel: "3rd", home: qualifiers["B"]?.first, away: undefined },
    { matchLabel: "R16-8", homeLabel: "1D", awayLabel: "3rd", home: qualifiers["D"]?.first, away: undefined },
    { matchLabel: "R16-9", homeLabel: "1F", awayLabel: "3rd", home: qualifiers["F"]?.first, away: undefined },
    { matchLabel: "R16-10", homeLabel: "1H", awayLabel: "3rd", home: qualifiers["H"]?.first, away: undefined },
    { matchLabel: "R16-11", homeLabel: "1J", awayLabel: "3rd", home: qualifiers["J"]?.first, away: undefined },
    { matchLabel: "R16-12", homeLabel: "1L", awayLabel: "3rd", home: qualifiers["L"]?.first, away: undefined },
    { matchLabel: "R16-13", homeLabel: "2A", awayLabel: "3rd", home: qualifiers["A"]?.second, away: undefined },
    { matchLabel: "R16-14", homeLabel: "2C", awayLabel: "3rd", home: qualifiers["C"]?.second, away: undefined },
    { matchLabel: "R16-15", homeLabel: "2E", awayLabel: "3rd", home: qualifiers["E"]?.second, away: undefined },
    { matchLabel: "R16-16", homeLabel: "2G", awayLabel: "3rd", home: qualifiers["G"]?.second, away: undefined },
  ];

  // Override with actual knockout match data if available
  function resolveMatch(index: number, pairings: typeof r16Pairings, matches: KnockoutMatch[]) {
    const pairing = pairings[index];
    const match = matches[index];
    return {
      matchLabel: pairing?.matchLabel ?? `Partido ${index + 1}`,
      homeLabel: pairing?.homeLabel ?? "Local",
      awayLabel: pairing?.awayLabel ?? "Visitante",
      homeTeam: match ? kTeam(match, "home") : pairing?.home,
      awayTeam: match ? kTeam(match, "away") : pairing?.away,
      homeScore: match?.homeScore,
      awayScore: match?.awayScore,
      isFinished: match?.isFinished,
    };
  }

  const stageLabels: Record<string, string> = {
    ROUND_OF_16: "Octavos de final",
    QUARTER_FINAL: "Cuartos de final",
    SEMI_FINAL: "Semifinales",
    THIRD_PLACE: "Tercer puesto",
    FINAL: "Final",
  };

  return (
    <div className="space-y-10">
      {/* Round of 16 */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
          Octavos de final
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {r16Pairings.map((p, i) => {
            const m = r16[i];
            return (
              <BracketMatch
                key={p.matchLabel}
                matchLabel={p.matchLabel}
                homeLabel={p.homeLabel}
                awayLabel={p.awayLabel}
                homeTeam={m ? kTeam(m, "home") : p.home}
                awayTeam={m ? kTeam(m, "away") : p.away}
                homeScore={m?.homeScore}
                awayScore={m?.awayScore}
                isFinished={m?.isFinished}
              />
            );
          })}
        </div>
      </section>

      {/* Quarters */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
          Cuartos de final
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => {
            const m = qf[i];
            return (
              <BracketMatch
                key={i}
                matchLabel={`QF-${i + 1}`}
                homeLabel={`G R16-${i * 2 + 1}`}
                awayLabel={`G R16-${i * 2 + 2}`}
                homeTeam={m ? kTeam(m, "home") : undefined}
                awayTeam={m ? kTeam(m, "away") : undefined}
                homeScore={m?.homeScore}
                awayScore={m?.awayScore}
                isFinished={m?.isFinished}
              />
            );
          })}
        </div>
      </section>

      {/* Semis */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
          Semifinales
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => {
            const m = sf[i];
            return (
              <BracketMatch
                key={i}
                matchLabel={`SF-${i + 1}`}
                homeLabel={`G QF-${i * 2 + 1}`}
                awayLabel={`G QF-${i * 2 + 2}`}
                homeTeam={m ? kTeam(m, "home") : undefined}
                awayTeam={m ? kTeam(m, "away") : undefined}
                homeScore={m?.homeScore}
                awayScore={m?.awayScore}
                isFinished={m?.isFinished}
              />
            );
          })}
        </div>
      </section>

      {/* Third place + Final */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
            Tercer puesto
          </h2>
          {(() => {
            const m = tp[0];
            return (
              <BracketMatch
                matchLabel="3er Lugar"
                homeLabel="Perdedor SF-1/2"
                awayLabel="Perdedor SF-3/4"
                homeTeam={m ? kTeam(m, "home") : undefined}
                awayTeam={m ? kTeam(m, "away") : undefined}
                homeScore={m?.homeScore}
                awayScore={m?.awayScore}
                isFinished={m?.isFinished}
              />
            );
          })()}
        </section>

        <section>
          <h2 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-4">
            🏆 Final
          </h2>
          {(() => {
            const m = fin[0];
            return (
              <BracketMatch
                matchLabel="Gran Final"
                homeLabel="G SF-1/2"
                awayLabel="G SF-3/4"
                homeTeam={m ? kTeam(m, "home") : undefined}
                awayTeam={m ? kTeam(m, "away") : undefined}
                homeScore={m?.homeScore}
                awayScore={m?.awayScore}
                isFinished={m?.isFinished}
              />
            );
          })()}
        </section>
      </div>
    </div>
  );
}

// ─── Groups overview ──────────────────────────────────────────────────────────

function GroupsOverview({ matchesByGroup }: { matchesByGroup: Record<string, Match[]> }) {
  const groups = Object.keys(matchesByGroup).sort();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {groups.map((group) => {
        const matches: MatchForTable[] = matchesByGroup[group].map(toMatchForTable);
        return (
          <div key={group}>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
              Grupo {group}
            </h2>
            <GroupTable
              matches={matches}
              title={`Grupo ${group}`}
              emptyLabel="— sin resultados aún"
              accent="violet"
              thirdQualifies={false}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function StagesView({
  matchesByGroup,
  knockoutMatches,
}: {
  matchesByGroup: Record<string, Match[]>;
  knockoutMatches: Match[];
}) {
  const [stage, setStage] = useState<"groups" | "knockout">("groups");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-cyan-700">Fases</h1>

        {/* Toggle */}
        <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
          <button
            onClick={() => setStage("groups")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              stage === "groups"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Fase de Grupos
          </button>
          <button
            onClick={() => setStage("knockout")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              stage === "knockout"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Fase Eliminatoria
          </button>
        </div>
      </div>

      {stage === "groups" ? (
        <GroupsOverview matchesByGroup={matchesByGroup} />
      ) : (
        <KnockoutBracket
          matchesByGroup={matchesByGroup}
          knockoutMatches={knockoutMatches}
        />
      )}
    </div>
  );
}