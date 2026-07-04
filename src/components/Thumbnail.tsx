import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, radius } from '@/theme';
import { brandMonogram } from '@/lib/brands';
import { AppText } from './ui/AppText';

// Placeholder device thumbnail. We deliberately avoid remote images so the app
// works fully offline in Expo Go and never shows a broken image. A cool
// monochrome tile with a phone silhouette + brand monogram reads as a device
// without any network dependency, and keeps the palette disciplined (the cyan
// frame is the only accent). The live API can supply real thumbnailUrls later;
// ListingRow/ModelRow would just render an <Image> when one is present.

type ThumbnailProps = {
  brand: string;
  size?: number;
};

export function Thumbnail({ brand, size = 48 }: ThumbnailProps) {
  const frameW = size * 0.42;
  const frameH = size * 0.66;
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: radius.md },
      ]}
    >
      <Svg
        width={size}
        height={size}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Rect
          x={(size - frameW) / 2}
          y={(size - frameH) / 2}
          width={frameW}
          height={frameH}
          rx={frameW * 0.18}
          stroke={colors.cyan}
          strokeWidth={1.5}
          fill="none"
          opacity={0.28}
        />
      </Svg>
      <AppText variant="heading" style={{ color: colors.text }}>
        {brandMonogram(brand)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
  },
});
