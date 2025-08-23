import firestore from "@react-native-firebase/firestore";
import { defaultTeam, LineupSlot, Team, TEAM_BALANCE } from "@/types/teamTypes";
import { defaultUser, User } from "@/types/userTypes";

const USERS_COLLECTION = "users";
const TEAMS_COLLECTION = "teams";

export type UserEditModel = Partial<{
  avatarUrl: string;
  dateOfBirth: Date;
  emailVerified: boolean;
  username: string;
}>;

export type TeamEditModel = {
  abbreviation: string;
  logoUrl: string;
  name: string;
};

export type LineupUpdateModel = Partial<{
  lineup: LineupSlot[];
  balance: number;
}>;

export class UserController {
  static getUser = async (userId: string): Promise<User> => {
    try {
      const user = await firestore()
        .collection(USERS_COLLECTION)
        .doc(userId)
        .get();

      return user.exists()
        ? {
            avatarUrl: user.data()?.avatarUrl,
            dateOfBirth: user.data()?.dateOfBirth?.toDate()?.toISOString(),
            email: user.data()?.email,
            emailVerified: user.data()?.emailVerified ?? false,
            id: user.id,
            username: user.data()?.username,
          }
        : defaultUser;
    } catch (error) {
      throw error;
    }
  };

  static editUser = async (userId: string, params: UserEditModel) => {
    try {
      await firestore()
        .collection(USERS_COLLECTION)
        .doc(userId)
        .update({
          ...params,
          updatedAt: new Date(),
        });
    } catch (error) {
      throw error;
    }
  };

  static addUserTeam = async (
    userId: string,
    params: TeamEditModel,
  ): Promise<string> => {
    try {
      const teamRef = await firestore()
        .collection(USERS_COLLECTION)
        .doc(userId)
        .collection(TEAMS_COLLECTION)
        .add({
          ...params,
          balance: TEAM_BALANCE,
          createdAt: new Date(),
        });

      return teamRef.id;
    } catch (error) {
      throw error;
    }
  };

  static getUserTeam = async (
    userId: string,
    teamId: string,
  ): Promise<Team> => {
    try {
      const team = await firestore()
        .collection(USERS_COLLECTION)
        .doc(userId)
        .collection(TEAMS_COLLECTION)
        .doc(teamId)
        .get();

      return team.exists()
        ? {
            abbreviation: team.data()?.abbreviation,
            id: team.id,
            logoUrl: team.data()?.logoUrl,
            name: team.data()?.name,
            lineup: team.data()?.lineup ?? defaultTeam.lineup,
            bench: team.data()?.bench ?? defaultTeam.bench,
            balance: team.data()?.balance ?? 0,
          }
        : defaultTeam;
    } catch (error) {
      throw error;
    }
  };

  static getUserTeams = async (userId: string): Promise<Team[]> => {
    try {
      const teams = await firestore()
        .collection(USERS_COLLECTION)
        .doc(userId)
        .collection(TEAMS_COLLECTION)
        .get();

      return teams.docs.map((team) => ({
        abbreviation: team.data()?.abbreviation,
        id: team.id,
        logoUrl: team.data()?.logoUrl,
        name: team.data()?.name,
        lineup: team.data()?.lineup,
        bench: team.data()?.bench,
        balance: team.data()?.balance,
      }));
    } catch (error) {
      throw error;
    }
  };

  static editUserTeam = async (
    userId: string,
    teamId: string,
    params: TeamEditModel,
  ) => {
    try {
      await firestore()
        .collection(USERS_COLLECTION)
        .doc(userId)
        .collection(TEAMS_COLLECTION)
        .doc(teamId)
        .update({
          ...params,
          updatedAt: new Date(),
        });
    } catch (error) {
      throw error;
    }
  };

  static saveUserTeamLineup = async (
    userId: string,
    teamId: string,
    params: LineupUpdateModel,
  ) => {
    try {
      await firestore()
        .collection(USERS_COLLECTION)
        .doc(userId)
        .collection(TEAMS_COLLECTION)
        .doc(teamId)
        .update({
          ...params,
          updatedAt: new Date(),
        });
    } catch (error) {
      throw error;
    }
  };

  static getSavedTeamLineup = async (
    userId: string,
    teamId: string,
  ): Promise<{ lineup: LineupSlot[]; balance: number }> => {
    try {
      const team = await firestore()
        .collection(USERS_COLLECTION)
        .doc(userId)
        .collection(TEAMS_COLLECTION)
        .doc(teamId)
        .get();

      if (team.exists()) {
        return {
          lineup: team.data()?.lineup ?? defaultTeam.lineup,
          balance: team.data()?.balance ?? TEAM_BALANCE,
        };
      }

      return {
        lineup: defaultTeam.lineup,
        balance: TEAM_BALANCE,
      };
    } catch (error) {
      throw error;
    }
  };
}
