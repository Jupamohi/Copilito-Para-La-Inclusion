import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { EstadoProvider, useEstado } from '../../../app/estado';
import { hablarEnEspanol } from '../../../lib/tts';
import type { DetectedHand } from '../../../lib/vector';
import { useTurnoSena } from './useTurnoSena';

vi.mock('../../../lib/tts', () => ({ hablarEnEspanol: vi.fn() }));

const sesion = { session_id: 'sesion-1', inicio: '2026-11-23T14:00:00Z' };
const izquierda: DetectedHand = {
  handedness: 'Left',
  landmarks: Array.from({ length: 21 }, (_, i) => ({
    x: i / 40,
    y: 0.5,
    z: -0.1,
  })),
};
const derecha: DetectedHand = {
  handedness: 'Right',
  landmarks: Array.from({ length: 21 }, (_, i) => ({
    x: 0.5,
    y: i / 40,
    z: -0.1,
  })),
};

beforeEach(() => {
  vi.stubEnv('VITE_USE_MOCK', 'false');
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function abrirTurno(fetcher: typeof fetch) {
  vi.stubGlobal('fetch', fetcher);
  const turno = renderHook(
    () => ({ ...useTurnoSena(sesion.session_id), app: useEstado() }),
    {
      wrapper: EstadoProvider,
    },
  );
  act(() =>
    turno.result.current.app.dispatch({
      type: 'sesion',
      sesion,
      camaraId: null,
    }),
  );
  return turno;
}

it('solo envía el vector y registra en memoria una confirmación con su latencia', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      seña: 'GRACIAS',
      texto: 'Muchas gracias.',
      confianza: 0.86,
      aceptada: true,
    }),
  );
  const detener = vi.fn();
  vi.mocked(hablarEnEspanol).mockImplementation((_texto, estado) => {
    estado('reproduciendo');
    return detener;
  });
  const { result, unmount } = abrirTurno(fetcher);
  await act(() => result.current.reconocer([derecha, izquierda]));
  const [url, peticion] = fetcher.mock.calls[0];
  const datos = JSON.parse(String(peticion?.body));
  expect(url).toBe('/api/v1/predict');
  expect(Object.keys(datos)).toEqual(['session_id', 'vector']);
  expect(datos.vector).toHaveLength(126);
  expect(datos.vector.slice(60, 63)).toEqual([1, 0, 0]);
  expect(datos.vector.slice(123)).toEqual([0, 1, 0]);

  act(() => {
    result.current.confirmar();
    result.current.confirmar();
  });
  expect(hablarEnEspanol).toHaveBeenCalledExactlyOnceWith(
    'Muchas gracias.',
    expect.any(Function),
  );
  expect(result.current.estado).toMatchObject({
    fase: 'confirmada',
    voz: 'reproduciendo',
  });
  expect(result.current.app.estado.intervencionesPendientes).toEqual([
    {
      interlocutor: 'sordo',
      tipo: 'seña',
      texto: 'Muchas gracias.',
      confianza: 0.86,
      confirmada: true,
      latencia_ms: expect.any(Number),
    },
  ]);
  expect(fetcher).toHaveBeenCalledTimes(1);
  unmount();
  expect(detener).toHaveBeenCalledTimes(1);
});

it('respeta aceptada y deja descartar una sugerencia sin reproducir ni registrar', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      Response.json({ seña: 'HOLA', confianza: 0.91, aceptada: false }),
    )
    .mockResolvedValueOnce(
      Response.json({ seña: 'HOLA', confianza: 0.86, aceptada: true }),
    );
  const { result } = abrirTurno(fetcher);
  await act(() => result.current.reconocer([izquierda]));
  expect(result.current.estado).toMatchObject({
    fase: 'rechazada',
    latenciaMs: expect.any(Number),
  });
  await act(() => result.current.reconocer([izquierda]));
  expect(result.current.estado).toMatchObject({
    fase: 'verificar',
    resultado: { texto: 'HOLA' },
  });
  act(() => result.current.descartar());
  expect(result.current.estado).toEqual({ fase: 'lista' });
  expect(result.current.app.estado.intervencionesPendientes).toEqual([]);
  expect(hablarEnEspanol).not.toHaveBeenCalled();
});

it('omite la petición sin puntos utilizables y cancela la predicción al salir del turno', async () => {
  const fetcher = vi.fn<typeof fetch>().mockImplementation(
    (_url, init) =>
      new Promise((_, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(init.signal?.reason),
          { once: true },
        );
      }),
  );
  const { result, unmount } = abrirTurno(fetcher);
  await act(() => result.current.reconocer([]));
  expect(result.current.estado).toMatchObject({ fase: 'error' });
  expect(fetcher).not.toHaveBeenCalled();
  let operacion: Promise<void> | undefined;
  act(() => {
    operacion = result.current.reconocer([izquierda]);
  });
  expect(result.current.estado).toMatchObject({ fase: 'prediciendo' });
  const signal = fetcher.mock.calls[0][1]?.signal;
  unmount();
  await operacion;
  expect(signal?.aborted).toBe(true);
});
