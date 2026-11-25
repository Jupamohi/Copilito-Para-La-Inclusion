import { expect, it } from 'vitest';
import { inicialVoz, reducirVoz } from './maquina';

it('exige detener y confirmar la transcripción antes de traducir', () => {
  expect(reducirVoz(inicialVoz, { tipo: 'traducir' })).toBe(inicialVoz);
  const permiso = reducirVoz(inicialVoz, { tipo: 'pedir' });
  const grabando = reducirVoz(permiso, { tipo: 'grabar' });
  const enviando = reducirVoz(grabando, { tipo: 'enviar' });
  const transcripcion = { texto: 'Hola.', latenciaMs: 10 };
  const revisando = reducirVoz(enviando, { tipo: 'verificar', transcripcion });
  expect(reducirVoz(revisando, { tipo: 'repetir' })).toBe(inicialVoz);
  const traduciendo = reducirVoz(revisando, { tipo: 'traducir' });
  const error = reducirVoz(traduciendo, { tipo: 'error', mensaje: 'Error.' });
  expect(error).toMatchObject({ fase: 'error', transcripcion });
  const reintento = reducirVoz(error, { tipo: 'traducir' });
  const secuencia = [
    {
      palabra: 'Hola.',
      glosa: 'HOLA',
      animacion: null,
      fuera_de_vocabulario: false as const,
    },
  ];
  expect(reducirVoz(reintento, { tipo: 'traducida', secuencia })).toEqual({
    fase: 'traducida',
    transcripcion,
    secuencia,
  });
});
