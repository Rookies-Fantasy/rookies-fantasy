import {
  TypographyColor,
  TypographyVariant,
  variantClasses,
  colorClasses,
} from "@/utils/typography.config";
import { ReactNode } from "react";
import { Text, TextProps } from "react-native";

type TypographyProps = TextProps & {
  variant: TypographyVariant;
  color?: TypographyColor;
  children: ReactNode;
  className?: string;
};

const Typography = ({
  variant,
  children,
  color,
  className = "",
  ...props
}: TypographyProps) => {
  // Use the pre-defined class mappings from your config
  const variantClass = variantClasses[variant];
  // Use the color class from mapping if provided, otherwise empty string
  const colorClass = color ? colorClasses[color] : "";

  return (
    <Text className={`${variantClass} ${colorClass} ${className}`} {...props}>
      {children}
    </Text>
  );
};

export default Typography;
