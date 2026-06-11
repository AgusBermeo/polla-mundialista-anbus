import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const usersCount = await prisma.user.count();
  const predictionsCount = await prisma.prediction.count();
  const matchesCount = await prisma.match.count();
  const teamsCount = await prisma.team.count();
  
  console.log(`Users: ${usersCount}`);
  console.log(`Predictions: ${predictionsCount}`);
  console.log(`Matches: ${matchesCount}`);
  console.log(`Teams: ${teamsCount}`);

  const teams = await prisma.team.findMany({
    orderBy: { group: "asc" }
  });
  console.log("Teams currently in database:");
  console.log(teams.map(t => `${t.code}: ${t.name} (${t.group})`).join("\n"));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
