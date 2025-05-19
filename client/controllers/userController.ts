import firestore from "@react-native-firebase/firestore";
import { defaultTeam, Team } from "@/types/teamTypes";
import { defaultUser, User } from "@/types/userTypes";

const USERS_COLLECTION = "users";
const TEAMS_COLLECTION = "teams";

export type UserEditModel = {
  avatarUrl: string;
  dateOfBirth: Date;
  name: string;
  username: string;
};

export type TeamEditModel = {
  abbreviation: string;
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

      return user.exists
        ? {
            avatarUrl: user.data()?.avatarUrl,
            dateOfBirth: user.data()?.dateOfBirth?.toDate()?.toISOString(),
            email: user.data()?.email,
            id: user.id,
            name: user.data()?.name,
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

      return team.exists
        ? {
            abbreviation: team.data()?.abbreviation,
            id: team.id,
            logoUrl: team.data()?.logoUrl,
            name: team.data()?.name,
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
}
