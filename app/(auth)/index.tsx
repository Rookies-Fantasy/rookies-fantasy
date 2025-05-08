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
  ImageBackground,
  StatusBar,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { PressableLink } from "@/components/PressableLink";

type CarouselData = {
  title: string;
  image: ImageSourcePropType;
  description: string;
};

const carouselData: CarouselData[] = [
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

const { width } = Dimensions.get("screen");

type CarouselItemProps = {
  item: CarouselData;
};

const CarouselItem = ({ item }: CarouselItemProps) => {
  return (
    <View
      className="flex items-center justify-center gap-4 px-4"
      style={{ width }}
    >
      <Image source={item.image} />
      <Text className="text-center font-clash text-pbk-h5 font-semibold text-white">
        {item.title}
      </Text>
      <Text className="text-center font-manrope text-pbk-b1 text-white">
        {item.description}
      </Text>
    </View>
  );
};

type CarouselDotProps = {
  carouselIndex: number;
  dotIndex: number;
  scrollX: SharedValue<number>;
};

const defaultDotWidth = 8;

const CarouselDot = ({
  carouselIndex,
  dotIndex,
  scrollX,
}: CarouselDotProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    const dotWidth = interpolate(
      scrollX.value,
      [(dotIndex - 1) * width, dotIndex * width, (dotIndex + 1) * width],
      [defaultDotWidth, defaultDotWidth * 2, defaultDotWidth],
      Extrapolation.CLAMP,
    );

    return { width: dotWidth };
  });

  return (
    <Animated.View
      className={`h-2 w-2 rounded-xl ${dotIndex === carouselIndex ? "bg-purple-600" : "bg-gray-800"}`}
      style={animatedStyle}
    />
  );
};

export default function Onboarding() {
  const scrollX = useSharedValue(0);
  const [carouselIndex, setCarouselIndex] = useState(0);

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
        setCarouselIndex(viewableItems[0].index);
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
    <ImageBackground
      className="flex-1 bg-gray-950"
      resizeMode="cover"
      source={require("@/assets/images/Bg Elements.png")}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex flex-1 items-center justify-between">
        <View className="flex flex-1 items-center justify-center gap-16">
          <Animated.FlatList
            className="flex-none"
            data={carouselData}
            horizontal
            onScroll={onScroll}
            pagingEnabled
            renderItem={({ item }) => <CarouselItem item={item} />}
            showsHorizontalScrollIndicator={false}
            style={{ width }}
            viewabilityConfigCallbackPairs={
              viewabilityConfigCallbackPairs.current
            }
          />
          <View className="flex flex-row justify-center gap-1.5">
            {Array.from({ length: carouselData.length }).map((_, i) => (
              <CarouselDot
                carouselIndex={carouselIndex}
                dotIndex={i}
                key={i}
                scrollX={scrollX}
              />
            ))}
          </View>
        </View>
        <View className="flex w-full gap-4 px-8 pb-8">
          <Pressable className="rounded-lg bg-purple-600 p-3">
            <Text className="text-center font-clash font-semibold uppercase text-white">
              Create an Account
            </Text>
          </Pressable>
          <PressableLink
            className="rounded-lg p-3"
            href="/login"
            label={
              <Text className="text-center font-clash font-semibold uppercase text-white">
                I Already Have An Account
              </Text>
            }
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
