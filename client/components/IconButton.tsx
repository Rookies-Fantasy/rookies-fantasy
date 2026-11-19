import React from "react";
import { Pressable } from "react-native";
import { cn } from "@/utils/jsUtils";

type IconButtonProps = {
  icon: React.ReactNode;
  onPress: () => void;
  size?: number;
  className?: string;
  disabled?: boolean;
};

const IconButton = ({
  icon,
  onPress,
  className = "",
  disabled = false,
}: IconButtonProps) => (
  <Pressable
    className={cn("size-8 items-center justify-center rounded-lg", className)}
    disabled={disabled}
    onPress={onPress}
  >
    {icon}
  </Pressable>
);

export default IconButton;
