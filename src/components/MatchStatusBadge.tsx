"use client";

import { useEffect, useState } from "react";

const MATCH_DURATION_MS = (2 * 60 + 15) * 60 * 1000; // 2h 15m

interface Props {
  matchDate: string; // ISO string
}

export default function MatchStatusBadge({ matchDate }: Props) {
  const [isFinished, setIsFinished] = useState(
    () => Date.now() - new Date(matchDate).getTime() >= MATCH_DURATION_MS
  );

  useEffect(() => {
    if (isFinished) return;

    const elapsed = Date.now() - new Date(matchDate).getTime();
    const remaining = MATCH_DURATION_MS - elapsed;

    const timer = setTimeout(() => setIsFinished(true), remaining);
    return () => clearTimeout(timer);
  }, [matchDate, isFinished]);

  if (isFinished) {
    return (
      <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
        Partido finalizado
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
      En juego
    </span>
  );
}