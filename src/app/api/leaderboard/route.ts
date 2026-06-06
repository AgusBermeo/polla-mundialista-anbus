import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        predictions: true,
      },
    });

    const leaderboard = users
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        totalPoints: user.predictions.reduce((sum, p) => sum + p.points, 0),
        totalPredictions: user.predictions.length,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    return NextResponse.json({ data: leaderboard });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener posiciones" }, { status: 500 });
  }
}