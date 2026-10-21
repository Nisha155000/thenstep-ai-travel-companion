import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppContent } from './App';
import { LanguageProvider } from './i18n/LanguageContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  </React.StrictMode>
);
