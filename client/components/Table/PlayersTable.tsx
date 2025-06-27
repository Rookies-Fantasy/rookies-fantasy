import { View, FlatList } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Row from "./Row";

type TableProps = {
  headers: string[];
  data: any[][];
  stickyIndexes: number[];
  widthClasses: string[];
  onEndReached?: () => void;
};

const PlayersTable = ({
  headers,
  data,
  stickyIndexes = [],
  widthClasses,
  onEndReached,
}: TableProps) => {
  const stickyHeaders = headers.slice(0, stickyIndexes.length);
  const scrollableHeaders = headers.slice(stickyIndexes.length);

  const stickyData = data.map((row) => row.slice(0, stickyIndexes.length));
  const scrollableData = data.map((row) => row.slice(stickyIndexes.length));

  const stickyWidths = widthClasses.slice(0, stickyIndexes.length);
  const scrollableWidths = widthClasses.slice(stickyIndexes.length);
  return (
    <View className="flex-1 flex-row">
      <View>
        <Row
          rowData={stickyHeaders}
          variant="header"
          widthClasses={stickyWidths}
        />
        <FlatList
          data={stickyData}
          renderItem={({ item }) => (
            <Row rowData={item} widthClasses={stickyWidths} />
          )}
          scrollEnabled={false}
        />
      </View>

      <ScrollView
        bounces={false}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <View>
          <Row
            cellVariant="scrollable"
            rowData={scrollableHeaders}
            variant="header"
            widthClasses={scrollableWidths}
          />
          <FlatList
            data={scrollableData}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <Row
                cellVariant="scrollable"
                rowData={item}
                stickyIndexes={stickyIndexes}
                widthClasses={scrollableWidths}
              />
            )}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default PlayersTable;
