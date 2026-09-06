/**
 * `require('*.png')` no tenía tipo en este proyecto (nadie lo había usado
 * todavía) y salía `any`, con todos los `no-unsafe-*` de la Regla 10 detrás.
 * Es la forma de un módulo de imagen para Metro/React Native: el número de
 * módulo que espera `Image`, `ImageBackground`, etc.
 */
declare module '*.png' {
  import type { ImageSourcePropType } from 'react-native';

  const value: ImageSourcePropType;
  export default value;
}
