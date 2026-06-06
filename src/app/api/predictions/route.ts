import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";

const prisma = new PrismaClient();

// GET /api/predictions — pronósticos del usuario actual
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const predictions = await prisma.prediction.findMany({
      where: { userId: user.id },
      include: { match: { include: { homeTeam: true, awayTeam: true } } },
    });

    return NextResponse.json({ data: predictions });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener pronósticos" }, { status: 500 });
  }
}

// POST /api/predictions — guardar o actualizar un pronóstico
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { matchId, homeScore, awayScore } = await request.json();

    if (homeScore === undefined || awayScore === undefined || !matchId) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Verificar que el partido no haya terminado
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }
    if (match.isFinished) {
      return NextResponse.json({ error: "El partido ya terminó" }, { status: 400 });
    }

    // Upsert: crea o actualiza el pronóstico
    const prediction = await prisma.prediction.upsert({
      where: { userId_matchId: { userId: user.id, matchId } },
      update: { homeScore, awayScore },
      create: { userId: user.id, matchId, homeScore, awayScore },
    });

    return NextResponse.json({ data: prediction });
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar pronóstico" }, { status: 500 });
  }
}