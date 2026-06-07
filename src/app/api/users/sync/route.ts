import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Crea el usuario en Prisma si no existe
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email! },
      create: {
        id: user.id,
        email: user.email!,
        name: user.email!.split("@")[0], // nombre temporal
      },
    });

    return NextResponse.json({ data: dbUser });
  } catch (error) {
    return NextResponse.json({ error: "Error al sincronizar usuario" }, { status: 500 });
  }
}