"use client";

import { useState } from "react";

type Team = { id: string; name: string; code: string; group: string };
type Match = {
  id: string;
  matchDate: string;
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

export default function MatchList({
  matchesByGroup,
  predictionsMap,
}: {
  matchesByGroup: Record<string, Match[]>;
  predictionsMap: Record<string, Prediction>;
}) {
  const [activeGroup, setActiveGroup] = useState("A");
  const groups = Object.keys(matchesByGroup).sort();

  return (
    <div>
      {/* Tabs de grupos */}
      <div className="flex flex-wrap gap-2 mb-6">
        {groups.map((group) => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeGroup === group
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Grupo {group}
          </button>
        ))}
      </div>

      {/* Partidos del grupo activo */}
      <div className="space-y-3">
        {matchesByGroup[activeGroup]?.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            prediction={predictionsMap[match.id]}
          />
        ))}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  prediction,
}: {
  match: Match;
  prediction?: Prediction;
}) {
  const [home, setHome] = useState(prediction?.homeScore ?? "");
  const [away, setAway] = useState(prediction?.awayScore ?? "");
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

    if (res.ok) setSaved(true);
    setSaving(false);
  }

  return (
    <div className={`bg-white rounded-xl border p-4 ${saved ? "border-green-200" : "border-gray-200"}`}>
      <div className="flex items-center justify-between gap-4">
        {/* Fecha */}
        <div className="text-xs text-gray-400 w-24 shrink-0">
          {matchDate.toLocaleDateString("es", { day: "numeric", month: "short", timeZone: "America/Guayaquil" })}
          <br />
          {matchDate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", timeZone: "America/Guayaquil" })}
        </div>

        {/* Equipos y marcador */}
        <div className="flex items-center gap-3 flex-1 justify-center">
          <span className="font-medium text-right w-28 truncate">{match.homeTeam.name}</span>

          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={20}
              value={home}
              onChange={(e) => { setHome(e.target.value); setSaved(false); }}
              disabled={isPast || match.isFinished}
              className="w-10 h-10 text-center border rounded-lg font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <span className="text-gray-400 font-bold">-</span>
            <input
              type="number"
              min={0}
              max={20}
              value={away}
              onChange={(e) => { setAway(e.target.value); setSaved(false); }}
              disabled={isPast || match.isFinished}
              className="w-10 h-10 text-center border rounded-lg font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <span className="font-medium text-left w-28 truncate">{match.awayTeam.name}</span>
        </div>

        {/* Botón guardar */}
        <div className="w-20 shrink-0 flex justify-end">
          {match.isFinished ? (
            <span className="text-xs text-gray-400">Finalizado</span>
          ) : isPast ? (
            <span className="text-xs text-gray-400">En juego</span>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || home === "" || away === ""}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 ${
                saved
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
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