import { BalldontlieAPI } from "@balldontlie/sdk";
import "dotenv/config";
import { db } from "./firebaseConfig.js";

const api = new BalldontlieAPI({ apiKey: process.env.BALLDONTLIE_API_KEY });

const populateNBATeams = async () => {
  try {
    const response = await api.nba.getTeams();

    const teams = response.data;

    if (!teams) {
      console.error("No teams to store.");
      return;
    }

    const filteredTeams = teams.filter(
      (team) => team.division && team.division.trim() !== ""
    );

    const normalizedTeams = filteredTeams.map((team) => ({
      id: team.id.toString(),
      abbreviation: team.abbreviation,
      city: team.city,
      conference: team.conference,
      division: team.division,
      fullName: team.full_name,
      name: team.name,
      state: "",
      logoUrl: "",
    }));

    console.log(normalizedTeams);

    const batch = db.batch();
    const teamsRef = db.collection("nbaTeams");

    normalizedTeams.forEach((team) => {
      const docRef = teamsRef.doc();

      batch.set(docRef, team);
    });

    await batch.commit();
    console.log(`Stored ${normalizedTeams.length} NBA teams in Firestore.`);
  } catch (error) {
    console.error("Error fetching/storing NBA teams:", error);
  }
};

populateNBATeams();
