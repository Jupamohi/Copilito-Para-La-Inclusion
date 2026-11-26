import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { StrictMode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { textos } from '../i18n/textos';
import { observarManos } from '../lib/mediapipe/detector';
import { EstadoProvider } from './estado';
import { AppRoutes } from './router';

vi.mock('../lib/mediapipe/detector', () => ({ observarManos: vi.fn() }));

const consentimiento = textos.consentimiento;
const dispositivos = textos.dispositivos;
const getUserMedia = vi.fn<MediaDevices['getUserMedia']>();
const descriptor = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');

function dispositivo(id: string, label: string): MediaDeviceInfo {
  const datos = {
    deviceId: id,
    groupId: '',
    kind: 'videoinput' as const,
    label,
  };
  return { ...datos, toJSON: () => datos };
}

function camara(id: string) {
  const pista = Object.assign(new EventTarget(), {
    stop: vi.fn(),
    readyState: 'live',
    getSettings: () => ({ deviceId: id }),
  });
  const stream = {
    getTracks: () => [pista],
    getVideoTracks: () => [pista],
  } as unknown as MediaStream;
  return { pista, stream };
}

beforeEach(() => {
  vi.stubEnv('VITE_USE_MOCK', 'true');
  getUserMedia.mockReset();
  vi.mocked(observarManos).mockReset();
  vi.mocked(observarManos).mockReturnValue(vi.fn());
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia,
      enumerateDevices: async () => [
        dispositivo('a', 'Cámara A'),
        dispositivo('b', 'Cámara B'),
      ],
    },
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (descriptor) Object.defineProperty(navigator, 'mediaDevices', descriptor);
  else Reflect.deleteProperty(navigator, 'mediaDevices');
});

function abrirBienvenida() {
  render(
    <StrictMode>
      <MemoryRouter initialEntries={['/consentimiento']}>
        <EstadoProvider>
          <AppRoutes />
        </EstadoProvider>
      </MemoryRouter>
    </StrictMode>,
  );
}

async function aceptar() {
  fireEvent.click(
    screen.getByRole('checkbox', { name: consentimiento.aceptacion }),
  );
  fireEvent.click(screen.getByRole('button', { name: consentimiento.aceptar }));
  await screen.findByRole('heading', { name: consentimiento.guardado });
}

function informar(manos: 0 | 1 | 2, luzSuficiente: boolean) {
  const recibir = vi.mocked(observarManos).mock.lastCall?.[1];
  if (!recibir) throw new Error('No se inició el detector de prueba.');
  const puntos = Array.from({ length: 21 }, () => ({
    x: 0,
    y: 0,
    z: 0,
    visibility: 1,
  }));
  act(() =>
    recibir({
      landmarks: Array.from({ length: manos }, () => puntos),
      handedness: [],
      luzSuficiente,
    }),
  );
}

it('permite rechazar y volver a leer sin solicitar acceso a la cámara', () => {
  abrirBienvenida();
  const boton = screen.getByRole<HTMLButtonElement>('button', {
    name: consentimiento.aceptar,
  });
  expect(boton.disabled).toBe(true);
  fireEvent.click(
    screen.getByRole('button', { name: consentimiento.noAceptar }),
  );
  expect(screen.getByRole('heading', { name: consentimiento.rechazado })).toBe(
    document.activeElement,
  );
  fireEvent.click(
    screen.getByRole('button', { name: consentimiento.volverALeer }),
  );
  expect(
    screen.getByRole('checkbox', { name: consentimiento.aceptacion }),
  ).toBeTruthy();
  expect(getUserMedia).not.toHaveBeenCalled();
});

it('muestra un error de consentimiento del servidor y permite volver a enviar', async () => {
  vi.stubEnv('VITE_USE_MOCK', 'false');
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(
      Response.json({ id_participante: 'codigo-de-prueba' }),
    );
  vi.stubGlobal('fetch', fetcher);
  abrirBienvenida();
  fireEvent.click(
    screen.getByRole('checkbox', { name: consentimiento.aceptacion }),
  );
  fireEvent.click(screen.getByRole('button', { name: consentimiento.aceptar }));
  expect((await screen.findByRole('alert')).textContent).toBe(
    textos.api.servidor,
  );
  fireEvent.click(screen.getByRole('button', { name: consentimiento.aceptar }));
  await screen.findByText('codigo-de-prueba');
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(getUserMedia).not.toHaveBeenCalled();
});

it('recupera una cámara denegada y abre sesión después de verificar luz y manos', async () => {
  const primera = camara('a');
  const detenerDetector = vi.fn();
  vi.mocked(observarManos).mockReturnValue(detenerDetector);
  getUserMedia
    .mockRejectedValueOnce(new DOMException('', 'NotAllowedError'))
    .mockResolvedValueOnce(primera.stream);
  abrirBienvenida();
  await aceptar();
  expect(screen.getByText(/^participante-/)).toBeTruthy();
  expect(getUserMedia).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('link', { name: consentimiento.irPreparacion }),
  );
  await screen.findByText(dispositivos.denegada);
  expect(getUserMedia).toHaveBeenCalledTimes(1);
  fireEvent.click(
    screen.getByRole('button', { name: dispositivos.reintentar }),
  );
  await screen.findByRole('combobox', { name: dispositivos.elegirCamara });
  await waitFor(() => expect(observarManos).toHaveBeenCalledTimes(1));

  const iniciar = screen.getByRole<HTMLButtonElement>('button', {
    name: dispositivos.iniciarSesion,
  });
  informar(0, true);
  expect(screen.getByText(dispositivos.manoNoDetectada)).toBeTruthy();
  expect(iniciar.disabled).toBe(true);
  informar(1, false);
  expect(screen.getByText(dispositivos.luzInsuficiente)).toBeTruthy();
  expect(iniciar.disabled).toBe(true);
  informar(2, true);
  expect(screen.getByText(dispositivos.conteos[2])).toBeTruthy();
  expect(iniciar.disabled).toBe(false);
  fireEvent.click(iniciar);
  await screen.findByRole('heading', { name: textos.conversacion });
  await waitFor(() => expect(primera.pista.stop).toHaveBeenCalledTimes(1));
  expect(detenerDetector).toHaveBeenCalledTimes(1);
});

it('libera la cámara anterior al elegir otra y avisa si se desconecta', async () => {
  const primera = camara('a');
  const segunda = camara('b');
  getUserMedia
    .mockResolvedValueOnce(primera.stream)
    .mockResolvedValueOnce(segunda.stream);
  abrirBienvenida();
  await aceptar();
  fireEvent.click(
    screen.getByRole('link', { name: consentimiento.irPreparacion }),
  );
  const selector = await screen.findByRole('combobox', {
    name: dispositivos.elegirCamara,
  });
  await waitFor(() => expect(observarManos).toHaveBeenCalledTimes(1));
  fireEvent.change(selector, { target: { value: 'b' } });
  await waitFor(() => expect(observarManos).toHaveBeenCalledTimes(2));
  expect(getUserMedia).toHaveBeenLastCalledWith({
    audio: false,
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      deviceId: { exact: 'b' },
    },
  });
  expect(primera.pista.stop).toHaveBeenCalledTimes(1);
  act(() => segunda.pista.dispatchEvent(new Event('ended')));
  expect(screen.getByText(dispositivos.perdida)).toBeTruthy();
  expect(segunda.pista.stop).toHaveBeenCalledTimes(1);
});

