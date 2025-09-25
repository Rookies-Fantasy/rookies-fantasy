import { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { cn } from "@/utils/jsUtils";

type FloatingActionButtonProps = {
  absolute?: boolean;
  buttonBackground?: string;
  children: ReactNode;
  className?: string;
  onPress: () => void;
};

const FloatingActionButton = ({
  absolute = true,
  buttonBackground = "bg-purple-500",
  children,
  className,
  onPress,
}: FloatingActionButtonProps) => (
  <View className={cn("z-2", absolute ? "absolute" : "", className)}>
    <Pressable
      className={cn(
        "min-h-12 w-full justify-center rounded-md",
        buttonBackground,
      )}
      onPress={onPress}
    >
      {children}
    </Pressable>
  </View>
);

export default FloatingActionButton;
