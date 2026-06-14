import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getFlagClass } from "@/lib/teamFlags";
import Link from "next/link";


export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date();

  const [dbUser, totalMatches, leaderboard, finishedMatches] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user!.id },
      include: { predictions: true },
    }),
    prisma.match.count(),
    prisma.user.findMany({
      include: { predictions: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.match.findMany({
      where: { isFinished: true },
      orderBy: { matchDate: "desc" },
    }),
  ]);

  const totalPoints = dbUser?.predictions.reduce((sum, p) => sum + p.points, 0) ?? 0;
  const totalPredictions = dbUser?.predictions.length ?? 0;

  // Calcular posición en el ranking
  const ranked = leaderboard
    .map((u) => ({
      id: u.id,
      points: u.predictions.reduce((sum, p) => sum + p.points, 0),
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.id.localeCompare(b.id);
    });
  const position = ranked.findIndex((u) => u.id === user!.id) + 1;

  // Compute previous position to find rank change
  let rankChange = 0;
  if (finishedMatches.length > 0) {
    const lastMatchId = finishedMatches[0].id;
    const previousLeaderboard = leaderboard
      .map((u) => ({
        id: u.id,
        points: u.predictions
          .filter((p) => p.matchId !== lastMatchId)
          .reduce((sum, p) => sum + p.points, 0),
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return a.id.localeCompare(b.id);
      });
    const previousPosition = previousLeaderboard.findIndex((u) => u.id === user!.id) + 1;
    rankChange = previousPosition - position; // Going up is positive
  }

  // Spotlight match: in-play or most recently finished
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

  // My prediction for the spotlight match
  let mySpotlightPred: { homeScore: number; awayScore: number } | null = null;
  if (spotlightMatch) {
    const pred = await prisma.prediction.findUnique({
      where: { userId_matchId: { userId: user!.id, matchId: spotlightMatch.id } },
    });
    if (pred) mySpotlightPred = { homeScore: pred.homeScore, awayScore: pred.awayScore };
  }

  const isLive = !!inPlayMatch;

  // Score the prediction
  let predResult: "exact" | "winner" | "wrong" | null = null;
  if (
    mySpotlightPred &&
    spotlightMatch?.isFinished &&
    spotlightMatch.homeScore != null &&
    spotlightMatch.awayScore != null
  ) {
    const rH = spotlightMatch.homeScore;
    const rA = spotlightMatch.awayScore;
    const realWinner = rH > rA ? "home" : rA > rH ? "away" : "draw";
    const predWinner =
      mySpotlightPred.homeScore > mySpotlightPred.awayScore
        ? "home"
        : mySpotlightPred.awayScore > mySpotlightPred.homeScore
          ? "away"
          : "draw";

    if (mySpotlightPred.homeScore === rH && mySpotlightPred.awayScore === rA)
      predResult = "exact";
    else if (predWinner === realWinner) predResult = "winner";
    else predResult = "wrong";
  }

  // Próximos partidos sin pronóstico
  const predictedMatchIds = new Set(dbUser?.predictions.map((p) => p.matchId));
  const upcomingMatches = await prisma.match.findMany({
    where: {
      isFinished: false,
      matchDate: { gte: now },
      id: { notIn: [...predictedMatchIds] },
    },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchDate: "asc" },
    take: 3,
  });

  // Próximos 4 partidos (todos)
  const next4Matches = await prisma.match.findMany({
    where: {
      isFinished: false,
      matchDate: { gte: now },
    },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchDate: "asc" },
    take: 4,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-cyan-700">
        {/* Random greetings depending of the time of the day */}
        {(() => {
          const hour = now.getHours();
          let timeOfDayGreeting;
          let greetings = [
            "Hola",
            "Saludos",
            "Hey",
            "Bienvenido",
            "Qué más",
            "Buenas",
            "Qué tal",
            "Cómo vas",
          ]
          if (hour < 12) {
            timeOfDayGreeting = greetings.push("Buenos días");
          } else if (hour < 18) {
            timeOfDayGreeting = greetings.push("Buenas tardes");
          } else {
            timeOfDayGreeting = greetings.push("Buenas noches");
          }
          const greeting = greetings[Math.floor(Math.random() * greetings.length)];
          return `${greeting}, ${dbUser?.name || dbUser?.email} 👋`;
        })()}
      </h1>
      <p className="text-gray-500 mt-1 mb-8">
        Puedes hacer tus pronósticos antes de que empiece cada partido.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Tus puntos</p>
          <p className="text-3xl font-bold mt-1 text-cyan-700">{totalPoints}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <p className="text-sm text-gray-500 font-medium">Posición</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-extrabold text-cyan-700">
              {position > 0 ? `#${position}` : "—"}
            </p>
            {rankChange > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-0.5">
                ▲ +{rankChange}
              </span>
            )}
            {rankChange < 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center gap-0.5">
                ▼ {rankChange}
              </span>
            )}
            {rankChange === 0 && position > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100 flex items-center gap-0.5">
                • 0
              </span>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Pronósticos</p>
          <p className="text-3xl font-bold mt-1 text-cyan-700">
            {totalPredictions}
            <span className="text-sm font-normal text-cyan-700"> / {totalMatches}</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Sin pronosticar</p>
          <p className="text-3xl font-bold mt-1 text-cyan-700">{totalMatches - totalPredictions}</p>
        </div>
      </div>

      {/* Spotlight match */}
      {spotlightMatch && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-cyan-700">
              {isLive ? "Partido en juego" : "Último partido"}
            </h2>
            <Link
              href="/dashboard/leaderboard"
              className="text-sm text-cyan-700 hover:underline flex items-center gap-1"
            >
              Ver posiciones
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            {/* Live / finished badge */}
            {isLive ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-full shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                En juego
              </span>
            ) : (
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
                Finalizado
              </span>
            )}

            {/* Teams + score */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={`${getFlagClass(spotlightMatch.homeTeam.code)} shadow-sm rounded-xs shrink-0`} />
              <span className="font-semibold text-sm text-gray-800 hidden sm:inline truncate">
                {spotlightMatch.homeTeam.name}
              </span>
              {spotlightMatch.isFinished ? (
                <span className="text-sm font-extrabold text-gray-700 shrink-0">
                  {spotlightMatch.homeScore} – {spotlightMatch.awayScore}
                </span>
              ) : (
                <span className="text-xs text-gray-400 shrink-0">vs</span>
              )}
              <span className="font-semibold text-sm text-gray-800 hidden sm:inline truncate">
                {spotlightMatch.awayTeam.name}
              </span>
              <span className={`${getFlagClass(spotlightMatch.awayTeam.code)} shadow-sm rounded-xs shrink-0`} />
            </div>

            {/* Date */}
            <span className="text-xs text-gray-400 shrink-0">
              {new Date(spotlightMatch.matchDate).toLocaleDateString("es", {
                day: "numeric", month: "short", timeZone: "America/Guayaquil",
              })}
            </span>
          </div>

          {/* My prediction for this match */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Mi pronóstico</span>
            {mySpotlightPred ? (
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${predResult === "exact"
                    ? "bg-emerald-100 text-emerald-700"
                    : predResult === "winner"
                      ? "bg-cyan-50 text-cyan-700 border border-cyan-100"
                      : predResult === "wrong"
                        ? "bg-red-50 text-red-500"
                        : "bg-gray-100 text-gray-600"
                  }`}
              >
                {mySpotlightPred.homeScore} – {mySpotlightPred.awayScore}
                {predResult === "exact" && <span className="ml-1">✓✓</span>}
                {predResult === "winner" && <span className="ml-1">✓</span>}
                {predResult === "wrong" && <span className="ml-1">✗</span>}
              </span>
            ) : (
              <span className="text-xs text-gray-300 italic">Sin pronóstico</span>
            )}
          </div>
        </div>
      )}

      {/* Próximos 4 partidos */}
      {next4Matches.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-cyan-700">Próximos partidos</h2>
            <Link
              href="/dashboard/matches"
              className="text-sm text-cyan-700 hover:underline cursor-pointer flex items-center gap-2"
            >
              Ver todos
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {next4Matches.map((match) => {
              const matchDate = new Date(match.matchDate);
              const hasPrediction = predictedMatchIds.has(match.id);
              return (
                <Link
                  key={match.id}
                  href="/dashboard/matches"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-cyan-200 hover:bg-cyan-50/30 transition-all group"
                >
                  {/* Date/time column */}
                  <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg px-3 py-2 shrink-0 min-w-[52px]">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">
                      {matchDate.toLocaleDateString("es", { month: "short", timeZone: "America/Guayaquil" })}
                    </span>
                    <span className="text-lg font-extrabold text-gray-700 leading-tight">
                      {matchDate.toLocaleDateString("es", { day: "numeric", timeZone: "America/Guayaquil" })}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {matchDate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", timeZone: "America/Guayaquil" })}
                    </span>
                  </div>

                  {/* Teams column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`${getFlagClass(match.homeTeam.code)} shrink-0 shadow-sm rounded-sm`} style={{ fontSize: "0.9rem" }} />
                      <span className="text-sm font-semibold text-gray-800 truncate">{match.homeTeam.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`${getFlagClass(match.awayTeam.code)} shrink-0 shadow-sm rounded-sm`} style={{ fontSize: "0.9rem" }} />
                      <span className="text-sm font-semibold text-gray-800 truncate">{match.awayTeam.name}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      Grupo {match.homeTeam.group}
                    </span>
                    {hasPrediction ? (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Listo
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        Pendiente
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Próximos partidos sin pronóstico */}
      {upcomingMatches.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-cyan-700">Partidos pendientes de pronóstico</h2>
            <Link
              href="/dashboard/matches"
              className="text-sm text-cyan-700 hover:underline cursor-pointer flex items-center gap-2"
            >
              Ver todos
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingMatches.map((match) => {
              const matchDate = new Date(match.matchDate);
              return (
                <div
                  key={match.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-20">
                      {matchDate.toLocaleDateString("es", {
                        day: "numeric",
                        month: "short",
                        timeZone: "America/Guayaquil",
                      })}
                    </span>
                    <span className="text-sm font-medium text-gray-500">
                      {match.homeTeam.name} vs {match.awayTeam.name}
                    </span>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    Sin pronóstico
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/matches"
          className="bg-cyan-600 text-white rounded-xl p-5 cursor-pointer transition-colors hover:bg-cyan-600/80"
        >
          <p className="font-semibold">⚽ Hacer pronósticos</p>
          <p className="text-sm text-white mt-1">Pronostica los próximos partidos</p>
        </Link>
        <Link
          href="/dashboard/leaderboard"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:bg-gray-50 transition-colors"
        >
          <p className="font-semibold text-cyan-700">🏆 Ver posiciones</p>
          <p className="text-sm text-gray-400 mt-1">Mira cómo vas en el ranking</p>
        </Link>
        <Link
          href="/dashboard/profile"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:bg-gray-50 transition-colors"
        >
          <p className="font-semibold text-cyan-700">👤 Mi perfil</p>
          <p className="text-sm text-gray-400 mt-1">Actualiza tu nombre</p>
        </Link>
      </div>
    </div>
  );
}