import { router } from "expo-router";
import { ArrowLeft } from "phosphor-react-native";
import { useEffect, useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Text,
  Keyboard,
  Pressable,
  ScrollView,
  Image,
  ImageBackground,
} from "react-native";
import Button from "@/components/Button";
import HelpModalButton from "@/components/HelpModalButton";
import { AugmentController } from "@/controllers/augmentController";
import { Augment } from "@/types/augmentTypes";

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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAugmentId, setSelectedAugmentId] = useState<string>();
  const [augments, setAugments] = useState<Augment[]>([]);

  useEffect(() => {
    const fetchAugments = async () => {
      try {
        setIsLoading(true);
        const data = await AugmentController.getAugments();

        // Shuffle the array and take the first 4
        // TODO: Replace this random selection logic with a more meaningful selection process that persists weekly in the backend.
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

  return (
    <View className="flex-1 bg-gray-950">
      <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        <View className="flex-1">
          <KeyboardAvoidingView behavior="padding" className="flex-1">
            <View className="flex-1 flex-col px-6 py-4">
              <View className="mb-4 mt-20 flex-row items-center gap-4">
                <Pressable
                  className="size-8 items-center justify-center rounded-md border border-gray-900"
                  onPress={() => router.back()}
                >
                  <ArrowLeft color="white" size={20} weight="bold" />
                </Pressable>
                <Text className="pbk-h5 text-base-white">
                  Select one augment
                </Text>
                <HelpModalButton title="What are Augments?">
                  <Text className="pbk-b2 text-gray-500">
                    {`Augments are strategic bonuses that reward how you build your team.\n\nEach Augment comes with a unique condition. When certain players on your roster meet that condition, only those players get a boost to their stats.\n\nWhether you're stacking sharpshooters, loading up on defenders, or betting on underdogs, Augments let you shape your playstyle and gain a competitive edge.`}
                  </Text>
                  <View className="mt-3 rounded-md bg-gray-900 p-3">
                    <Text className="pbk-b2 text-base-white">
                      {`Example\n\nThe “Deep Threat” Augment gives a +15% Points boost to players shooting 40%+ from three — but only if you have 3 such players on your team.`}
                    </Text>
                  </View>
                </HelpModalButton>
              </View>

              <ScrollView className="p-2">
                <View className="flex-row flex-wrap justify-between gap-y-4">
                  {augments.map((card) => (
                    <Pressable
                      className="w-[49%] overflow-hidden rounded-xl"
                      key={card.id}
                      onPress={() => setSelectedAugmentId(card.id)}
                    >
                      <ImageBackground
                        className="overflow-hidden rounded-xl px-3 py-4"
                        resizeMode="cover"
                        source={require("@/assets/images/augments/background-image.png")}
                      >
                        {selectedAugmentId === card.id && (
                          <View className="absolute -inset-1 z-20 rounded-xl border-8 border-purple-600" />
                        )}

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
                      </ImageBackground>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>

          <View className="mb-8 justify-end gap-2 bg-gray-950 px-6">
            <Button
              disabled={!selectedAugmentId}
              isLoading={isLoading}
              onPress={() => console.log("Confirmed")}
              text="Confirm Selection"
            />
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export default ApplyAugment;
