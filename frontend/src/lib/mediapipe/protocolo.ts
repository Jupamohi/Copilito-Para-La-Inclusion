import type { HandLandmarkerResult } from '@mediapipe/tasks-vision';

export type CapturaManos = Pick<
  HandLandmarkerResult,
  'landmarks' | 'handedness'
> & {
  luzSuficiente: boolean;
};

export type MensajeDetector =
  | { tipo: 'iniciar'; base: string }
  | { tipo: 'analizar'; imagen: ImageBitmap; tiempo: number };

export type RespuestaDetector =
  | { tipo: 'listo' }
  | { tipo: 'captura'; captura: CapturaManos }
  | { tipo: 'error' };
