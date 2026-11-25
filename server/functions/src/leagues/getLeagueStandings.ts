import * as functions from "firebase-functions/v1";
import { admin } from "../shared/admin";
import {
  LEAGUE_COLLECTION,
  readLeagueDocument,
  TEAM_SUBCOLLECTION,
  USER_COLLECTION,
} from "./leagueDocuments";
import { EMPTY_PAYLOAD, type LeagueStandingTeam } from "./types";
import {
  isLeagueMember,
  toLeagueTeamRefs,
  toStandingTeam,
  validateLeagueId,
} from "./validation";

// Returns the standings-relevant data for every team in a league.
export const getLeagueStandings = functions.https.onRequest(
  async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).send("Unauthorized");
      return;
    }

    const idToken = authHeader.split("Bearer ")[1];
    let uid: string;
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      res.status(401).send("Unauthorized");
      return;
    }

    const rawLeagueId = req.query.leagueId;
    const validation = validateLeagueId(
      typeof rawLeagueId === "string" ? rawLeagueId : "",
    );

    if (!validation.valid) {
      res.status(400).send(validation.message);
      return;
    }

    try {
      const db = admin.firestore();
      const leagueSnapshot = await db
        .collection(LEAGUE_COLLECTION)
        .doc(validation.input)
        .get();

      const league = readLeagueDocument(leagueSnapshot);

      if (league === null) {
        res.status(404).send("League not found");
        return;
      }

      // Only members of the league may view its standings.
      if (!isLeagueMember(league, uid)) {
        res.status(403).send("Forbidden");
        return;
      }

      // Each team is read from the member who registered it, so a team doc
      // another user created under a league team's id is never included.
      const teamRefs = toLeagueTeamRefs(league).map(({ teamId, ownerId }) =>
        db
          .collection(USER_COLLECTION)
          .doc(ownerId)
          .collection(TEAM_SUBCOLLECTION)
          .doc(teamId),
      );

      const snapshots =
        teamRefs.length === 0 ? [] : await db.getAll(...teamRefs);

      const teams: LeagueStandingTeam[] = snapshots.flatMap((snapshot) =>
        snapshot.exists
          ? [toStandingTeam(snapshot.id, snapshot.data() ?? EMPTY_PAYLOAD)]
          : [],
      );

      res.json({ teams });
    } catch (err) {
      console.error("Error fetching league standings:", err);
      res.status(500).json({ error: "Failed to fetch standings" });
    }
  },
);
