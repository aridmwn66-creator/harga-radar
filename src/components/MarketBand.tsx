import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import type { Aggregate, Listing } from '@/types';
import { colors, durations, fonts } from '@/theme';
import { formatIdrCompact } from '@/lib/format';

// The signature "market band". A custom vector distribution:
//   - horizontal axis from min -> max price
//   - shaded p25..p75 interquartile zone (the "fair" middle)
//   - every listing as a dot (acid lime below median, red above)
//   - a labeled vertical "Pasaran" (median) line
//   - an optional dashed target-price marker (when the model is on the watchlist)
//
// Draw-in is SEQUENCED and calm: a single linear "clock" shared value drives the
// whole thing, and each element eases itself off that clock. The axis + fair zone
// draw first; then every dot fades and settles in one after another with a gentle,
// capped stagger; the median line and labels ride in with the structure. Nothing
// pops. Everything ends fully visible, and reduced-motion renders it static.
//
// NOTE: The spec suggested @shopify/react-native-skia. Skia is not bundled in
// Expo Go, which conflicts with the "runs in Expo Go on first launch" hard
// requirement, so this is drawn with react-native-svg. It is isolated in this one
// component and can be reimplemented in Skia for a dev build without touching any
// caller.

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedG = Animated.createAnimatedComponent(G);

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
  const reduced = useReducedMotion();
  const clock = useSharedValue(reduced ? 1 : 0);

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

  // Timeline: axis phase, then a capped dot-stagger window, then the last dot's
  // own fade. All expressed as fractions of one linear clock (0 -> 1).
  const n = listings.length;
  const dotWindowMs = Math.min(durations.bandDotWindowMax, n * durations.bandDotStagger);
  const perDotMs = n > 0 ? dotWindowMs / n : 0;
  const axisMs = durations.bandAxis;
  const dotFadeMs = durations.bandDotFade;
  const totalMs = axisMs + dotWindowMs + dotFadeMs;
  const axisFrac = totalMs > 0 ? axisMs / totalMs : 1;
  const structStartFrac = axisFrac * 0.35;

  useEffect(() => {
    if (reduced) {
      clock.value = 1;
      return;
    }
    clock.value = 0;
    // Linear clock; each element applies its own ease-out so motion decelerates.
    clock.value = withTiming(1, { duration: totalMs, easing: Easing.linear });
  }, [clock, reduced, median, n, width, totalMs]);

  // Axis draws in left-to-right via stroke dash offset.
  const axisProps = useAnimatedProps(() => {
    const p = Math.min(1, Math.max(0, clock.value / axisFrac));
    const e = 1 - Math.pow(1 - p, 3);
    return { strokeDashoffset: innerWidth * (1 - e) };
  });

  // Structure opacity (zone behind dots; median + labels in front). Same fade so
  // they arrive together with the axis.
  const structBackProps = useAnimatedProps(() => {
    const denom = Math.max(0.0001, axisFrac - structStartFrac);
    return { opacity: Math.min(1, Math.max(0, (clock.value - structStartFrac) / denom)) };
  });
  const structFrontProps = useAnimatedProps(() => {
    const denom = Math.max(0.0001, axisFrac - structStartFrac);
    return { opacity: Math.min(1, Math.max(0, (clock.value - structStartFrac) / denom)) };
  });

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (aggregate.count === 0) {
    return <View style={{ height }} onLayout={onLayout} />;
  }

  const dotBandTop = BAND_TOP + 6;
  const dotBandBottom = baselineY - 8;
  const medianX = scaleX(median);

  return (
    <View style={styles.container} onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {/* BACK structure: fair zone + axis (axis also draws via dash). */}
          <AnimatedG animatedProps={structBackProps}>
            <Rect
              x={scaleX(p25)}
              y={BAND_TOP}
              width={Math.max(0, scaleX(p75) - scaleX(p25))}
              height={baselineY - BAND_TOP}
              fill={colors.accentTint}
              rx={6}
            />
            <AnimatedLine
              x1={innerLeft}
              y1={baselineY}
              x2={innerRight}
              y2={baselineY}
              stroke={colors.hairline}
              strokeWidth={1}
              strokeDasharray={Math.max(1, innerWidth)}
              animatedProps={axisProps}
            />
          </AnimatedG>

          {/* Listing dots, each settling in on its own slice of the clock. */}
          {listings.map((l, i) => {
            const startMs = axisMs + i * perDotMs;
            return (
              <BandDot
                key={l.id}
                clock={clock}
                cx={scaleX(l.priceIdr)}
                cy={dotBandBottom - jitter(l.id) * (dotBandBottom - dotBandTop)}
                fill={l.priceIdr < median ? colors.up : colors.down}
                startFrac={startMs / totalMs}
                endFrac={(startMs + dotFadeMs) / totalMs}
              />
            );
          })}

          {/* FRONT structure: median line + labels, painted over the dots. */}
          <AnimatedG animatedProps={structFrontProps}>
            <Line
              x1={medianX}
              y1={BAND_TOP - 6}
              x2={medianX}
              y2={baselineY + 4}
              stroke={colors.text}
              strokeWidth={1.5}
            />
            <SvgText
              x={clampLabel(medianX, innerLeft, innerRight)}
              y={BAND_TOP - 10}
              fill={colors.text}
              fontSize={10}
              fontFamily={fonts.bodySemiBold}
              textAnchor="middle"
            >
              PASARAN
            </SvgText>

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
          </AnimatedG>
        </Svg>
      ) : null}
    </View>
  );
}

// A single dot that fades + gently grows into place over its slice of the clock.
function BandDot({
  clock,
  cx,
  cy,
  fill,
  startFrac,
  endFrac,
}: {
  clock: SharedValue<number>;
  cx: number;
  cy: number;
  fill: string;
  startFrac: number;
  endFrac: number;
}) {
  const animatedProps = useAnimatedProps(() => {
    const denom = Math.max(0.0001, endFrac - startFrac);
    const p = Math.min(1, Math.max(0, (clock.value - startFrac) / denom));
    const e = 1 - Math.pow(1 - p, 3);
    return { opacity: 0.9 * e, r: 2.4 + 0.8 * e };
  });
  return <AnimatedCircle animatedProps={animatedProps} cx={cx} cy={cy} fill={fill} />;
}

/** Keep a centered label from spilling past the drawing edges. */
function clampLabel(x: number, left: number, right: number): number {
  return Math.min(right - 22, Math.max(left + 22, x));
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
