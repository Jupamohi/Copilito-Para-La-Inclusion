import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useLayoutEffect, useState } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import type { Intervencion } from '../api/tipos';
import { textos } from '../i18n/textos';
import { EstadoProvider, useEstado } from './estado';
import { AppRoutes } from './router';

type Preparacion = 'bienvenida' | 'consentida' | 'activa' | 'finalizada';
const sesion = {
  session_id: 'sesion-a11y',
  inicio: '2026-11-23T19:00:00.000Z',
};
const intervencion: Intervencion = {
  interlocutor: 'sordo',
  tipo: 'seña',
  texto: 'Hola.',
  confianza: 0.9,
  confirmada: true,
  latencia_ms: 12,
};

function Preparar({ fase }: { fase: Preparacion }) {
  const { dispatch } = useEstado();
  const [lista, setLista] = useState(false);
  useLayoutEffect(() => {
    if (fase !== 'bienvenida')
      dispatch({ type: 'consentimiento', participante: 'participante-a11y' });
    if (fase === 'activa' || fase === 'finalizada')
      dispatch({ type: 'sesion', sesion, camaraId: null });
    if (fase === 'finalizada') {
      const sesionId = sesion.session_id;
      dispatch({
        type: 'confirmarIntervencion',
        sesionId,
        datos: intervencion,
      });
      dispatch({
        type: 'registrarIntervencion',
        sesionId,
        datos: intervencion,
        id: 'i-a11y',
      });
      dispatch({
        type: 'cierre',
        sesionId,
        cierre: { fase: 'finalizada', duracionMs: 65_000 },
      });
    }
    setLista(true);
  }, [dispatch, fase]);
  return lista ? <AppRoutes piloto /> : null;
}

function abrir(ruta: string, fase: Preparacion = 'bienvenida') {
  vi.stubEnv('VITE_USE_MOCK', 'true');
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <EstadoProvider>
        <Preparar fase={fase} />
      </EstadoProvider>
    </MemoryRouter>,
  );
}

async function comprobar(contenedor: HTMLElement) {
  // jsdom carece de renderizado visual. Se verifica el contraste en Chromium.
  const resultado = await axe(contenedor, {
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(
    resultado.violations.map(({ id, nodes }) => ({
      id,
      elementos: nodes.map(({ target }) => target),
    })),
  ).toEqual([]);
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it.each([
  ['/consentimiento', 'bienvenida', textos.bienvenida],
  ['/preparacion', 'consentida', textos.preparacion],
  ['/conversacion', 'activa', textos.conversacion],
  ['/cierre', 'finalizada', textos.resumen.finalizada],
  ['/sus', 'finalizada', textos.sus],
  ['/retirar-consentimiento', 'bienvenida', textos.revocar],
  ['/admin/login', 'bienvenida', textos.acceso],
] as const)(
  'revisa la estructura accesible de %s',
  async (ruta, fase, titulo) => {
    const { container } = abrir(ruta, fase);
    await screen.findByRole('heading', { name: titulo });
    await comprobar(container);
  },
  10_000,
);

it('revisa el control de turno y los estados visibles del modo voz', async () => {
  const { container } = abrir('/conversacion', 'activa');
  fireEvent.click(
    await screen.findByRole('button', { name: textos.turnos.pasarAVoz }),
  );
  await screen.findByRole('button', { name: textos.voz.hablar });
  expect(
    screen.getAllByRole('button', { name: /Cambiar al turno/ }),
  ).toHaveLength(1);
  expect(screen.getByText(textos.voz.estados.lista)).toBeTruthy();
  await comprobar(container);
}, 10_000);

it.each([
  ['/admin/catalogo', textos.catalogo, /Ver animación de HOLA/, 'button'],
  ['/admin/muestras', textos.muestras, /^Seña$/, 'combobox'],
  ['/admin/modelo', textos.modelo, /Filas de clases reales/, 'table'],
] as const)(
  'revisa los elementos interactivos de %s',
  async (ruta, titulo, nombre, rol) => {
    const { container } = abrir(ruta);
    fireEvent.change(
      await screen.findByLabelText(textos.administracion.usuario),
      { target: { value: 'admin' } },
    );
    fireEvent.change(screen.getByLabelText(textos.administracion.contrasena), {
      target: { value: 'copilito-demo' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: textos.administracion.entrar }),
    );
    await screen.findByRole('heading', { name: titulo });
    await screen.findByRole(rol, { name: nombre });
    await comprobar(container);
  },
  10_000,
);

