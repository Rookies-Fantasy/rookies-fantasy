import { useMemo, useRef, useState } from "react";
import { Animated, Image, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Row, { RowData } from "@/components/Table/Row";
import { StandingsRow } from "@/types/standings";
import { hexToRgba, themeColors } from "@/utils/colorUtils";
import { getTeamLogoSource } from "@/utils/teamUtils";

const COLUMNS = [
  { label: "#", widthClass: "w-10" },
  { label: "TEAM", widthClass: "w-44" },
  { label: "W", widthClass: "w-12" },
  { label: "L", widthClass: "w-12" },
  { label: "D", widthClass: "w-12" },
  { label: "GP", widthClass: "w-12" },
  { label: "WIN%", widthClass: "w-16" },
  { label: "PTS", widthClass: "w-14" },
];
const STICKY_COLUMNS = 2;
const HEADER_HEIGHT_CLASS = "h-11";
const ROW_HEIGHT_CLASS = "h-16";

// How far from the end of the scroll the overflow hint starts fading out.
const FADE_OUT_DISTANCE = 24;

const STICKY = COLUMNS.slice(0, STICKY_COLUMNS);
const SCROLLABLE = COLUMNS.slice(STICKY_COLUMNS);
const STICKY_WIDTHS = STICKY.map((column) => column.widthClass);
const SCROLLABLE_WIDTHS = SCROLLABLE.map((column) => column.widthClass);

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const TeamCell = ({ row }: { row: StandingsRow }) => (
  <View className="flex-row items-center gap-2 pr-2">
    <Image
      className="size-10 rounded-full"
      source={getTeamLogoSource(row.team.logoUrl)}
    />
    <Text className="pbk-b2 flex-1 text-base-white" numberOfLines={1}>
      {row.team.name}
    </Text>
  </View>
);

type StandingsTableProps = {
  standings: StandingsRow[];
};

const StandingsTable = ({ standings }: StandingsTableProps) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  // Both widths come from the ScrollView itself, so they are always what
  // NativeWind actually rendered rather than a guess at what it would.
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  const maxScroll = Math.max(contentWidth - viewportWidth, 0);
  const hasOverflow = maxScroll > 0;

  const fadeOpacity = useMemo(() => {
    if (maxScroll <= 0) return 0;
    return scrollX.interpolate({
      inputRange: [Math.max(maxScroll - FADE_OUT_DISTANCE, 0), maxScroll],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });
  }, [maxScroll, scrollX]);

  const data: RowData[] = useMemo(
    () =>
      standings.map((row) => ({
        id: row.team.id,
        cells: [
          row.rank,
          <TeamCell key={row.team.id} row={row} />,
          row.wins,
          row.losses,
          row.draws,
          row.gamesPlayed,
          row.winPctLabel,
          row.points,
        ],
      })),
    [standings],
  );

  return (
    <View className="overflow-hidden rounded-2xl">
      <View className="flex-row">
        <View>
          <Row
            heightClass={HEADER_HEIGHT_CLASS}
            rowData={{ id: "header", cells: STICKY.map(({ label }) => label) }}
            variant="header"
            widthClasses={STICKY_WIDTHS}
          />
          {data.map((row) => (
            <Row
              heightClass={ROW_HEIGHT_CLASS}
              key={row.id}
              rowData={{
                id: row.id,
                cells: row.cells.slice(0, STICKY_COLUMNS),
              }}
              widthClasses={STICKY_WIDTHS}
            />
          ))}
        </View>

        <AnimatedScrollView
          bounces={false}
          decelerationRate="fast"
          horizontal
          onContentSizeChange={(width) => setContentWidth(width)}
          onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
        >
          <View>
            <Row
              cellVariant="scrollable"
              heightClass={HEADER_HEIGHT_CLASS}
              rowData={{
                id: "header",
                cells: SCROLLABLE.map(({ label }) => label),
              }}
              variant="header"
              widthClasses={SCROLLABLE_WIDTHS}
            />
            {data.map((row) => (
              <Row
                cellVariant="scrollable"
                heightClass={ROW_HEIGHT_CLASS}
                key={row.id}
                rowData={{ id: row.id, cells: row.cells.slice(STICKY_COLUMNS) }}
                widthClasses={SCROLLABLE_WIDTHS}
              />
            ))}
          </View>
        </AnimatedScrollView>
      </View>

      {hasOverflow && (
        <Animated.View
          className="absolute bottom-0 right-0 top-0 w-7"
          pointerEvents="none"
          style={{ opacity: fadeOpacity }}
        >
          <LinearGradient
            colors={[hexToRgba(themeColors.gray920, 0), themeColors.gray920]}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );
};

export default StandingsTable;
