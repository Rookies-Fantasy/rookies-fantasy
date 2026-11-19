import firestore from "@react-native-firebase/firestore";
import { NbaTeam } from "@/types/nbaTeams";

const NBA_TEAMS_COLLECTION = "nbaTeams";

export class NbaTeamsController {
  static getAllTeams = async (): Promise<NbaTeam[]> => {
    try {
      const teamsSnapshot = await firestore()
        .collection(NBA_TEAMS_COLLECTION)
        .orderBy("fullName")
        .get();

      return teamsSnapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          abbreviation: data.abbreviation,
          city: data.city,
          conference: data.conference,
          division: data.division,
          fullName: data.fullName,
          id: data.id,
          logoUrl: data.logoUrl,
          name: data.name,
          state: data.state,
        };
      });
    } catch (error) {
      throw error;
    }
  };
}
