import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    return NextResponse.json({ data: dbUser });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { name } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "El nombre no puede estar vacío" }, { status: 400 });
    }

    const dbUser = await prisma.user.update({
      where: { id: user.id },
      data: { name: name.trim() },
    });

    return NextResponse.json({ data: dbUser });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
  }
}