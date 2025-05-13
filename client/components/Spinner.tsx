import { Animated, Easing } from "react-native";
import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

type SpinnerProps = {
  className?: string;
};

const Spinner = ({ className }: SpinnerProps) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000, // 1 second for full spin
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spinAnimation.start();

    return () => spinAnimation.stop();
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      className={cn(
        "h-6 w-6 rounded-full border-2 border-white border-t-transparent",
        className,
      )}
      style={{ transform: [{ rotate: spin }] }}
    />
  );
};

export default Spinner;
