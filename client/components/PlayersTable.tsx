import { View, Text, FlatList, ScrollView } from "react-native";

type TableProps = {
  stickyHeaders: string[];
  scrollableHeaders: string[];
  stickyWidths: string[];
  scrollableWidths: string[];
  data: (string | number)[][];
  onEndReached?: () => void;
  headerClass?: string;
  rowClass?: string;
  cellClass?: string;
  textClass?: string;
};

const PlayersTable = ({
  stickyHeaders,
  scrollableHeaders,
  stickyWidths,
  scrollableWidths,
  data,
  onEndReached,
}: TableProps) => {
  const rowHeightClass = "h-[32px]";

  const renderStickyCells = ({ item }: { item: any }) => (
    <View className={`flex-row ${rowHeightClass}`}>
      {[item[0], item[1]].map((cell, idx) => (
        <View
          className={`${stickyWidths[idx]} border bg-white px-2 py-1`}
          key={idx}
        >
          <Text className="text-xs">{cell}</Text>
        </View>
      ))}
    </View>
  );

  const renderScrollableCells = ({ item }: { item: any }) => (
    <View className={`flex-row ${rowHeightClass}`}>
      {item.slice(2).map((cell: string | number, idx: number) => (
        <View
          className={`${scrollableWidths[idx]} border bg-white px-2 py-1`}
          key={idx}
        >
          <Text className="text-xs">{cell}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View className="flex-row">
      {/* Sticky Columns */}
      <View>
        <View className="flex-row bg-gray-100">
          {stickyHeaders.map((header, idx) => (
            <View className={`${stickyWidths[idx]} border px-2 py-1`} key={idx}>
              <Text className="text-xs font-bold">{header}</Text>
            </View>
          ))}
        </View>
        <FlatList
          data={data}
          renderItem={renderStickyCells}
          scrollEnabled={false}
        />
      </View>

      <ScrollView
        horizontal
        nestedScrollEnabled={true}
        showsHorizontalScrollIndicator={false}
      >
        <View>
          <View className="flex-row bg-gray-100">
            {scrollableHeaders.map((header, idx) => (
              <View
                className={`${scrollableWidths[idx]} border px-2 py-1`}
                key={idx}
              >
                <Text className="text-xs font-bold">{header}</Text>
              </View>
            ))}
          </View>
          <FlatList
            data={data}
            onEndReached={onEndReached}
            renderItem={renderScrollableCells}
            scrollEnabled={true}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default PlayersTable;
