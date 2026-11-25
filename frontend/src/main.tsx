import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { EstadoProvider } from './app/estado';
import { AppRoutes } from './app/router';
import './styles/tokens.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <EstadoProvider><AppRoutes /></EstadoProvider>
    </BrowserRouter>
  </StrictMode>,
);
