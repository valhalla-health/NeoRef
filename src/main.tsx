import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Self-hosted fonts (no CDN) — fixes AUDIT S-4 (offline) and the PDPA leak from
// Google Fonts. vite-plugin-pwa precaches these .woff2 files.
import '@fontsource-variable/source-sans-3/index.css';
import '@fontsource-variable/jetbrains-mono/index.css';
import '@fontsource/sarabun/400.css';
import '@fontsource/sarabun/600.css';
import '@fontsource/sarabun/700.css';

import './theme/global.css';
import { App } from './App';
import { AuthProvider } from './features/auth/AuthContext';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
