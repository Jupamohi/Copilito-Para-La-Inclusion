import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import { textos } from '../i18n/textos';
import { EstadoProvider } from './estado';
import { AppRoutes } from './router';

const acceso = textos.administracion;
const modelo = textos.modeloAdmin;

function abrir(ruta: string, fetcher: typeof fetch) {
  vi.stubEnv('VITE_USE_MOCK', 'false');
  vi.stubGlobal('fetch', fetcher);
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <EstadoProvider>
        <AppRoutes />
      </EstadoProvider>
    </MemoryRouter>,
  );
}

async function iniciar(clave = 'clave-de-prueba') {
  const usuario = await screen.findByLabelText(acceso.usuario);
  fireEvent.change(usuario, { target: { value: 'admin' } });
  fireEvent.change(screen.getByLabelText(acceso.contrasena), {
    target: { value: clave },
  });
  fireEvent.click(screen.getByRole('button', { name: acceso.entrar }));
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it('protege el acceso, muestra credenciales inválidas, conserva la ruta solicitada y detecta un token vencido', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json({ token: 'token-prueba' }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }));
  abrir('/admin/modelo', fetcher);
  await iniciar('incorrecta');
  expect((await screen.findByRole('alert')).textContent).toBe(
    textos.api.credenciales,
  );
  await iniciar();
  await screen.findByText(textos.api.sesionAdmin);
  expect(screen.getByRole('heading', { name: textos.acceso })).toBeTruthy();
  expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
    '/api/v1/auth/login',
    '/api/v1/auth/login',
    '/api/v1/model',
  ]);
  expect(
    new Headers(fetcher.mock.calls[2][1]?.headers).get('Authorization'),
  ).toBe('Bearer token-prueba');
  expect(
    screen.queryByRole('navigation', { name: acceso.navegacion }),
  ).toBeNull();
});

it('registra un primer modelo, convierte porcentajes y distingue una exactitud igual al 85 %', async () => {
  const nuevo = {
    version: 'v1',
    exactitud: 0.85,
    precision: 0.9,
    sensibilidad: 0.83,
    f1: 0.86,
    umbral: 0.8,
    matriz_confusion: {
      etiquetas: ['HOLA', 'AYUDA'],
      valores: [
        [5, 2],
        [1, 6],
      ],
    },
  };
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ token: 'token-prueba' }))
    .mockResolvedValueOnce(new Response(null, { status: 404 }))
    .mockResolvedValueOnce(Response.json(nuevo));
  abrir('/admin/modelo', fetcher);
  await iniciar();
  fireEvent.click(
    await screen.findByRole('button', { name: modelo.registrar }),
  );
  fireEvent.change(screen.getByLabelText(modelo.version), {
    target: { value: 'v1' },
  });
  for (const [nombre, valor] of [
    ['Exactitud', 85],
    ['Precisión', 90],
    ['Sensibilidad', 83],
    ['F1', 86],
    ['Umbral de confianza', 80],
  ] as const) {
    fireEvent.change(screen.getByLabelText(modelo.medida(nombre)), {
      target: { value: String(valor) },
    });
  }
  fireEvent.change(screen.getByLabelText(modelo.matrizJson), {
    target: { value: JSON.stringify(nuevo.matriz_confusion) },
  });
  fireEvent.click(screen.getByRole('button', { name: modelo.guardar }));
  await screen.findByText(modelo.guardado);
  expect(screen.getByText(modelo.hasta)).toBeTruthy();
  expect(screen.queryByText(modelo.supera)).toBeNull();
  expect(
    within(screen.getByRole('table')).getByRole('rowheader', { name: 'HOLA' }),
  ).toBeTruthy();
  const [url, solicitud] = fetcher.mock.calls[2];
  expect(url).toBe('/api/v1/model');
  expect(solicitud?.method).toBe('PUT');
  expect(JSON.parse(String(solicitud?.body))).toEqual(nuevo);
  fireEvent.click(screen.getByRole('button', { name: acceso.salir }));
  await screen.findByRole('heading', { name: textos.acceso });
  expect(screen.queryByRole('table')).toBeNull();
});
