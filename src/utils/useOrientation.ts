import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export interface OrientationInfo {
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
  isTablet: boolean;
  isPhone: boolean;
  scale: number;
}

function compute(dim: ScaledSize): OrientationInfo {
  const { width, height, scale } = dim;
  const isLandscape = width > height;
  const minDim = Math.min(width, height);
  // Devices with shortest side >= 600dp are considered tablets
  const isTablet = minDim >= 600;
  return {
    width,
    height,
    isLandscape,
    isPortrait: !isLandscape,
    isTablet,
    isPhone: !isTablet,
    scale,
  };
}

/** Hook to track screen dimensions + orientation in real-time. */
export function useOrientation(): OrientationInfo {
  const [info, setInfo] = useState<OrientationInfo>(() =>
    compute(Dimensions.get('window'))
  );

  useEffect(() => {
    const handler = (dims: { window: ScaledSize }) => {
      setInfo(compute(dims.window));
    };
    const sub = Dimensions.addEventListener('change', handler);
    return () => {
      sub.remove();
    };
  }, []);

  return info;
}
