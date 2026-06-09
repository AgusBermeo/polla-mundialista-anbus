import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";


export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [dbUser, totalMatches, leaderboard] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user!.id },
      include: { predictions: true },
    }),
    prisma.match.count(),
    prisma.user.findMany({
      include: { predictions: true },
      orderBy: { createdAt: "asc" },
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
    .sort((a, b) => b.points - a.points);
  const position = ranked.findIndex((u) => u.id === user!.id) + 1;

  // Próximos partidos sin pronóstico
  const predictedMatchIds = new Set(dbUser?.predictions.map((p) => p.matchId));
  const upcomingMatches = await prisma.match.findMany({
    where: {
      isFinished: false,
      matchDate: { gte: new Date() },
      id: { notIn: [...predictedMatchIds] },
    },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchDate: "asc" },
    take: 3,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-cyan-700">
        Bienvenido, {dbUser?.name || dbUser?.email} 👋
      </h1>
      <p className="text-gray-500 mt-1 mb-8">
        Haz tus pronósticos antes de que empiece cada partido.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Tus puntos</p>
          <p className="text-3xl font-bold mt-1 text-cyan-700">{totalPoints}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Posición</p>
          <p className="text-3xl font-bold mt-1 text-cyan-700">
            {position === 0 ? "-" : `#${position}`}
          </p>
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