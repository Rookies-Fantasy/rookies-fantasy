import { ReactNode } from "react";
import { Pressable } from "react-native";
import Cell from "./Cell";

export type RowData = {
  id: string;
  cells: (string | number | ReactNode)[];
};

type RowProps = {
  cellVariant?: "scrollable" | "sticky";
  heightClass?: string;
  onPress?: () => void;
  rowData: RowData;
  variant?: "header" | "row";
  widthClasses?: string[];
};

const Row = ({
  cellVariant = "sticky",
  heightClass,
  onPress,
  rowData,
  variant = "row",
  widthClasses = [],
}: RowProps) => (
  <Pressable className="flex-row" onPress={onPress}>
    {rowData.cells.map((item, index) => (
      <Cell
        cellVariant={cellVariant}
        content={item}
        heightClass={heightClass}
        key={index}
        variant={variant}
        widthClass={widthClasses[index]}
      />
    ))}
  </Pressable>
);

export default Row;
