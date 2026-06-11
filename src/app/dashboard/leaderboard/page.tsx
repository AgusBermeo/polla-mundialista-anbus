import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getFlagClass } from "@/lib/teamFlags";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date();

  // Find the "spotlight" match: currently in play (started but not finished),
  // or else the most recently finished one.
  const inPlayMatch = await prisma.match.findFirst({
    where: { matchDate: { lte: now }, isFinished: false },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchDate: "desc" },
  });

  const spotlightMatch = inPlayMatch ?? await prisma.match.findFirst({
    where: { isFinished: true },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchDate: "desc" },
  });

  // Fetch all predictions for the spotlight match
  const spotlightPredictions: Record<string, { homeScore: number; awayScore: number }> = {};
  if (spotlightMatch) {
    const preds = await prisma.prediction.findMany({
      where: { matchId: spotlightMatch.id },
    });
    for (const p of preds) {
      spotlightPredictions[p.userId] = { homeScore: p.homeScore, awayScore: p.awayScore };
    }
  }

  const users = await prisma.user.findMany({
    include: { predictions: true },
  });

  const leaderboard = users
    .map((u) => ({
      id: u.id,
      name: u.name || u.email,
      totalPoints: u.predictions.reduce((sum, p) => sum + p.points, 0),
      totalPredictions: u.predictions.length,
      spotlightPred: spotlightPredictions[u.id] ?? null,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const isLive = !!inPlayMatch;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-cyan-700">Tabla de posiciones</h1>

      {/* Spotlight match banner */}
      {spotlightMatch && (
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          {isLive ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
              En juego
            </span>
          ) : (
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
              Último partido
            </span>
          )}

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={`${getFlagClass(spotlightMatch.homeTeam.code)} shadow-sm rounded-xs shrink-0`} />
            <span className="font-semibold text-sm text-gray-800 truncate sm:inline hidden">{spotlightMatch.homeTeam.name}</span>
            {spotlightMatch.isFinished ? (
              <span className="text-sm font-extrabold text-gray-700 shrink-0">
                {spotlightMatch.homeScore} – {spotlightMatch.awayScore}
              </span>
            ) : (
              <span className="text-xs text-gray-400 shrink-0">vs</span>
            )}
            <span className="font-semibold text-sm text-gray-800 truncate sm:inline hidden">{spotlightMatch.awayTeam.name}</span>
            <span className={`${getFlagClass(spotlightMatch.awayTeam.code)} shadow-sm rounded-xs shrink-0`} />
          </div>

          <span className="text-xs text-gray-400 shrink-0">
            {new Date(spotlightMatch.matchDate).toLocaleDateString("es", {
              day: "numeric", month: "short", timeZone: "America/Guayaquil",
            })}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-8">#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Jugador</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 hidden sm:table-cell">Pronósticos</th>
                {spotlightMatch && (
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">
                    Pronóstico
                  </th>
                )}
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => {
                const isMe = entry.id === user?.id;
                const pred = entry.spotlightPred;

                // Score the prediction only for finished matches
                let predResult: "exact" | "winner" | "wrong" | null = null;
                if (
                  pred &&
                  spotlightMatch?.isFinished &&
                  spotlightMatch.homeScore != null &&
                  spotlightMatch.awayScore != null
                ) {
                  const rH = spotlightMatch.homeScore;
                  const rA = spotlightMatch.awayScore;
                  const realWinner = rH > rA ? "home" : rA > rH ? "away" : "draw";
                  const predWinner = pred.homeScore > pred.awayScore ? "home" : pred.awayScore > pred.homeScore ? "away" : "draw";

                  if (pred.homeScore === rH && pred.awayScore === rA) predResult = "exact";
                  else if (predWinner === realWinner) predResult = "winner";
                  else predResult = "wrong";
                }

                return (
                  <tr
                    key={entry.id}
                    className={`border-b border-gray-50 last:border-0 transition-colors ${
                      isMe ? "bg-cyan-50" : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Position */}
                    <td className="px-4 py-3.5 text-sm font-bold text-gray-400">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-sm text-gray-700">
                        {entry.name}
                        {isMe && (
                          <span className="ml-1.5 text-xs text-cyan-600 font-normal">(tú)</span>
                        )}
                      </span>
                    </td>

                    {/* Predictions count */}
                    <td className="px-4 py-3.5 text-center text-sm text-gray-500 hidden sm:table-cell">
                      {entry.totalPredictions}
                    </td>

                    {/* Spotlight prediction */}
                    {spotlightMatch && (
                      <td className="px-4 py-3.5 text-center">
                        {pred ? (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
                              predResult === "exact"
                                ? "bg-emerald-100 text-emerald-700"
                                : predResult === "winner"
                                ? "bg-cyan-50 text-cyan-700 border border-cyan-100"
                                : predResult === "wrong"
                                ? "bg-red-50 text-red-500"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {pred.homeScore} – {pred.awayScore}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300 italic">—</span>
                        )}
                      </td>
                    )}

                    {/* Points */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-lg text-cyan-700">{entry.totalPoints}</span>
                    </td>
                  </tr>
                );
              })}

              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">
                    Aún no hay participantes registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend — only shown once the match is finished */}
      {spotlightMatch?.isFinished && (
        <div className="mt-3 flex flex-wrap gap-3 px-1">
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold text-[11px]">1–0</span>
            Marcador exacto
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="bg-cyan-50 text-cyan-700 border border-cyan-100 px-2 py-0.5 rounded font-bold text-[11px]">2–0</span>
            Ganador correcto
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded font-bold text-[11px]">0–1</span>
            Incorrecto
          </span>
        </div>
      )}
    </div>
  );
}