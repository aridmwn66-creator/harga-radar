import { useEffect, useId, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import type { HistoryPoint } from '@/lib/history';
import { colors, durations, fonts } from '@/theme';
import { formatIdrCompact } from '@/lib/format';

// A line chart of the price trend over time, drawn with react-native-svg so it
// matches the market band. The line draws in left-to-right on load; the area
// under it fades in. Reduced-motion renders it static.
//
// TODO(PROMPT 2 / backend): the series is currently mock (see src/lib/history).

const AnimatedPath = Animated.createAnimatedComponent(Path);

type PriceHistoryChartProps = {
  data: HistoryPoint[];
  height?: number;
};

export function PriceHistoryChart({ data, height = 132 }: PriceHistoryChartProps) {
  const [width, setWidth] = useState(0);
  const reduced = useReducedMotion();
  const clock = useSharedValue(reduced ? 1 : 0);
  const gradId = `hist-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const n = data.length;
  const prices = useMemo(() => data.map((d) => d.priceIdr), [data]);
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 1;
  const spanP = Math.max(1, maxP - minP);

  const padX = 8;
  const padTop = 14;
  const padBottom = 22;
  const plotW = Math.max(0, width - padX * 2);
  const plotH = Math.max(0, height - padTop - padBottom);
  const baseline = padTop + plotH;

  const xAt = (i: number) => padX + (n > 1 ? (i / (n - 1)) * plotW : 0);
  const yAt = (v: number) => padTop + (1 - (v - minP) / spanP) * plotH;

  const { linePath, areaPath, lineLen } = useMemo(() => {
    if (n === 0 || width === 0) return { linePath: '', areaPath: '', lineLen: 1 };
    let d = '';
    let len = 0;
    let prevX = 0;
    let prevY = 0;
    data.forEach((p, i) => {
      const x = xAt(i);
      const y = yAt(p.priceIdr);
      if (i === 0) d = `M ${x} ${y}`;
      else {
        d += ` L ${x} ${y}`;
        len += Math.hypot(x - prevX, y - prevY);
      }
      prevX = x;
      prevY = y;
    });
    const area = `${d} L ${xAt(n - 1)} ${baseline} L ${xAt(0)} ${baseline} Z`;
    return { linePath: d, areaPath: area, lineLen: Math.max(1, len) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, width, height, minP, maxP]);

  useEffect(() => {
    if (reduced) {
      clock.value = 1;
      return;
    }
    clock.value = 0;
    clock.value = withTiming(1, { duration: durations.odometer, easing: Easing.out(Easing.cubic) });
  }, [clock, reduced, linePath]);

  const lineProps = useAnimatedProps(() => {
    const e = 1 - Math.pow(1 - clock.value, 3);
    return { strokeDashoffset: lineLen * (1 - e) };
  });
  const areaProps = useAnimatedProps(() => {
    const start = 0.25;
    const p = Math.min(1, Math.max(0, (clock.value - start) / (1 - start)));
    return { opacity: p * 0.9 };
  });

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const lastX = xAt(n - 1);
  const lastY = n > 0 ? yAt(prices[n - 1] as number) : 0;

  return (
    <View style={styles.container} onLayout={onLayout}>
      {width > 0 && n > 1 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.up} stopOpacity={0.22} />
              <Stop offset="1" stopColor={colors.up} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          <AnimatedPath d={areaPath} fill={`url(#${gradId})`} animatedProps={areaProps} />

          {/* Glow halo behind the line. */}
          <AnimatedPath
            d={linePath}
            stroke={colors.up}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.16}
            strokeDasharray={lineLen}
            animatedProps={lineProps}
          />
          <AnimatedPath
            d={linePath}
            stroke={colors.up}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={lineLen}
            animatedProps={lineProps}
          />

          {/* Current-price endpoint. */}
          <Circle cx={lastX} cy={lastY} r={7} fill={colors.up} opacity={0.16} />
          <Circle cx={lastX} cy={lastY} r={3.2} fill={colors.up} />

          {/* Sparse x-axis labels. */}
          {data.map((p, i) =>
            p.label ? (
              <SvgText
                key={p.index}
                x={i === 0 ? padX : i === n - 1 ? width - padX : xAt(i)}
                y={height - 6}
                fill={colors.textMuted}
                fontSize={10}
                fontFamily={fonts.body}
                textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
              >
                {p.label}
              </SvgText>
            ) : null,
          )}

          {/* Min / max price guides. */}
          <SvgText x={padX} y={padTop - 2} fill={colors.textFaint} fontSize={10} fontFamily={fonts.body} textAnchor="start">
            {formatIdrCompact(maxP)}
          </SvgText>
          <SvgText x={width - padX} y={baseline + 12} fill={colors.textFaint} fontSize={10} fontFamily={fonts.body} textAnchor="end">
            {formatIdrCompact(minP)}
          </SvgText>
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
