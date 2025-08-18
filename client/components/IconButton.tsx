import React from "react";
import { Pressable } from "react-native";
import { cn } from "@/utils/jsUtils";

type IconButtonProps = {
  icon: React.ReactNode;
  onPress: () => void;
  size?: number;
  className?: string;
};

const IconButton = ({
  icon,
  onPress,
  size = 40,
  className = "",
}: IconButtonProps) => (
  <Pressable
    className={cn("size-8 items-center justify-center rounded-lg", className)}
    onPress={onPress}
  >
    {icon}
  </Pressable>
);

export default IconButton;
