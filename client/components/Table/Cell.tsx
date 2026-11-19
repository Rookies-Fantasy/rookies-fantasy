import { ReactNode } from "react";
import { View, Text } from "react-native";

type CellProps = {
  content: string | ReactNode;
  widthClass?: string;
  heightClass?: string;
  variant?: "header" | "row";
  cellVariant?: "scrollable" | "sticky";
};

const Cell = ({
  content,
  widthClass = "w-24",
  variant = "row",
  cellVariant = "sticky",
}: CellProps) => {
  const heightClass = variant === "header" ? "h-12" : "h-24";
  const cellClass =
    cellVariant === "scrollable"
      ? "border-b border-t border-gray-900 items-center"
      : "border border-gray-900 pl-3.5";

  return (
    <View
      className={`justify-center bg-gray-920 ${widthClass} ${heightClass} ${cellClass}`}
    >
      {typeof content === "string" || typeof content === "number" ? (
        <Text className="pbk-b1 text-base-white">{content}</Text>
      ) : (
        content
      )}
    </View>
  );
};

export default Cell;
