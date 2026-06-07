import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <img className="object-contain" src="/logo-anbu-futbol.png" alt="Anbus" width={25} height={50} />
              <span className="font-bold text-lg text-cyan-700">Polla Mundial 2026</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Inicio</a>
              <a href="/dashboard/matches" className="text-sm text-gray-600 hover:text-gray-900">Pronósticos</a>
              <a href="/dashboard/leaderboard" className="text-sm text-gray-600 hover:text-gray-900">Posiciones</a>
              <a href="/dashboard/profile" className="text-sm text-gray-600 hover:text-gray-900">Mi perfil</a>
              {dbUser?.isAdmin && (
                <a href="/dashboard/admin" className="text-sm text-cyan-700 hover:text-cyan-900 font-medium">
                  Admin
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-cyan-700 font-medium">{dbUser?.name}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}