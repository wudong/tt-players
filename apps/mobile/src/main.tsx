import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { AppRouter } from './AppRouter';

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  </StrictMode>,
);
