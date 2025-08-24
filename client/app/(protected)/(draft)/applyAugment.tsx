import { router } from "expo-router";
import { ArrowLeft, CheckCircle } from "phosphor-react-native";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  ImageBackground,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Button from "@/components/Button";
import HelpDialogButton from "@/components/HelpDialogButton";
import Screen from "@/components/Screen";
import { AugmentController } from "@/controllers/augmentController";
import { UserController } from "@/controllers/userController";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { setAugmentId } from "@/state/slices/teamSlice";
import { Augment } from "@/types/augment";

// TODO: Once migrated to S3 blob storage, remove this hardcoded mapping and use the actual URLs from the API.
const iconMap: Record<string, any> = {
  "all-around-contributors.png": require("@/assets/images/augments/all-around-contributors.png"),
  "all-star-pedigree.png": require("@/assets/images/augments/all-star-pedigree.png"),
  "assist-leaders.png": require("@/assets/images/augments/assist-leaders.png"),
  "balanced-attack.png": require("@/assets/images/augments/balanced-attack.png"),
  "backcourt-bombers.png": require("@/assets/images/augments/backcourt-bombers.png"),
  "block-party.png": require("@/assets/images/augments/block-party.png"),
  "board-lords.png": require("@/assets/images/augments/board-lords.png"),
  "clutch-scorers.png": require("@/assets/images/augments/clutch-scorers.png"),
  "consistency-counts.png": require("@/assets/images/augments/consistency-counts.png"),
  "deep-threat.png": require("@/assets/images/augments/deep-threat.png"),
  "defensive-backbone.png": require("@/assets/images/augments/defensive-backbone.png"),
  "defensive-identity.png": require("@/assets/images/augments/defensive-identity.png"),
  "defensive-mindset.png": require("@/assets/images/augments/defensive-mindset.png"),
  "defensive-specialists.png": require("@/assets/images/augments/defensive-specialists.png"),
  "efficiency-experts.png": require("@/assets/images/augments/efficiency-experts.png"),
  "fast-pace.png": require("@/assets/images/augments/fast-pace.png"),
  "floor-general.png": require("@/assets/images/augments/floor-general.png"),
  "free-throw-specialists.png": require("@/assets/images/augments/free-throw-specialists.png"),
  "frontcourt-focus.png": require("@/assets/images/augments/frontcourt-focus.png"),
  "hustle-squad.png": require("@/assets/images/augments/hustle-squad.png"),
  "iron-man.png": require("@/assets/images/augments/iron-man.png"),
  "low-turnover-crew.png": require("@/assets/images/augments/low-turnover-crew.png"),
  "positionless-basketball.png": require("@/assets/images/augments/positionless-basketball.png"),
  "pure-playmaking.png": require("@/assets/images/augments/pure-playmaking.png"),
  "rebound-kings.png": require("@/assets/images/augments/rebound-kings.png"),
  "rookie-showcase.png": require("@/assets/images/augments/rookie-showcase.png"),
  "scoring-machine.png": require("@/assets/images/augments/scoring-machine.png"),
  "shot-blockers.png": require("@/assets/images/augments/shot-blockers.png"),
  "twin-towers.png": require("@/assets/images/augments/twin-towers.png"),
  "two-way-threat.png": require("@/assets/images/augments/two-way-threat.png"),
  "two-way-wings.png": require("@/assets/images/augments/two-way-wings.png"),
  "underdog-heroes.png": require("@/assets/images/augments/underdog-heroes.png"),
  "underrated-gems.png": require("@/assets/images/augments/underrated-gems.png"),
  "volume-gunner.png": require("@/assets/images/augments/volume-gunner.png"),
};

