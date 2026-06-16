import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/chat — last 60 messages
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const messages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: "asc" },
      take: 60,
      include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json({ data: messages });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 });
  }
}

// POST /api/chat — save a new message
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { content } = await request.json();

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
    }

    if (content.trim().length > 300) {
      return NextResponse.json({ error: "Mensaje demasiado largo" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    });

    const message = await prisma.chatMessage.create({
      data: {
        userId: user.id,
        content: content.trim(),
      },
      include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json({ data: message });
  } catch (error) {
    return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 });
  }
}