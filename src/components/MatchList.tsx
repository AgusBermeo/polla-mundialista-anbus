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
  stage: string;
};
type Prediction = {
  matchId: string;
  homeScore: number;
  awayScore: number;
};

const STAGE_LABELS: Record<string, string> = {
  ROUND_OF_16: "Octavos de final",
  QUARTER_FINAL: "Cuartos de final",
  SEMI_FINAL: "Semifinales",
  THIRD_PLACE: "Tercer puesto",
  FINAL: "Final",
};

const STAGE_ORDER = ["ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"];

/**
 * Given a map of group → MatchForTable[], returns a Set of teamIds
 * that are among the best 8 third-place finishers across all groups.
 */
function getBestThirds(allGroupMatches: Record<string, MatchForTable[]>): Set<string> {
  const thirds = Object.entries(allGroupMatches).flatMap(([, matches]) => {
    const standings = computeStandings(matches);
    const third = standings[2];
    if (!third || !matches.some((m) => m.counted)) return [];
    return [third];
  });

  thirds.sort(compareThird);
  return new Set(thirds.slice(0, 8).map((s) => s.teamId));
}

export default function MatchList({
  matchesByGroup,
  knockoutMatches = [],
  predictionsMap,
}: {
  matchesByGroup: Record<string, Match[]>;
  knockoutMatches?: Match[];
  predictionsMap: Record<string, Prediction>;
}) {
  const [stage, setStage] = useState<"groups" | "knockout">("groups");
  const [activeGroup, setActiveGroup] = useState("A");
  const groups = Object.keys(matchesByGroup).sort();

  const [sessionPredictions, setSessionPredictions] = useState<
    Record<string, { homeScore: number; awayScore: number }>
  >({});

  function onPredictionSaved(matchId: string, homeScore: number, awayScore: number) {
    setSessionPredictions((prev) => ({ ...prev, [matchId]: { homeScore, awayScore } }));
  }

  // Build MatchForTable arrays for every group
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

  const predBestThirds = getBestThirds(allPredMatchesByGroup);
  const realBestThirds = getBestThirds(allRealMatchesByGroup);

  function getThirdTeamId(matchesForTable: MatchForTable[]): string | null {
    const standings = computeStandings(matchesForTable);
    return standings[2]?.teamId ?? null;
  }

  const predThirdId = getThirdTeamId(allPredMatchesByGroup[activeGroup] ?? []);
  const realThirdId = getThirdTeamId(allRealMatchesByGroup[activeGroup] ?? []);

  const activeMatches = matchesByGroup[activeGroup] ?? [];

  // Group knockout matches by stage
  const knockoutByStage = knockoutMatches.reduce((acc, m) => {
    if (!acc[m.stage]) acc[m.stage] = [];
    acc[m.stage].push(m);
    return acc;
  }, {} as Record<string, Match[]>);

  const hasKnockout = knockoutMatches.length > 0;

  return (
    <div>
      {/* Stage toggle — title left, toggle right, matching Fases page */}
      <div className="flex flex-col md:flex-row md:items-center items-start justify-between mb-6 ">
        <h1 className="text-2xl font-bold text-cyan-700 mb-3 md:mb-0">Pronósticos</h1>
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

      {/* ── GROUPS ── */}
      {stage === "groups" && (
        <>
          {/* Group tabs */}
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

          {/* Both tables side by side */}
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
        </>
      )}

      {/* ── KNOCKOUT ── */}
      {stage === "knockout" && (
        <div className="space-y-8">
          {!hasKnockout && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <p className="text-gray-400 text-sm">
                La fase eliminatoria aún no ha comenzado.
              </p>
              <p className="text-gray-300 text-xs mt-1">
                Los partidos aparecerán aquí una vez que se definan los clasificados.
              </p>
            </div>
          )}

          {STAGE_ORDER.filter((s) => knockoutByStage[s]?.length).map((stageKey) => (
            <section key={stageKey}>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">
                {STAGE_LABELS[stageKey] ?? stageKey}
              </h2>
              <div className="space-y-3">
                {knockoutByStage[stageKey].map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={sessionPredictions[match.id] ?? predictionsMap[match.id]}
                    onSaved={(hs, as_) => onPredictionSaved(match.id, hs, as_)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
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

  const { useEffect } = require("react");

  useEffect(() => {
    const initialHome = prediction?.homeScore ?? "";
    const initialAway = prediction?.awayScore ?? "";

    if (home === initialHome && away === initialAway) {
      return;
    }

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
    }, 600);

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">

        {/* Date / Time */}
        <div className="flex justify-between md:justify-start items-center md:w-28 md:shrink-0 text-xs text-gray-400 font-medium">
          <div>
            {matchDate.toLocaleDateString("es", { day: "numeric", month: "short", timeZone: "America/Guayaquil" })}
            <span className="mx-1.5">•</span>
            {matchDate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", timeZone: "America/Guayaquil" })}
          </div>
          <div className="md:hidden">
            {renderStatus()}
          </div>
        </div>

        {/* Team Matchup and Inputs */}
        <div className="flex items-center justify-between gap-2 md:gap-4 flex-1 text-gray-700">
          {/* Home Team */}
          <div className="flex items-center justify-end gap-2 flex-1 text-right min-w-0">
            <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-800 truncate" title={match.homeTeam.name}>
              {match.homeTeam.name}
            </span>
            <span className={`${getFlagClass(match.homeTeam.code)} shrink-0 shadow-3xs rounded-xs`} />
          </div>

          {/* Score inputs */}
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

        {/* Right status (desktop) */}
        <div className="hidden md:flex md:w-28 md:shrink-0 md:justify-end">
          {renderStatus()}
        </div>
      </div>
    </div>
  );
}