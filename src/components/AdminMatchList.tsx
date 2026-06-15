"use client";

import { useState, useEffect, useRef } from "react";
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
  stage: string;
};

const STAGE_LABELS: Record<string, string> = {
  GROUP:         "Fase de grupos",
  ROUND_OF_32:   "Ronda de 32",
  ROUND_OF_16:   "Octavos de final",
  QUARTER_FINAL: "Cuartos de final",
  SEMI_FINAL:    "Semifinales",
  THIRD_PLACE:   "Tercer puesto",
  FINAL:         "Final",
};

function getTodayLabel() {
  return new Date().toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Guayaquil",
  });
}

export default function AdminMatchList({ matches }: { matches: Match[] }) {
  const todayLabel = getTodayLabel();
  const todayRef = useRef<HTMLElement | null>(null);

  // Sort all matches chronologically
  const sorted = [...matches].sort(
    (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
  );

  // Group by day label
  const byDate: { label: string; matches: Match[] }[] = [];
  for (const match of sorted) {
    const label = new Date(match.matchDate).toLocaleDateString("es", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "America/Guayaquil",
    });
    const last = byDate[byDate.length - 1];
    if (last && last.label === label) {
      last.matches.push(match);
    } else {
      byDate.push({ label, matches: [match] });
    }
  }

  // Find the index of today's section, or the next upcoming day
  const todayIndex = byDate.findIndex((d) => d.label === todayLabel);
  // If today has no matches, find the first future day
  const upcomingIndex = byDate.findIndex((d) =>
    d.matches.some((m) => new Date(m.matchDate) >= new Date())
  );
  const scrollTargetIndex = todayIndex !== -1 ? todayIndex : upcomingIndex;

  useEffect(() => {
    if (todayRef.current) {
      // Small delay so the page has fully painted before we jump
      const id = setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => clearTimeout(id);
    }
  }, []);

  return (
    <div className="space-y-8">
      {byDate.map(({ label, matches: dayMatches }, i) => {
        const isToday = i === scrollTargetIndex;
        return (
          <section
            key={label}
            ref={isToday ? todayRef : undefined}
          >
            <div className="flex items-center gap-2 mb-3">
              <h2 className={`text-xs font-bold uppercase tracking-widest capitalize ${
                isToday ? "text-cyan-700" : "text-gray-400"
              }`}>
                {label}
              </h2>
              {isToday && (
                <span className="text-[10px] font-bold text-white bg-cyan-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Hoy
                </span>
              )}
            </div>
            <div className="space-y-3">
              {dayMatches.map((match) => (
                <AdminMatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        );
      })}
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

  const stageLabel =
    match.stage === "GROUP"
      ? `Grupo ${match.homeTeam.group}`
      : (STAGE_LABELS[match.stage] ?? match.stage);

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">

        {/* Time + stage badge + mobile status */}
        <div className="flex justify-between md:justify-start items-center md:w-36 md:shrink-0 gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-400 font-medium">
              {matchDate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", timeZone: "America/Guayaquil" })}
            </span>
            <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded w-fit">
              {stageLabel}
            </span>
          </div>
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