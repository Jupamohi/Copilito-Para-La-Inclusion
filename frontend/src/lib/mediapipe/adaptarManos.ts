import type { DetectedHand } from '../vector';
import type { CapturaManos } from './protocolo';

export function adaptarManos(
  captura: CapturaManos,
  fotogramaEnEspejo = false,
): DetectedHand[] {
  return captura.landmarks.flatMap((landmarks, indice) => {
    const clasificacion = captura.handedness[indice]?.[0];
    const lado = clasificacion?.categoryName;
    if (lado !== 'Left' && lado !== 'Right') return [];
    // La vista previa se refleja con CSS. El worker recibe el fotograma original.
    if (!fotogramaEnEspejo)
      return [
        {
          handedness: lado,
          landmarks,
          confianzaLateralidad: clasificacion.score,
        },
      ];
    return [
      {
        handedness: lado === 'Left' ? 'Right' : 'Left',
        landmarks: landmarks.map(({ x, y, z }) => ({ x: 1 - x, y, z })),
        confianzaLateralidad: clasificacion.score,
      },
    ];
  });
}
