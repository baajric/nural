import { Image } from 'expo-image';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { getIllustration } from '@/lib/illustrations';
import type { Illustration } from '@/lib/illustrations';

type Props = {
  /** Reading category, or a specific illustration */
  category?: string;
  illustration?: Illustration;
  /** Size and shape of the panel; the artwork is centered and never cropped. */
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/** An illustration on its own paper color, so it fills any panel shape seamlessly. */
export function IllustrationPanel({ category, illustration, style, children }: Props) {
  const art = illustration ?? getIllustration(category ?? '');
  return (
    <View style={[{ backgroundColor: art.paper, overflow: 'hidden' }, style]}>
      <Image source={art.source} style={{ width: '100%', height: '100%' }} contentFit="contain" />
      {children}
    </View>
  );
}
