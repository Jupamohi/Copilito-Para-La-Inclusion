import { expect, it } from 'vitest';
import { inicial, permitePredecir, reducirSena } from './maquina';

const resultado = {
  glosa: 'HOLA',
  texto: 'Hola.',
  confianza: 0.94,
  latenciaMs: 140,
};

it('exige una predicción pendiente y una verificación antes de confirmar', () => {
  expect(reducirSena(inicial, { tipo: 'confirmar' })).toBe(inicial);
  expect(reducirSena(inicial, { tipo: 'mostrar', resultado })).toBe(inicial);
  const pendiente = reducirSena(inicial, { tipo: 'solicitar' });
  expect(permitePredecir(pendiente)).toBe(false);
  const verificacion = reducirSena(pendiente, { tipo: 'mostrar', resultado });
  expect(reducirSena(verificacion, { tipo: 'descartar' })).toBe(inicial);
  const confirmada = reducirSena(verificacion, { tipo: 'confirmar' });
  expect(reducirSena(confirmada, { tipo: 'confirmar' })).toBe(confirmada);
  expect(
    permitePredecir(
      reducirSena(confirmada, { tipo: 'voz', estado: 'reproduciendo' }),
    ),
  ).toBe(false);
  const terminada = reducirSena(confirmada, {
    tipo: 'voz',
    estado: 'terminada',
  });
  expect(terminada).toMatchObject({ resultado });
  expect(permitePredecir(terminada)).toBe(true);
});

it('conserva la latencia de un rechazo y permite un nuevo intento', () => {
  const pendiente = reducirSena(inicial, { tipo: 'solicitar' });
  const rechazo = reducirSena(pendiente, { tipo: 'rechazar', latenciaMs: 150 });
  expect(rechazo).toEqual({ fase: 'rechazada', latenciaMs: 150 });
  expect(reducirSena(rechazo, { tipo: 'solicitar' })).toEqual({
    fase: 'prediciendo',
  });
});
