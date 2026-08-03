// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDefaultConfig } = require('expo/metro-config');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withNativewind } = require('nativewind/metro');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// --- Monorepo ---------------------------------------------------------------
// Metro solo vigila la carpeta del proyecto: sin esto, editar packages/theme
// no recarga la app. Y necesita mirar también el node_modules de la raíz,
// donde pnpm deja los paquetes en modo hoisted (ver .npmrc).
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = false;

// --- NativeWind 5 -----------------------------------------------------------
// `globalClassNamePolyfill` añade la prop `className` a los componentes de
// React Native, para escribir el mismo JSX que en la web.
module.exports = withNativewind(config, { globalClassNamePolyfill: true });
