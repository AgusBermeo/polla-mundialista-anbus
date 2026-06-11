import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const teams = [
    // Grupo A
    { name: "México",              code: "MEX", group: "A" },
    { name: "Sudáfrica",           code: "RSA", group: "A" },
    { name: "Corea del Sur",       code: "KOR", group: "A" },
    { name: "República Checa",     code: "CZE", group: "A" },
    // Grupo B
    { name: "Canadá",              code: "CAN", group: "B" },
    { name: "Bosnia y Herz.",      code: "BIH", group: "B" },
    { name: "Catar",               code: "QAT", group: "B" },
    { name: "Suiza",               code: "SUI", group: "B" },
    // Grupo C
    { name: "Brasil",              code: "BRA", group: "C" },
    { name: "Marruecos",           code: "MAR", group: "C" },
    { name: "Haití",               code: "HAI", group: "C" },
    { name: "Escocia",             code: "SCO", group: "C" },
    // Grupo D
    { name: "Estados Unidos",      code: "USA", group: "D" },
    { name: "Paraguay",            code: "PAR", group: "D" },
    { name: "Australia",           code: "AUS", group: "D" },
    { name: "Turquía",             code: "TUR", group: "D" },
    // Grupo E
    { name: "Alemania",            code: "GER", group: "E" },
    { name: "Curazao",             code: "CUW", group: "E" },
    { name: "Costa de Marfil",     code: "CIV", group: "E" },
    { name: "Ecuador",             code: "ECU", group: "E" },
    // Grupo F
    { name: "Países Bajos",        code: "NED", group: "F" },
    { name: "Japón",               code: "JPN", group: "F" },
    { name: "Suecia",              code: "SWE", group: "F" },
    { name: "Túnez",               code: "TUN", group: "F" },
    // Grupo G
    { name: "Bélgica",             code: "BEL", group: "G" },
    { name: "Egipto",              code: "EGY", group: "G" },
    { name: "Irán",                code: "IRN", group: "G" },
    { name: "Nueva Zelanda",       code: "NZL", group: "G" },
    // Grupo H
    { name: "España",              code: "ESP", group: "H" },
    { name: "Cabo Verde",          code: "CPV", group: "H" },
    { name: "Arabia Saudita",      code: "KSA", group: "H" },
    { name: "Uruguay",             code: "URU", group: "H" },
    // Grupo I
    { name: "Francia",             code: "FRA", group: "I" },
    { name: "Senegal",             code: "SEN", group: "I" },
    { name: "Irak",                code: "IRQ", group: "I" },
    { name: "Noruega",             code: "NOR", group: "I" },
    // Grupo J
    { name: "Argentina",           code: "ARG", group: "J" },
    { name: "Argelia",             code: "ALG", group: "J" },
    { name: "Austria",             code: "AUT", group: "J" },
    { name: "Jordania",            code: "JOR", group: "J" },
    // Grupo K
    { name: "Portugal",            code: "POR", group: "K" },
    { name: "R.D. Congo",          code: "COD", group: "K" },
    { name: "Uzbekistán",          code: "UZB", group: "K" },
    { name: "Colombia",            code: "COL", group: "K" },
    // Grupo L
    { name: "Inglaterra",          code: "ENG", group: "L" },
    { name: "Croacia",             code: "CRO", group: "L" },
    { name: "Ghana",               code: "GHA", group: "L" },
    { name: "Panamá",              code: "PAN", group: "L" },
  ];

  for (const team of teams) {
    await prisma.team.upsert({
      where: { code: team.code },
      update: { name: team.name, group: team.group },
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

  // ─── PARTIDOS FASE ELIMINATORIA ────────────────────────────────────────────

  // RONDA DE 32 (partidos 73–88)
  const knockoutR32 = [
    // Partido 73 – 28 jun
    { home: "A2", away: "B2", date: new Date("2026-06-28T14:00:00Z"), stage: "ROUND_OF_32" },
    // Partido 74 – 29 jun
    { home: "E1", away: "3rd-ABCDF", date: new Date("2026-06-29T15:30:00Z"), stage: "ROUND_OF_32" },
    // Partido 75 – 29 jun
    { home: "F1", away: "C2", date: new Date("2026-06-29T20:00:00Z"), stage: "ROUND_OF_32" },
    // Partido 76 – 29 jun
    { home: "C1", away: "F2", date: new Date("2026-06-29T12:00:00Z"), stage: "ROUND_OF_32" },
    // Partido 77 – 30 jun
    { home: "I1", away: "3rd-CDFGH", date: new Date("2026-06-30T16:00:00Z"), stage: "ROUND_OF_32" },
    // Partido 78 – 30 jun
    { home: "E2", away: "I2", date: new Date("2026-06-30T12:00:00Z"), stage: "ROUND_OF_32" },
    // Partido 79 – 30 jun
    { home: "A1", away: "3rd-CEFHI", date: new Date("2026-06-30T20:00:00Z"), stage: "ROUND_OF_32" },
    // Partido 80 – 1 jul
    { home: "L1", away: "3rd-EHIJK", date: new Date("2026-07-01T11:00:00Z"), stage: "ROUND_OF_32" },
    // Partido 81 – 1 jul
    { home: "D1", away: "3rd-BEFIJ", date: new Date("2026-07-01T19:00:00Z"), stage: "ROUND_OF_32" },
    // Partido 82 – 1 jul
    { home: "G1", away: "3rd-AEHIJ", date: new Date("2026-07-01T15:00:00Z"), stage: "ROUND_OF_32" },
    // Partido 83 – 2 jul
    { home: "K2", away: "L2", date: new Date("2026-07-02T18:00:00Z"), stage: "ROUND_OF_32" },
    // Partido 84 – 2 jul
    { home: "H1", away: "J2", date: new Date("2026-07-02T14:00:00Z"), stage: "ROUND_OF_32" },
    // Partido 85 – 2 jul
    { home: "B1", away: "3rd-EFGIJ", date: new Date("2026-07-02T22:00:00Z"), stage: "ROUND_OF_32" },
    // Partido 86 – 3 jul
    { home: "J1", away: "H2", date: new Date("2026-07-03T17:00:00Z"), stage: "ROUND_OF_32" },
    // Partido 87 – 3 jul
    { home: "K1", away: "3rd-DEIJL", date: new Date("2026-07-03T20:30:00Z"), stage: "ROUND_OF_32" },
    // Partido 88 – 3 jul
    { home: "D2", away: "G2", date: new Date("2026-07-03T13:00:00Z"), stage: "ROUND_OF_32" },
  ];

  // OCTAVOS DE FINAL (partidos 89–96)
  const knockoutR16 = [
    { date: new Date("2026-07-04T16:00:00Z"), stage: "ROUND_OF_16" }, // G.P74 vs G.P77
    { date: new Date("2026-07-04T12:00:00Z"), stage: "ROUND_OF_16" }, // G.P73 vs G.P75
    { date: new Date("2026-07-05T15:00:00Z"), stage: "ROUND_OF_16" }, // G.P76 vs G.P78
    { date: new Date("2026-07-05T19:00:00Z"), stage: "ROUND_OF_16" }, // G.P79 vs G.P80
    { date: new Date("2026-07-06T14:00:00Z"), stage: "ROUND_OF_16" }, // G.P83 vs G.P84
    { date: new Date("2026-07-06T19:00:00Z"), stage: "ROUND_OF_16" }, // G.P81 vs G.P82
    { date: new Date("2026-07-07T11:00:00Z"), stage: "ROUND_OF_16" }, // G.P86 vs G.P88
    { date: new Date("2026-07-07T15:00:00Z"), stage: "ROUND_OF_16" }, // G.P85 vs G.P87
  ];

  // CUARTOS DE FINAL (partidos 97–100)
  const knockoutQF = [
    { date: new Date("2026-07-09T15:00:00Z"), stage: "QUARTER_FINAL" },
    { date: new Date("2026-07-10T14:00:00Z"), stage: "QUARTER_FINAL" },
    { date: new Date("2026-07-11T16:00:00Z"), stage: "QUARTER_FINAL" },
    { date: new Date("2026-07-11T20:00:00Z"), stage: "QUARTER_FINAL" },
  ];

  // SEMIFINALES (partidos 101–102)
  const knockoutSF = [
    { date: new Date("2026-07-14T14:00:00Z"), stage: "SEMI_FINAL" },
    { date: new Date("2026-07-15T14:00:00Z"), stage: "SEMI_FINAL" },
  ];

  // TERCER PUESTO + FINAL (partidos 103–104)
  const knockoutFinals = [
    { date: new Date("2026-07-18T16:00:00Z"), stage: "THIRD_PLACE" },
    { date: new Date("2026-07-19T14:00:00Z"), stage: "FINAL" },
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