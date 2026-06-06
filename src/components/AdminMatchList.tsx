"use client";

import { useState } from "react";

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

export default function AdminMatchList({ matches }: { matches: Match[] }) {
  const [activeGroup, setActiveGroup] = useState("A");
  const groups = [...new Set(matches.map((m) => m.homeTeam.group))].sort();

  const matchesByGroup = matches.reduce((acc, match) => {
    const group = match.homeTeam.group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

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

      <div className="space-y-3">
        {matchesByGroup[activeGroup]?.map((match) => (
          <AdminMatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}

function AdminMatchCard({ match }: { match: Match }) {
  const [home, setHome] = useState(match.homeScore ?? "");
  const [away, setAway] = useState(match.awayScore ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(match.isFinished);
  const [updated, setUpdated] = useState(0); // cantidad de pronósticos actualizados

  const matchDate = new Date(match.matchDate);

  async function handleSave() {
    if (home === "" || away === "") return;
    setSaving(true);

    const res = await fetch(`/api/matches/${match.id}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeScore: Number(home),
        awayScore: Number(away),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setSaved(true);
      setUpdated(data.data.predictionsUpdated);
    }

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
              className="w-10 h-10 text-center border rounded-lg font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400 font-bold">-</span>
            <input
              type="number"
              min={0}
              max={20}
              value={away}
              onChange={(e) => { setAway(e.target.value); setSaved(false); }}
              className="w-10 h-10 text-center border rounded-lg font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <span className="font-medium text-left w-28 truncate">{match.awayTeam.name}</span>
        </div>

        {/* Botón y estado */}
        <div className="w-32 shrink-0 flex flex-col items-end gap-1">
          <button
            onClick={handleSave}
            disabled={saving || home === "" || away === ""}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 ${
              saved
                ? "bg-green-100 text-green-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {saving ? "Calculando..." : saved ? "✓ Guardado" : "Guardar resultado"}
          </button>
          {updated > 0 && (
            <span className="text-xs text-gray-400">{updated} pronósticos actualizados</span>
          )}
        </div>
      </div>
    </div>
  );
}