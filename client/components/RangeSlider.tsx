import { useState, useEffect, useCallback } from "react";
import { View, Text } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  withTiming,
} from "react-native-reanimated";
import { cn } from "@/utils/jsUtils";

export type RangeSliderValue = [number, number];

export type RangeSliderProps = {
  min: number;
  max: number;
  step?: number;
  value?: RangeSliderValue;
  defaultValue?: RangeSliderValue;
  onChange?: (value: RangeSliderValue) => void;
  trackWidth?: number;
  thumbSize?: number;
  trackHeight?: number;
  containerClassName?: string;
  trackClassName?: string;
  activeTrackClassName?: string;
  thumbClassName?: string;
  labelClassName?: string;
  showLabels?: boolean;
  labelPosition?: "top" | "bottom" | "none";
  formatValue?: (value: number) => string;
  disabled?: boolean;
  animationDuration?: number;
};

const DEFAULT_TRACK_WIDTH = 280;
const DEFAULT_THUMB_SIZE = 24;
const DEFAULT_TRACK_HEIGHT = 8;

const RangeSlider = ({
  min,
  max,
  step = 1,
  value: controlledValue,
  defaultValue,
  onChange,
  trackWidth = DEFAULT_TRACK_WIDTH,
  thumbSize = DEFAULT_THUMB_SIZE,
  trackHeight = DEFAULT_TRACK_HEIGHT,
  containerClassName,
  trackClassName,
  activeTrackClassName,
  thumbClassName,
  labelClassName,
  showLabels = true,
  labelPosition = "bottom",
  formatValue = (value) => value.toString(),
  disabled = false,
  animationDuration = 200,
}: RangeSliderProps) => {
  const finalDefaultValue = defaultValue || [min, max];

  // State management - controlled/uncontrolled pattern
  const [internalValue, setInternalValue] =
    useState<RangeSliderValue>(finalDefaultValue);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const [minValue, maxValue] = currentValue;

  const valueToPosition = useCallback(
    (val: number) => {
      "worklet";
      return ((val - min) / (max - min)) * trackWidth;
    },
    [min, max, trackWidth],
  );

  const positionToValue = useCallback(
    (position: number) => {
      "worklet";
      return min + (position / trackWidth) * (max - min);
    },
    [min, max, trackWidth],
  );

  const minThumbPosition = useSharedValue(valueToPosition(minValue));
  const maxThumbPosition = useSharedValue(valueToPosition(maxValue));
  const startMinPosition = useSharedValue(0);
  const startMaxPosition = useSharedValue(0);

  useEffect(() => {
    if (isControlled) {
      minThumbPosition.value = withTiming(valueToPosition(minValue), {
        duration: animationDuration,
      });
      maxThumbPosition.value = withTiming(valueToPosition(maxValue), {
        duration: animationDuration,
      });
    }
  }, [
    minValue,
    maxValue,
    isControlled,
    animationDuration,
    valueToPosition,
    minThumbPosition,
    maxThumbPosition,
  ]);

  const updateValue = useCallback(
    (newMinValue: number, newMaxValue: number) => {
      const newValue: RangeSliderValue = [newMinValue, newMaxValue];

      if (!isControlled) {
        setInternalValue(newValue);
      }

      onChange?.(newValue);
    },
    [isControlled, onChange],
  );

  const updateMinValue = useCallback(
    (newValue: number) => {
      updateValue(newValue, maxValue);
    },
    [updateValue, maxValue],
  );

  const updateMaxValue = useCallback(
    (newValue: number) => {
      updateValue(minValue, newValue);
    },
    [updateValue, minValue],
  );

  const minGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      startMinPosition.value = minThumbPosition.value;
    })
    .onUpdate((event) => {
      const newPosition = Math.max(
        0,
        Math.min(
          startMinPosition.value + event.translationX,
          maxThumbPosition.value - thumbSize,
        ),
      );
      minThumbPosition.value = newPosition;

      const newValue = positionToValue(newPosition);
      const steppedValue = Math.round(newValue / step) * step;
      runOnJS(updateMinValue)(steppedValue);
    });

  const maxGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      startMaxPosition.value = maxThumbPosition.value;
    })
    .onUpdate((event) => {
      const newPosition = Math.min(
        trackWidth,
        Math.max(
          startMaxPosition.value + event.translationX,
          minThumbPosition.value + thumbSize,
        ),
      );
      maxThumbPosition.value = newPosition;

      const newValue = positionToValue(newPosition);
      const steppedValue = Math.round(newValue / step) * step;
      runOnJS(updateMaxValue)(steppedValue);
    });

  const minThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: minThumbPosition.value - thumbSize / 2 }],
  }));

  const maxThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: maxThumbPosition.value - thumbSize / 2 }],
  }));

  const activeTrackStyle = useAnimatedStyle(() => ({
    left: minThumbPosition.value,
    width: maxThumbPosition.value - minThumbPosition.value,
  }));

  const minLabelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: minThumbPosition.value - thumbSize / 2 }],
  }));

  const maxLabelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: maxThumbPosition.value - thumbSize / 2 }],
  }));

  const containerHeight =
    thumbSize + (showLabels && labelPosition !== "none" ? 30 : 10);
  const labelTop = labelPosition === "top" ? -5 : containerHeight - 10;

  return (
    <View className={cn("px-6 py-3", containerClassName)}>
      <View
        className="relative"
        style={{ height: containerHeight, justifyContent: "center" }}
      >
        <View
          className={cn("rounded-full bg-gray-800", trackClassName)}
          style={{
            width: trackWidth,
            height: trackHeight,
          }}
        />

        <Animated.View
          className={cn(
            "absolute rounded-full bg-purple-600",
            activeTrackClassName,
          )}
          style={[
            {
              height: trackHeight,
            },
            activeTrackStyle,
          ]}
        />

        <GestureDetector gesture={minGesture}>
          <Animated.View
            className={cn(
              "absolute rounded-full bg-purple-600",
              disabled && "opacity-50",
              thumbClassName,
            )}
            style={[
              {
                width: thumbSize,
                height: thumbSize,
              },
              minThumbStyle,
            ]}
          >
            <View
              className="absolute rounded-full bg-white"
              style={{
                width: thumbSize - 6,
                height: thumbSize - 6,
                top: 3,
                left: 3,
              }}
            />
          </Animated.View>
        </GestureDetector>

        <GestureDetector gesture={maxGesture}>
          <Animated.View
            className={cn(
              "absolute rounded-full bg-purple-600",
              disabled && "opacity-50",
              thumbClassName,
            )}
            style={[
              {
                width: thumbSize,
                height: thumbSize,
              },
              maxThumbStyle,
            ]}
          >
            <View
              className="absolute rounded-full bg-white"
              style={{
                width: thumbSize - 6,
                height: thumbSize - 6,
                top: 3,
                left: 3,
              }}
            />
          </Animated.View>
        </GestureDetector>

        {showLabels && labelPosition !== "none" && (
          <>
            <Animated.View
              className="absolute items-center"
              style={[
                {
                  top: labelTop,
                  width: 60,
                  marginLeft: -20,
                },
                minLabelStyle,
              ]}
            >
              <Text
                className={cn(
                  "pbk-b2 text-center text-base-white",
                  labelClassName,
                )}
              >
                {formatValue(minValue)}
              </Text>
            </Animated.View>

            <Animated.View
              className="absolute items-center"
              style={[
                {
                  top: labelTop,
                  width: 60,
                  marginLeft: -20,
                },
                maxLabelStyle,
              ]}
            >
              <Text
                className={cn(
                  "pbk-b2 text-center text-base-white",
                  labelClassName,
                )}
              >
                {formatValue(maxValue)}
              </Text>
            </Animated.View>
          </>
        )}
      </View>
    </View>
  );
};

export default RangeSlider;
