import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import type { Aggregate, Listing } from '@/types';
import { colors, fonts } from '@/theme';
import { formatIdrCompact } from '@/lib/format';

// The signature "market band". A custom vector distribution:
//   - horizontal axis from min -> max price
//   - shaded p25..p75 interquartile zone (the "fair" middle)
//   - every listing as a dot (acid lime below median, red above)
//   - a labeled vertical "Pasaran" (median) line
//   - an optional dashed target-price marker (when the model is on the watchlist)
//
// The drawing itself is always fully rendered; the load animation is a plain
// Animated.View "curtain" (matching the card surface) that slides off to the
// right, revealing the band left-to-right. Using a View transform for the reveal
// (instead of an animated SVG clip) keeps it rock-solid: if the animation ever
// no-ops, the band is still fully visible rather than clipped to nothing.
//
// NOTE: The spec suggested @shopify/react-native-skia. Skia is not bundled in
// Expo Go, which conflicts with the "runs in Expo Go on first launch" hard
// requirement, so this is drawn with react-native-svg instead. It is isolated in
// this one component and can be reimplemented in Skia for a dev build without
// touching any caller.

const H_PAD = 16;
const BAND_TOP = 20;
const AXIS_BOTTOM_GAP = 30;

type MarketBandProps = {
  aggregate: Aggregate;
  listings: Listing[];
  targetPriceIdr?: number;
  height?: number;
};

/** Deterministic 0..1 jitter from a listing id so dots do not overlap. */
function jitter(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 100000;
  return (h % 1000) / 1000;
}

export function MarketBand({
  aggregate,
  listings,
  targetPriceIdr,
  height = 150,
}: MarketBandProps) {
  const [width, setWidth] = useState(0);
  const reveal = useSharedValue(0);

  const { median, p25, p75 } = aggregate;

  // Include the target in the domain so its marker is always visible.
  const domainMin = Math.min(aggregate.min, targetPriceIdr ?? aggregate.min);
  const domainMax = Math.max(aggregate.max, targetPriceIdr ?? aggregate.max);
  const span = Math.max(1, domainMax - domainMin);

  const innerLeft = H_PAD;
  const innerRight = Math.max(H_PAD, width - H_PAD);
  const innerWidth = Math.max(0, innerRight - innerLeft);
  const baselineY = height - AXIS_BOTTOM_GAP;

  const scaleX = useMemo(
    () => (price: number) => innerLeft + ((price - domainMin) / span) * innerWidth,
    [innerLeft, domainMin, span, innerWidth],
  );

  useEffect(() => {
    reveal.value = 0;
    reveal.value = withTiming(1, { duration: 780, easing: Easing.out(Easing.cubic) });
  }, [reveal, median, listings.length, width]);

  const curtainStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: reveal.value * width }],
  }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (aggregate.count === 0) {
    return <View style={{ height }} onLayout={onLayout} />;
  }

  const dotBandTop = BAND_TOP + 6;
  const dotBandBottom = baselineY - 8;

  return (
    <View style={styles.container} onLayout={onLayout}>
      {width > 0 ? (
        <View style={{ width, height }}>
          <Svg width={width} height={height}>
            {/* Interquartile "fair" zone. */}
            <Rect
              x={scaleX(p25)}
              y={BAND_TOP}
              width={Math.max(0, scaleX(p75) - scaleX(p25))}
              height={baselineY - BAND_TOP}
              fill={colors.accentTint}
              rx={6}
            />

            {/* Axis baseline. */}
            <Line
              x1={innerLeft}
              y1={baselineY}
              x2={innerRight}
              y2={baselineY}
              stroke={colors.hairline}
              strokeWidth={1}
            />

            {/* Listing dots. */}
            {listings.map((l) => {
              const cx = scaleX(l.priceIdr);
              const cy = dotBandBottom - jitter(l.id) * (dotBandBottom - dotBandTop);
              const below = l.priceIdr < median;
              return (
                <Circle
                  key={l.id}
                  cx={cx}
                  cy={cy}
                  r={3.2}
                  fill={below ? colors.up : colors.down}
                  opacity={0.9}
                />
              );
            })}

            {/* Median ("Pasaran") line + label. */}
            <Line
              x1={scaleX(median)}
              y1={BAND_TOP - 6}
              x2={scaleX(median)}
              y2={baselineY + 4}
              stroke={colors.text}
              strokeWidth={1.5}
            />
            <SvgText
              x={clampLabel(scaleX(median), innerLeft, innerRight)}
              y={BAND_TOP - 10}
              fill={colors.text}
              fontSize={10}
              fontFamily={fonts.bodySemiBold}
              textAnchor="middle"
            >
              PASARAN
            </SvgText>

            {/* Optional target marker (dashed). */}
            {targetPriceIdr != null ? (
              <>
                <Line
                  x1={scaleX(targetPriceIdr)}
                  y1={BAND_TOP - 6}
                  x2={scaleX(targetPriceIdr)}
                  y2={baselineY + 4}
                  stroke={colors.accent}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
                <SvgText
                  x={clampLabel(scaleX(targetPriceIdr), innerLeft, innerRight)}
                  y={baselineY + 26}
                  fill={colors.accent}
                  fontSize={10}
                  fontFamily={fonts.bodySemiBold}
                  textAnchor="middle"
                >
                  TARGET
                </SvgText>
              </>
            ) : null}

            {/* Min / max axis labels. */}
            <SvgText
              x={innerLeft}
              y={baselineY + 18}
              fill={colors.textMuted}
              fontSize={10}
              fontFamily={fonts.body}
              textAnchor="start"
            >
              {formatIdrCompact(aggregate.min)}
            </SvgText>
            <SvgText
              x={innerRight}
              y={baselineY + 18}
              fill={colors.textMuted}
              fontSize={10}
              fontFamily={fonts.body}
              textAnchor="end"
            >
              {formatIdrCompact(aggregate.max)}
            </SvgText>
          </Svg>

          {/* Reveal curtain: covers the band, then slides off to the right. */}
          <Animated.View
            pointerEvents="none"
            style={[styles.curtain, { width, height }, curtainStyle]}
          />
        </View>
      ) : null}
    </View>
  );
}

/** Keep a centered label from spilling past the drawing edges. */
function clampLabel(x: number, left: number, right: number): number {
  return Math.min(right - 22, Math.max(left + 22, x));
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  curtain: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: colors.surface,
  },
});
