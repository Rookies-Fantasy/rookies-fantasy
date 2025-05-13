import { ReactNode, useCallback, useEffect, useState } from "react";
import { Dimensions, Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export const { height: SCREEN_HEIGHT } = Dimensions.get("window");
export const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + 50;

type SnapPoint = "0%" | "33%" | "50%" | "66%" | "100%";
const snapPointMap: Record<SnapPoint, number> = {
  "0%": 0,
  "33%": -SCREEN_HEIGHT / 3,
  "50%": -SCREEN_HEIGHT / 2,
  "66%": (-SCREEN_HEIGHT * 2) / 3,
  "100%": MAX_TRANSLATE_Y,
};
const defaultSnapPoints: SnapPoint[] = ["0%", "33%", "66%", "100%"];

type BottomSheetProps = {
  children?: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  snapPoints?: SnapPoint[];
};

const BottomSheet = ({
  children,
  footer,
  header,
  isOpen,
  onClose,
  snapPoints,
}: BottomSheetProps) => {
  const context = useSharedValue({ y: 0 });
  const translateY = useSharedValue(0);
  const sheetTop = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(1);
  const scrollViewMaxHeight = useSharedValue(SCREEN_HEIGHT);

  const [visible, setVisible] = useState(isOpen);

  useAnimatedReaction(
    () => translateY.value,
    (currentTranslateY) => {
      scrollViewMaxHeight.value = Math.abs(currentTranslateY + 135);
    },
  );

  const scrollTo = useCallback(
    (destination: number) => {
      "worklet";
      if (destination === 0) {
        backdropOpacity.value = withTiming(0, { duration: 100 });
      }

      translateY.value = withSpring(
        destination,
        { damping: 50 },
        (finished) => {
          if (finished && destination === 0) {
            runOnJS(setVisible)(false);
            runOnJS(onClose)();
          }
        },
      );

      sheetTop.value = SCREEN_HEIGHT + destination;
    },
    [backdropOpacity, onClose, sheetTop, translateY],
  );

  const allSnapPoints = [
    ...new Set(["0%", ...(snapPoints ?? defaultSnapPoints)]),
  ].map((o) => snapPointMap[o as SnapPoint]);

  useEffect(() => {
    if (isOpen) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      setVisible(true);
      scrollTo(allSnapPoints[1] ?? snapPointMap["33%"]);
    } else {
      scrollTo(0);
    }
  }, [isOpen, scrollTo, allSnapPoints, backdropOpacity]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((o) => {
      translateY.value = Math.max(
        o.translationY + context.value.y,
        Math.min(...allSnapPoints),
      );
    })
    .onEnd(() => {
      let closest = allSnapPoints[0];
      let minDiff = Math.abs(translateY.value - closest);
      for (const point of allSnapPoints) {
        const diff = Math.abs(translateY.value - point);
        if (diff < minDiff) {
          closest = point;
          minDiff = diff;
        }
      }
      scrollTo(closest);
    });

  const bottomSheetStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      translateY.value,
      [MAX_TRANSLATE_Y + 50, MAX_TRANSLATE_Y],
      [20, 5],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateY: translateY.value }],
      borderRadius,
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  const scrollViewStyle = useAnimatedStyle(() => {
    return {
      maxHeight: scrollViewMaxHeight.value,
    };
  });

  if (!visible) return null;

  return (
    <View className="absolute inset-0 z-50">
      <Pressable onPress={onClose} className="absolute inset-0">
        <Animated.View className="flex-1 bg-black/50" style={[backdropStyle]} />
      </Pressable>

      <GestureDetector gesture={gesture}>
        <Animated.View
          className="absolute top-full h-screen w-full border border-gray-900 bg-gray-920"
          style={[bottomSheetStyle]}
        >
          <View className="my-2 h-1 w-12 self-center rounded-sm bg-gray-500" />

          <View className="flex-1">
            {header && <View className="z-[1] pb-4">{header}</View>}

            <Animated.ScrollView
              className="flex-1"
              showsVerticalScrollIndicator
              style={[scrollViewStyle]}
            >
              {children}
            </Animated.ScrollView>

            {footer && <View className="z-[1] mt-4 px-4">{footer}</View>}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export default BottomSheet;
