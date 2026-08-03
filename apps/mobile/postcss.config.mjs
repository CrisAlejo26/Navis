/**
 * Expo procesa los ficheros CSS con PostCSS antes de pasárselos a
 * react-native-css, que los convierte en estilos nativos. Aquí es donde
 * Tailwind v4 compila las clases del proyecto.
 */
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
