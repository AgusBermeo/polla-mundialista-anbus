"use client";

import { useState } from "react";
import GroupTable, { MatchForTable, computeStandings, compareThird } from "@/components/GroupTable";

type Team = { id: string; name: string; code: string; group: string };
type Match = {
  id: string;
  matchDate: Date;
  isFinished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: Team;
  awayTeam: Team;
};
type Prediction = {
  matchId: string;
  homeScore: number;
  awayScore: number;
};

/**
 * Given a map of group → MatchForTable[], returns a Set of teamIds
 * that are among the best 8 third-place finishers across all groups.
 */
function getBestThirds(allGroupMatches: Record<string, MatchForTable[]>): Set<string> {
  const thirds = Object.entries(allGroupMatches).flatMap(([, matches]) => {
    const standings = computeStandings(matches);
    // Only consider the 3rd-place team if it has played at least one counted match
    const third = standings[2];
    if (!third || !matches.some((m) => m.counted)) return [];
    return [third];
  });

  // Sort all third-place teams by the same criteria used inside group tables
  thirds.sort(compareThird);

  // Top 8 qualify
  return new Set(thirds.slice(0, 8).map((s) => s.teamId));
}

export default function MatchList({
  matchesByGroup,
  predictionsMap,
}: {
  matchesByGroup: Record<string, Match[]>;
  predictionsMap: Record<string, Prediction>;
}) {
  const [activeGroup, setActiveGroup] = useState("A");
  const groups = Object.keys(matchesByGroup).sort();

  const [sessionPredictions, setSessionPredictions] = useState<
    Record<string, { homeScore: number; awayScore: number }>
  >({});

  function onPredictionSaved(matchId: string, homeScore: number, awayScore: number) {
    setSessionPredictions((prev) => ({ ...prev, [matchId]: { homeScore, awayScore } }));
  }

  // Build MatchForTable arrays for every group (needed to compute best thirds across all groups)
  const allPredMatchesByGroup: Record<string, MatchForTable[]> = {};
  const allRealMatchesByGroup: Record<string, MatchForTable[]> = {};

  for (const [group, matches] of Object.entries(matchesByGroup)) {
    allPredMatchesByGroup[group] = matches.map((m) => {
      const pred = sessionPredictions[m.id] ?? predictionsMap[m.id];
      return {
        id: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeScore: pred ? pred.homeScore : null,
        awayScore: pred ? pred.awayScore : null,
        counted: !!pred,
      };
    });

    allRealMatchesByGroup[group] = matches.map((m) => ({
      id: m.id,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      counted: m.isFinished,
    }));
  }

  // Compute which 3rd-place teams qualify across ALL groups
  const predBestThirds = getBestThirds(allPredMatchesByGroup);
  const realBestThirds = getBestThirds(allRealMatchesByGroup);

  // Get the 3rd-place team for the active group (to pass thirdQualifies)
  function getThirdTeamId(matchesForTable: MatchForTable[]): string | null {
    const standings = computeStandings(matchesForTable);
    return standings[2]?.teamId ?? null;
  }

  const predThirdId = getThirdTeamId(allPredMatchesByGroup[activeGroup] ?? []);
  const realThirdId = getThirdTeamId(allRealMatchesByGroup[activeGroup] ?? []);

  const activeMatches = matchesByGroup[activeGroup] ?? [];

  return (
    <div>
      {/* Group tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {groups.map((group) => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              activeGroup === group
                ? "bg-cyan-700 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Grupo {group}
          </button>
        ))}
      </div>

      {/* Both tables side by side on md+, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <GroupTable
          matches={allPredMatchesByGroup[activeGroup] ?? []}
          title="📋 Mis pronósticos"
          emptyLabel="— ingresa tus pronósticos"
          accent="cyan"
          thirdQualifies={!!predThirdId && predBestThirds.has(predThirdId)}
        />
        <GroupTable
          matches={allRealMatchesByGroup[activeGroup] ?? []}
          title="🏟️ Resultados reales"
          emptyLabel="— sin resultados aún"
          accent="violet"
          thirdQualifies={!!realThirdId && realBestThirds.has(realThirdId)}
        />
      </div>

      {/* Match cards */}
      <div className="space-y-3">
        {activeMatches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            prediction={sessionPredictions[match.id] ?? predictionsMap[match.id]}
            onSaved={(hs, as_) => onPredictionSaved(match.id, hs, as_)}
          />
        ))}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  prediction,
  onSaved,
}: {
  match: Match;
  prediction?: { homeScore: number; awayScore: number };
  onSaved: (homeScore: number, awayScore: number) => void;
}) {
  const [home, setHome] = useState<number | "">(prediction?.homeScore ?? "");
  const [away, setAway] = useState<number | "">(prediction?.awayScore ?? "");
  const [saved, setSaved] = useState(!!prediction);
  const [saving, setSaving] = useState(false);

  const matchDate = new Date(match.matchDate);
  const isPast = matchDate < new Date();

  async function handleSave() {
    if (home === "" || away === "") return;
    setSaving(true);

    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: match.id,
        homeScore: Number(home),
        awayScore: Number(away),
      }),
    });

    if (res.ok) {
      setSaved(true);
      onSaved(Number(home), Number(away));
    }
    setSaving(false);
  }

  return (
    <div className={`bg-white rounded-xl border p-4 ${saved ? "border-cyan-200" : "border-gray-200"}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs text-gray-400 w-24 shrink-0">
          {matchDate.toLocaleDateString("es", { day: "numeric", month: "short", timeZone: "America/Guayaquil" })}
          <br />
          {matchDate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", timeZone: "America/Guayaquil" })}
        </div>

        <div className="flex items-center gap-3 flex-1 justify-center text-gray-600">
          <span className="font-medium text-right w-28">{match.homeTeam.name}</span>
          <div className="flex items-center gap-1">
            <input
              type="number" min={0} max={20} value={home}
              onChange={(e) => { setHome(e.target.value === "" ? "" : Number(e.target.value)); setSaved(false); }}
              disabled={isPast || match.isFinished}
              className="w-10 h-10 text-right border rounded-lg font-bold text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100"
            />
            <span className="text-gray-400 font-bold">-</span>
            <input
              type="number" min={0} max={20} value={away}
              onChange={(e) => { setAway(e.target.value === "" ? "" : Number(e.target.value)); setSaved(false); }}
              disabled={isPast || match.isFinished}
              className="w-10 h-10 text-right border rounded-lg font-bold text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100"
            />
          </div>
          <span className="font-medium text-left w-28">{match.awayTeam.name}</span>
        </div>

        <div className="w-24 shrink-0 flex flex-col items-end gap-1">
          {match.isFinished ? (
            <div className="text-right">
              <span className="text-xs text-gray-400 block">Finalizado</span>
              <span className="text-xs font-semibold text-gray-600">{match.homeScore} - {match.awayScore}</span>
            </div>
          ) : isPast ? (
            <span className="text-xs text-gray-400">En juego</span>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || home === "" || away === ""}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 ${
                saved ? "bg-cyan-100 text-cyan-700" : "bg-cyan-600 text-white hover:bg-cyan-700"
              }`}
            >
              {saving ? "..." : saved ? "✓ Guardado" : "Guardar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}