import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Matchup } from "@/types/matchup";
import { GameInfo, GameStats } from "@/types/team";
import { applyAugmentEffects, validateAugment } from "@/utils/augmentUtils";
import { calculateFantasyPoints } from "@/utils/fantasyPoints";
import { isNil, isNotNil } from "@/utils/jsUtils";

type PlayerGameData = {
  gameInfo: GameInfo;
  gameStats: GameStats;
};

export type MatchupState = {
  data?: Matchup;
};

const defaultMatchup: MatchupState = {
  data: undefined,
};

const matchupSlice = createSlice({
  name: "matchup",
  initialState: defaultMatchup,
  reducers: {
    setMatchup: (state, action: PayloadAction<Matchup>) => {
      const matchup = action.payload;

      // Validate and compute qualifying players for each daily matchup
      Object.keys(matchup.dailyMatchups).forEach((date) => {
        const dailyMatchup = matchup.dailyMatchups[date];

        const homeValidation = validateAugment(
          matchup.home.homeAugment,
          dailyMatchup.homeTeam.lineup,
        );
        dailyMatchup.homeTeam.qualifyingPlayers =
          homeValidation.qualifyingPlayers;

        const awayValidation = validateAugment(
          matchup.away.awayAugment,
          dailyMatchup.awayTeam.lineup,
        );
        dailyMatchup.awayTeam.qualifyingPlayers =
          awayValidation.qualifyingPlayers;

        if (matchup.home.homeAugment) {
          matchup.home.homeAugment.isActive = homeValidation.isValid;
        }
        if (matchup.away.awayAugment) {
          matchup.away.awayAugment.isActive = awayValidation.isValid;
        }
      });

      state.data = matchup;
    },
    clearMatchup: () => defaultMatchup,
    updateMatchupWithLiveData: (
      state,
      action: PayloadAction<{
        date: string;
        updatedHome: Record<string, PlayerGameData | null>;
        updatedAway: Record<string, PlayerGameData | null>;
      }>,
    ) => {
      if (isNil(state.data)) {
        return;
      }

      const newMatchup = state.data.dailyMatchups[action.payload.date];

      newMatchup.homeTeam.lineup.forEach((o) => {
        if (isNotNil(o.player?.id)) {
          const newData = action.payload.updatedHome[o.player?.id];
          o.gameInfo = newData?.gameInfo;
          if (newData?.gameStats) {
            const baseFpts = calculateFantasyPoints(newData.gameStats);
            const augmentedFpts = applyAugmentEffects(
              baseFpts,
              newData.gameStats,
              o.player.id,
              newMatchup.homeTeam.qualifyingPlayers,
              state.data?.home.homeAugment,
            );
            o.gameStats = {
              ...newData.gameStats,
              fantasyPoints: augmentedFpts,
            };
          } else {
            o.gameStats = newData?.gameStats;
          }
        }
      });

      newMatchup.awayTeam.lineup.forEach((o) => {
        if (isNotNil(o.player?.id)) {
          const newData = action.payload.updatedAway[o.player?.id];
          o.gameInfo = newData?.gameInfo;
          if (newData?.gameStats) {
            const baseFpts = calculateFantasyPoints(newData.gameStats);
            const augmentedFpts = applyAugmentEffects(
              baseFpts,
              newData.gameStats,
              o.player.id,
              newMatchup.awayTeam.qualifyingPlayers,
              state.data?.away.awayAugment,
            );
            o.gameStats = {
              ...newData.gameStats,
              fantasyPoints: augmentedFpts,
            };
          } else {
            o.gameStats = newData?.gameStats;
          }
        }
      });

      const homeScore = newMatchup.homeTeam.lineup.reduce(
        (total, slot) => total + (slot.gameStats?.fantasyPoints ?? 0),
        0,
      );

      const awayScore = newMatchup.awayTeam.lineup.reduce(
        (total, slot) => total + (slot.gameStats?.fantasyPoints ?? 0),
        0,
      );

      newMatchup.homeTeam.score = homeScore;
      newMatchup.awayTeam.score = awayScore;

      state.data.dailyMatchups[action.payload.date] = newMatchup;
    },
  },
});

export const selectMatchup = (state: RootState) => state.matchup.data;
export const selectMatchupId = (state: RootState) => state.matchup.data?.id;
export const selectDailyMatchups = (state: RootState) =>
  state.matchup.data?.dailyMatchups;
export const selectAwayUserId = (state: RootState) =>
  state.matchup.data?.away.awayUserId;
export const selectHomeUserId = (state: RootState) =>
  state.matchup.data?.home.homeUserId;

export const { setMatchup, clearMatchup, updateMatchupWithLiveData } =
  matchupSlice.actions;

export default matchupSlice.reducer;
