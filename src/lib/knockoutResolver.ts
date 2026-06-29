export type Team = {
  id: string;
  name: string;
  code: string;
  group: string;
  flagUrl?: string | null;
};

export type Match = {
  id: string;
  matchDate: Date | string;
  isFinished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: Team;
  awayTeam: Team;
  stage: string;
};

export type Standing = {
  teamId: string;
  teamName: string;
  teamCode: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  teamFlag: string;
};

export const KNOCKOUT_PAIRINGS: Record<string, number> = {
  "A2_B2": 73,
  "E1_3rd-ABCDF": 74,
  "F1_C2": 75,
  "C1_F2": 76,
  "I1_3rd-CDFGH": 77,
  "E2_I2": 78,
  "A1_3rd-CEFHI": 79,
  "L1_3rd-EHIJK": 80,
  "D1_3rd-BEFIJ": 81,
  "G1_3rd-AEHIJ": 82,
  "K2_L2": 83,
  "H1_J2": 84,
  "B1_3rd-EFGIJ": 85,
  "J1_H2": 86,
  "K1_3rd-DEIJL": 87,
  "D2_G2": 88,
  "GP74_GP77": 89,
  "GP73_GP75": 90,
  "GP76_GP78": 91,
  "GP79_GP80": 92,
  "GP83_GP84": 93,
  "GP81_GP82": 94,
  "GP86_GP88": 95,
  "GP85_GP87": 96,
  "GP89_GP90": 97,
  "GP93_GP94": 98,
  "GP91_GP92": 99,
  "GP95_GP96": 100,
  "GP97_GP98": 101,
  "GP99_GP100": 102,
  "PP101_PP102": 103,
  "GP101_GP102": 104,
};

export function isPlaceholderCode(code: string): boolean {
  if (/^[A-L][12]$/.test(code)) return true;
  if (code.startsWith("3rd-")) return true;
  if (code.startsWith("GP") || code.startsWith("PP")) return true;
  return false;
}

export function computeStandings(matches: {
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  counted: boolean;
}[]): Standing[] {
  const standings: Record<string, Standing> = {};

  for (const match of matches) {
    for (const team of [match.homeTeam, match.awayTeam]) {
      if (!standings[team.id]) {
        standings[team.id] = {
          teamId: team.id,
          teamName: team.name,
          teamCode: team.code,
          played: 0, won: 0, drawn: 0, lost: 0,
          gf: 0, ga: 0, gd: 0, points: 0,
          teamFlag: (team as any).flag ?? "",
        };
      }
    }
  }

  for (const match of matches) {
    if (!match.counted || match.homeScore === null || match.awayScore === null) continue;

    const home = standings[match.homeTeam.id];
    const away = standings[match.awayTeam.id];
    const hs = match.homeScore;
    const as_ = match.awayScore;

    if (!home || !away) continue;

    home.played++; away.played++;
    home.gf += hs; home.ga += as_;
    away.gf += as_; away.ga += hs;

    if (hs > as_) {
      home.won++; home.points += 3; away.lost++;
    } else if (hs < as_) {
      away.won++; away.points += 3; home.lost++;
    } else {
      home.drawn++; away.drawn++;
      home.points += 1; away.points += 1;
    }
  }

  return Object.values(standings)
    .map((s) => ({ ...s, gd: s.gf - s.ga }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.teamName.localeCompare(b.teamName);
    });
}

export function compareThird(a: Standing, b: Standing): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.gd !== a.gd) return b.gd - a.gd;
  if (b.gf !== a.gf) return b.gf - a.gf;
  return a.teamName.localeCompare(b.teamName);
}

