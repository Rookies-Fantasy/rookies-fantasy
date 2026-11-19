import { CaretRight } from "phosphor-react-native";
import { ReactNode, useState, useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { cn } from "@/utils/jsUtils";

type AccordionProps = {
  animationDuration?: number;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  defaultExpanded?: boolean;
  disabled?: boolean;
  headerClassName?: string;
  onToggle?: (isExpanded: boolean) => void;
  selectedCount?: number;
  title: string;
};

const Accordion = ({
  animationDuration = 200,
  children,
  className,
  contentClassName,
  defaultExpanded = false,
  disabled = false,
  headerClassName,
  onToggle,
  selectedCount,
  title,
}: AccordionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const rotation = useSharedValue(isExpanded ? 90 : 0);
  const height = useSharedValue(isExpanded ? 1 : 0);

  useEffect(() => {
    rotation.value = withTiming(isExpanded ? 90 : 0, {
      duration: animationDuration,
    });
    height.value = withTiming(isExpanded ? 1 : 0, {
      duration: animationDuration,
    });
  }, [isExpanded, animationDuration, rotation, height]);

  const toggleAccordion = () => {
    if (disabled) return;

    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    onToggle?.(newExpandedState);
  };

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: height.value,
    overflow: "hidden",
  }));

  return (
    <View className={cn("mx-3 border-b border-gray-800", className)}>
      <Pressable
        className={cn(
          "mx-3 flex-row items-center justify-between py-8",
          disabled && "opacity-50",
          headerClassName,
        )}
        disabled={disabled}
        onPress={toggleAccordion}
      >
        <Text className="pbk-b1 ml-3 text-gray-400">{title}</Text>
        <View className="flex-row items-center gap-6">
          {(selectedCount ?? 0) > 0 && (
            <Text className="pbk-b2 rounded-lg bg-gray-800 p-1.5 text-base-white">
              {selectedCount} Selected
            </Text>
          )}
          <Animated.View style={rotationStyle}>
            <CaretRight color="white" size={20} />
          </Animated.View>
        </View>
      </Pressable>

      <Animated.View style={contentStyle}>
        {isExpanded && (
          <View className={cn("pb-4", contentClassName)}>{children}</View>
        )}
      </Animated.View>
    </View>
  );
};

export default Accordion;
