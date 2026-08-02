import { createQueryClient } from '@pastortools/api-client';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { RouterProvider } from 'react-router';

import { PwaUpdatePrompt } from '@/components/pwa-update-prompt';
import { i18n } from '@/lib/i18n';
import '@/lib/theme'; // inicializa el tema (clase `dark`) antes del primer render
import { router } from '@/router';
import '@/styles/global.css';

const queryClient = createQueryClient();
const container = document.getElementById('root');

if (!container) throw new Error('No se encontró #root en index.html');

createRoot(container).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <PwaUpdatePrompt />
      </QueryClientProvider>
    </I18nextProvider>
  </StrictMode>,
);
