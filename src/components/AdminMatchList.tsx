"use client";

import { useState } from "react";
import { getFlagClass } from "@/lib/teamFlags";

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
      {/* Group tabs - horizontally scrollable, matching MatchList style */}
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

      <div className="space-y-3">
        {matchesByGroup[activeGroup]?.map((match) => (
          <AdminMatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}

function AdminMatchCard({ match }: { match: Match }) {
  const [home, setHome] = useState<number | "">(match.homeScore ?? "");
  const [away, setAway] = useState<number | "">(match.awayScore ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(match.isFinished);
  const [updated, setUpdated] = useState(0);

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

  const renderStatus = () => {
    if (saved && !saving) {
      return (
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md flex items-center gap-1">
            <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Guardado
          </span>
          {updated > 0 && (
            <span className="text-[10px] text-gray-400">{updated} pronósticos actualizados</span>
          )}
        </div>
      );
    }
    if (saving) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-cyan-600 font-semibold bg-cyan-50 px-2 py-0.5 rounded-md animate-pulse">
          <svg className="animate-spin h-3 w-3 text-cyan-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Calculando...
        </div>
      );
    }
    return (
      <span className="text-xs text-gray-400 italic">Sin resultado</span>
    );
  };

  return (
    <div className={`bg-white rounded-xl border p-4 transition-all duration-200 hover:shadow-xs ${
      saved ? "border-emerald-200 bg-emerald-50/10" : "border-gray-200"
    }`}>
      {/* Responsive layout: stacked on mobile, single row on desktop */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">

        {/* Date / Time + mobile status */}
        <div className="flex justify-between md:justify-start items-center md:w-28 md:shrink-0 text-xs text-gray-400 font-medium">
          <div>
            {matchDate.toLocaleDateString("es", { day: "numeric", month: "short", timeZone: "America/Guayaquil" })}
            <span className="mx-1.5">•</span>
            {matchDate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", timeZone: "America/Guayaquil" })}
          </div>
          {/* Status pill on mobile (top-right) */}
          <div className="md:hidden">{renderStatus()}</div>
        </div>

        {/* Teams + score inputs */}
        <div className="flex items-center justify-between gap-2 md:gap-4 flex-1 text-gray-700">
          {/* Home team */}
          <div className="flex items-center justify-end gap-2 flex-1 text-right min-w-0">
            <span
              className="font-semibold text-xs sm:text-sm md:text-base text-gray-800 truncate"
              title={match.homeTeam.name}
            >
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
                setSaved(false);
              }}
              className="w-10 h-10 text-center border border-gray-200 bg-white rounded-md font-extrabold text-base focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <span className="text-gray-400 font-bold text-sm">-</span>
            <input
              type="number"
              min={0}
              max={20}
              value={away}
              onChange={(e) => {
                setAway(e.target.value === "" ? "" : Number(e.target.value));
                setSaved(false);
              }}
              className="w-10 h-10 text-center border border-gray-200 bg-white rounded-md font-extrabold text-base focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Away team */}
          <div className="flex items-center justify-start gap-2 flex-1 text-left min-w-0">
            <span className={`${getFlagClass(match.awayTeam.code)} shrink-0 shadow-3xs rounded-xs`} />
            <span
              className="font-semibold text-xs sm:text-sm md:text-base text-gray-800 truncate"
              title={match.awayTeam.name}
            >
              {match.awayTeam.name}
            </span>
          </div>
        </div>

        {/* Right column: status + save button (desktop) */}
        <div className="hidden md:flex md:flex-col md:items-end md:w-36 md:shrink-0 gap-1.5">
          {renderStatus()}
          <button
            onClick={handleSave}
            disabled={saving || home === "" || away === ""}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 bg-cyan-700 text-white hover:bg-cyan-800 cursor-pointer"
          >
            Guardar resultado
          </button>
        </div>

        {/* Save button on mobile (full width) */}
        <button
          onClick={handleSave}
          disabled={saving || home === "" || away === ""}
          className="md:hidden w-full text-sm py-2 rounded-lg font-medium transition-colors disabled:opacity-40 bg-cyan-700 text-white hover:bg-cyan-800 cursor-pointer"
        >
          Guardar resultado
        </button>
      </div>
    </div>
  );
}