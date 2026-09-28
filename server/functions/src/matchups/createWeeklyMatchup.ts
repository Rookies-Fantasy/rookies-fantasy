import { admin } from "../shared/admin";
import type { TeamSnapshot } from "../shared/types";
import type { Matchup } from "./types";

export const createWeeklyMatchup = async (
  userId1: string,
  userId2: string,
  teamId1: string,
  teamId2: string,
): Promise<string | undefined> => {
  try {
    const team1Data = await admin
      .firestore()
      .collection("users")
      .doc(userId1)
      .collection("teams")
      .doc(teamId1)
      .get();
    const team2Data = await admin
      .firestore()
      .collection("users")
      .doc(userId2)
      .collection("teams")
      .doc(teamId2)
      .get();

    if (!team1Data.exists || !team2Data.exists) {
      console.error("Team data not found!");
      return undefined;
    }

    const team1Info = team1Data.data();
    const team2Info = team2Data.data();

    if (!team1Info || !team2Info) {
      console.error("Team info is undefined!");
      return undefined;
    }

    const startDate = await getNextMondayDate();
    const matchupRef = admin.firestore().collection("matchups").doc();

    const [team1Augment, team2Augment] = await Promise.all([
      getAugmentSnapshot(team1Info.augmentId),
      getAugmentSnapshot(team2Info.augmentId),
    ]);

    const matchupData: Matchup = {
      id: matchupRef.id,
      createdAt: new Date(),
      weekStart: startDate,
      homeTeamId: teamId1,
      awayTeamId: teamId2,
      homeUserId: userId1,
      awayUserId: userId2,
      awayTeamSnapshot: createTeamSnapshot(team2Info, team2Augment),
      homeTeamSnapshot: createTeamSnapshot(team1Info, team1Augment),
      awayLineupSnapshots: {},
      homeLineupSnapshots: {},
      status: "active",
    };

    await matchupRef.set(matchupData);
    return matchupRef.id;
  } catch (error) {
    console.error("Error creating weekly matchup:", error);
    return undefined;
  }
};

const getAugmentSnapshot = async (augmentId?: string) => {
  if (!augmentId) {
    return undefined;
  }

  const augment = await admin
    .firestore()
    .collection("augments")
    .doc(augmentId)
    .get();

  return augment.exists ? { id: augment.id, ...augment.data() } : undefined;
};

const createTeamSnapshot = (
  teamInfo: any,
  augmentSnapshot?: any,
): TeamSnapshot => ({
  logoUrl: teamInfo.logoUrl,
  name: teamInfo.name,
  record: teamInfo.record,
  ...(augmentSnapshot ? { augmentSnapshot } : {}),
});

const getNextMondayDate = async (): Promise<string> => {
  const today = new Date();
  const dayOfTheWeek = today.getDay();

  if (dayOfTheWeek === 1) {
    const hasMondayGamesStarted = await checkIfMondayGamesStarted();

    if (!hasMondayGamesStarted) {
      return today.toISOString().split("T")[0];
    } else {
      // Move to next Monday
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + 7);
      return nextMonday.toISOString().split("T")[0];
    }
  }

  const daysUntilMonday = dayOfTheWeek === 0 ? 1 : (8 - dayOfTheWeek) % 7;

  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split("T")[0];
};

const checkIfMondayGamesStarted = async (): Promise<boolean> => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const response = await fetch(
      `${process.env.BALLDONTLIE_URL}/games?dates[]=${todayStr}`,
      {
        headers: {
          Authorization: `${process.env.BALLDONTLIE_API_KEY}`,
        },
      },
    );

    if (!response.ok) {
      console.log("Failed fetch for NBA games");
      return true;
    }

    const data: any = await response.json();
    const games = data.data || [];

    if (games.length === 0) {
      return false;
    }

    const earliestGame = new Date(
      Math.min(...games.map((g: any) => new Date(g.status).getTime())),
    );

    const now = new Date();
    return now >= earliestGame;
  } catch (error) {
    console.log("Error checking NBA games:", error);
    return true;
  }
};
