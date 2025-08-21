import { CaretRight } from "phosphor-react-native";
import { ReactNode, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type AccordionProps = {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
};

const Accordion = ({
  title,
  children,
  defaultExpanded = false,
}: AccordionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const rotation = useSharedValue(defaultExpanded ? 90 : 0);
  const height = useSharedValue(defaultExpanded ? 1 : 0);

  const toggleAccordion = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    rotation.value = withTiming(newExpandedState ? 90 : 0, { duration: 200 });
    height.value = withTiming(newExpandedState ? 1 : 0, { duration: 200 });
  };

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: height.value,
    overflow: "hidden" as const,
  }));

  return (
    <View className="mx-3 border-b border-gray-800">
      <Pressable
        className="mx-3 flex-row items-center justify-between py-8"
        onPress={toggleAccordion}
      >
        <Text className="pbk-b1 text-base-white">{title}</Text>
        <Animated.View style={rotationStyle}>
          <CaretRight color="white" size={20} />
        </Animated.View>
      </Pressable>

      <Animated.View style={contentStyle}>
        {isExpanded && <View className="pb-4">{children}</View>}
      </Animated.View>
    </View>
  );
};

export default Accordion;
