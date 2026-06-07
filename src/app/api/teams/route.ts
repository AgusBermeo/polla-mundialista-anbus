import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/teams — todos los equipos
// GET /api/teams?group=A — equipos de un grupo específico
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get("group");

    const teams = await prisma.team.findMany({
      where: group ? { group } : undefined,
      orderBy: [{ group: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ data: teams });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener equipos" },
      { status: 500 }
    );
  }
}