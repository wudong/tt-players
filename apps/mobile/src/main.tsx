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

const rememberedHighlight = window.localStorage.getItem('TTPlayers-Highlight') ?? 'red';
document.body.setAttribute('data-highlight', `highlight-${rememberedHighlight}`);

const existingHighlightLinks = document.querySelectorAll('link.page-highlight');
existingHighlightLinks.forEach((link) => link.remove());

const highlightStylesheet = document.createElement('link');
highlightStylesheet.rel = 'stylesheet';
highlightStylesheet.className = 'page-highlight';
highlightStylesheet.type = 'text/css';
highlightStylesheet.href = `/appkit/styles/highlights/highlight_${rememberedHighlight}.css`;
document.head.appendChild(highlightStylesheet);

const rememberedGradient = window.localStorage.getItem('TTPlayers-Gradient') ?? 'default';
document.body.setAttribute('data-gradient', `body-${rememberedGradient}`);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
