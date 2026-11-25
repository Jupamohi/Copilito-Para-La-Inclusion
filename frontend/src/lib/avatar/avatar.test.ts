import { expect, it } from 'vitest';
import { duracionBaseMs, iniciarCola, reducirCola } from './cola';
import { resolverFuente } from './fuentes';
import { interpolarPose, leerPoses } from './poses';

it('respeta pausa, velocidad lenta, el orden de la secuencia y la repetición', () => {
  let actual = iniciarCola(false);
  const avanzar = (deltaMs: number) => {
    actual = reducirCola(actual, { tipo: 'avanzar', longitud: 3, deltaMs });
  };
  actual = reducirCola(actual, { tipo: 'velocidad', velocidad: 'lenta' });
  avanzar(duracionBaseMs);
  expect(actual).toMatchObject({ indice: 0, tiempoMs: duracionBaseMs / 2 });
  actual = reducirCola(actual, { tipo: 'pausar' });
  avanzar(duracionBaseMs);
  expect(actual).toMatchObject({ indice: 0, tiempoMs: duracionBaseMs / 2 });
  actual = reducirCola(actual, { tipo: 'continuar' });
  avanzar(duracionBaseMs);
  expect(actual).toMatchObject({ indice: 1, tiempoMs: 0 });
  avanzar(duracionBaseMs * 2);
  expect(actual.indice).toBe(2);
  avanzar(duracionBaseMs * 2);
  expect(actual.modo).toBe('terminada');
  actual = reducirCola(actual, { tipo: 'repetir', pasoAPaso: false });
  expect(actual).toMatchObject({
    indice: 0,
    vuelta: 1,
    modo: 'reproduciendo',
    velocidad: 'lenta',
  });
});

it('permite ver una glosa a la vez con movimiento reducido', () => {
  const actual = iniciarCola(true);
  expect(
    reducirCola(actual, { tipo: 'avanzar', longitud: 2, deltaMs: 9000 }),
  ).toBe(actual);
  const segundo = reducirCola(actual, { tipo: 'siguiente', longitud: 2 });
  expect(segundo).toMatchObject({ indice: 1, modo: 'pausada' });
  expect(reducirCola(segundo, { tipo: 'siguiente', longitud: 2 }).modo).toBe(
    'terminada',
  );
});

it('admite clips y poses locales y usa gesto genérico con otras rutas', () => {
  expect(resolverFuente('saludo.glb#Hola%20LSC')).toMatchObject({
    formato: 'gltf',
    clip: 'Hola LSC',
  });
  expect(resolverFuente('/avatar/poses.json')).toMatchObject({
    formato: 'poses',
  });
  expect(resolverFuente('../otro.glb')).toEqual({ formato: 'generico' });
  expect(resolverFuente('https://ejemplo.test/avatar/poses.json')).toEqual({
    formato: 'generico',
  });
});

it('valida e interpola los fotogramas por articulación', () => {
  const fotogramas = leerPoses({
    fotogramas: [
      { tiempo_ms: 0, rotaciones: { LeftElbow: [0, 0, 0] } },
      {
        tiempo_ms: 1000,
        rotaciones: { LeftElbow: [2, 0, 0], RightIndex1: [0, 0, 1] },
      },
    ],
  });
  expect(interpolarPose(fotogramas, 500)).toEqual({
    LeftElbow: [1, 0, 0],
    RightIndex1: [0, 0, 0.5],
  });
  expect(() =>
    leerPoses({
      fotogramas: [
        { tiempo_ms: 1, rotaciones: {} },
        { tiempo_ms: 0, rotaciones: {} },
      ],
    }),
  ).toThrow();
});
