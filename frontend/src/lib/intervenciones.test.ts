import { expect, it, vi } from 'vitest';
import type { Intervencion } from '../api/tipos';
import { crearRegistroDeIntervenciones } from './intervenciones';

const primero: Intervencion = {
  interlocutor: 'sordo',
  tipo: 'seña',
  texto: 'Hola.',
  confianza: 0.89,
  confirmada: true,
  latencia_ms: 9,
};
const segundo: Intervencion = {
  interlocutor: 'oyente',
  tipo: 'voz',
  texto: 'Gracias.',
  confianza: null,
  confirmada: true,
  latencia_ms: 20,
};

it('conserva los acuses en orden y al reintentar solo reenvía la intervención fallida', async () => {
  const registrarIntervencion = vi
    .fn()
    .mockResolvedValueOnce({ id: '1' })
    .mockRejectedValueOnce(new Error())
    .mockResolvedValueOnce({ id: '2' });
  const alRegistrar = vi.fn();
  const guardar = crearRegistroDeIntervenciones(
    { registrarIntervencion },
    alRegistrar,
  );
  await expect(guardar('sesion', [primero, segundo])).rejects.toThrow();
  await guardar('sesion', [primero, segundo]);
  expect(registrarIntervencion.mock.calls).toEqual([
    ['sesion', primero],
    ['sesion', segundo],
    ['sesion', segundo],
  ]);
  expect(alRegistrar.mock.calls).toEqual([
    ['sesion', primero, '1'],
    ['sesion', segundo, '2'],
  ]);
});

it('comparte el mismo envío entre solicitudes coincidentes', async () => {
  const registrarIntervencion = vi.fn().mockResolvedValue({ id: '1' });
  const alRegistrar = vi.fn();
  const guardar = crearRegistroDeIntervenciones(
    { registrarIntervencion },
    alRegistrar,
  );
  await Promise.all([
    guardar('sesion', [primero]),
    guardar('sesion', [primero]),
  ]);
  expect(registrarIntervencion).toHaveBeenCalledTimes(1);
  expect(alRegistrar).toHaveBeenCalledTimes(1);
});
