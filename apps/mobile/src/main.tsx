import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const rememberedTheme = window.localStorage.getItem('TTPlayers-Theme');
if (rememberedTheme === 'dark-mode') {
  document.body.classList.add('theme-dark');
  document.body.classList.remove('theme-light', 'detect-theme');
} else {
  document.body.classList.add('theme-light');
  document.body.classList.remove('theme-dark', 'detect-theme');
}
document.body.setAttribute('data-highlight', 'highlight-red');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
