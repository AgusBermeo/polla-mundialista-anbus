import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import MatchList from "@/components/MatchList";


export default async function MatchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [matches, predictions] = await Promise.all([
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: "asc" },
    }),
    prisma.prediction.findMany({
      where: { userId: user!.id },
    }),
  ]);

  // Agrupar partidos por grupo
  const matchesByGroup = matches.reduce((acc, match) => {
    const group = match.homeTeam.group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(match);
    return acc;
  }, {} as Record<string, typeof matches>);

  // Convertir pronósticos a un mapa para fácil acceso
  const predictionsMap = predictions.reduce((acc, pred) => {
    acc[pred.matchId] = pred;
    return acc;
  }, {} as Record<string, typeof predictions[0]>);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-cyan-700">Pronósticos</h1>
      <MatchList
        matchesByGroup={matchesByGroup}
        predictionsMap={predictionsMap}
      />
    </div>
  );
}