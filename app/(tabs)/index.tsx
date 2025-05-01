import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  ImageSourcePropType,
  Image,
  Dimensions,
  ViewToken,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

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

type SliderItemProps = {
  item: SliderData;
};

const { width } = Dimensions.get("screen");

const SliderItem = ({ item }: SliderItemProps) => {
  console.log(width);
  return (
    <View
      className="flex items-center justify-center gap-4 px-4"
      style={{ width }}
    >
      <Image source={item.image} />
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

const defaultDotWidth = 8;

const SliderPagination = ({
  numberOfItems,
  paginationIndex,
  scrollX,
}: SliderPaginationProps) => {
  return (
    <View className="flex flex-row justify-center gap-1.5">
      {Array.from({ length: numberOfItems }).map((_, i) => {
        const animationStyle = useAnimatedStyle(() => {
          const dotWidth = interpolate(
            scrollX.value,
            [(i - 1) * width, i * width, (i + 1) * width],
            [defaultDotWidth, defaultDotWidth * 2, defaultDotWidth],
            Extrapolation.CLAMP,
          );

          return { width: dotWidth };
        });
        return (
          <Animated.View
            className={`h-2 w-2 rounded-xl ${paginationIndex === i ? "bg-purple-600" : "bg-white"}`}
            key={i}
            style={animationStyle}
          />
        );
      })}
    </View>
  );
};

export default function TabOneScreen() {
  const scrollX = useSharedValue(0);
  const [paginationIndex, setPaginationIndex] = useState(0);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (
        viewableItems[0] !== undefined &&
        viewableItems[0].index !== undefined &&
        viewableItems[0].index !== null
      ) {
        setPaginationIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e: any) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  return (
    <SafeAreaView className="flex flex-1 items-center justify-between bg-black">
      <View className="flex flex-1 items-center justify-center gap-16">
        <Animated.FlatList
          className="flex-none"
          data={data}
          horizontal
          onScroll={onScroll}
          pagingEnabled
          renderItem={({ item }) => <SliderItem item={item} />}
          showsHorizontalScrollIndicator={false}
          style={{ width }}
          viewabilityConfigCallbackPairs={
            viewabilityConfigCallbackPairs.current
          }
        />
        <SliderPagination
          numberOfItems={data.length}
          paginationIndex={paginationIndex}
          scrollX={scrollX}
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
