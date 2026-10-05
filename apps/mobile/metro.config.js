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
// Local SDKs, emulators and native build output are not JavaScript sources.
// Excluding them keeps a cold monorepo crawl from indexing generated artifacts.
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
    ...(Array.isArray(existingBlockList)
        ? existingBlockList
        : existingBlockList
          ? [existingBlockList]
          : []),
    /[/\\](?:\.tools|\.git|\.gradle|\.cxx)[/\\]/,
    /[/\\]android[/\\](?:build|app[/\\]build)[/\\]/,
];

// --- `@navis/api-client` va a su fuente, no a su `dist` ---------------------
// Mismo problema que resuelve el alias de `vite.config.ts` en la web (léelo
// ahí): su `dist` es CommonJS, y al hacer `require('@tanstack/react-query')`
// desde ese `.js` compilado, Metro puede resolverlo a una condición de paquete
// distinta de la que usa `import` en el código fuente de la app — dos módulos
// de React Query, cada uno con su propio `QueryClientContext`, y los hooks de
// `useDashboardSummary` quedaban «fuera» del `QueryClientProvider` de verdad
// («No QueryClient set»). Desde el fuente, los dos importan el mismo módulo.
//
// Solo este paquete: es el único que trae un hook de React Query. Los demás
// (`@navis/shared`, `@navis/i18n`, `@navis/theme`) se quedan resolviendo a su
// `dist`, que es lo que ya espera el resto de este fichero (`watchFolders`
// vigila ese `dist` para recargar en caliente al reconstruirlo).
const API_CLIENT_SOURCE = path.resolve(workspaceRoot, 'packages/api-client/src/index.ts');
const TEXT_DEFAULTS = path.resolve(projectRoot, 'src/lib/ui/react-native-fonts.tsx');
const previousResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === '@navis/api-client') {
        return { type: 'sourceFile', filePath: API_CLIENT_SOURCE };
    }
    // El plugin de Babel de NativeWind reescribe `import { Text } from
    // 'react-native'` a `react-native-css/components/Text`; aquí se pone en
    // medio un módulo que lo reexporta con Poppins por defecto (léelo en
    // `react-native-fonts.tsx`). El propio módulo importa el original, así que
    // no se redirige a sí mismo.
    if (
        moduleName === 'react-native-css/components/Text' &&
        context.originModulePath !== TEXT_DEFAULTS
    ) {
        return { type: 'sourceFile', filePath: TEXT_DEFAULTS };
    }
    if (previousResolveRequest) return previousResolveRequest(context, moduleName, platform);
    return context.resolveRequest(context, moduleName, platform);
};

// --- NativeWind 5 -----------------------------------------------------------
// `globalClassNamePolyfill` añade la prop `className` a los componentes de
// React Native, para escribir el mismo JSX que en la web.
module.exports = withNativewind(config, { globalClassNamePolyfill: true });
