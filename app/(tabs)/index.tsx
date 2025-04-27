import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  FlatList,
  ImageSourcePropType,
  Image,
  Dimensions,
} from "react-native";
import { SharedValue, useSharedValue } from "react-native-reanimated";

type SliderData = {
  title: string;
  image: ImageSourcePropType;
  description: string;
};

const data: SliderData[] = [
  {
    title: "Welcome to Rookies 👋",
    image: require("@/assets/images/Frame 5989.png"),
    description:
      "Compete in weekly 1v1 matchups, build your lineup, and climb the ranked ladder!",
  },
  {
    title: "Create your team 🎽",
    image: require("@/assets/images/Frame 5990.png"),
    description:
      "Pick a team name, choose a logo, and make your team uniquely yours!",
  },
  {
    title: "Choose your game mode ⚔️",
    image: require("@/assets/images/Frame 5991.png"),
    description:
      "Pick a mode, queue up, and challenge opponents in daily matchups!",
  },
  {
    title: "Draft your team 💰",
    image: require("@/assets/images/Frame 5992.png"),
    description:
      "Build your lineup within the salary cap  and make every pick count for every week!",
  },
  {
    title: "Power up your game 🚀",
    image: require("@/assets/images/Frame 5993.png"),
    description:
      "Use special augments to boost your squad and outplay your opponent! Strategy is key!",
  },
  {
    title: "Climb the ranked ladder 🏆",
    image: require("@/assets/images/Frame 5994.png"),
    description:
      "Compete in the daily matchups, win your games, and climb the ranks to the top!",
  },
];

const Slider = () => {
  const test = false;
  return null;
};

type SliderItemProps = {
  item: SliderData;
};

const { width, height } = Dimensions.get("screen");

const SliderItem = ({ item }: SliderItemProps) => {
  console.log(width);
  return (
    <View
      className="flex items-center justify-center gap-4 px-4"
      style={{ width }}
    >
      <Image
        source={item.image}
        // style={{ width: "50%", height: "50%", resizeMode: "contain" }}
      />
      <Text className="text-center text-white">{item.title}</Text>
      <Text className="text-center text-white">{item.description}</Text>
    </View>
  );
};

type SliderPaginationProps = {
  numberOfItems: number;
  paginationIndex: number;
  scrollX: SharedValue<number>;
};

const SliderPagination = ({
  numberOfItems,
  paginationIndex,
  scrollX,
}: SliderPaginationProps) => {
  return (
    <View className="flex flex-row justify-center gap-2">
      {Array.from({ length: numberOfItems }).map((_, i) => (
        <View
          className={`h-2 w-2 rounded-xl ${paginationIndex === i ? "bg-purple-600" : "bg-white"}`}
          key={i}
        />
      ))}
    </View>
  );
};

export default function TabOneScreen() {
  const scrollX = useSharedValue(0);
  const [paginationIndex, setPaginationIndex] = useState(0);

  return (
    <SafeAreaView className="flex flex-1 items-center justify-between bg-black">
      <View className="flex flex-1 items-center justify-center gap-16">
        <FlatList
          className="flex-none"
          data={data}
          renderItem={({ item }) => <SliderItem item={item} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
        />
        <SliderPagination
          numberOfItems={data.length}
          scrollX={scrollX}
          paginationIndex={paginationIndex}
        />
      </View>
      <View className="flex w-full gap-4 px-8 pb-8">
        <Pressable
          className="rounded-lg bg-purple-600 p-3"
          onPress={() => console.log("TEST")}
        >
          <Text className="text-center text-white">Create an Account</Text>
        </Pressable>
        <Pressable className="rounded-lg p-3">
          <Text className="text-center text-white">
            I Already Have An Account
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
