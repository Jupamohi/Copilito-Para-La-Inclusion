type Falla =
  | 'microfonoNoDisponible'
  | 'microfonoDenegado'
  | 'grabacionNoDisponible'
  | 'grabacionFallida';

export class ErrorGrabacion extends Error {
  constructor(public readonly codigo: Falla) {
    super(codigo);
  }
}

const formatos = [
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/mp4',
];
// TODO(supuesto): confirmar los formatos con FastAPI/STT.

export async function iniciarGrabacion(
  signal: AbortSignal,
  entregar: (audio: Blob) => void,
  alFallar: (error: ErrorGrabacion) => void,
  alAbrirMicrofono?: (nombre: string) => void,
) {
  const media = navigator.mediaDevices;
  if (!media?.getUserMedia || typeof MediaRecorder !== 'function') {
    throw new ErrorGrabacion('grabacionNoDisponible');
  }
  signal.throwIfAborted();

  let medio: MediaStream;
  try {
    medio = await media.getUserMedia({ audio: true, video: false });
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotFoundError')
        throw new ErrorGrabacion('microfonoNoDisponible');
      if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
        throw new ErrorGrabacion('microfonoDenegado');
      }
    }
    throw new ErrorGrabacion('grabacionFallida');
  }

  const pistas = medio.getTracks();
  const liberar = () => pistas.forEach((pista) => pista.stop());
  if (signal.aborted) {
    liberar();
    signal.throwIfAborted();
  }
  if (!medio.getAudioTracks().some((pista) => pista.readyState === 'live')) {
    liberar();
    throw new ErrorGrabacion('microfonoNoDisponible');
  }

  let grabador: MediaRecorder;
  try {
    const mimeType = formatos.find((tipo) =>
      MediaRecorder.isTypeSupported(tipo),
    );
    grabador = new MediaRecorder(medio, mimeType ? { mimeType } : undefined);
  } catch {
    liberar();
    throw new ErrorGrabacion('grabacionNoDisponible');
  }

  const partes: Blob[] = [];
  let cerrada = false;

  function cerrar() {
    if (cerrada) return;
    cerrada = true;
    signal.removeEventListener('abort', cerrar);
    grabador.ondataavailable = null;
    grabador.onstop = null;
    grabador.onerror = null;
    partes.length = 0;
    try {
      if (grabador.state !== 'inactive') grabador.stop();
    } finally {
      liberar();
    }
  }

  function fallar() {
    cerrar();
    alFallar(new ErrorGrabacion('grabacionFallida'));
  }

  function detener() {
    if (cerrada || grabador.state === 'inactive') return;
    try {
      grabador.stop();
    } catch {
      fallar();
    }
  }

  grabador.ondataavailable = ({ data }) => {
    if (data.size) partes.push(data);
  };
  grabador.onstop = () => {
    const audio = new Blob(partes, {
      type: grabador.mimeType || partes[0]?.type,
    });
    cerrar();
    if (!audio.size || !audio.type.startsWith('audio/')) {
      alFallar(new ErrorGrabacion('grabacionFallida'));
      return;
    }
    entregar(audio);
  };
  grabador.onerror = fallar;
  signal.addEventListener('abort', cerrar, { once: true });
  try {
    grabador.start();
    alAbrirMicrofono?.(medio.getAudioTracks()[0]?.label || 'Nombre no disponible');
  } catch {
    cerrar();
    throw new ErrorGrabacion('grabacionFallida');
  }
  return detener;
}
