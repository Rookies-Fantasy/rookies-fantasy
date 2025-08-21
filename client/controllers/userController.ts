import firestore from "@react-native-firebase/firestore";
import { defaultTeam, Team, TEAM_BALANCE } from "@/types/team";
import { defaultUser, User } from "@/types/user";

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
  augmentId?: string;
  logoUrl: string;
  name: string;
};

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
            augmentId: team.data()?.augmentId,
            id: team.id,
            logoUrl: team.data()?.logoUrl,
            name: team.data()?.name,
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
        balance: team.data()?.balance,
      }));
    } catch (error) {
      throw error;
    }
  };

  static editUserTeam = async (
    userId: string,
    teamId: string,
    params: Partial<TeamEditModel>,
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
}
