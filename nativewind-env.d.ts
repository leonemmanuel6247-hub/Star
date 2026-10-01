import type { CssToReactNativeRuntimeOptions } from 'nativewind/types';

declare module 'react-native-css-utilities' {
  const blacklist: RegExp[];
}
declare module 'nativewind/dist/shared-types' {
  const opts: CssToReactNativeRuntimeOptions;
}

declare module 'nativewind/types' {
  export type CssToReactNativeRuntimeOptions = Record<string, unknown>;
}
