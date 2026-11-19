import { router } from "expo-router";
import { ArrowLeft } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import AugmentCard from "@/components/AugmentCard";
import Button from "@/components/Button";
import HelpDialogButton from "@/components/HelpDialogButton";
import Screen from "@/components/Screen";
import { AugmentController } from "@/controllers/augmentController";
import { UserController } from "@/controllers/userController";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { setAugment } from "@/state/slices/teamSlice";
import { Augment } from "@/types/augment";

const ApplyAugment = () => {
  const userId = useAppSelector((state) => state.user.id);
  const teamId = useAppSelector((state) => state.team.id);
  const augment = useAppSelector((state) => state.team.augment);
  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedAugment, setSelectedAugment] = useState<Augment | undefined>(
    augment,
  );
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

  const handleUpdateTeamAugment = async (augment?: Augment) => {
    setIsLoading(true);
    try {
      await UserController.editUserTeam(userId, teamId, {
        augmentId: augment?.id,
      });
      dispatch(setAugment(augment));
    } catch (error) {
      console.error("Failed to set augment:", error);
    } finally {
      setIsLoading(false);
      router.push("/(protected)/(draft)/(teamBuilder)/roster");
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
                {`Whether you're stacking sharpshooters, loading up on
                  defenders, or betting on underdogs, augments let you shape your
                  playstyle and gain a competitive edge.`.replace(/\s+/g, " ")}
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
              const isSelected = selectedAugment?.id === card.id;
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

                  <AugmentCard
                    cardData={card}
                    isSelected={isSelected}
                    onPress={() => setSelectedAugment(card)}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
      <View className="justify-end gap-2 bg-gray-950 px-6">
        <Button
          disabled={!selectedAugment}
          isLoading={isLoading}
          label="Confirm Selection"
          onPress={() => handleUpdateTeamAugment(selectedAugment)}
        />
      </View>
    </Screen>
  );
};

export default ApplyAugment;
