import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { getFunctionUrl } from "@/firebase/config";
import { JsonValue } from "@/types/json";
import { League, LeagueDeadlineBounds } from "@/types/league";
import { LeagueStandingTeam } from "@/types/standings";
import { defaultTeam, Team } from "@/types/team";
import { callFunction, getIdToken } from "@/utils/callableUtils";
import { toLeagueStatus } from "@/utils/leagueUtils";
import { parseLeagueStandingTeams } from "@/utils/standingsUtils";

const LEAGUE_COLLECTION = "leagues";

const toLeague = (
  id: string,
  data: FirebaseFirestoreTypes.DocumentData,
): League => ({
  id,
  name: data.name,
  creatorUserId: data.creatorUserId,
  numberOfTeams: data.numberOfTeams,
  budget: data.budget,
  memberCount: data.memberCount,
  teamIds: data.teamIds ?? [],
  userIds: data.userIds ?? [],
  deadline: typeof data.deadline === "string" ? data.deadline : "",
  status: toLeagueStatus(data.status ?? ""),
});

const SIGNED_OUT_ERROR = "No authenticated user";
const CREATE_SIGNED_OUT_ERROR = "You must be signed in to create a league";
const JOIN_SIGNED_OUT_ERROR = "You must be signed in to join a league";
const UPDATE_SIGNED_OUT_ERROR = "You must be signed in to edit a league";
const DELETE_SIGNED_OUT_ERROR = "You must be signed in to delete a league";

export type LeagueSettingsModel = {
  name: string;
  numberOfTeams: number;
  budget: number;
};

export type LeagueUpdateModel = LeagueSettingsModel & {
  deadline: string;
};

export type LeagueEditModel = LeagueUpdateModel & {
  initialTeamId: string;
};

export type JoinLeagueTeamModel = {
  teamName: string;
  abbreviation: string;
  logoUrl: string;
};

type JoinedTeamResponse = {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl: string;
  balance: number;
  isLeagueTeam: boolean;
};

export type LeagueTeamInfo = {
  league: League;
  team: Team;
};

export class LeagueController {
  static getLeaguesByTeamIds = async (
    teamIds: string[],
  ): Promise<Map<string, League>> => {
    if (teamIds.length === 0) return new Map();

    try {
      const leagues = await firestore()
        .collection(LEAGUE_COLLECTION)
        .where("teamIds", "array-contains-any", teamIds)
        .get();

      const teamToLeague = new Map<string, League>();

      leagues.docs.forEach((doc) => {
        const data = doc.data();
        if (data?.status === "deleted") return;

        const league = toLeague(doc.id, data);

        (data?.teamIds ?? []).forEach((teamId: string) => {
          if (teamIds.includes(teamId)) {
            teamToLeague.set(teamId, league);
          }
        });
      });

      return teamToLeague;
    } catch (error) {
      console.error("Error fetching leagues by team IDs:", error);
      throw error;
    }
  };

  static getLeague = async (leagueId: string): Promise<League | null> => {
    try {
      const leagueDoc = await firestore()
        .collection(LEAGUE_COLLECTION)
        .doc(leagueId)
        .get();

      if (!leagueDoc.exists()) return null;

      const data = leagueDoc.data() ?? {};
      if (data.status === "deleted") return null;

      return toLeague(leagueDoc.id, data);
    } catch (error) {
      console.error("Error fetching league:", error);
      throw error;
    }
  };

  static getLeagueStandingTeams = async (
    league: League,
  ): Promise<LeagueStandingTeam[]> => {
    const idToken = await getIdToken(SIGNED_OUT_ERROR);
    const url = `${getFunctionUrl("getLeagueStandings")}?leagueId=${league.id}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(`HTTP ${response.status}: ${message}`);
      }

      const payload: JsonValue = await response.json();

      return parseLeagueStandingTeams(payload);
    } catch (error) {
      console.error("getLeagueStandingTeams failed:", url, error);
      throw error;
    }
  };

  static createLeague = async (params: LeagueEditModel): Promise<League> => {
    try {
      const { league } = await callFunction<{ league: League }>(
        "createLeague",
        {
          name: params.name,
          numberOfTeams: params.numberOfTeams,
          budget: params.budget,
          initialTeamId: params.initialTeamId,
          deadline: params.deadline,
        },
        CREATE_SIGNED_OUT_ERROR,
      );

      return league;
    } catch (error) {
      console.error("Error creating league:", error);
      throw error;
    }
  };

  static getLeagueDeadlineBounds = async (): Promise<LeagueDeadlineBounds> => {
    try {
      return await callFunction<LeagueDeadlineBounds>(
        "getLeagueDeadlineBounds",
        {},
        CREATE_SIGNED_OUT_ERROR,
      );
    } catch (error) {
      console.error("Error fetching league deadline bounds:", error);
      throw error;
    }
  };

  // The server creates the team and joins it to the league in one transaction,
  // so on failure nothing has been written and there is no team to clean up.
  static joinLeague = async (
    leagueId: string,
    team: JoinLeagueTeamModel,
  ): Promise<LeagueTeamInfo> => {
    try {
      const response = await callFunction<{
        league: League;
        team: JoinedTeamResponse;
      }>(
        "joinLeague",
        {
          leagueId,
          teamName: team.teamName,
          abbreviation: team.abbreviation,
          logoUrl: team.logoUrl,
        },
        JOIN_SIGNED_OUT_ERROR,
      );

      return {
        league: response.league,
        team: {
          ...response.team,
          lineup: defaultTeam.lineup,
          bench: defaultTeam.bench,
          record: defaultTeam.record,
        },
      };
    } catch (error) {
      console.error("Join league error:", error);
      throw error;
    }
  };

  static updateLeague = async (
    leagueId: string,
    params: LeagueUpdateModel,
  ): Promise<League> => {
    try {
      const { league } = await callFunction<{ league: League }>(
        "updateLeague",
        {
          leagueId,
          name: params.name,
          numberOfTeams: params.numberOfTeams,
          budget: params.budget,
          deadline: params.deadline,
        },
        UPDATE_SIGNED_OUT_ERROR,
      );

      return league;
    } catch (error) {
      console.error("Error updating league:", error);
      throw error;
    }
  };

  static deleteLeague = async (leagueId: string): Promise<void> => {
    try {
      await callFunction<{ leagueId: string }>(
        "deleteLeague",
        { leagueId },
        DELETE_SIGNED_OUT_ERROR,
      );
    } catch (error) {
      console.error("Error deleting league:", error);
      throw error;
    }
  };
}
