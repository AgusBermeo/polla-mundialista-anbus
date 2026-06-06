import { createClient } from "@/lib/supabase/server";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import AdminMatchList from "@/components/AdminMatchList";

const prisma = new PrismaClient();

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const dbUser = await prisma.user.findUnique({ where: { id: user!.id } });
  if (!dbUser?.isAdmin) redirect("/dashboard");

  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchDate: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Panel de administrador</h1>
      <p className="text-gray-500 text-sm mb-6">
        Ingresa los resultados de los partidos para calcular los puntos automáticamente.
      </p>
      <AdminMatchList matches={matches} />
    </div>
  );
}