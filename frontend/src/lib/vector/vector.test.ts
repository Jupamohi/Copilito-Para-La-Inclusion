import { expect, it } from 'vitest';
import { adaptarManos } from '../mediapipe/adaptarManos';
import { countHands, landmarksToVector } from '.';
import type { DetectedHand } from '.';

const izquierda: DetectedHand = {
  handedness: 'Left',
  landmarks: Array.from({ length: 21 }, (_, indice) => ({
    x: 0.25 + indice / 80,
    y: 0.5,
    z: -0.125,
  })),
};
const derecha: DetectedHand = {
  handedness: 'Right',
  landmarks: Array.from({ length: 21 }, (_, indice) => ({
    x: 0.4,
    y: 0.3 - indice / 40,
    z: 0.7,
  })),
};
const bloqueVacio = Array(63).fill(0);

it('rellena el vector sin manos y cuenta las detecciones válidas', () => {
  expect(landmarksToVector([])).toEqual(Array(126).fill(0));
  expect(countHands([])).toBe(0);
  expect(countHands([izquierda])).toBe(1);
  expect(countHands([izquierda, derecha])).toBe(2);
  expect(countHands([{ landmarks: [] }])).toBe(0);
});

it('coloca una mano en su bloque y rellena el otro con ceros', () => {
  const soloIzquierda = landmarksToVector([izquierda]);
  const soloDerecha = landmarksToVector([derecha]);
  expect(soloIzquierda).toHaveLength(126);
  expect(soloIzquierda.slice(63)).toEqual(bloqueVacio);
  expect(soloDerecha).toHaveLength(126);
  expect(soloDerecha.slice(0, 63)).toEqual(bloqueVacio);
  expect(soloIzquierda.slice(0, 3)).toEqual([0, 0, 0]);
  expect(soloIzquierda.slice(60, 63)).toEqual([1, 0, 0]);
  expect(soloDerecha.slice(123)).toEqual([0, -1, 0]);
});

it('preserva el orden anatómico y la escala al desplazar o ampliar los puntos', () => {
  const vector = landmarksToVector([derecha, izquierda]);
  expect(vector).toEqual(landmarksToVector([izquierda, derecha]));
  const ajustada = derecha.landmarks.map(({ x, y, z }) => ({
    x: x * 2 + 0.1,
    y: y * 2 + 0.1,
    z: z * 2 + 0.1,
  }));
  landmarksToVector([{ ...derecha, landmarks: ajustada }, izquierda]).forEach(
    (valor, indice) => {
      expect(valor).toBeCloseTo(vector[indice], 10);
    },
  );
});

it('omite puntos no finitos, manos sin escala y el duplicado de menor confianza', () => {
  const duplicado = {
    ...derecha,
    handedness: 'Left' as const,
    confianzaLateralidad: 0.5,
  };
  const mejor = { ...izquierda, confianzaLateralidad: 0.95 };
  expect(landmarksToVector([duplicado, mejor])).toEqual(
    landmarksToVector([mejor]),
  );
  expect(landmarksToVector([mejor, duplicado])).toEqual(
    landmarksToVector([mejor]),
  );
  const coincidentes = Array.from({ length: 21 }, () => ({ x: 1, y: 1, z: 1 }));
  const corruptos = [{ x: NaN, y: 1, z: 1 }, ...coincidentes.slice(1)];
  expect(
    landmarksToVector([
      { ...izquierda, landmarks: coincidentes },
      { ...derecha, landmarks: corruptos },
    ]),
  ).toEqual(landmarksToVector([]));
});

it('corrige la lateralidad y x únicamente si se espejó el fotograma de entrada', () => {
  const deteccion = {
    landmarks: [
      izquierda.landmarks.map(({ x, y, z }) => ({
        x: 1 - x,
        y,
        z,
        visibility: 1,
      })),
    ],
    handedness: [
      [{ index: 0, categoryName: 'Right', displayName: 'Right', score: 0.99 }],
    ],
    luzSuficiente: true,
  };
  expect(adaptarManos(deteccion)[0].handedness).toBe('Right');
  const corregido = adaptarManos(deteccion, true);
  expect(corregido[0].handedness).toBe('Left');
  landmarksToVector(corregido).forEach((valor, indice) => {
    expect(valor).toBeCloseTo(landmarksToVector([izquierda])[indice], 10);
  });
});
