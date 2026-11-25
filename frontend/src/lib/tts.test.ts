import { afterEach, expect, it, vi } from 'vitest';
import { hablarEnEspanol } from './tts';

class Locucion {
  voice?: SpeechSynthesisVoice;
  lang?: string;
  onstart?: () => void;
  onend?: () => void;
  onerror?: () => void;
  constructor(readonly text: string) {}
}

function prepararVoces(voces: { lang: string; localService: boolean }[]) {
  const sintesis = Object.assign(new EventTarget(), {
    getVoices: () => voces,
    speak: vi.fn<(locucion: Locucion) => void>(),
    cancel: vi.fn(),
  });
  vi.stubGlobal('SpeechSynthesisUtterance', Locucion);
  vi.stubGlobal('speechSynthesis', sintesis);
  return sintesis;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it('prioriza la voz local colombiana y anuncia el inicio y el fin', () => {
  const sintesis = prepararVoces([
    { lang: 'es-CO', localService: false },
    { lang: 'es-ES', localService: true },
    { lang: 'es-CO', localService: true },
  ]);
  const actualizar = vi.fn();
  const cancelar = hablarEnEspanol('Hola.', actualizar);
  const locucion = sintesis.speak.mock.calls[0][0];
  expect(locucion).toMatchObject({
    text: 'Hola.',
    lang: 'es-CO',
    voice: { localService: true },
  });
  locucion.onstart?.();
  locucion.onend?.();
  cancelar?.();
  expect(actualizar.mock.calls.flat()).toEqual([
    'preparando',
    'reproduciendo',
    'terminada',
  ]);
  expect(sintesis.cancel).not.toHaveBeenCalled();
});

it('conserva la alternativa textual cuando solo hay voces remotas', () => {
  vi.useFakeTimers();
  const sintesis = prepararVoces([{ lang: 'es-CO', localService: false }]);
  const actualizar = vi.fn();
  hablarEnEspanol('Hola.', actualizar);
  vi.advanceTimersByTime(1_500);
  expect(actualizar.mock.calls.flat()).toEqual(['preparando', 'noDisponible']);
  expect(sintesis.speak).not.toHaveBeenCalled();
});
