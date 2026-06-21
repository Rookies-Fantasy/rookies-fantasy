import firestore from "@react-native-firebase/firestore";
import { Augment } from "@/types/augment";
import { defaultTeam, TeamLineupSlot, Team, TEAM_BALANCE } from "@/types/team";
import { defaultUser, User } from "@/types/user";

const USERS_COLLECTION = "users";
const TEAMS_COLLECTION = "teams";
const AUGMENT_COLLECTION = "augments";

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
  isLeagueTeam?: boolean;
  balance?: number;
};

export type LineupUpdateModel = Partial<{
  lineup: TeamLineupSlot[];
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
            queueStatus: user.data()?.queueStatus ?? "idle",
            queuedAt: user.data()?.queuedAt?.toDate()?.toISOString(),
            currentMatchupId: user.data()?.currentMatchupId,
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
          balance: params.balance ?? TEAM_BALANCE,
          isLeagueTeam: params.isLeagueTeam ?? false,
          record: {
            wins: 0,
            losses: 0,
            draws: 0,
          },
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

      const augmentId = team.data()?.augmentId;
      const augmentDoc = augmentId
        ? await firestore().collection(AUGMENT_COLLECTION).doc(augmentId).get()
        : null;
      const augmentData = augmentDoc?.data();
      const augment: Augment | undefined =
        augmentDoc?.exists() && augmentData
          ? {
              ...(augmentData as Omit<
                Augment,
                "id" | "createdAt" | "updatedAt"
              >),
              id: augmentDoc.id,
              createdAt: augmentData.createdAt?.toDate?.()?.toISOString(),
              updatedAt: augmentData.updatedAt?.toDate?.()?.toISOString(),
            }
          : undefined;

      return team.exists()
        ? {
            abbreviation: team.data()?.abbreviation,
            augment,
            augmentId,
            id: team.id,
            logoUrl: team.data()?.logoUrl,
            name: team.data()?.name,
            lineup: team.data()?.lineup ?? defaultTeam.lineup,
            bench: team.data()?.bench ?? defaultTeam.bench,
            balance: team.data()?.balance ?? 0,
            record: team.data()?.record ?? defaultTeam.record,
            isLeagueTeam: team.data()?.isLeagueTeam ?? false,
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
        augmentId: team.data()?.augmentId,
        id: team.id,
        logoUrl: team.data()?.logoUrl,
        name: team.data()?.name,
        lineup: team.data()?.lineup ?? defaultTeam.lineup,
        bench: team.data()?.bench ?? defaultTeam.bench,
        balance: team.data()?.balance ?? TEAM_BALANCE,
        record: team.data()?.record ?? defaultTeam.record,
        isLeagueTeam: team.data()?.isLeagueTeam ?? false,
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
  ): Promise<{ lineup: TeamLineupSlot[]; balance: number }> => {
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

  static joinQueue = async (userId: string, teamId: string) => {
    try {
      await firestore().collection(USERS_COLLECTION).doc(userId).update({
        queueStatus: "queued",
        queuedAt: new Date(),
        teamId: teamId,
        updatedAt: new Date(),
      });
    } catch (error) {
      throw error;
    }
  };

  static leaveQueue = async (userId: string) => {
    try {
      await firestore().collection(USERS_COLLECTION).doc(userId).update({
        queueStatus: "idle",
        queuedAt: firestore.FieldValue.delete(),
        teamId: firestore.FieldValue.delete(),
        updatedAt: new Date(),
      });
    } catch (error) {
      throw error;
    }
  };

  static subscribeToUser = (
    userId: string,
    callback: (user: User | null) => void,
  ) =>
    firestore()
      .collection(USERS_COLLECTION)
      .doc(userId)
      .onSnapshot(
        (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            if (data) {
              callback({
                avatarUrl: data.avatarUrl,
                dateOfBirth: data.dateOfBirth?.toDate()?.toISOString(),
                email: data.email,
                emailVerified: data.emailVerified ?? false,
                id: doc.id,
                username: data.username,
                queueStatus: data.queueStatus ?? "idle",
                queuedAt: data.queuedAt?.toDate()?.toISOString(),
                currentMatchupId: data.currentMatchupId,
              });
            }
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error("User subscription error:", error);
          callback(null);
        },
      );
}
