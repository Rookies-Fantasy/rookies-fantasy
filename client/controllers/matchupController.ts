import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { Augment } from "@/types/augment";
import { Matchup, TeamSnapshot } from "@/types/matchup";

const MATCHUPS_COLLECTION = "matchups";

type FirestoreAugment = Omit<Augment, "createdAt" | "updatedAt"> & {
  createdAt?: FirebaseFirestoreTypes.Timestamp;
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
};

type FirestoreTeamSnapshot = Omit<TeamSnapshot, "augmentSnapshot"> & {
  augmentSnapshot?: FirestoreAugment;
};

type FirestoreMatchup = Omit<
  Matchup,
  "createdAt" | "updatedAt" | "homeTeamSnapshot" | "awayTeamSnapshot"
> & {
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
  homeTeamSnapshot: FirestoreTeamSnapshot;
  awayTeamSnapshot: FirestoreTeamSnapshot;
};

const serializeAugment = (augment: FirestoreAugment): Augment => {
  const { createdAt, updatedAt, ...data } = augment;

  return {
    ...data,
    ...(createdAt ? { createdAt: createdAt.toDate().toISOString() } : {}),
    ...(updatedAt ? { updatedAt: updatedAt.toDate().toISOString() } : {}),
  };
};

const serializeTeamSnapshot = (
  snapshot: FirestoreTeamSnapshot,
): TeamSnapshot => {
  const { augmentSnapshot, ...data } = snapshot;

  return {
    ...data,
    ...(augmentSnapshot
      ? { augmentSnapshot: serializeAugment(augmentSnapshot) }
      : {}),
  };
};

export class MatchupController {
  static getUserMatchup = async (userId: string): Promise<Matchup | null> => {
    try {
      const [homeMatchups, awayMatchups] = await Promise.all([
        firestore()
          .collection(MATCHUPS_COLLECTION)
          .where("homeUserId", "==", userId)
          .where("status", "==", "active")
          .limit(1)
          .get(),
        firestore()
          .collection(MATCHUPS_COLLECTION)
          .where("awayUserId", "==", userId)
          .where("status", "==", "active")
          .limit(1)
          .get(),
      ]);

      const matchups = homeMatchups.empty ? awayMatchups : homeMatchups;

      if (matchups.empty) {
        return null;
      }

      const matchup = matchups.docs[0].data() as FirestoreMatchup;

      const {
        createdAt,
        updatedAt,
        homeTeamSnapshot,
        awayTeamSnapshot,
        ...data
      } = matchup;

      return {
        ...data,
        createdAt: createdAt.toDate().toISOString(),
        ...(updatedAt ? { updatedAt: updatedAt.toDate().toISOString() } : {}),
        homeTeamSnapshot: serializeTeamSnapshot(homeTeamSnapshot),
        awayTeamSnapshot: serializeTeamSnapshot(awayTeamSnapshot),
      };
    } catch (error) {
      console.error("Error fetching user matchup:", error);
      throw error;
    }
  };
}
