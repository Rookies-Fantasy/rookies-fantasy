import { CaretRight } from "phosphor-react-native";
import { ReactNode, useState, useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { cn } from "@/utils/jsUtils";

export type AccordionItem = {
  id: string;
  title: string;
  content: ReactNode;
  disabled?: boolean;
  defaultOpen?: boolean;
};

export type AccordionProps = {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  disabled?: boolean;
  onChange?: (isExpanded: boolean) => void;
  isExpanded?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  animationDuration?: number;
};

const Accordion = ({
  title,
  children,
  defaultExpanded = false,
  disabled = false,
  onChange,
  isExpanded: controlledIsExpanded,
  className,
  headerClassName,
  contentClassName,
  animationDuration = 200,
}: AccordionProps) => {
  const [localIsExpanded, setLocalIsExpanded] = useState(defaultExpanded);
  const isControlled = controlledIsExpanded !== undefined;
  const isExpanded = isControlled ? controlledIsExpanded : localIsExpanded;
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

    if (!isControlled) {
      setLocalIsExpanded(newExpandedState);
    }

    onChange?.(newExpandedState);
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
        <Animated.View style={rotationStyle}>
          <CaretRight color="white" size={20} />
        </Animated.View>
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
