import { useMemo, useRef, useState } from "react";
import { Animated, Image, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Row, { RowData } from "@/components/Table/Row";
import { StandingsRow } from "@/types/standings";
import { hexToRgba, themeColors } from "@/utils/colorUtils";
import { cn } from "@/utils/jsUtils";
import { widthClassToPixels } from "@/utils/tailwindUtils";
import { getTeamLogoSource } from "@/utils/teamUtils";

// Each column declares its width once, as the Tailwind class that actually
// renders it. The pixel width the snap offsets need is derived from that class,
// so the two can't drift.
//
// The class has to be written out in full: Tailwind only emits classes it finds
// as literals when it scans this file, so a class built from a number at runtime
// would never make it into the stylesheet.
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
const FADE_WIDTH_CLASS = "w-7";

// The fade's own width, in pixels, for the scroll interpolation below.
const FADE_WIDTH = widthClassToPixels(FADE_WIDTH_CLASS);

const STICKY = COLUMNS.slice(0, STICKY_COLUMNS);
const SCROLLABLE = COLUMNS.slice(STICKY_COLUMNS);
const STICKY_WIDTHS = STICKY.map((column) => column.widthClass);
const SCROLLABLE_WIDTHS = SCROLLABLE.map((column) => column.widthClass);
const SCROLLABLE_WIDTH = SCROLLABLE.reduce(
  (total, column) => total + widthClassToPixels(column.widthClass),
  0,
);

// Left edge of each scrollable column, so a swipe can only ever come to rest
// with a column boundary flush against the sticky block.
const COLUMN_STARTS = SCROLLABLE.reduce<number[]>((starts, column, index) => {
  starts.push(
    index === 0
      ? 0
      : starts[index - 1] +
          widthClassToPixels(SCROLLABLE[index - 1].widthClass),
  );
  return starts;
}, []);

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

// League standings grid. Reuses the shared Row/Cell primitives for the sticky-left
// + horizontally-scrollable-right layout, but renders rows directly (no inner
// vertical scroll) so it can live inside the page's ScrollView. Standings are
// bounded by league size, so virtualization isn't needed.
//
// The header sits inside the same horizontal ScrollView as the body, so the two
// stay aligned by construction rather than by syncing scroll offsets.
const StandingsTable = ({ standings }: StandingsTableProps) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [viewportWidth, setViewportWidth] = useState(0);

  const maxScroll = Math.max(SCROLLABLE_WIDTH - viewportWidth, 0);
  const hasOverflow = maxScroll > 0;

  // Every column start that is actually reachable, plus the far end so the last
  // column lands flush against the right edge instead of being clipped.
  const snapOffsets = useMemo(
    () => [...COLUMN_STARTS.filter((start) => start < maxScroll), maxScroll],
    [maxScroll],
  );

  // Fades out over the final stretch of the scroll, so the hint disappears once
  // there is nothing left to reveal.
  const fadeOpacity = useMemo(() => {
    if (maxScroll <= 0) return 0;
    return scrollX.interpolate({
      inputRange: [Math.max(maxScroll - FADE_WIDTH, 0), maxScroll],
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
          onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          snapToOffsets={snapOffsets}
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
          className={cn("absolute bottom-0 right-0 top-0", FADE_WIDTH_CLASS)}
          pointerEvents="none"
          // opacity is driven by an Animated value, which only exists on the
          // style prop — className can't express it.
          style={{ opacity: fadeOpacity }}
        >
          <LinearGradient
            colors={[hexToRgba(themeColors.gray920, 0), themeColors.gray920]}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            // LinearGradient is a third-party component and NativeWind is not
            // wired up for it (no cssInterop anywhere in the app), so className
            // would be dropped. Matches every other LinearGradient in the repo.
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );
};

export default StandingsTable;
