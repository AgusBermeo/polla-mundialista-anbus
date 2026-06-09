import { prisma } from "@/lib/prisma";
import StagesView from "@/components/StagesView";

export default async function StagesPage() {
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchDate: "asc" },
  });

  const groupMatches = matches.filter((m) => m.stage === "GROUP");

  // Build matchesByGroup
  const matchesByGroup = groupMatches.reduce((acc, match) => {
    const group = match.homeTeam.group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(match);
    return acc;
  }, {} as Record<string, typeof groupMatches>);

  // Knockout matches by stage
  const knockoutMatches = matches.filter((m) => m.stage !== "GROUP");

  return <StagesView matchesByGroup={matchesByGroup} knockoutMatches={knockoutMatches} />;
}