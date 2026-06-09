import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const teams = [
    // Grupo A
    { name: "México",           code: "MEX", group: "A", flag: "🇲🇽" },
    { name: "Sudáfrica",        code: "RSA", group: "A", flag: "🇿🇦" },
    { name: "Corea del Sur",    code: "KOR", group: "A", flag: "🇰🇷" },
    { name: "República Checa",  code: "CZE", group: "A", flag: "🇨🇿" },
    // Grupo B
    { name: "Canadá",           code: "CAN", group: "B", flag: "🇨🇦" },
    { name: "Bosnia y Herz.",   code: "BIH", group: "B", flag: "🇧🇦" },
    { name: "Catar",            code: "QAT", group: "B", flag: "🇶🇦" },
    { name: "Suiza",            code: "SUI", group: "B", flag: "🇨🇭" },
    // Grupo C
    { name: "Brasil",           code: "BRA", group: "C", flag: "🇧🇷" },
    { name: "Marruecos",        code: "MAR", group: "C", flag: "🇲🇦" },
    { name: "Haití",            code: "HAI", group: "C", flag: "🇭🇹" },
    { name: "Escocia",          code: "SCO", group: "C", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
    // Grupo D
    { name: "Estados Unidos",   code: "USA", group: "D", flag: "🇺🇸" },
    { name: "Paraguay",         code: "PAR", group: "D", flag: "🇵🇾" },
    { name: "Australia",        code: "AUS", group: "D", flag: "🇦🇺" },
    { name: "Turquía",          code: "TUR", group: "D", flag: "🇹🇷" },
    // Grupo E
    { name: "Alemania",         code: "GER", group: "E", flag: "🇩🇪" },
    { name: "Curazao",          code: "CUW", group: "E", flag: "🇨🇼" },
    { name: "Costa de Marfil",  code: "CIV", group: "E", flag: "🇨🇮" },
    { name: "Ecuador",          code: "ECU", group: "E", flag: "🇪🇨" },
    // Grupo F
    { name: "Países Bajos",     code: "NED", group: "F", flag: "🇳🇱" },
    { name: "Japón",            code: "JPN", group: "F", flag: "🇯🇵" },
    { name: "Suecia",           code: "SWE", group: "F", flag: "🇸🇪" },
    { name: "Túnez",            code: "TUN", group: "F", flag: "🇹🇳" },
    // Grupo G
    { name: "Bélgica",          code: "BEL", group: "G", flag: "🇧🇪" },
    { name: "Egipto",           code: "EGY", group: "G", flag: "🇪🇬" },
    { name: "Irán",             code: "IRN", group: "G", flag: "🇮🇷" },
    { name: "Nueva Zelanda",    code: "NZL", group: "G", flag: "🇳🇿" },
    // Grupo H
    { name: "España",           code: "ESP", group: "H", flag: "🇪🇸" },
    { name: "Cabo Verde",       code: "CPV", group: "H", flag: "🇨🇻" },
    { name: "Arabia Saudita",   code: "KSA", group: "H", flag: "🇸🇦" },
    { name: "Uruguay",          code: "URU", group: "H", flag: "🇺🇾" },
    // Grupo I
    { name: "Francia",          code: "FRA", group: "I", flag: "🇫🇷" },
    { name: "Senegal",          code: "SEN", group: "I", flag: "🇸🇳" },
    { name: "Irak",             code: "IRQ", group: "I", flag: "🇮🇶" },
    { name: "Noruega",          code: "NOR", group: "I", flag: "🇳🇴" },
    // Grupo J
    { name: "Argentina",        code: "ARG", group: "J", flag: "🇦🇷" },
    { name: "Argelia",          code: "ALG", group: "J", flag: "🇩🇿" },
    { name: "Austria",          code: "AUT", group: "J", flag: "🇦🇹" },
    { name: "Jordania",         code: "JOR", group: "J", flag: "🇯🇴" },
    // Grupo K
    { name: "Portugal",         code: "POR", group: "K", flag: "🇵🇹" },
    { name: "R.D. Congo",       code: "COD", group: "K", flag: "🇨🇩" },
    { name: "Uzbekistán",       code: "UZB", group: "K", flag: "🇺🇿" },
    { name: "Colombia",         code: "COL", group: "K", flag: "🇨🇴" },
    // Grupo L
    { name: "Inglaterra",       code: "ENG", group: "L", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { name: "Croacia",          code: "CRO", group: "L", flag: "🇭🇷" },
    { name: "Ghana",            code: "GHA", group: "L", flag: "🇬🇭" },
    { name: "Panamá",           code: "PAN", group: "L", flag: "🇵🇦" },
  ];

  for (const team of teams) {
    await prisma.team.upsert({
      where: { code: team.code },
      update: { name: team.name, group: team.group, flag: team.flag },
      create: team,
    });
  }

  console.log(`✅ ${teams.length} equipos insertados/actualizados`);

  await prisma.pointConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", exactScore: 3, correctWinner: 1 },
  });

  // ─── PARTIDOS FASE DE GRUPOS ───────────────────────────────
  const teamByCode = async (code: string) => {
    const team = await prisma.team.findUnique({ where: { code } });
    if (!team) throw new Error(`Equipo no encontrado: ${code}`);
    return team.id;
  };

  const matches = [
    // GRUPO A
    { home: "MEX", away: "RSA", date: new Date("2026-06-11T19:00:00Z") }, //
    { home: "KOR", away: "CZE", date: new Date("2026-06-12T02:00:00Z") }, //
    { home: "RSA", away: "CZE", date: new Date("2026-06-18T16:00:00Z") }, //
    { home: "MEX", away: "KOR", date: new Date("2026-06-19T01:00:00Z") }, //
    { home: "MEX", away: "CZE", date: new Date("2026-06-25T01:00:00Z") }, //
    { home: "KOR", away: "RSA", date: new Date("2026-06-25T01:00:00Z") }, //
    // GRUPO B
    { home: "CAN", away: "BIH", date: new Date("2026-06-12T19:00:00Z") }, //
    { home: "QAT", away: "SUI", date: new Date("2026-06-13T19:00:00Z") }, //
    { home: "CAN", away: "QAT", date: new Date("2026-06-18T22:00:00Z") }, //
    { home: "BIH", away: "SUI", date: new Date("2026-06-18T19:00:00Z") }, //
    { home: "CAN", away: "SUI", date: new Date("2026-06-24T19:00:00Z") }, //
    { home: "BIH", away: "QAT", date: new Date("2026-06-24T19:00:00Z") }, //
    // GRUPO C
    { home: "BRA", away: "MAR", date: new Date("2026-06-13T22:00:00Z") }, //
    { home: "HAI", away: "SCO", date: new Date("2026-06-14T01:00:00Z") }, //
    { home: "BRA", away: "HAI", date: new Date("2026-06-20T00:30:00Z") }, //
    { home: "MAR", away: "SCO", date: new Date("2026-06-19T22:00:00Z") }, //
    { home: "BRA", away: "SCO", date: new Date("2026-06-24T22:00:00Z") }, //
    { home: "MAR", away: "HAI", date: new Date("2026-06-24T22:00:00Z") }, //
    // GRUPO D
    { home: "USA", away: "PAR", date: new Date("2026-06-13T01:00:00Z") }, //
    { home: "AUS", away: "TUR", date: new Date("2026-06-14T04:00:00Z") }, //
    { home: "USA", away: "AUS", date: new Date("2026-06-19T19:00:00Z") }, //
    { home: "PAR", away: "TUR", date: new Date("2026-06-20T03:00:00Z") }, //
    { home: "USA", away: "TUR", date: new Date("2026-06-26T02:00:00Z") }, //
    { home: "AUS", away: "PAR", date: new Date("2026-06-26T02:00:00Z") }, //
    // GRUPO E
    { home: "GER", away: "CUW", date: new Date("2026-06-14T17:00:00Z") }, //
    { home: "CIV", away: "ECU", date: new Date("2026-06-14T23:00:00Z") }, //
    { home: "GER", away: "CIV", date: new Date("2026-06-20T20:00:00Z") }, //
    { home: "CUW", away: "ECU", date: new Date("2026-06-21T00:00:00Z") }, //
    { home: "GER", away: "ECU", date: new Date("2026-06-25T20:00:00Z") }, //
    { home: "CIV", away: "CUW", date: new Date("2026-06-25T20:00:00Z") }, //
    // GRUPO F
    { home: "NED", away: "JPN", date: new Date("2026-06-14T20:00:00Z") }, //
    { home: "SWE", away: "TUN", date: new Date("2026-06-15T02:00:00Z") }, //
    { home: "NED", away: "SWE", date: new Date("2026-06-20T17:00:00Z") }, //
    { home: "JPN", away: "TUN", date: new Date("2026-06-21T04:00:00Z") }, //
    { home: "NED", away: "TUN", date: new Date("2026-06-25T23:00:00Z") }, //
    { home: "JPN", away: "SWE", date: new Date("2026-06-25T23:00:00Z") }, //
    // GRUPO G
    { home: "BEL", away: "EGY", date: new Date("2026-06-15T19:00:00Z") }, //
    { home: "IRN", away: "NZL", date: new Date("2026-06-16T01:00:00Z") }, //
    { home: "BEL", away: "IRN", date: new Date("2026-06-21T19:00:00Z") }, //
    { home: "EGY", away: "NZL", date: new Date("2026-06-22T01:00:00Z") }, //
    { home: "BEL", away: "NZL", date: new Date("2026-06-27T03:00:00Z") }, //
    { home: "EGY", away: "IRN", date: new Date("2026-06-27T03:00:00Z") }, //
    // GRUPO H
    { home: "ESP", away: "CPV", date: new Date("2026-06-15T16:00:00Z") }, //
    { home: "KSA", away: "URU", date: new Date("2026-06-15T22:00:00Z") }, //
    { home: "ESP", away: "KSA", date: new Date("2026-06-21T16:00:00Z") }, //
    { home: "CPV", away: "URU", date: new Date("2026-06-21T22:00:00Z") }, //
    { home: "ESP", away: "URU", date: new Date("2026-06-27T00:00:00Z") }, //
    { home: "CPV", away: "KSA", date: new Date("2026-06-27T00:00:00Z") }, //
    // GRUPO I
    { home: "FRA", away: "SEN", date: new Date("2026-06-16T19:00:00Z") }, //
    { home: "IRQ", away: "NOR", date: new Date("2026-06-16T22:00:00Z") }, //
    { home: "FRA", away: "IRQ", date: new Date("2026-06-22T21:00:00Z") }, //
    { home: "SEN", away: "NOR", date: new Date("2026-06-23T00:00:00Z") }, //
    { home: "FRA", away: "NOR", date: new Date("2026-06-26T19:00:00Z") }, //
    { home: "SEN", away: "IRQ", date: new Date("2026-06-26T19:00:00Z") }, //
    // GRUPO J
    { home: "ARG", away: "ALG", date: new Date("2026-06-17T01:00:00Z") }, //
    { home: "AUT", away: "JOR", date: new Date("2026-06-17T04:00:00Z") }, //
    { home: "ARG", away: "AUT", date: new Date("2026-06-22T17:00:00Z") }, //
    { home: "ALG", away: "JOR", date: new Date("2026-06-23T03:00:00Z") }, //
    { home: "ARG", away: "JOR", date: new Date("2026-06-28T02:00:00Z") }, //
    { home: "ALG", away: "AUT", date: new Date("2026-06-28T02:00:00Z") }, //
    // GRUPO K
    { home: "POR", away: "COD", date: new Date("2026-06-17T17:00:00Z") }, //
    { home: "UZB", away: "COL", date: new Date("2026-06-18T02:00:00Z") }, //
    { home: "POR", away: "UZB", date: new Date("2026-06-23T17:00:00Z") }, //
    { home: "COD", away: "COL", date: new Date("2026-06-24T02:00:00Z") }, //
    { home: "POR", away: "COL", date: new Date("2026-06-27T23:30:00Z") }, //
    { home: "COD", away: "UZB", date: new Date("2026-06-27T23:30:00Z") }, //
    // GRUPO L
    { home: "ENG", away: "CRO", date: new Date("2026-06-17T20:00:00Z") }, //
    { home: "GHA", away: "PAN", date: new Date("2026-06-17T23:00:00Z") }, //
    { home: "ENG", away: "GHA", date: new Date("2026-06-23T20:00:00Z") }, //
    { home: "CRO", away: "PAN", date: new Date("2026-06-23T23:00:00Z") }, //
    { home: "ENG", away: "PAN", date: new Date("2026-06-27T21:00:00Z") }, //
    { home: "GHA", away: "CRO", date: new Date("2026-06-27T21:00:00Z") }, //
  ];

  await prisma.match.deleteMany();

  for (const m of matches) {
    await prisma.match.create({
      data: {
        homeTeamId: await teamByCode(m.home),
        awayTeamId: await teamByCode(m.away),
        matchDate:  m.date,
        stage:      "GROUP",
      },
    });
  }

  console.log(`✅ ${matches.length} partidos insertados`);
  console.log("✅ Configuración de puntos lista");
  console.log("🎉 Seed completado!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });