import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";


export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const users = await prisma.user.findMany({
    include: { predictions: true },
  });

  const leaderboard = users
    .map((u) => ({
      id: u.id,
      name: u.name || u.email,
      email: u.email,
      totalPoints: u.predictions.reduce((sum, p) => sum + p.points, 0),
      totalPredictions: u.predictions.length,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-cyan-700">Tabla de posiciones</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 w-12">#</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Jugador</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500">Pronósticos</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr
                key={entry.id}
                className={`border-b border-gray-50 last:border-0 ${
                  entry.id === user?.id ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <td className="px-6 py-4 text-sm font-bold text-gray-400">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-sm text-gray-600">
                    {entry.name}
                    {entry.id === user?.id && (
                      <span className="ml-2 text-xs text-blue-500 font-normal">(tú)</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">
                  {entry.totalPredictions}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="font-bold text-lg text-cyan-700">{entry.totalPoints}</span>
                </td>
              </tr>
            ))}

            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                  Aún no hay participantes registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}