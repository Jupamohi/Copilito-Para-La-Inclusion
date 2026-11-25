import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { MensajeDetector, RespuestaDetector } from './protocolo';

const puerto = self as unknown as {
  postMessage: (mensaje: RespuestaDetector) => void;
  onmessage: (evento: MessageEvent<MensajeDetector>) => void;
};
const tamano = { ancho: 32, alto: 24 };
// TODO(supuesto): ajustar la iluminación mínima durante las pruebas en Cali.
const brilloMinimo = 55;
let detector: HandLandmarker | undefined;
let contraste: OffscreenCanvasRenderingContext2D | null;

function hayLuz(imagen: ImageBitmap) {
  if (!contraste) throw new Error('No se pudo inicializar la medición de luz.');
  contraste.drawImage(imagen, 0, 0, tamano.ancho, tamano.alto);
  const pixels = contraste.getImageData(0, 0, tamano.ancho, tamano.alto).data;
  contraste.clearRect(0, 0, tamano.ancho, tamano.alto);
  let suma = 0;
  for (let indice = 0; indice < pixels.length; indice += 4) {
    suma +=
      0.2126 * pixels[indice] +
      0.7152 * pixels[indice + 1] +
      0.0722 * pixels[indice + 2];
  }
  return suma / (pixels.length / 4) >= brilloMinimo;
}

async function iniciar(base: string) {
  try {
    const archivos = await FilesetResolver.forVisionTasks(`${base}wasm`);
    contraste = new OffscreenCanvas(tamano.ancho, tamano.alto).getContext(
      '2d',
      {
        willReadFrequently: true,
      },
    );
    if (!contraste)
      throw new Error('No se pudo inicializar la medición de luz.');
    detector = await HandLandmarker.createFromOptions(archivos, {
      baseOptions: {
        modelAssetPath: `${base}hand_landmarker.task`,
        delegate: 'CPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
    });
    puerto.postMessage({ tipo: 'listo' });
  } catch {
    puerto.postMessage({ tipo: 'error' });
  }
}

puerto.onmessage = ({ data }) => {
  if (data.tipo === 'iniciar') {
    void iniciar(data.base);
    return;
  }
  const { imagen, tiempo } = data;
  try {
    if (!detector) throw new Error('El detector aún no está listo.');
    const luzSuficiente = hayLuz(imagen);
    const { landmarks, handedness } = detector.detectForVideo(imagen, tiempo);
    puerto.postMessage({
      tipo: 'captura',
      captura: { landmarks, handedness, luzSuficiente },
    });
  } catch {
    puerto.postMessage({ tipo: 'error' });
  } finally {
    imagen.close();
  }
};
