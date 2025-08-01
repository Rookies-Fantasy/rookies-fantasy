import { useRef } from "react";
import { View, FlatList } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Row from "./Row";

type TableProps = {
  isFetchingNextPage: boolean;
  headers: string[];
  hasNextPage: boolean;
  data: any[][];
  stickyColumns: number;
  widthClasses: string[];
  onEndReached?: () => void;
};

const Table = ({
  isFetchingNextPage,
  headers,
  hasNextPage,
  data,
  stickyColumns,
  widthClasses,
  onEndReached,
}: TableProps) => {
  const horizontalScrollRef = useRef<ScrollView>(null);
  const bodyScrollRef = useRef<ScrollView>(null);
  const isSyncingRef = useRef(false);

  const stickyHeaders = headers.slice(0, stickyColumns);
  const scrollableHeaders = headers.slice(stickyColumns);

  const stickyData = data.map((row) => row.slice(0, stickyColumns));
  const scrollableData = data.map((row) => row.slice(stickyColumns));

  const stickyWidths = widthClasses.slice(0, stickyColumns);
  const scrollableWidths = widthClasses.slice(stickyColumns);

  const handleHorizontalScroll = (x: number, source?: "header") => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    let frameId: number | null = null;
    if (source === "header") {
      bodyScrollRef.current?.scrollTo({ x, animated: false });
    } else {
      horizontalScrollRef.current?.scrollTo({ x, animated: false });
    }

    frameId = requestAnimationFrame(() => {
      isSyncingRef.current = false;
      frameId = null;
    });
  };

  return (
    <View className="flex-1">
      <View className="flex-row">
        <Row
          rowData={stickyHeaders}
          variant="header"
          widthClasses={stickyWidths}
        />
        <ScrollView
          bounces={false}
          horizontal
          onScroll={(e) => {
            handleHorizontalScroll(e.nativeEvent.contentOffset.x, "header");
          }}
          ref={horizontalScrollRef}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
        >
          <Row
            cellVariant="scrollable"
            rowData={scrollableHeaders}
            variant="header"
            widthClasses={scrollableWidths}
          />
        </ScrollView>
      </View>
      <ScrollView
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isBottom =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 50;

          if (isBottom && hasNextPage && !isFetchingNextPage) {
            onEndReached?.();
          }
        }}
        scrollEventThrottle={200}
      >
        <View className="flex-row">
          <View>
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
            onScroll={(e) => {
              handleHorizontalScroll(e.nativeEvent.contentOffset.x);
            }}
            ref={bodyScrollRef}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
          >
            <View>
              <FlatList
                data={scrollableData}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                  <Row
                    cellVariant="scrollable"
                    rowData={item}
                    widthClasses={scrollableWidths}
                  />
                )}
                scrollEnabled={false}
              />
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

export default Table;
