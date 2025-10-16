import { CaretLeft, CaretRight } from "phosphor-react-native";
import { useState } from "react";
import { Text, View, Image, Pressable } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import AugmentCard, { iconMap } from "@/components/AugmentCard";
import Dialog from "@/components/Dialog";
import IconButton from "@/components/IconButton";
import { useAppSelector } from "@/state/hooks";
import { selectAugment, selectTeam } from "@/state/slices/teamSlice";
import { teamLogoOptions } from "@/types/asset";

const Arena = () => {
  const team = useAppSelector(selectTeam);
  const augment = useAppSelector(selectAugment);
  const [openDialog, setOpenDialog] = useState(false);

  // Find the matching asset by URL to get the proper source
  const teamLogo = teamLogoOptions.find(
    (asset) => asset.url === team.logoUrl,
  )?.source;

  return (
    <View className="flex-1 flex-col items-center bg-gray-950">
      <View className="w-full flex-row">
        <View className="w-1/2 border-b border-r border-gray-900 py-4 pl-6 pr-2">
          <View className="mb-2 w-full flex-row items-start justify-between">
            <Image
              className="h-12 w-12 rounded-full border-2"
              source={teamLogo}
            />

            <Text className="pbk-h5 text-base-white">440</Text>
          </View>

          <Text className="pbk-h6 text-base-white" numberOfLines={1}>
            CALGARY GHOSTS
          </Text>

          <Text className="pbk-b3 text-base-white">0W 0L (-% WR)</Text>
        </View>

        <View className="w-1/2 items-end border-b border-l border-gray-900 py-4 pl-2 pr-6">
          <View className="mb-2 w-full flex-row items-start justify-between">
            <Text className="pbk-h5 text-base-white">478</Text>

            <Image
              className="h-12 w-12 rounded-full border-2"
              source={teamLogo}
            />
          </View>

          <Text className="pbk-h6 text-base-white" numberOfLines={1}>
            GUNS N ROSES
          </Text>

          <Text className="pbk-b3 text-base-white">1W 0L (100% WR)</Text>
        </View>
      </View>
      <View className="w-full flex-row items-center justify-between border-b border-gray-900 px-6 py-4">
        <IconButton
          icon={<CaretLeft color="#6042FF" />}
          onPress={() => {}}
          size={24}
        />

        <Text className="pbk-bl text-primary-500">TODAY (OCT 15, 2025)</Text>

        <IconButton
          icon={<CaretRight color="#6042FF" />}
          onPress={() => {}}
          size={24}
        />
      </View>
      <ScrollView
        className="w-full flex-1"
        contentContainerStyle={{ paddingVertical: 20 }}
      >
        <View className="flex-row justify-center gap-5">
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
                    <Image
                      className="h-8 w-8"
                      source={iconMap[augment.iconUrl]}
                    />
                    <Text className="pbk-h7 text-base-white">
                      {augment.title.toUpperCase()}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Pressable>

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
                    <Image
                      className="h-8 w-8"
                      source={iconMap[augment.iconUrl]}
                    />
                    <Text className="pbk-h7 text-base-white">
                      {augment.title.toUpperCase()}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Pressable>
        </View>

        <View className="flex-row rounded-md border border-red-500 bg-gray-920">
          <View className="flex-col">
            <View className="flex-row border-b border-red-500 px-2 pt-2">
              <View className="flex-col pr-2">
                <Text className="pbk-h8 mb-4 text-base-white">PG</Text>
                <Text className="pbk-h8 text-base-white">MIKE</Text>
                <Text className="pbk-h8 mb-2 text-base-white">CONLEY</Text>
              </View>
              <Image className="h-16 w-16 self-end" source={teamLogo} />
            </View>
          </View>
          <View className="justify-center border-x border-red-500">
            <Text className="text-base-white">PG</Text>
          </View>
          <View className="flex-col">
            <View className="border-b border-gray-900"></View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Arena;
