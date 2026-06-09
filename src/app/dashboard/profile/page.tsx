import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";


export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const dbUser = await prisma.user.findUnique({
    where: { id: user!.id },
    include: { predictions: true },
  });

  const totalPoints = dbUser?.predictions.reduce((sum, p) => sum + p.points, 0) ?? 0;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6 text-cyan-700">Mi perfil</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Pronósticos</p>
          <p className="text-3xl font-bold mt-1 text-cyan-700">{dbUser?.predictions.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Puntos totales</p>
          <p className="text-3xl font-bold mt-1 text-cyan-700">{totalPoints}</p>
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