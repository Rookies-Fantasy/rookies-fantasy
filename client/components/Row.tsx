import React from "react";
import { View } from "react-native";
import Cell from "./Cell";

type RowProps = {
  rowData: any[];
  stickyIndexes?: number[];
  widthClasses?: string[];
  variant?: "header" | "row";
  cellVariant?: "scrollable" | "sticky";
};

const Row = ({
  rowData,
  widthClasses = [],
  variant = "row",
  cellVariant = "sticky",
}: RowProps) => (
  <View className="flex-row">
    {rowData.map((item, index) => (
      <Cell
        cellVariant={cellVariant}
        content={item}
        key={index}
        variant={variant}
        widthClass={widthClasses[index]}
      />
    ))}
  </View>
);

export default Row;