const ApplyAugment = () => {
  const userId = useAppSelector((state) => state.user.id);
  const teamId = useAppSelector((state) => state.team.id);
  const augmentId = useAppSelector((state) => state.team.augmentId);
  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedAugmentId, setSelectedAugmentId] = useState<
    string | undefined
  >(augmentId);
  const [augments, setAugments] = useState<Augment[]>([]);

  useEffect(() => {
    const fetchAugments = async () => {
      try {
        setIsLoading(true);
        const data = await AugmentController.getAugments();

        // Shuffle the array and take the first 4
        // TODO: Replace this random selection logic with a more meaningful selection process that persists weekly in the backend.
        // Look into a shuffle algorithm to use, such as the Fisher-Yates (aka Knuth) algorithm.
        const shuffled = data.sort(() => 0.5 - Math.random());
        const randomFour = shuffled.slice(0, 4);

        setAugments(randomFour);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load augments:", error);
      }
    };

    fetchAugments();
  }, []);

  const handleUpdateTeamAugment = async (augmentId?: string) => {
    setIsLoading(true);
    try {
      await UserController.editUserTeam(userId, teamId, { augmentId });
      dispatch(setAugmentId(augmentId));

      router.replace("/(protected)/(tabs)");
    } catch (error) {
      console.error("Failed to set augmentId:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen>
      <View className="mt-8 flex-1 flex-col px-6">
        <View className="mb-4 flex-row items-center gap-4">
          <Pressable
            className="size-8 items-center justify-center rounded-md border border-gray-900"
            onPress={() => router.back()}
          >
            <ArrowLeft color="white" size={20} weight="bold" />
          </Pressable>
          <Text className="pbk-h5 text-base-white">Select an augment</Text>
          <HelpDialogButton title="What are Augments?">
            <View>
              <Text className="pbk-b2 text-gray-500">
                Augments are strategic bonuses that reward how you build your
                team.
              </Text>
              <Text className="pbk-b2 mt-4 text-gray-500">
                Each Augment comes with a unique condition. When certain players
                on your roster meet that condition, only those players get a
                boost to their stats.
              </Text>
              <Text className="pbk-b2 mt-4 text-gray-500">
                Whether you&apos;re stacking sharpshooters, loading up on
                defenders, or betting on underdogs, Augments let you shape your
                playstyle and gain a competitive edge.
              </Text>
            </View>
            <View className="mt-3 rounded-md bg-gray-900 p-3">
              <Text className="pbk-b2 text-center text-base-white">
                Example
              </Text>
              <Text className="pbk-b2 mt-3 text-base-white">
                The “Deep Threat” Augment gives a +15% Points boost to players
                shooting 40%+ from three — but only if you have 3 such players
                on your team.
              </Text>
            </View>
          </HelpDialogButton>
        </View>
        <ScrollView className="p-2">
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {augments.map((card) => {
              const isSelected = selectedAugmentId === card.id;
              return (
                <View
                  className="relative mb-4 w-[48%] rounded-xl"
                  key={card.id}
                >
                  {isSelected && (
                    <LinearGradient
                      colors={[
                        "#CCE8FE",
                        "#CDA0FF",
                        "#8489F5",
                        "#CDF1FF",
                        "#B591E9",
                      ]}
                      end={{ x: 1, y: 1 }}
                      start={{ x: 0, y: 0 }}
                      style={{
                        position: "absolute",
                        top: -3,
                        right: -3,
                        bottom: -3,
                        left: -3,
                        borderRadius: 12,
                      }}
                    />
                  )}

                  <Pressable
                    className="flex-1 overflow-hidden rounded-xl"
                    onPress={() => setSelectedAugmentId(card.id)}
                  >
                    <ImageBackground
                      className="flex-1 overflow-hidden rounded-xl px-3 py-4"
                      resizeMode="cover"
                      source={require("@/assets/images/augments/background-image.png")}
                    >
                      <View className="flex-1 justify-between">
                        <View>
                          <Text className="pbk-b1 mb-2 text-center text-base-white">
                            {card.title}
                          </Text>
                          <Image
                            className="mb-4 h-24 w-24 self-center rounded-xl"
                            resizeMode="cover"
                            source={iconMap[card.iconUrl]}
                          />
                          <Text className="pbk-b3 text-center text-base-white">
                            {card.description}
                          </Text>
                          <Text className="pbk-b3 mt-2 text-center text-green-400">
                            {card.info}
                          </Text>
                        </View>
                        <View
                          className="flex-row justify-end"
                          style={{ opacity: isSelected ? 1 : 0 }}
                        >
                          <CheckCircle color="white" size={20} weight="bold" />
                        </View>
                      </View>
                    </ImageBackground>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
      <View className="justify-end gap-2 bg-gray-950 px-6">
        <Button
          disabled={!selectedAugmentId}
          isLoading={isLoading}
          label="Confirm Selection"
          onPress={() => handleUpdateTeamAugment(selectedAugmentId)}
        />
      </View>
    </Screen>
  );
};

export default ApplyAugment;
