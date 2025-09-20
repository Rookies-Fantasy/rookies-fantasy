import { useState } from "react";
import { View, Text, Image, Pressable } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import AugmentCard, { iconMap } from "./AugmentCard";
import Dialog from "./Dialog";
import { useAppSelector } from "@/state/hooks";
import {
  selectAugment,
  selectQualifyingPlayersCount,
} from "@/state/slices/teamSlice";

const SelectedAugment = () => {
  const augment = useAppSelector(selectAugment);
  const qualifyingPlayersCount = useAppSelector(selectQualifyingPlayersCount);
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <Pressable onPress={() => setOpenDialog(true)}>
      {augment && (
        <Dialog
          closeLabel="Close"
          dialogClassname="w-[75%]"
          onClose={() => setOpenDialog(false)}
          title="Selected augment"
          visible={openDialog}
        >
          <View className="my-4 items-center justify-center">
            <View className="h-80 w-[75%]">
              <AugmentCard
                cardData={augment}
                onPress={() => setOpenDialog(false)}
              />
            </View>
          </View>
        </Dialog>
      )}
      <LinearGradient
        colors={["#CCE8FE", "#CDA0FF", "#8489F5", "#CDF1FF", "#B591E9"]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          position: "absolute",
          top: -3,
          right: -3,
          bottom: -3,
          left: -3,
          borderRadius: 16,
          borderWidth: 1,
        }}
      />
      <View className="w-full rounded-2xl bg-gray-900 p-4">
        {augment && (
          <View className="flex-col items-center gap-1">
            <View className="flex-row items-center">
              <Image className="h-8 w-8" source={iconMap[augment.iconUrl]} />
              <Text className="pbk-h7 text-base-white">
                {augment.title.toUpperCase()}
              </Text>
            </View>
            <Text className="pbk-b2 text-base-white">
              {`${qualifyingPlayersCount} / ${augment.playerCount} players meet the condition for this augment`}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

export default SelectedAugment;
