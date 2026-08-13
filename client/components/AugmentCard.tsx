import { CheckCircle } from "phosphor-react-native";
import { Pressable, ImageBackground, View, Text, Image } from "react-native";
import { Augment } from "@/types/augment";

// TODO: Once migrated to S3 blob storage, remove this hardcoded mapping and use the actual URLs from the API.
export const iconMap: Record<string, any> = {
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

type AugmentCardProps = {
  cardData: Augment;
  isSelected?: boolean;
  onPress?: () => void;
};

const AugmentCard = ({ cardData, isSelected, onPress }: AugmentCardProps) => (
  <Pressable className="flex-1 overflow-hidden rounded-xl" onPress={onPress}>
    <ImageBackground
      className="flex-1 overflow-hidden rounded-xl px-3 py-4"
      resizeMode="cover"
      source={require("@/assets/images/augments/background-image.png")}
    >
      <View className="flex-1 justify-between">
        <View>
          <Text className="pbk-b1 mb-2 text-center text-base-white">
            {cardData.title}
          </Text>
          <Image
            className="mb-4 h-24 w-24 self-center rounded-xl"
            resizeMode="cover"
            source={iconMap[cardData.iconUrl]}
          />
          <Text className="pbk-b3 text-center text-base-white">
            {cardData.description}
          </Text>
          <Text className="pbk-b3 mt-2 text-center text-green-400">
            {cardData.info}
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
);
export default AugmentCard;
