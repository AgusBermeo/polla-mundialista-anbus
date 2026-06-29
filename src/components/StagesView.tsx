"use client";

import { useState } from "react";
import GroupTable, { MatchForTable, computeStandings } from "@/components/GroupTable";
import { getFlagClass } from "@/lib/teamFlags";
import { resolveKnockoutTeams, isPlaceholderCode, KNOCKOUT_PAIRINGS } from "@/lib/knockoutResolver";

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

function groupQualifiers(matches: Match[]) {
  const forTable = matches.map(toMatchForTable);
  const standings = computeStandings(forTable);
  return standings;
}

// ─── Bracket slot ────────────────────────────────────────────────────────────

function Slot({
  label,
  teamName,
  teamCode,
  score,
  winner,
}: {
  label: string;
  teamName?: string;
  teamCode?: string;
  score?: number | null;
  winner?: boolean;
}) {
  const showFlag = teamCode && !isPlaceholderCode(teamCode);
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors
        ${winner ? "bg-cyan-600 border-cyan-600 text-white" : "bg-white border-gray-200 text-gray-700"}
        ${!teamName ? "italic text-gray-400 border-dashed" : ""}
      `}
    >
      <span className={`text-[10px] shrink-0 w-16 truncate ${winner ? "text-cyan-100" : "text-gray-400"}`}>
        {label}
      </span>
      {showFlag && (
        <span className={`${getFlagClass(teamCode)} shrink-0 shadow-3xs rounded-xs`} />
      )}
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
  homeTeamName,
  homeTeamCode,
  awayTeamName,
  awayTeamCode,
  homeScore,
  awayScore,
  isFinished,
  matchDate,
}: {
  matchLabel: string;
  homeLabel: string;
  awayLabel: string;
  homeTeamName?: string;
  homeTeamCode?: string;
  awayTeamName?: string;
  awayTeamCode?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  isFinished?: boolean;
  matchDate?: Date;
}) {
  const homeWins = isFinished && homeScore != null && awayScore != null && homeScore > awayScore;
  const awayWins = isFinished && homeScore != null && awayScore != null && awayScore > homeScore;

  return (
    <div className="flex flex-col gap-0.5 w-56">
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
          {matchLabel}
        </span>
        {matchDate && (
          <span className="text-[10px] text-gray-300">
            {new Date(matchDate).toLocaleDateString("es", { day: "numeric", month: "short", timeZone: "America/Guayaquil" })}
          </span>
        )}
      </div>
      <Slot label={homeLabel} teamName={homeTeamName} teamCode={homeTeamCode} score={isFinished ? homeScore : undefined} winner={homeWins} />
      <Slot label={awayLabel} teamName={awayTeamName} teamCode={awayTeamCode} score={isFinished ? awayScore : undefined} winner={awayWins} />
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
  const allMatches = [
    ...Object.values(matchesByGroup).flat(),
    ...knockoutMatches,
  ];

  const uniqueTeamsMap = new Map<string, Team>();
  for (const m of allMatches) {
    if (m.homeTeam) uniqueTeamsMap.set(m.homeTeam.id, m.homeTeam);
    if (m.awayTeam) uniqueTeamsMap.set(m.awayTeam.id, m.awayTeam);
  }
  const allTeams = Array.from(uniqueTeamsMap.values());

  const resolvedTeams = resolveKnockoutTeams(allMatches, allTeams);

  const findMatchByNum = (num: number, stageMatches: KnockoutMatch[]) => {
    return stageMatches.find((m) => {
      const key = `${m.homeTeam.code}_${m.awayTeam.code}`;
      return KNOCKOUT_PAIRINGS[key] === num;
    });
  };

  const byStage = (stage: string) => knockoutMatches.filter((m) => m.stage === stage);

  const r32 = byStage("ROUND_OF_32");
  const r16 = byStage("ROUND_OF_16");
  const qf  = byStage("QUARTER_FINAL");
  const sf  = byStage("SEMI_FINAL");
  const tp  = byStage("THIRD_PLACE");
  const fin = byStage("FINAL");

  // Official FIFA 2026 Round of 32 pairings (matches 73–88)
  // https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
  const r32Pairings = [
    // Match 73 – June 28
    { num: 73, matchLabel: "Partido 73", homeLabel: "2.° Grupo A", awayLabel: "2.° Grupo B",
      home: resolvedTeams["A2"]?.name, away: resolvedTeams["B2"]?.name,
      date: new Date("2026-06-28T14:00:00Z") },
    // Match 74 – June 29
    { num: 74, matchLabel: "Partido 74", homeLabel: "1.° Grupo E", awayLabel: "Mejor 3.° A/B/C/D/F",
      home: resolvedTeams["E1"]?.name, away: resolvedTeams["3rd-ABCDF"]?.name,
      date: new Date("2026-06-29T15:30:00Z") },
    // Match 75 – June 29
    { num: 75, matchLabel: "Partido 75", homeLabel: "1.° Grupo F", awayLabel: "2.° Grupo C",
      home: resolvedTeams["F1"]?.name, away: resolvedTeams["C2"]?.name,
      date: new Date("2026-06-29T20:00:00Z") },
    // Match 76 – June 29
    { num: 76, matchLabel: "Partido 76", homeLabel: "1.° Grupo C", awayLabel: "2.° Grupo F",
      home: resolvedTeams["C1"]?.name, away: resolvedTeams["F2"]?.name,
      date: new Date("2026-06-29T12:00:00Z") },
    // Match 77 – June 30
    { num: 77, matchLabel: "Partido 77", homeLabel: "1.° Grupo I", awayLabel: "Mejor 3.° C/D/F/G/H",
      home: resolvedTeams["I1"]?.name, away: resolvedTeams["3rd-CDFGH"]?.name,
      date: new Date("2026-06-30T16:00:00Z") },
    // Match 78 – June 30
    { num: 78, matchLabel: "Partido 78", homeLabel: "2.° Grupo E", awayLabel: "2.° Grupo I",
      home: resolvedTeams["E2"]?.name, away: resolvedTeams["I2"]?.name,
      date: new Date("2026-06-30T12:00:00Z") },
    // Match 79 – June 30
    { num: 79, matchLabel: "Partido 79", homeLabel: "1.° Grupo A", awayLabel: "Mejor 3.° C/E/F/H/I",
      home: resolvedTeams["A1"]?.name, away: resolvedTeams["3rd-CEFHI"]?.name,
      date: new Date("2026-06-30T20:00:00Z") },
    // Match 80 – July 1
    { num: 80, matchLabel: "Partido 80", homeLabel: "1.° Grupo L", awayLabel: "Mejor 3.° E/H/I/J/K",
      home: resolvedTeams["L1"]?.name, away: resolvedTeams["3rd-EHIJK"]?.name,
      date: new Date("2026-07-01T11:00:00Z") },
    // Match 81 – July 1
    { num: 81, matchLabel: "Partido 81", homeLabel: "1.° Grupo D", awayLabel: "Mejor 3.° B/E/F/I/J",
      home: resolvedTeams["D1"]?.name, away: resolvedTeams["3rd-BEFIJ"]?.name,
      date: new Date("2026-07-01T19:00:00Z") },
    // Match 82 – July 1
    { num: 82, matchLabel: "Partido 82", homeLabel: "1.° Grupo G", awayLabel: "Mejor 3.° A/E/H/I/J",
      home: resolvedTeams["G1"]?.name, away: resolvedTeams["3rd-AEHIJ"]?.name,
      date: new Date("2026-07-01T15:00:00Z") },
    // Match 83 – July 2
    { num: 83, matchLabel: "Partido 83", homeLabel: "2.° Grupo K", awayLabel: "2.° Grupo L",
      home: resolvedTeams["K2"]?.name, away: resolvedTeams["L2"]?.name,
      date: new Date("2026-07-02T18:00:00Z") },
    // Match 84 – July 2
    { num: 84, matchLabel: "Partido 84", homeLabel: "1.° Grupo H", awayLabel: "2.° Grupo J",
      home: resolvedTeams["H1"]?.name, away: resolvedTeams["J2"]?.name,
      date: new Date("2026-07-02T14:00:00Z") },
    // Match 85 – July 2
    { num: 85, matchLabel: "Partido 85", homeLabel: "1.° Grupo B", awayLabel: "Mejor 3.° E/F/G/I/J",
      home: resolvedTeams["B1"]?.name, away: resolvedTeams["3rd-EFGIJ"]?.name,
      date: new Date("2026-07-02T22:00:00Z") },
    // Match 86 – July 3
    { num: 86, matchLabel: "Partido 86", homeLabel: "1.° Grupo J", awayLabel: "2.° Grupo H",
      home: resolvedTeams["J1"]?.name, away: resolvedTeams["H2"]?.name,
      date: new Date("2026-07-03T17:00:00Z") },
    // Match 87 – July 3
    { num: 87, matchLabel: "Partido 87", homeLabel: "1.° Grupo K", awayLabel: "Mejor 3.° D/E/I/J/L",
      home: resolvedTeams["K1"]?.name, away: resolvedTeams["3rd-DEIJL"]?.name,
      date: new Date("2026-07-03T20:30:00Z") },
    // Match 88 – July 3
    { num: 88, matchLabel: "Partido 88", homeLabel: "2.° Grupo D", awayLabel: "2.° Grupo G",
      home: resolvedTeams["D2"]?.name, away: resolvedTeams["G2"]?.name,
      date: new Date("2026-07-03T13:00:00Z") },
  ];

  // Round of 16 pairings (matches 89–96)
  const r16Pairings = [
    { matchLabel: "Partido 89", homeLabel: "G. P74", awayLabel: "G. P77", date: new Date("2026-07-04T16:00:00Z") },
    { matchLabel: "Partido 90", homeLabel: "G. P73", awayLabel: "G. P75", date: new Date("2026-07-04T12:00:00Z") },
    { matchLabel: "Partido 91", homeLabel: "G. P76", awayLabel: "G. P78", date: new Date("2026-07-05T15:00:00Z") },
    { matchLabel: "Partido 92", homeLabel: "G. P79", awayLabel: "G. P80", date: new Date("2026-07-05T19:00:00Z") },
    { matchLabel: "Partido 93", homeLabel: "G. P83", awayLabel: "G. P84", date: new Date("2026-07-06T14:00:00Z") },
    { matchLabel: "Partido 94", homeLabel: "G. P81", awayLabel: "G. P82", date: new Date("2026-07-06T19:00:00Z") },
    { matchLabel: "Partido 95", homeLabel: "G. P86", awayLabel: "G. P88", date: new Date("2026-07-07T11:00:00Z") },
    { matchLabel: "Partido 96", homeLabel: "G. P85", awayLabel: "G. P87", date: new Date("2026-07-07T15:00:00Z") },
  ];

  // Quarter-finals (matches 97–100)
  const qfPairings = [
    { matchLabel: "Partido 97", homeLabel: "G. P89", awayLabel: "G. P90", date: new Date("2026-07-09T15:00:00Z") },
    { matchLabel: "Partido 98", homeLabel: "G. P93", awayLabel: "G. P94", date: new Date("2026-07-10T14:00:00Z") },
    { matchLabel: "Partido 99", homeLabel: "G. P91", awayLabel: "G. P92", date: new Date("2026-07-11T16:00:00Z") },
    { matchLabel: "Partido 100", homeLabel: "G. P95", awayLabel: "G. P96", date: new Date("2026-07-11T20:00:00Z") },
  ];

  // Semi-finals (matches 101–102)
  const sfPairings = [
    { matchLabel: "Partido 101", homeLabel: "G. P97", awayLabel: "G. P98", date: new Date("2026-07-14T14:00:00Z") },
    { matchLabel: "Partido 102", homeLabel: "G. P99", awayLabel: "G. P100", date: new Date("2026-07-15T14:00:00Z") },
  ];

  return (
    <div className="space-y-10">
      {/* Round of 32 */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
          Ronda de 32
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {r32Pairings.map((p) => {
            const m = findMatchByNum(p.num, r32);
            const homeResolved = m ? (resolvedTeams[m.homeTeam.code] ?? m.homeTeam) : null;
            const awayResolved = m ? (resolvedTeams[m.awayTeam.code] ?? m.awayTeam) : null;
            return (
              <BracketMatch
                key={p.matchLabel}
                matchLabel={p.matchLabel}
                homeLabel={p.homeLabel}
                awayLabel={p.awayLabel}
                homeTeamName={homeResolved?.name ?? p.home}
                homeTeamCode={homeResolved?.code}
                awayTeamName={awayResolved?.name ?? p.away}
                awayTeamCode={awayResolved?.code}
                homeScore={m?.homeScore}
                awayScore={m?.awayScore}
                isFinished={m?.isFinished}
                matchDate={m?.matchDate ?? p.date}
              />
            );
          })}
        </div>
      </section>

      {/* Round of 16 */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
          Octavos de final
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {r16Pairings.map((p) => {
            const num = parseInt(p.matchLabel.replace("Partido ", ""), 10);
            const m = findMatchByNum(num, r16);
            const homeResolved = m ? (resolvedTeams[m.homeTeam.code] ?? m.homeTeam) : null;
            const awayResolved = m ? (resolvedTeams[m.awayTeam.code] ?? m.awayTeam) : null;
            return (
              <BracketMatch
                key={p.matchLabel}
                matchLabel={p.matchLabel}
                homeLabel={p.homeLabel}
                awayLabel={p.awayLabel}
                homeTeamName={homeResolved?.name}
                homeTeamCode={homeResolved?.code}
                awayTeamName={awayResolved?.name}
                awayTeamCode={awayResolved?.code}
                homeScore={m?.homeScore}
                awayScore={m?.awayScore}
                isFinished={m?.isFinished}
                matchDate={m?.matchDate ?? p.date}
              />
            );
          })}
        </div>
      </section>

      {/* Quarter-finals */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
          Cuartos de final
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {qfPairings.map((p) => {
            const num = parseInt(p.matchLabel.replace("Partido ", ""), 10);
            const m = findMatchByNum(num, qf);
            const homeResolved = m ? (resolvedTeams[m.homeTeam.code] ?? m.homeTeam) : null;
            const awayResolved = m ? (resolvedTeams[m.awayTeam.code] ?? m.awayTeam) : null;
            return (
              <BracketMatch
                key={p.matchLabel}
                matchLabel={p.matchLabel}
                homeLabel={p.homeLabel}
                awayLabel={p.awayLabel}
                homeTeamName={homeResolved?.name}
                homeTeamCode={homeResolved?.code}
                awayTeamName={awayResolved?.name}
                awayTeamCode={awayResolved?.code}
                homeScore={m?.homeScore}
                awayScore={m?.awayScore}
                isFinished={m?.isFinished}
                matchDate={m?.matchDate ?? p.date}
              />
            );
          })}
        </div>
      </section>

      {/* Semi-finals */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
          Semifinales
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sfPairings.map((p) => {
            const num = parseInt(p.matchLabel.replace("Partido ", ""), 10);
            const m = findMatchByNum(num, sf);
            const homeResolved = m ? (resolvedTeams[m.homeTeam.code] ?? m.homeTeam) : null;
            const awayResolved = m ? (resolvedTeams[m.awayTeam.code] ?? m.awayTeam) : null;
            return (
              <BracketMatch
                key={p.matchLabel}
                matchLabel={p.matchLabel}
                homeLabel={p.homeLabel}
                awayLabel={p.awayLabel}
                homeTeamName={homeResolved?.name}
                homeTeamCode={homeResolved?.code}
                awayTeamName={awayResolved?.name}
                awayTeamCode={awayResolved?.code}
                homeScore={m?.homeScore}
                awayScore={m?.awayScore}
                isFinished={m?.isFinished}
                matchDate={m?.matchDate ?? p.date}
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
            const m = findMatchByNum(103, tp);
            const homeResolved = m ? (resolvedTeams[m.homeTeam.code] ?? m.homeTeam) : null;
            const awayResolved = m ? (resolvedTeams[m.awayTeam.code] ?? m.awayTeam) : null;
            return (
              <BracketMatch
                matchLabel="Partido 103"
                homeLabel="Perd. P101"
                awayLabel="Perd. P102"
                homeTeamName={homeResolved?.name}
                homeTeamCode={homeResolved?.code}
                awayTeamName={awayResolved?.name}
                awayTeamCode={awayResolved?.code}
                homeScore={m?.homeScore}
                awayScore={m?.awayScore}
                isFinished={m?.isFinished}
                matchDate={m?.matchDate ?? new Date("2026-07-18T16:00:00Z")}
              />
            );
          })()}
        </section>

        <section>
          <h2 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-4">
            🏆 Final
          </h2>
          {(() => {
            const m = findMatchByNum(104, fin);
            const homeResolved = m ? (resolvedTeams[m.homeTeam.code] ?? m.homeTeam) : null;
            const awayResolved = m ? (resolvedTeams[m.awayTeam.code] ?? m.awayTeam) : null;
            return (
              <BracketMatch
                matchLabel="Partido 104"
                homeLabel="G. P101"
                awayLabel="G. P102"
                homeTeamName={homeResolved?.name}
                homeTeamCode={homeResolved?.code}
                awayTeamName={awayResolved?.name}
                awayTeamCode={awayResolved?.code}
                homeScore={m?.homeScore}
                awayScore={m?.awayScore}
                isFinished={m?.isFinished}
                matchDate={m?.matchDate ?? new Date("2026-07-19T14:00:00Z")}
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