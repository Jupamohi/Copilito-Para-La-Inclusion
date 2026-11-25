import type { Punto } from '../vector';

const conexiones = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
] as const;

export function dibujarManos(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  manos: readonly (readonly Punto[])[],
) {
  const { videoWidth: ancho, videoHeight: alto } = video;
  if (!ancho || !alto) return;
  if (canvas.width !== ancho) canvas.width = ancho;
  if (canvas.height !== alto) canvas.height = alto;
  const dibujo = canvas.getContext('2d');
  if (!dibujo) return;
  dibujo.clearRect(0, 0, ancho, alto);
  const grosor = Math.max(2, ancho * 0.006);
  dibujo.lineCap = 'round';
  dibujo.lineJoin = 'round';

  for (const mano of manos) {
    dibujo.beginPath();
    for (const [inicio, fin] of conexiones) {
      const a = mano[inicio];
      const b = mano[fin];
      if (!a || !b) continue;
      dibujo.moveTo(a.x * ancho, a.y * alto);
      dibujo.lineTo(b.x * ancho, b.y * alto);
    }
    dibujo.strokeStyle = '#123b36';
    dibujo.lineWidth = grosor * 2;
    dibujo.stroke();
    dibujo.strokeStyle = '#ffffff';
    dibujo.lineWidth = grosor;
    dibujo.stroke();
    for (const { x, y } of mano) {
      dibujo.beginPath();
      dibujo.arc(x * ancho, y * alto, grosor, 0, Math.PI * 2);
      dibujo.fillStyle = '#ffffff';
      dibujo.fill();
      dibujo.strokeStyle = '#123b36';
      dibujo.lineWidth = grosor / 2;
      dibujo.stroke();
    }
  }
}
