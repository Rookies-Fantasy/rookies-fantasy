import * as functions from "firebase-functions/v1";
import { calculateFantasyPoints } from "../scoring/fantasyPoints";
import { getLineupSnapshot } from "../scoring/lineupSnapshot";
import { admin } from "../shared/admin";
import { fetchAllPagesFromUrl } from "../shared/balldontlie";
import { commitIfNeeded } from "../shared/batch";
import { formatDate, getThisMondayString } from "../shared/dates";

export const updateDailyPlayerData = functions
  .runWith({ secrets: ["BALLDONTLIE_API_KEY"] })
  .pubsub.schedule("0 1 * * *") // runs every day at 1:00 AM PDT
  .timeZone("America/Los_Angeles")
  .onRun(async () => {
    const apiKey = process.env.BALLDONTLIE_API_KEY;

    const now = new Date();
    const pacificNow = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
    );

    // ===================================
    // ====== FETCH SEASON AVERAGES ======
    // ===================================
    const month = pacificNow.getMonth() + 1; // 1–12
    let seasonYear: number;

    // If month >= July (7), season starts that year.
    // Otherwise it's still the previous year's season.
    if (month >= 7) {
      seasonYear = pacificNow.getFullYear();
    } else {
      seasonYear = pacificNow.getFullYear() - 1;
    }

    const seasonUrl = `https://api.balldontlie.io/nba/v1/season_averages/general?season=${seasonYear}&season_type=regular&type=base`;

    const seasonData = await fetchAllPagesFromUrl(seasonUrl, apiKey);

    const seasonAverages = seasonData.map((entry: any) => {
      const s = entry.stats;
      const p = entry.player;

      return {
        assists: s.ast,
        blocks: s.blk,
        fantasyPoints: calculateFantasyPoints(s),
        fieldGoalPercentage: s.fg_pct,
        fieldGoalsAttempted: s.fga,
        fieldGoalsMade: s.fgm,
        freeThrowPercentage: s.ft_pct,
        freeThrowsAttempted: s.fta,
        freeThrowsMade: s.ftm,
        minutes: s.min,
        playerId: String(p.id),
        points: s.pts,
        rebounds: s.reb,
        steals: s.stl,
        threePointerPercentage: s.fg3_pct,
        threePointersAttempted: s.fg3a,
        threePointersMade: s.fg3m,
        turnovers: s.tov ?? 0,
      };
    });

    // =======================================
    // ====== FETCH DAILY GAMELOG STATS ======
    // =======================================
    // Subtract 1 day to get "yesterday" in PDT
    pacificNow.setDate(pacificNow.getDate() - 1);

    const yyyy = pacificNow.getFullYear();
    const mm = String(pacificNow.getMonth() + 1).padStart(2, "0");
    const dd = String(pacificNow.getDate()).padStart(2, "0");
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    const gamelogUrl = `https://api.balldontlie.io/v1/stats?dates[]=${formattedDate}`;

    const gamelogData = await fetchAllPagesFromUrl(gamelogUrl, apiKey);

    const playerGamelogs = gamelogData.map((gamelog: any) => {
      const gamelogForFPTS = { ...gamelog, tov: gamelog.turnover ?? 0 };

      return {
        assists: gamelog.ast,
        blocks: gamelog.blk,
        date: gamelog.game.date,
        fantasyPoints: calculateFantasyPoints(gamelogForFPTS),
        fieldGoalPercentage: gamelog.fg_pct,
        fieldGoalsAttempted: gamelog.fga,
        fieldGoalsMade: gamelog.fgm,
        freeThrowPerfectange: gamelog.ft_pct,
        freeThrowsAttempted: gamelog.fta,
        freeThrowsMade: gamelog.ftm,
        gameId: gamelog.game.id,
        homeTeamId: gamelog.game.home_team_id,
        minutes: gamelog.min,
        personalFouls: gamelog.pf,
        playerId: String(gamelog.player.id),
        points: gamelog.pts,
        rebounds: gamelog.reb,
        steals: gamelog.stl,
        teamId: gamelog.team.id,
        threePointerPercentage: gamelog.fg3_pct,
        threePointersAttempted: gamelog.fg3a,
        threePointersMade: gamelog.fg3m,
        turnovers: gamelog.turnover ?? 0,
        visitorTeamId: gamelog.game.visitor_team_id,
        player: gamelog.player,
        team: gamelog.team,
        game: gamelog.game,
      };
    });

    // Initialize batching
    let batch = admin.firestore().batch();
    let opCount = 0;
    const BATCH_LIMIT = 400;

    const seasonAvgMap: Record<string, any> = {};
    for (const avg of seasonAverages) {
      const { playerId, ...statsWithoutId } = avg;
      seasonAvgMap[playerId] = statsWithoutId;
    }

    const gamelogMap: Record<string, any> = {};
    for (const gamelog of playerGamelogs) {
      const { playerId, ...gamelogWithoutId } = gamelog;
      gamelogMap[playerId] = gamelogWithoutId;
    }

    console.log("Season map size:", Object.keys(seasonAvgMap).length);
    console.log("Gamelog map size:", Object.keys(gamelogMap).length);

    // === UPDATE NBA PLAYERS COLLECTION ===
    for (const gamelog of playerGamelogs) {
      const playerQuery = await admin
        .firestore()
        .collection("nbaPlayers")
        .where("playerId", "==", gamelog.playerId)
        .limit(1)
        .get();

      if (playerQuery.empty) {
        console.warn(
          `Player not found in Firestore for id: ${gamelog.playerId}`,
        );
        continue;
      }

      const playerDocRef = playerQuery.docs[0].ref;

      const updateObj: any = {
        gamelog: admin.firestore.FieldValue.arrayUnion(gamelog),
      };

      const latestAvg = seasonAvgMap[String(gamelog.playerId)];
      if (latestAvg) {
        updateObj.averageStats = latestAvg;
      }

      console.log("Writing nbaPlayer update:", {
        docId: playerDocRef.id,
        playerId: gamelog.playerId,
      });

      batch.update(playerDocRef, updateObj);

      opCount++;
      const result = await commitIfNeeded(batch, opCount, BATCH_LIMIT);
      batch = result.batch;
      opCount = result.count;
    }

    // === UPDATE MATCHUPS COLLECTION ===
    const weekStartDate = getThisMondayString();
    const today = formatDate(new Date());
    const matchupSnapshot = await admin
      .firestore()
      .collection("matchups")
      .where("weekStart", "==", weekStartDate)
      .get();

    for (const matchupDoc of matchupSnapshot.docs) {
      const matchupData = matchupDoc.data();

      // Save the current state of the lineups and players to the history. These are immutable snapshots
      const awayAugment = matchupData.awayTeamSnapshot?.augmentSnapshot;
      const homeAugment = matchupData.homeTeamSnapshot?.augmentSnapshot;

      const [homeTeamDoc, awayTeamDoc] = await Promise.all([
        admin
          .firestore()
          .doc(
            `users/${matchupData.homeUserId}/teams/${matchupData.homeTeamId}`,
          )
          .get(),
        admin
          .firestore()
          .doc(
            `users/${matchupData.awayUserId}/teams/${matchupData.awayTeamId}`,
          )
          .get(),
      ]);

      const homeLineup = homeTeamDoc.exists ? homeTeamDoc.data()?.lineup : {};
      const awayLineup = awayTeamDoc.exists ? awayTeamDoc.data()?.lineup : {};

      console.log("Processing matchup with augments:", {
        docId: matchupDoc.id,
        awayAugment: awayAugment?.title,
        homeAugment: homeAugment?.title,
      });

      const awayLineupSnapshotsField = `awayLineupSnapshots.${today}`;
      const homeLineupSnapshotsField = `homeLineupSnapshots.${today}`;

      batch.set(
        matchupDoc.ref,
        {
          [awayLineupSnapshotsField]: getLineupSnapshot(
            awayLineup,
            gamelogMap,
            awayAugment,
          ),
          [homeLineupSnapshotsField]: getLineupSnapshot(
            homeLineup,
            gamelogMap,
            homeAugment,
          ),
        },
        { merge: true },
      );

      const result = await commitIfNeeded(batch, opCount, BATCH_LIMIT);
      batch = result.batch;
      opCount = result.count;
    }

    if (opCount > 0) {
      console.log("Final commit with remaining operations:", opCount);
      try {
        await batch.commit();
        console.log("Final batch commit SUCCESS");
      } catch (err) {
        console.error("Final batch commit FAILED:", err);
      }
    }

    console.log("=== Finished updateDailyPlayerData job ===");
  });
