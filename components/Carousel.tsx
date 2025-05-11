import { useCallback, useRef, useState } from "react";
import { View, Image, Text, Dimensions, ViewToken } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { CarouselData } from "@/types/carouselData";

const { width } = Dimensions.get("screen");
const defaultDotWidth = 8;

type CarouselItemProps = {
  item: CarouselData;
};

const CarouselItem = ({ item }: CarouselItemProps) => {
  return (
    <View
      className="flex items-center justify-center gap-4 px-4"
      style={{ width }}
    >
      <Image
        className="h-[200px] w-[300px]"
        resizeMode="contain"
        source={item.image}
      />
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

type CarouselProps = {
  data: CarouselData[];
};

export const Carousel = ({ data }: CarouselProps) => {
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
    <View className="flex flex-1 items-center justify-center gap-16">
      <Animated.FlatList
        className="flex-none"
        data={data}
        horizontal
        onScroll={onScroll}
        pagingEnabled
        renderItem={({ item }) => <CarouselItem item={item} />}
        showsHorizontalScrollIndicator={false}
        style={{ width }}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
      />
      <View className="flex flex-row justify-center gap-1.5">
        {Array.from({ length: data.length }).map((_, i) => (
          <CarouselDot
            carouselIndex={carouselIndex}
            dotIndex={i}
            key={i}
            scrollX={scrollX}
          />
        ))}
      </View>
    </View>
  );
};
