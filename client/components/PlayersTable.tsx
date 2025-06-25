import { View, Text, FlatList } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

type TableProps = {
  stickyHeaders: string[];
  scrollableHeaders: string[];
  stickyWidths: string[];
  scrollableWidths: string[];
  data: any[][];
  onEndReached?: () => void;
};

const PlayersTable = ({
  stickyHeaders,
  scrollableHeaders,
  stickyWidths,
  scrollableWidths,
  data,
  onEndReached,
}: TableProps) => {
  const renderStickyRow = ({ item }: { item: (string | number)[] }) => (
    <View className="min-h-16 flex-row items-center border-b border-gray-300">
      {item.map((cell, index) => (
        <View
          className={`${stickyWidths[index]} justify-center border-r border-gray-400 px-3`}
          key={index}
        >
          <Text className="text-base-white">{cell}</Text>
        </View>
      ))}
    </View>
  );

  const renderScrollableRow = ({ item }: { item: (string | number)[] }) => (
    <View className="min-h-16 flex-row items-center border-b border-gray-300">
      {item.map((cell, index) => (
        <View
          className={`${scrollableWidths[index]} justify-center border-r border-gray-400 px-3`}
          key={index}
        >
          <Text className="text-base-white">{cell}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View className="flex-row">
      <View>
        {/* Sticky Header */}
        <View className="min-h-12 flex-row items-center border-b-2 border-gray-900 bg-gray-920">
          {stickyHeaders.map((header, index) => (
            <View className={`${stickyWidths[index]}`} key={index}>
              <Text className="text-pbk-b1 text-gray-400">{header}</Text>
            </View>
          ))}
        </View>
        {/* Scrollable Rows */}
        <FlatList
          data={data.map((row) => row.slice(0, stickyHeaders.length))}
          keyExtractor={(_, idx) => idx.toString()}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          renderItem={renderStickyRow}
          scrollEnabled={false}
        />
      </View>
      <ScrollView
        bounces={false}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <View>
          {/* Scrollable Header */}
          <View className="min-h-12 flex-row items-center border-b-2 border-gray-900 bg-gray-920">
            {scrollableHeaders.map((header, index) => (
              <View className={`${scrollableWidths[index]}`} key={index}>
                <Text className="text-pbk-b1 text-gray-400">{header}</Text>
              </View>
            ))}
          </View>
          {/* Scrollable Rows */}
          <FlatList
            data={data.map((row) => row.slice(stickyHeaders.length))}
            keyExtractor={(_, idx) => idx.toString()}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            renderItem={renderScrollableRow}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default PlayersTable;
