import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, radius } from '@/theme';
import { brandAccent, brandMonogram } from '@/lib/brands';
import { AppText } from './ui/AppText';

// Placeholder device thumbnail. We deliberately avoid remote images so the app
// works fully offline in Expo Go and never shows a broken image. A brand-tinted
// tile with a subtle phone silhouette and the brand monogram reads as a device
// without any network dependency. The live API can supply real thumbnailUrls
// later; ListingRow/ModelRow would just render an <Image> when one is present.

type ThumbnailProps = {
  brand: string;
  size?: number;
};

export function Thumbnail({ brand, size = 48 }: ThumbnailProps) {
  const accent = brandAccent(brand);
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
          stroke={accent}
          strokeWidth={1.5}
          fill="none"
          opacity={0.35}
        />
      </Svg>
      <AppText variant="heading" style={{ color: accent }}>
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
