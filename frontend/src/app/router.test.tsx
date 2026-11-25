import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { EstadoProvider } from './estado';
import { AppRoutes } from './router';

afterEach(cleanup);

it.each([
  ['/preparacion', false, 'Bienvenida y consentimiento'],
  ['/conversacion', false, 'Bienvenida y consentimiento'],
  ['/admin/catalogo', false, 'Acceso del administrador'],
  ['/admin/ruta-desconocida', false, 'Acceso del administrador'],
  ['/sus', false, 'Página no encontrada'],
  ['/sus', true, 'Cuestionario de usabilidad'],
] as const)('gestiona %s con piloto=%s', async (ruta, piloto, titulo) => {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <EstadoProvider>
        <AppRoutes piloto={piloto} />
      </EstadoProvider>
    </MemoryRouter>,
  );
  const encabezado = await screen.findByRole('heading', {
    level: 1,
    name: titulo,
  });
  expect(document.activeElement).toBe(encabezado);
});

it('no detecta infracciones automáticas de accesibilidad en el layout inicial', async () => {
  const { container } = render(
    <MemoryRouter>
      <EstadoProvider>
        <AppRoutes />
      </EstadoProvider>
    </MemoryRouter>,
  );
  // El contraste se verifica por separado. jsdom no renderiza los colores de la página.
  const resultado = await axe(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(resultado.violations).toEqual([]);
});
