import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";


export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [dbUser, allUsers, finishedMatches] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user!.id },
      include: {
        predictions: {
          include: {
            match: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      include: {
        predictions: true,
      },
    }),
    prisma.match.findMany({
      where: { isFinished: true },
      orderBy: { matchDate: "desc" },
    }),
  ]);

  const totalPoints = dbUser?.predictions.reduce((sum, p) => sum + p.points, 0) ?? 0;

  // Compute position in the leaderboard
  const currentLeaderboard = allUsers
    .map((u) => ({
      id: u.id,
      points: u.predictions.reduce((sum, p) => sum + p.points, 0),
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.id.localeCompare(b.id);
    });

  const position = currentLeaderboard.findIndex((u) => u.id === user!.id) + 1;

  // Compute previous position to find rank change
  let rankChange = 0;
  if (finishedMatches.length > 0) {
    const lastMatchId = finishedMatches[0].id;
    const previousLeaderboard = allUsers
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

  // Count exact, correct, and wrong predictions
  let exactCount = 0;
  let correctCount = 0;
  let wrongCount = 0;

  if (dbUser) {
    for (const pred of dbUser.predictions) {
      if (pred.match.isFinished && pred.match.homeScore != null && pred.match.awayScore != null) {
        const rH = pred.match.homeScore;
        const rA = pred.match.awayScore;
        const pH = pred.homeScore;
        const pA = pred.awayScore;

        const realWinner = rH > rA ? "home" : rA > rH ? "away" : "draw";
        const predWinner = pH > pA ? "home" : pA > pH ? "away" : "draw";

        if (pH === rH && pA === rA) {
          exactCount++;
        } else if (predWinner === realWinner) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6 text-cyan-700">Mi perfil</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
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

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <p className="text-sm text-gray-500 font-medium">Puntos totales</p>
          <p className="text-3xl font-extrabold mt-1 text-cyan-700">{totalPoints}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <p className="text-sm text-gray-500 font-medium">Pronósticos</p>
          <p className="text-3xl font-extrabold mt-1 text-cyan-700">{dbUser?.predictions.length ?? 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-emerald-100 bg-emerald-50/10 p-5 shadow-xs">
          <p className="text-sm text-emerald-700 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Exactos
          </p>
          <p className="text-3xl font-extrabold mt-1 text-emerald-600">{exactCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-cyan-100 bg-cyan-50/10 p-5 shadow-xs">
          <p className="text-sm text-cyan-700 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
            Correctos
          </p>
          <p className="text-3xl font-extrabold mt-1 text-cyan-600">{correctCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-rose-100 bg-rose-50/10 p-5 shadow-xs">
          <p className="text-sm text-rose-700 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            Incorrectos
          </p>
          <p className="text-3xl font-extrabold mt-1 text-rose-600">{wrongCount}</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold mb-4 text-cyan-700">Editar información</h2>
        <ProfileForm name={dbUser?.name ?? ""} email={dbUser?.email ?? ""} />
      </div>
    </div>
  );
}