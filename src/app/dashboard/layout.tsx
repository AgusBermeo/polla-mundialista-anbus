import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import OnlineUsersFooter from "@/components/OnlineUsersFooter";
import DashboardFooter from "@/components/DashboardFooter";
import Chat from "@/components/Chat";
import BackToTop from "@/components/BackToTop";

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
    <div className="min-h-screen bg-slate-200 flex flex-col">
      <Navbar userName={dbUser?.name} isAdmin={!!dbUser?.isAdmin} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        {children}
      </main>
      <DashboardFooter />
      <OnlineUsersFooter
        currentUserId={user.id}
        currentUserName={dbUser?.name ?? user.email ?? "Usuario"}
        isAdmin={!!dbUser?.isAdmin}
      />
      <BackToTop />
      <Chat
        currentUserId={user.id}
        currentUserName={dbUser?.name ?? user.email ?? "Usuario"}
      />
    </div>
  );
}