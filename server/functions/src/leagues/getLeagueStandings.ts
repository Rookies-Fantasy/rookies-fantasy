import * as functions from "firebase-functions/v1";
import { admin, FieldPath } from "../shared/admin";
import {
  LEAGUE_COLLECTION,
  readLeagueDocument,
  TEAM_SUBCOLLECTION,
  USER_COLLECTION,
} from "./leagueDocuments";
import { type LeagueStandingTeam, MAX_TEAMS } from "./types";
import { isLeagueMember, toStandingTeam, validateLeagueId } from "./validation";

const dedupe = (values: string[]): string[] => Array.from(new Set(values));

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

      const teamIds = dedupe(league.teamIds).slice(0, MAX_TEAMS);
      const memberIds = dedupe(league.userIds).slice(0, MAX_TEAMS);

      const snapshots =
        teamIds.length === 0
          ? []
          : await Promise.all(
              memberIds.map((memberId) =>
                db
                  .collection(USER_COLLECTION)
                  .doc(memberId)
                  .collection(TEAM_SUBCOLLECTION)
                  .where(FieldPath.documentId(), "in", teamIds)
                  .get(),
              ),
            );

      const teams: LeagueStandingTeam[] = snapshots.flatMap((snapshot) =>
        snapshot.docs.map((doc) => toStandingTeam(doc.id, doc.data())),
      );

      res.json({ teams });
    } catch (err) {
      console.error("Error fetching league standings:", err);
      res.status(500).json({ error: "Failed to fetch standings" });
    }
  },
);
