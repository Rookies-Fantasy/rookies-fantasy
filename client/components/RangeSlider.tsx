import React, { useState } from "react";
import { View, Text } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";

type RangeSliderProps = {
  min: number;
  max: number;
  initialMinValue: number;
  initialMaxValue: number;
  step?: number;
  onValueChange: (minValue: number, maxValue: number) => void;
  formatValue?: (value: number) => string;
};

const RangeSlider = ({
  min,
  max,
  initialMinValue,
  initialMaxValue,
  step = 1,
  onValueChange,
  formatValue = (value) => value.toString(),
}: RangeSliderProps) => {
  const TRACK_WIDTH = 280;
  const THUMB_SIZE = 20;

  const [minValue, setMinValue] = useState(initialMinValue);
  const [maxValue, setMaxValue] = useState(initialMaxValue);

  // Convert value to position on track
  const valueToPosition = (val: number) => {
    "worklet";
    return ((val - min) / (max - min)) * TRACK_WIDTH;
  };

  // Convert position to value
  const positionToValue = (position: number) => {
    "worklet";
    return min + (position / TRACK_WIDTH) * (max - min);
  };

  const minThumbPosition = useSharedValue(valueToPosition(initialMinValue));
  const maxThumbPosition = useSharedValue(valueToPosition(initialMaxValue));
  const startMinPosition = useSharedValue(0);
  const startMaxPosition = useSharedValue(0);

  const updateMinValue = (newValue: number) => {
    setMinValue(newValue);
    onValueChange(newValue, maxValue);
  };

  const updateMaxValue = (newValue: number) => {
    setMaxValue(newValue);
    onValueChange(minValue, newValue);
  };

  const minGesture = Gesture.Pan()
    .onStart(() => {
      startMinPosition.value = minThumbPosition.value;
    })
    .onUpdate((event) => {
      const newPosition = Math.max(
        0,
        Math.min(
          startMinPosition.value + event.translationX,
          maxThumbPosition.value - THUMB_SIZE,
        ),
      );
      minThumbPosition.value = newPosition;

      const newValue = positionToValue(newPosition);
      const steppedValue = Math.round(newValue / step) * step;
      runOnJS(updateMinValue)(steppedValue);
    });

  const maxGesture = Gesture.Pan()
    .onStart(() => {
      startMaxPosition.value = maxThumbPosition.value;
    })
    .onUpdate((event) => {
      const newPosition = Math.min(
        TRACK_WIDTH,
        Math.max(
          startMaxPosition.value + event.translationX,
          minThumbPosition.value + THUMB_SIZE,
        ),
      );
      maxThumbPosition.value = newPosition;

      const newValue = positionToValue(newPosition);
      const steppedValue = Math.round(newValue / step) * step;
      runOnJS(updateMaxValue)(steppedValue);
    });

  const minThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: minThumbPosition.value - THUMB_SIZE / 2 }],
  }));

  const maxThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: maxThumbPosition.value - THUMB_SIZE / 2 }],
  }));

  const activeTrackStyle = useAnimatedStyle(() => ({
    left: minThumbPosition.value,
    width: maxThumbPosition.value - minThumbPosition.value,
  }));

  const minLabelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: minThumbPosition.value - THUMB_SIZE / 2 }],
  }));

  const maxLabelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: maxThumbPosition.value - THUMB_SIZE / 2 }],
  }));

  return (
    <View className="px-4 py-6">
      <View
        className="relative"
        style={{ height: 60, justifyContent: "center" }}
      >
        {/* Track background */}
        <View
          className="rounded-full bg-gray-600"
          style={{ width: TRACK_WIDTH, height: 4 }}
        />

        {/* Active track */}
        <Animated.View
          className="absolute rounded-full bg-blue-500"
          style={[{ height: 4 }, activeTrackStyle]}
        />

        {/* Min Thumb */}
        <GestureDetector gesture={minGesture}>
          <Animated.View
            className="absolute rounded-full border-2 border-white bg-blue-500"
            style={[
              {
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                top: 20, // Center thumb on track
              },
              minThumbStyle,
            ]}
          />
        </GestureDetector>

        {/* Max Thumb */}
        <GestureDetector gesture={maxGesture}>
          <Animated.View
            className="absolute rounded-full border-2 border-white bg-blue-500"
            style={[
              {
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                top: 20, // Center thumb on track
              },
              maxThumbStyle,
            ]}
          />
        </GestureDetector>

        {/* Min Value label under thumb */}
        <Animated.View
          className="absolute items-center"
          style={[
            {
              top: 45,
              width: 60,
              marginLeft: -20,
            },
            minLabelStyle,
          ]}
        >
          <Text className="pbk-b2 text-center text-base-white">
            {formatValue(minValue)}
          </Text>
        </Animated.View>

        {/* Max Value label under thumb */}
        <Animated.View
          className="absolute items-center"
          style={[
            {
              top: 45,
              width: 60,
              marginLeft: -20,
            },
            maxLabelStyle,
          ]}
        >
          <Text className="pbk-b2 text-center text-base-white">
            {formatValue(maxValue)}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

export default RangeSlider;
