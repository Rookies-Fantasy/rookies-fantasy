import { useRouter } from "expo-router";
import { CaretDown, CaretUp, Check, Trophy } from "phosphor-react-native";
import { useCallback, useState } from "react";
import { Image, Modal, Pressable, Text, View } from "react-native";
import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import { PressableLink } from "@/components/PressableLink";
import {
  LeagueController,
  LeagueTeamInfo,
} from "@/controllers/leagueController";
import { UserController } from "@/controllers/userController";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  selectCurrentLeague,
  setCurrentLeague,
} from "@/state/slices/leagueSlice";
import { setTeam } from "@/state/slices/teamSlice";
import { selectUserId } from "@/state/slices/userSlice";
import { teamLogoOptions, defaultTeamLogo } from "@/types/asset";
import { Team } from "@/types/team";

type LeagueSwitcherProps = {
  className?: string;
};

const LeagueSwitcher = ({ className }: LeagueSwitcherProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectUserId);
  const currentLeague = useAppSelector(selectCurrentLeague);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [leagueTeams, setLeagueTeams] = useState<LeagueTeamInfo[]>([]);
  const [rankedTeam, setRankedTeam] = useState<Team | null>(null);

  const fetchLeagueTeams = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const allTeams = await UserController.getUserTeams(userId);

      if (!allTeams) {
        setLeagueTeams([]);
        setRankedTeam(null);
        return;
      }

      const leagueTeamsList = allTeams.filter((team) => team.isLeagueTeam);
      const rankedTeamData = allTeams.find((team) => !team.isLeagueTeam);

      setRankedTeam(rankedTeamData ?? null);

      if (leagueTeamsList.length > 0) {
        const teamIds = leagueTeamsList.map((team) => team.id);
        const teamToLeagueMap =
          await LeagueController.getLeaguesByTeamIds(teamIds);

        const leagueTeamInfos: LeagueTeamInfo[] = leagueTeamsList
          .filter((team) => teamToLeagueMap.has(team.id))
          .map((team) => ({
            team,
            league: teamToLeagueMap.get(team.id)!,
          }));

        setLeagueTeams(leagueTeamInfos);
      }
    } catch (error) {
      console.error("Error fetching league teams:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const getTeamLogoSource = (logoUrl?: string) => {
    const logo = teamLogoOptions.find((option) => option.url === logoUrl);
    return logo?.source ?? defaultTeamLogo.source;
  };

  const handleSelectRanked = async () => {
    if (rankedTeam && userId) {
      try {
        const teamData = await UserController.getUserTeam(
          userId,
          rankedTeam.id,
        );
        dispatch(setCurrentLeague(null));
        dispatch(setTeam(teamData));
      } catch (error) {
        console.error("Error fetching ranked team:", error);
      }
    }
    setIsOpen(false);
  };

  const handleSelectLeague = async (leagueTeamInfo: LeagueTeamInfo) => {
    console.log(leagueTeamInfo);
    dispatch(setCurrentLeague(leagueTeamInfo.league));
    dispatch(setTeam(leagueTeamInfo.team));
    setIsOpen(false);
  };

  const isRankedSelected = currentLeague === null;
  const displayName = currentLeague?.name ?? "Ranked";

  return (
    <>
      <Pressable
        className={`flex-row items-center justify-center gap-3 rounded-lg p-2 ${className}`}
        onPress={() => {
          if (!isLoading) {
            fetchLeagueTeams();
          }
          setIsOpen(true);
        }}
      >
        {isRankedSelected ? (
          <Trophy color="#6042FF" size={28} weight="fill" />
        ) : (
          <View className="h-8 w-8 items-center justify-center overflow-hidden rounded-full">
            {leagueTeams.find((lt) => lt.league.id === currentLeague?.id)?.team
              .logoUrl && (
              <Image
                className="h-full w-full"
                source={getTeamLogoSource(
                  leagueTeams.find((lt) => lt.league.id === currentLeague?.id)
                    ?.team.logoUrl,
                )}
              />
            )}
          </View>
        )}
        <Text className="pbk-h6 text-base-white">{displayName}</Text>
        {isOpen ? (
          <CaretDown color="white" size={20} weight="bold" />
        ) : (
          <CaretUp color="white" size={20} weight="bold" />
        )}
      </Pressable>

      <Modal
        animationType="none"
        onRequestClose={() => setIsOpen(false)}
        transparent
        visible={isOpen}
      >
        <BottomSheet
          header={
            <Text className="pbk-h5 px-4 text-base-white">Select Mode</Text>
          }
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          snapPoints={["50%"]}
        >
          <View className="flex-1 px-4">
            <Pressable
              className={`mb-2 flex-row items-center gap-4 rounded-xl p-4 ${
                isRankedSelected ? "bg-purple-900" : "bg-gray-900"
              }`}
              onPress={handleSelectRanked}
            >
              <View className="h-12 w-12 items-center justify-center rounded-full bg-purple-600/30">
                <Trophy color="#6042FF" size={24} weight="fill" />
              </View>
              <View className="flex-1">
                <Text className="pbk-b1 text-base-white">Ranked</Text>
                <Text className="pbk-b3 text-gray-400">
                  Global competitive mode
                </Text>
              </View>
              {isRankedSelected && (
                <Check color="#6042FF" size={24} weight="bold" />
              )}
            </Pressable>

            {isLoading ? (
              <View className="items-center justify-center py-8">
                <Text className="pbk-b2 text-gray-400">Loading leagues...</Text>
              </View>
            ) : (
              leagueTeams.map((leagueTeamInfo) => {
                const isSelected =
                  currentLeague?.id === leagueTeamInfo.league.id;
                return (
                  <Pressable
                    className={`mb-2 flex-row items-center gap-4 rounded-xl p-4 ${
                      isSelected ? "bg-purple-600/20" : "bg-gray-900"
                    }`}
                    key={leagueTeamInfo.league.id}
                    onPress={() => handleSelectLeague(leagueTeamInfo)}
                  >
                    <Image
                      className="h-12 w-12 rounded-full border border-gray-800"
                      source={getTeamLogoSource(leagueTeamInfo.team.logoUrl)}
                    />
                    <View className="flex-1">
                      <Text className="pbk-b1 text-base-white">
                        {leagueTeamInfo.league.name}
                      </Text>
                      <Text className="pbk-b3 text-gray-400">
                        {leagueTeamInfo.team.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <Check color="#6042FF" size={24} weight="bold" />
                    )}
                  </Pressable>
                );
              })
            )}

            {!isLoading && leagueTeams.length === 0 && (
              <View className="items-center justify-center py-4">
                <Text className="pbk-b2 text-center text-gray-400">
                  No leagues yet. Create or join a league to play with friends!
                </Text>
              </View>
            )}

            {!isLoading && (
              <View className="mt-14 gap-2">
                <Button
                  label="Create New League"
                  onPress={() => {
                    setIsOpen(false);
                    router.push("/(protected)/createLeague");
                  }}
                  variant="primary"
                />

                <PressableLink
                  className="min-h-12 w-full items-center justify-center rounded-md border border-gray-800 bg-gray-920"
                  href="/" // TODO: Update with join league route
                  label="Join League"
                />
              </View>
            )}
          </View>
        </BottomSheet>
      </Modal>
    </>
  );
};

export default LeagueSwitcher;
