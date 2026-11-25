export const articulaciones = [
  'LeftShoulder',
  'LeftElbow',
  'LeftWrist',
  'RightShoulder',
  'RightElbow',
  'RightWrist',
  ...(['Left', 'Right'] as const).flatMap((lado) =>
    (['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'] as const).flatMap((dedo) =>
      [1, 2, 3].map((nivel) => `${lado}${dedo}${nivel}` as const),
    ),
  ),
] as const;

export type Rotacion = [number, number, number];
export type Pose = Partial<Record<(typeof articulaciones)[number], Rotacion>>;
type Fotograma = { tiempo_ms: number; rotaciones: Pose };
const reposo: Rotacion = [0, 0, 0];

// TODO(supuesto): comprobar esta convención provisional con el rig y las poses del equipo.
export function leerPoses(datos: unknown): Fotograma[] {
  if (
    !datos ||
    typeof datos !== 'object' ||
    !('fotogramas' in datos) ||
    !Array.isArray(datos.fotogramas)
  ) {
    throw new Error('Formato de poses inválido.');
  }
  const fotogramas = datos.fotogramas as unknown[];
  if (fotogramas.length < 2) throw new Error('Se requieren dos fotogramas.');
  let anterior = -1;
  return fotogramas.map((entrada) => {
    if (
      !entrada ||
      typeof entrada !== 'object' ||
      !('tiempo_ms' in entrada) ||
      typeof entrada.tiempo_ms !== 'number' ||
      !Number.isFinite(entrada.tiempo_ms) ||
      entrada.tiempo_ms < 0 ||
      entrada.tiempo_ms <= anterior ||
      !('rotaciones' in entrada) ||
      !entrada.rotaciones ||
      typeof entrada.rotaciones !== 'object'
    ) {
      throw new Error('Fotograma inválido.');
    }
    const fuente = entrada.rotaciones as Record<string, unknown>;
    const rotaciones: Pose = {};
    for (const nombre of articulaciones) {
      const valor = fuente[nombre];
      if (valor === undefined) continue;
      if (
        !Array.isArray(valor) ||
        valor.length !== 3 ||
        !valor.every(Number.isFinite)
      ) {
        throw new Error('Rotación inválida.');
      }
      rotaciones[nombre] = valor as Rotacion;
    }
    anterior = entrada.tiempo_ms;
    return { tiempo_ms: anterior, rotaciones };
  });
}

export function interpolarPose(
  fotogramas: readonly Fotograma[],
  tiempo: number,
): Pose {
  const siguiente = fotogramas.findIndex(
    ({ tiempo_ms }) => tiempo_ms >= tiempo,
  );
  if (siguiente === 0) return fotogramas[0].rotaciones;
  if (siguiente < 0) return fotogramas.at(-1)?.rotaciones ?? {};
  const a = fotogramas[siguiente - 1];
  const b = fotogramas[siguiente];
  const fraccion = (tiempo - a.tiempo_ms) / (b.tiempo_ms - a.tiempo_ms);
  const resultado: Pose = {};
  for (const nombre of articulaciones) {
    if (!a.rotaciones[nombre] && !b.rotaciones[nombre]) continue;
    const inicio = a.rotaciones[nombre] ?? reposo;
    const final = b.rotaciones[nombre] ?? reposo;
    resultado[nombre] = [0, 1, 2].map(
      (i) => inicio[i] + (final[i] - inicio[i]) * fraccion,
    ) as Rotacion;
  }
  return resultado;
}
