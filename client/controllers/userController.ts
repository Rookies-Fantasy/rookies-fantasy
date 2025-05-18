import firestore from "@react-native-firebase/firestore";

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
  static getUser = async (userId: string) => {
    try {
      const userDoc = await firestore()
        .collection(USERS_COLLECTION)
        .doc(userId)
        .get();
      return userDoc.exists ? userDoc.data() : undefined;
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

  static addUserTeam = async (userId: string, params: TeamEditModel) => {
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

  static getUserTeam = async (userId: string, teamId: string) => {
    try {
      const teamDoc = await firestore()
        .collection(USERS_COLLECTION)
        .doc(userId)
        .collection(TEAMS_COLLECTION)
        .doc(teamId)
        .get();

      return teamDoc.exists ? { id: teamDoc.id, ...teamDoc.data() } : undefined;
    } catch (error) {
      throw error;
    }
  };

  static getUserTeams = async (userId: string) => {
    try {
      const teamsSnapshot = await firestore()
        .collection(USERS_COLLECTION)
        .doc(userId)
        .collection(TEAMS_COLLECTION)
        .get();

      return teamsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
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
