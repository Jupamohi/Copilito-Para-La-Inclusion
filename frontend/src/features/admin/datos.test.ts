import { expect, it } from 'vitest';
import { leerModelo, leerVectorMuestra, metricas } from './datos';

it('extrae únicamente un vector con 126 valores numéricos finitos', () => {
  const vector = Array.from({ length: 126 }, (_, i) => (i % 21) / 20);
  expect(leerVectorMuestra(JSON.stringify(vector))).toEqual(vector);
  expect(
    leerVectorMuestra(JSON.stringify({ vector, otro: 'dato ajeno' })),
  ).toEqual(vector);
  expect(() => leerVectorMuestra(JSON.stringify(vector.slice(0, 63)))).toThrow(
    expect.objectContaining({ codigo: 'archivoMuestraInvalido' }),
  );
  expect(() =>
    leerVectorMuestra(JSON.stringify({ vector: ['0', ...vector.slice(1)] })),
  ).toThrow(expect.objectContaining({ codigo: 'archivoMuestraInvalido' }));
  expect(() => leerVectorMuestra('archivo ilegible')).toThrow(
    expect.objectContaining({ codigo: 'archivoMuestraInvalido' }),
  );
});

it('conserva decimales y valida clase por fila y columna, valores y porcentajes de un modelo', () => {
  const formulario = new FormData();
  formulario.set('version', '  v2  ');
  for (const metrica of metricas) formulario.set(metrica, '85.01');
  formulario.set(
    'matriz_confusion',
    JSON.stringify({
      etiquetas: ['Hola', 'Ayuda'],
      valores: [
        [0.6, 0.4],
        [0.2, 0.8],
      ],
    }),
  );
  const modelo = leerModelo(formulario);
  expect(modelo.version).toBe('v2');
  expect(modelo.exactitud).toBeCloseTo(0.8501, 10);
  expect(modelo.umbral).toBeCloseTo(0.8501, 10);
  formulario.set('umbral', '101');
  expect(() => leerModelo(formulario)).toThrow(
    expect.objectContaining({ codigo: 'modeloInvalido' }),
  );
  formulario.set('umbral', '80');
  formulario.set(
    'matriz_confusion',
    JSON.stringify({ etiquetas: ['Hola', 'Ayuda'], valores: [[1, 2], [3]] }),
  );
  expect(() => leerModelo(formulario)).toThrow(
    expect.objectContaining({ codigo: 'matrizInvalida' }),
  );
});
