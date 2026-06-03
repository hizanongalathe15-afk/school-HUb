import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './global.css';
import { registerServiceWorkerWhenIdle, unregisterServiceWorker } from './utils/swManager';

import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/i18n';
import { getInitialLanguage, changeLanguage } from './i18n/Language';
import { isRTL } from './i18n/settings';

// Initialize language and direction
const initialLanguage = getInitialLanguage();
changeLanguage(initialLanguage);

// Set initial RTL direction
if (typeof document !== 'undefined') {
  document.documentElement.dir = isRTL(initialLanguage) ? 'rtl' : 'ltr';
  document.documentElement.lang = initialLanguage;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

// Keep Vite development free of service-worker interception; enable offline support in production builds.
if (import.meta.env.DEV) {
  unregisterServiceWorker().catch(() => undefined);
} else {
  registerServiceWorkerWhenIdle();
}
