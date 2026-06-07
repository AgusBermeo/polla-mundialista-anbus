import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/matches             — todos los partidos
// GET /api/matches?group=A     — partidos de un grupo
// GET /api/matches?stage=GROUP — partidos por fase
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get("group");
    const stage = searchParams.get("stage");

    const matches = await prisma.match.findMany({
      where: {
        ...(stage ? { stage: stage as any } : {}),
        ...(group
          ? {
              homeTeam: { group },
            }
          : {}),
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: { matchDate: "asc" },
    });

    return NextResponse.json({ data: matches });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener partidos" },
      { status: 500 }
    );
  }
}