export function resolveKnockoutTeams(matches: Match[], teams: Team[]): Record<string, Team> {
  const groupMatches = matches.filter((m) => m.stage === "GROUP");
  const knockoutMatches = matches.filter((m) => m.stage !== "GROUP");

  const matchesByGroup: Record<string, Match[]> = {};
  for (const match of groupMatches) {
    const grp = match.homeTeam.group;
    if (!matchesByGroup[grp]) matchesByGroup[grp] = [];
    matchesByGroup[grp].push(match);
  }

  const standingsByGroup: Record<string, Standing[]> = {};
  for (const [group, grpMatches] of Object.entries(matchesByGroup)) {
    const forTable = grpMatches.map((m) => ({
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      counted: m.isFinished,
    }));
    standingsByGroup[group] = computeStandings(forTable);
  }

  const resolved: Record<string, Team> = {};

  const findTeamByCode = (code: string): Team | undefined => {
    return teams.find((t) => t.code === code);
  };

  // Resolve group rankings
  for (const [group, standings] of Object.entries(standingsByGroup)) {
    if (standings[0] && standings[0].played > 0) {
      const team = findTeamByCode(standings[0].teamCode);
      if (team) resolved[`${group}1`] = team;
    }
    if (standings[1] && standings[1].played > 0) {
      const team = findTeamByCode(standings[1].teamCode);
      if (team) resolved[`${group}2`] = team;
    }
  }

  // Resolve best 3rd place teams
  const allThirds: Array<Standing & { group: string }> = [];
  for (const [group, standings] of Object.entries(standingsByGroup)) {
    const third = standings[2];
    if (third && third.played > 0) {
      allThirds.push({ ...third, group });
    }
  }
  allThirds.sort(compareThird);

  const thirdPlaceholders = [
    "3rd-ABCDF",
    "3rd-CDFGH",
    "3rd-CEFHI",
    "3rd-EHIJK",
    "3rd-BEFIJ",
    "3rd-AEHIJ",
    "3rd-EFGIJ",
    "3rd-DEIJL",
  ];

  const assignedThirds = new Set<string>();
  for (const placeholder of thirdPlaceholders) {
    const groups = placeholder.replace("3rd-", "").split("");
    const best = allThirds.find(
      (t) => groups.includes(t.group) && !assignedThirds.has(t.teamId)
    );
    if (best) {
      const team = findTeamByCode(best.teamCode);
      if (team) {
        resolved[placeholder] = team;
        assignedThirds.add(best.teamId);
      }
    }
  }

  const findMatchByNum = (num: number): Match | undefined => {
    return knockoutMatches.find((m) => {
      const key = `${m.homeTeam.code}_${m.awayTeam.code}`;
      return KNOCKOUT_PAIRINGS[key] === num;
    });
  };

  const resolveTeamByCode = (code: string): Team | undefined => {
    if (!isPlaceholderCode(code)) {
      return findTeamByCode(code);
    }
    if (resolved[code]) {
      return resolved[code];
    }

    let result: Team | undefined;

    if (code.startsWith("GP")) {
      const matchNum = parseInt(code.slice(2), 10);
      const m = findMatchByNum(matchNum);
      if (m && m.isFinished && m.homeScore !== null && m.awayScore !== null) {
        const resolvedHome = resolveTeamByCode(m.homeTeam.code);
        const resolvedAway = resolveTeamByCode(m.awayTeam.code);
        if (resolvedHome && resolvedAway) {
          result = m.homeScore > m.awayScore ? resolvedHome : resolvedAway;
        }
      }
    } else if (code.startsWith("PP")) {
      const matchNum = parseInt(code.slice(2), 10);
      const m = findMatchByNum(matchNum);
      if (m && m.isFinished && m.homeScore !== null && m.awayScore !== null) {
        const resolvedHome = resolveTeamByCode(m.homeTeam.code);
        const resolvedAway = resolveTeamByCode(m.awayTeam.code);
        if (resolvedHome && resolvedAway) {
          result = m.homeScore < m.awayScore ? resolvedHome : resolvedAway;
        }
      }
    }

    if (result) {
      resolved[code] = result;
      return result;
    }

    return findTeamByCode(code);
  };

  // Populate resolved map for all knockout matches
  for (const m of knockoutMatches) {
    resolveTeamByCode(m.homeTeam.code);
    resolveTeamByCode(m.awayTeam.code);
  }

  return resolved;
}
