import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { Palabra } from '../../api/tipos';
import { Avatar3D } from './Avatar3D';

vi.mock('./EscenaAvatar', () => ({
  default: ({ alFallar }: { alFallar: () => void }) => (
    <button type="button" onClick={alFallar}>
      Simular WebGL no disponible
    </button>
  ),
}));

const secuencia: Palabra[] = [
  {
    palabra: 'Hola',
    glosa: 'HOLA',
    animacion: null,
    fuera_de_vocabulario: false,
  },
  { palabra: 'profe', fuera_de_vocabulario: true },
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('permite recorrer y repetir la secuencia textual con movimiento reducido y sin WebGL', async () => {
  vi.stubGlobal('matchMedia', () =>
    Object.assign(new EventTarget(), { matches: true }),
  );
  render(<Avatar3D frase="Hola profe" secuencia={secuencia} />);
  await screen.findByText('Glosa actual: HOLA');
  fireEvent.click(
    await screen.findByRole('button', { name: 'Simular WebGL no disponible' }),
  );
  expect(screen.queryByRole('button', { name: 'Pausar' })).toBeNull();
  expect(screen.getByText(/El avatar 3D no está disponible/)).toBeTruthy();
  expect(screen.getByText('Hola profe')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente glosa' }));
  expect(screen.getAllByText('Fuera de vocabulario: profe')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Repetir secuencia' }));
  expect(screen.getByText('Glosa actual: HOLA')).toBeTruthy();
});
