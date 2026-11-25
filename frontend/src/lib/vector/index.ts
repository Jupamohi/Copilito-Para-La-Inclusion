import { LONGITUD_VECTOR } from '../../api/tipos';

export type Punto = { x: number; y: number; z: number };
export type Lado = 'Left' | 'Right';
export type DetectedHand = {
  handedness: Lado;
  landmarks: readonly Punto[];
  confianzaLateralidad?: number;
};

const puntosPorMano = 21;
const valoresPorMano = puntosPorMano * 3;

function puntosValidos(puntos: readonly Punto[]) {
  return (
    puntos.length === puntosPorMano &&
    Array.from(puntos).every(
      (punto) => punto && [punto.x, punto.y, punto.z].every(Number.isFinite),
    )
  );
}

export function countHands(
  hands: readonly Pick<DetectedHand, 'landmarks'>[],
): 0 | 1 | 2 {
  const detectadas = hands.filter(({ landmarks }) =>
    puntosValidos(landmarks),
  ).length;
  return detectadas >= 2 ? 2 : detectadas === 1 ? 1 : 0;
}

function normalizar(puntos: readonly Punto[]) {
  if (!puntosValidos(puntos)) return null;
  // TODO(supuesto): confirmar con la CNN origen, escala y unidades de las coordenadas.
  const [muneca] = puntos;
  const relativos = puntos.map(({ x, y, z }) => [
    x - muneca.x,
    y - muneca.y,
    z - muneca.z,
  ]);
  const escala = Math.max(...relativos.map(([x, y, z]) => Math.hypot(x, y, z)));
  if (!Number.isFinite(escala) || escala === 0) return null;
  return relativos.flatMap((punto) => punto.map((valor) => valor / escala));
}

type Bloque = { valores: number[]; confianza: number };

function precede(candidato: Bloque, vigente: Bloque) {
  if (candidato.confianza !== vigente.confianza)
    return candidato.confianza > vigente.confianza;
  const indice = candidato.valores.findIndex(
    (valor, i) => valor !== vigente.valores[i],
  );
  return indice !== -1 && candidato.valores[indice] < vigente.valores[indice];
}

export function landmarksToVector(hands: readonly DetectedHand[]): number[] {
  const bloques: Partial<Record<Lado, Bloque>> = {};
  for (const { handedness, landmarks, confianzaLateralidad } of hands) {
    const valores = normalizar(landmarks);
    if (!valores) continue;
    const confianza = confianzaLateralidad ?? 0;
    const candidato = {
      valores,
      confianza: Number.isFinite(confianza) ? confianza : 0,
    };
    const vigente = bloques[handedness];
    if (!vigente || precede(candidato, vigente))
      bloques[handedness] = candidato;
  }

  const vector = Array<number>(LONGITUD_VECTOR).fill(0);
  bloques.Left?.valores.forEach((valor, indice) => {
    vector[indice] = valor;
  });
  bloques.Right?.valores.forEach((valor, indice) => {
    vector[valoresPorMano + indice] = valor;
  });
  return vector;
}
