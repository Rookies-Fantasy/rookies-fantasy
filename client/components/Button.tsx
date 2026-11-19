import { useCallback, useRef } from "react";
import { Pressable, Text } from "react-native";
import Spinner from "./Spinner";

type ButtonProps = {
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  label: string;
  onPress?: () => void;
  throttleMs?: number;
  variant?: "primary" | "secondary";
};

const Button = ({
  className,
  disabled,
  isLoading,
  label,
  onPress,
  throttleMs = 0,
  variant = "primary",
}: ButtonProps) => {
  const baseClass = "min-h-12 w-full items-center justify-center rounded-md";
  const primaryClass = disabled ? "bg-purple-900" : "bg-purple-600";
  const secondaryClass = "border border-gray-800 bg-gray-920";
  const textClass = disabled ? "text-gray-400" : "text-base-white";
  const lastPressRef = useRef(0);

  const handlePress = useCallback(() => {
    if (!onPress) return;

    // Skip throttle check if throttleMs is 0 or not provided
    if (throttleMs > 0) {
      const now = Date.now();
      if (now - lastPressRef.current < throttleMs) return;
      lastPressRef.current = now;
    }

    onPress();
  }, [onPress, throttleMs]);

  return (
    <Pressable
      className={`${baseClass} ${variant === "primary" ? primaryClass : secondaryClass} ${className}`}
      disabled={disabled || isLoading}
      onPress={handlePress}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <Text className={`pbk-h7 text-center uppercase ${textClass}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
};

export default Button;
