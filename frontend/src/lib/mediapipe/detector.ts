import type {
  CapturaManos,
  MensajeDetector,
  RespuestaDetector,
} from './protocolo';

// TODO(supuesto): ajustar frecuencia y tiempos de espera en los dispositivos piloto.
const intervaloMs = 125;
const inicioMaximoMs = 30_000;
const deteccionMaximaMs = 8_000;

export function observarManos(
  video: HTMLVideoElement,
  recibir: (captura: CapturaManos) => void,
  alFallar: () => void,
) {
  const base = new URL(
    `${import.meta.env.BASE_URL}mediapipe/`,
    window.location.href,
  ).href;
  const worker = new Worker(`${base}hand-worker.js`);
  let cerrado = false;
  let ocupado = false;
  let ultimoTiempo = -1;
  let intervalo: number | undefined;
  let espera = window.setTimeout(fallar, inicioMaximoMs);

  function cerrar() {
    if (cerrado) return;
    cerrado = true;
    window.clearTimeout(espera);
    window.clearInterval(intervalo);
    worker.terminate();
  }

  function fallar() {
    if (cerrado) return;
    cerrar();
    alFallar();
  }

  async function enviarFotograma() {
    if (
      cerrado ||
      ocupado ||
      video.readyState < 2 ||
      video.currentTime === ultimoTiempo
    )
      return;
    ocupado = true;
    ultimoTiempo = video.currentTime;
    espera = window.setTimeout(fallar, deteccionMaximaMs);
    let imagen: ImageBitmap | undefined;
    try {
      imagen = await createImageBitmap(video);
      if (cerrado) return;
      const mensaje: MensajeDetector = {
        tipo: 'analizar',
        imagen,
        tiempo: performance.now(),
      };
      worker.postMessage(mensaje, [imagen]);
      imagen = undefined; // El worker tiene la propiedad del fotograma transferido.
    } catch {
      fallar();
    } finally {
      imagen?.close();
    }
  }

  worker.onmessage = ({ data }: MessageEvent<RespuestaDetector>) => {
    window.clearTimeout(espera);
    switch (data.tipo) {
      case 'listo':
        intervalo = window.setInterval(
          () => void enviarFotograma(),
          intervaloMs,
        );
        break;
      case 'captura':
        ocupado = false;
        recibir(data.captura);
        break;
      case 'error':
        fallar();
        break;
    }
  };
  worker.onerror = fallar;
  worker.onmessageerror = fallar;
  const mensaje: MensajeDetector = { tipo: 'iniciar', base };
  try {
    worker.postMessage(mensaje);
  } catch {
    cerrar();
    throw new Error('No se pudo iniciar el detector.');
  }
  return cerrar;
}
