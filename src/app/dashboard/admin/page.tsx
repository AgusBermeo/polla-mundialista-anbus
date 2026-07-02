import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminMatchList from "@/components/AdminMatchList";
import { resolveKnockoutTeams } from "@/lib/knockoutResolver";


export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const dbUser = await prisma.user.findUnique({ where: { id: user!.id } });
  if (!dbUser?.isAdmin) redirect("/dashboard");

  const [matches, allTeams] = await Promise.all([
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: "asc" },
    }),
    prisma.team.findMany(),
  ]);

  const resolvedTeams = resolveKnockoutTeams(matches, allTeams);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-cyan-700">Panel de administrador</h1>
      <p className="text-gray-500 text-sm mb-6">
        Ingresa los resultados de los partidos para calcular los puntos automáticamente.
      </p>
      <AdminMatchList matches={matches} resolvedTeams={resolvedTeams} />
    </div>
  );
}