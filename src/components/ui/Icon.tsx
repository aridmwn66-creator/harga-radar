import Svg, { Circle, Line, Path, Polygon, Polyline } from 'react-native-svg';
import { colors, type ColorToken } from '@/theme';

// A small, hand-drawn line-icon set (24x24, 2px stroke). Custom SVG rather than
// a stock icon font so the app keeps its own terminal-editorial identity and
// stays dependency-light (only react-native-svg, already used by MarketBand).

export type IconName =
  | 'search'
  | 'radar'
  | 'home'
  | 'bookmark'
  | 'sliders'
  | 'bell'
  | 'chevron-right'
  | 'chevron-left'
  | 'x'
  | 'trash'
  | 'plus'
  | 'filter'
  | 'refresh'
  | 'external'
  | 'edit'
  | 'check'
  | 'activity'
  | 'clock';

type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorToken | string;
  strokeWidth?: number;
};

function resolveColor(color: ColorToken | string | undefined): string {
  if (!color) return colors.text;
  return color in colors ? colors[color as ColorToken] : color;
}

export function Icon({ name, size = 22, color, strokeWidth = 2 }: IconProps) {
  const stroke = resolveColor(color);
  const common = {
    stroke,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {renderIcon(name, stroke, common)}
    </Svg>
  );
}

type Common = {
  stroke: string;
  strokeWidth: number;
  strokeLinecap: 'round';
  strokeLinejoin: 'round';
  fill: 'none';
};

function renderIcon(name: IconName, stroke: string, c: Common) {
  switch (name) {
    case 'search':
      return (
        <>
          <Circle cx={11} cy={11} r={7} {...c} />
          <Line x1={20} y1={20} x2={16} y2={16} {...c} />
        </>
      );
    case 'radar':
      return (
        <>
          <Circle cx={12} cy={12} r={9} {...c} opacity={0.5} />
          <Circle cx={12} cy={12} r={5} {...c} opacity={0.7} />
          <Line x1={12} y1={12} x2={19} y2={7} {...c} />
          <Circle cx={12} cy={12} r={1.6} fill={stroke} stroke="none" />
        </>
      );
    case 'home':
      return (
        <>
          <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...c} />
          <Path d="M9 22V12h6v10" {...c} />
        </>
      );
    case 'bookmark':
      return <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" {...c} />;
    case 'sliders':
      return (
        <>
          <Line x1={4} y1={21} x2={4} y2={14} {...c} />
          <Line x1={4} y1={10} x2={4} y2={3} {...c} />
          <Line x1={12} y1={21} x2={12} y2={12} {...c} />
          <Line x1={12} y1={8} x2={12} y2={3} {...c} />
          <Line x1={20} y1={21} x2={20} y2={16} {...c} />
          <Line x1={20} y1={12} x2={20} y2={3} {...c} />
          <Line x1={1} y1={14} x2={7} y2={14} {...c} />
          <Line x1={9} y1={8} x2={15} y2={8} {...c} />
          <Line x1={17} y1={16} x2={23} y2={16} {...c} />
        </>
      );
    case 'bell':
      return (
        <>
          <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" {...c} />
          <Path d="M13.73 21a2 2 0 0 1-3.46 0" {...c} />
        </>
      );
    case 'chevron-right':
      return <Polyline points="9 6 15 12 9 18" {...c} />;
    case 'chevron-left':
      return <Polyline points="15 6 9 12 15 18" {...c} />;
    case 'x':
      return (
        <>
          <Line x1={18} y1={6} x2={6} y2={18} {...c} />
          <Line x1={6} y1={6} x2={18} y2={18} {...c} />
        </>
      );
    case 'trash':
      return (
        <>
          <Polyline points="3 6 5 6 21 6" {...c} />
          <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...c} />
        </>
      );
    case 'plus':
      return (
        <>
          <Line x1={12} y1={5} x2={12} y2={19} {...c} />
          <Line x1={5} y1={12} x2={19} y2={12} {...c} />
        </>
      );
    case 'filter':
      return <Polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" {...c} />;
    case 'refresh':
      return (
        <>
          <Polyline points="23 4 23 10 17 10" {...c} />
          <Path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" {...c} />
        </>
      );
    case 'external':
      return (
        <>
          <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" {...c} />
          <Polyline points="15 3 21 3 21 9" {...c} />
          <Line x1={10} y1={14} x2={21} y2={3} {...c} />
        </>
      );
    case 'edit':
      return (
        <>
          <Path d="M12 20h9" {...c} />
          <Path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" {...c} />
        </>
      );
    case 'check':
      return <Polyline points="20 6 9 17 4 12" {...c} />;
    case 'activity':
      return <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" {...c} />;
    case 'clock':
      return (
        <>
          <Circle cx={12} cy={12} r={9} {...c} />
          <Polyline points="12 7 12 12 16 14" {...c} />
        </>
      );
    default:
      return null;
  }
}
