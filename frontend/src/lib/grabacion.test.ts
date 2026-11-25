import { afterEach, expect, it, vi } from 'vitest';
import { iniciarGrabacion } from './grabacion';

class Grabador {
  static isTypeSupported(tipo: string) {
    return tipo.startsWith('audio/webm');
  }
  state = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable?: (evento: { data: Blob }) => void;
  onstop?: () => void;
  onerror?: () => void;
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({
      data: new Blob(['audio'], { type: this.mimeType }),
    });
    this.onstop?.();
  }
}

const descriptor = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');

function preparar() {
  vi.stubGlobal('MediaRecorder', Grabador);
  const pista = { stop: vi.fn(), readyState: 'live' };
  const getUserMedia = vi
    .fn()
    .mockResolvedValue({
      getTracks: () => [pista],
      getAudioTracks: () => [pista],
    });
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });
  return { pista, getUserMedia };
}

afterEach(() => {
  vi.unstubAllGlobals();
  if (descriptor) Object.defineProperty(navigator, 'mediaDevices', descriptor);
  else Reflect.deleteProperty(navigator, 'mediaDevices');
});

it('pide solo audio, entrega un Blob una vez y libera la pista al detener', async () => {
  const { pista, getUserMedia } = preparar();
  const entregar = vi.fn();
  const detener = await iniciarGrabacion(
    new AbortController().signal,
    entregar,
    vi.fn(),
  );
  expect(getUserMedia).toHaveBeenCalledExactlyOnceWith({
    audio: true,
    video: false,
  });
  detener();
  detener();
  expect(entregar).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ type: 'audio/webm', size: 5 }),
  );
  expect(pista.stop).toHaveBeenCalledTimes(1);
});

it('suelta la pista y descarta el audio si se cancela el turno', async () => {
  const { pista } = preparar();
  const control = new AbortController();
  const entregar = vi.fn();
  const detener = await iniciarGrabacion(control.signal, entregar, vi.fn());
  control.abort();
  detener();
  expect(entregar).not.toHaveBeenCalled();
  expect(pista.stop).toHaveBeenCalledTimes(1);
});
