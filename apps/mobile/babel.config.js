module.exports = function (api) {
  // La configuración depende de NODE_ENV, así que la caché tiene que ir por él.
  api.cache.using(() => process.env.NODE_ENV);

  const presets = ['babel-preset-expo'];

  // `nativewind/babel` reescribe los imports de `react-native` a los
  // componentes con soporte de `className` y añade el plugin de worklets que
  // necesita Reanimated 4. Debe ir DESPUÉS de babel-preset-expo.
  //
  // En Jest se queda fuera: esos componentes hacen `Object.entries()` sobre los
  // originales de React Native, que el preset de tests sustituye por mocks, y
  // la suite ni siquiera arranca. Los tests comprueban comportamiento y
  // accesibilidad, no estilos, así que las clases se ignoran sin más.
  if (process.env.NODE_ENV !== 'test') presets.push('nativewind/babel');

  return { presets };
};
