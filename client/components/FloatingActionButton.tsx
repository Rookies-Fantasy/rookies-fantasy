import { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { cn } from "@/utils/jsUtils";

type FloatingActionButtonProps = {
  children: ReactNode;
  className?: string;
  onPress: () => void;
};

const FloatingActionButton = ({
  children,
  className,
  onPress,
}: FloatingActionButtonProps) => (
  <View className={cn("z-2 absolute", className)}>
    <Pressable
      className="min-h-12 w-full justify-center rounded-md bg-purple-600"
      onPress={onPress}
    >
      {children}
    </Pressable>
  </View>
);

export default FloatingActionButton;
