import { ReactNode } from "react";
import { Text, TextProps } from "react-native";

type VariantType =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "h7"
  | "h8"
  | "sh1"
  | "sh2"
  | "bl"
  | "b1"
  | "b2"
  | "b3";

type ColorType =
  | "base"
  | "gray"
  | "purple"
  | "blue"
  | "green"
  | "yellow"
  | "red"
  | "orange";

type ShadeType =
  | "0"
  | "50"
  | "100"
  | "200"
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800"
  | "900"
  | "920"
  | "950";

type TypographyProps = TextProps & {
  variant: VariantType;
  children: ReactNode;
  color?: `${ColorType}-${ShadeType}`;
  className?: string;
};

const Typography = ({
  variant,
  children,
  color,
  className = "",
  ...props
}: TypographyProps) => {
  const variantClass = `text-pbk-${variant}`;
  const colorClass = color ? `text-${color}` : "";

  return (
    <Text className={`${variantClass} ${colorClass} ${className}`} {...props}>
      {children}
    </Text>
  );
};

export default Typography;
