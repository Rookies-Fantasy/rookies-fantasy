import { useState } from "react";
import { View, Image, Text, Pressable } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import AugmentCard, { iconMap } from "./AugmentCard";
import Dialog from "./Dialog";
import { useAppSelector } from "@/state/hooks";
import { selectAugment, selectIsAugmentValid } from "@/state/slices/teamSlice";
import { cn } from "@/utils/jsUtils";

const AugmentStatusCard = () => {
  const augment = useAppSelector(selectAugment);
  const augmentValid = useAppSelector(selectIsAugmentValid);
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <Pressable onPress={() => setOpenDialog(true)}>
      {augment && (
        <>
          <Dialog
            closeLabel="Close"
            dialogClassname="w-[75%]"
            onClose={() => setOpenDialog(false)}
            title="Selected augment"
            visible={openDialog}
          >
            <View className="my-4 h-80 w-[75%] justify-center self-center">
              <AugmentCard
                cardData={augment}
                onPress={() => setOpenDialog(false)}
              />
            </View>
          </Dialog>
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
            <View className="flex-row items-center justify-between gap-1">
              <View className="flex-row items-center">
                <Image className="h-8 w-8" source={iconMap[augment.iconUrl]} />
                <Text className="pbk-h7 text-base-white">
                  {augment.title.toUpperCase()}
                </Text>
              </View>
              <View
                className={cn(
                  `h-5 w-16 items-center justify-center rounded-md`,
                  augmentValid ? "bg-green-600" : "bg-gray-600",
                )}
              >
                <Text className="pbk-b3 text-base-white">
                  {augmentValid ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}
    </Pressable>
  );
};

export default AugmentStatusCard;
