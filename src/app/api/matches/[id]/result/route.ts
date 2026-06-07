import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verificar que es admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.isAdmin) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const { homeScore, awayScore } = await request.json();

    if (homeScore === undefined || awayScore === undefined) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Actualizar resultado del partido
    const match = await prisma.match.update({
      where: { id },
      data: { homeScore, awayScore, isFinished: true },
    });

    // Obtener configuración de puntos
    const config = await prisma.pointConfig.findUnique({
      where: { id: "default" },
    });
    const exactPoints = config?.exactScore ?? 3;
    const winnerPoints = config?.correctWinner ?? 1;

    // Calcular resultado real
    const realResult =
      homeScore > awayScore ? "home" :
      awayScore > homeScore ? "away" : "draw";

    // Obtener todos los pronósticos de este partido
    const predictions = await prisma.prediction.findMany({
      where: { matchId: id },
    });

    // Calcular y actualizar puntos de cada pronóstico
    for (const pred of predictions) {
      const predResult =
        pred.homeScore > pred.awayScore ? "home" :
        pred.awayScore > pred.homeScore ? "away" : "draw";

      let points = 0;

      if (pred.homeScore === homeScore && pred.awayScore === awayScore) {
        points = exactPoints; // marcador exacto
      } else if (predResult === realResult) {
        points = winnerPoints; // ganador correcto
      }

      await prisma.prediction.update({
        where: { id: pred.id },
        data: { points },
      });
    }

    return NextResponse.json({
      data: { match, predictionsUpdated: predictions.length },
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar resultado" }, { status: 500 });
  }
}