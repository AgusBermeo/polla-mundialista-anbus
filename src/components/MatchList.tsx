"use client";

import { getFlagClass } from "@/lib/teamFlags";

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
      {/* Group tabs - horizontally scrollable on mobile */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-none">
        {groups.map((group) => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer shrink-0 ${
              activeGroup === group
                ? "bg-cyan-700 text-white shadow-xs"
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    prediction ? "saved" : "idle"
  );

  const matchDate = new Date(match.matchDate);
  const isPast = matchDate < new Date();

  // Debounced auto-save effect
  import("react").then(({ useEffect }) => {
    // Note: We use dynamic check or standard react import to be safe, but since React is in scope, 
    // we can use useEffect directly because it was imported at the top of the file!
  });

  // Since useEffect is already imported at the top of the file, we can use it directly.
  const { useEffect } = require("react");

  useEffect(() => {
    const initialHome = prediction?.homeScore ?? "";
    const initialAway = prediction?.awayScore ?? "";

    // If the input scores match the initial predictions in DB, skip saving
    if (home === initialHome && away === initialAway) {
      return;
    }

    // Do not save if either input is empty (both scores are required for a valid prediction)
    if (home === "" || away === "") {
      setSaveStatus("idle");
      return;
    }

    setSaveStatus("saving");

    const timer = setTimeout(async () => {
      try {
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
          setSaveStatus("saved");
          onSaved(Number(home), Number(away));
        } else {
          setSaveStatus("error");
        }
      } catch (err) {
        setSaveStatus("error");
      }
    }, 600); // 600ms debounce delay

    return () => clearTimeout(timer);
  }, [home, away, match.id, onSaved, prediction]);

  const renderStatus = () => {
    if (match.isFinished) {
      return (
        <div className="text-right">
          <span className="text-xs text-gray-400 block md:inline md:mr-2">Finalizado</span>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            {match.homeScore} - {match.awayScore}
          </span>
        </div>
      );
    }
    if (isPast) {
      return (
        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
          En juego
        </span>
      );
    }
    
    if (saveStatus === "saving") {
      return (
        <div className="flex items-center gap-1.5 text-xs text-cyan-600 font-semibold bg-cyan-50 px-2 py-0.5 rounded-md animate-pulse">
          <svg className="animate-spin h-3 w-3 text-cyan-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Guardando...</span>
        </div>
      );
    }
    if (saveStatus === "saved") {
      return (
        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md flex items-center gap-1">
          <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>Guardado</span>
        </span>
      );
    }
    if (saveStatus === "error") {
      return (
        <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-md">
          Error al guardar
        </span>
      );
    }
    return (
      <span className="text-xs text-gray-400 italic">
        Sin pronóstico
      </span>
    );
  };

  return (
    <div className={`bg-white rounded-xl border p-4 transition-all duration-200 hover:shadow-xs ${
      saveStatus === "saved" ? "border-cyan-200 bg-cyan-50/10" : "border-gray-200"
    }`}>
      {/* Responsive layout: stacked flex-col on mobile, single flex-row on desktop */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        
        {/* Date / Time Row (top row on mobile, left column on desktop) */}
        <div className="flex justify-between md:justify-start items-center md:w-28 md:shrink-0 text-xs text-gray-400 font-medium">
          <div>
            {matchDate.toLocaleDateString("es", { day: "numeric", month: "short", timeZone: "America/Guayaquil" })}
            <span className="mx-1.5">•</span>
            {matchDate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", timeZone: "America/Guayaquil" })}
          </div>
          {/* On mobile: display the save status or match status on the right */}
          <div className="md:hidden">
            {renderStatus()}
          </div>
        </div>

        {/* Team Matchup and Inputs (middle on both mobile & desktop) */}
        <div className="flex items-center justify-between gap-2 md:gap-4 flex-1 text-gray-700">
          {/* Home Team */}
          <div className="flex items-center justify-end gap-2 flex-1 text-right min-w-0">
            <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-800 truncate" title={match.homeTeam.name}>
              {match.homeTeam.name}
            </span>
            <span className={`${getFlagClass(match.homeTeam.code)} shrink-0 shadow-3xs rounded-xs`} />
          </div>

          {/* Scores input container */}
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 p-1 rounded-lg border border-slate-100">
            <input
              type="number"
              min={0}
              max={20}
              value={home}
              onChange={(e) => {
                setHome(e.target.value === "" ? "" : Number(e.target.value));
              }}
              disabled={isPast || match.isFinished}
              className="w-10 h-10 text-center border border-gray-200 bg-white rounded-md font-extrabold text-base focus:outline-hidden focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100/60 disabled:text-gray-400"
            />
            <span className="text-gray-400 font-bold text-sm">-</span>
            <input
              type="number"
              min={0}
              max={20}
              value={away}
              onChange={(e) => {
                setAway(e.target.value === "" ? "" : Number(e.target.value));
              }}
              disabled={isPast || match.isFinished}
              className="w-10 h-10 text-center border border-gray-200 bg-white rounded-md font-extrabold text-base focus:outline-hidden focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100/60 disabled:text-gray-400"
            />
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-start gap-2 flex-1 text-left min-w-0">
            <span className={`${getFlagClass(match.awayTeam.code)} shrink-0 shadow-3xs rounded-xs`} />
            <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-800 truncate" title={match.awayTeam.name}>
              {match.awayTeam.name}
            </span>
          </div>
        </div>

        {/* Right Column (Save/Status - hidden on mobile, visible on desktop) */}
        <div className="hidden md:flex md:w-28 md:shrink-0 md:justify-end">
          {renderStatus()}
        </div>

      </div>
    </div>
  );
}