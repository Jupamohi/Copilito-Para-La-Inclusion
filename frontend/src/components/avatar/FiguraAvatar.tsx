import type { Pose } from '../../lib/avatar/poses';

const piel = '#d6a789';
const uniforme = '#17665a';
const dedos = [
  ['Thumb', 0.05, 0.095],
  ['Index', 0.095, 0.085],
  ['Middle', 0.03, 0.097],
  ['Ring', -0.035, 0.087],
  ['Pinky', -0.095, 0.069],
] as const;
const niveles = [1, 2, 3] as const;

function Mano({ lado, pose }: { lado: 'Left' | 'Right'; pose: Pose }) {
  const signo = lado === 'Left' ? 1 : -1;
  return (
    <group
      position={[0, -0.54, 0]}
      name={`${lado}Wrist`}
      rotation={pose[`${lado}Wrist`]}
    >
      <mesh position={[0, -0.13, 0]}>
        <boxGeometry args={[0.27, 0.28, 0.15]} />
        <meshStandardMaterial color={piel} />
      </mesh>
      {dedos.map(([dedo, x, largo]) => {
        const pulgar = dedo === 'Thumb';
        return (
          <group
            key={dedo}
            position={[signo * (pulgar ? 0.13 : x), pulgar ? -0.1 : -0.25, 0]}
            rotation={[0, 0, pulgar ? signo * 0.66 : 0]}
          >
            <Falange
              lado={lado}
              dedo={dedo}
              largo={largo}
              nivel={1}
              pose={pose}
            />
          </group>
        );
      })}
    </group>
  );
}

function Falange({
  lado,
  dedo,
  largo,
  nivel,
  pose,
}: {
  lado: 'Left' | 'Right';
  dedo: (typeof dedos)[number][0];
  largo: number;
  nivel: 1 | 2 | 3;
  pose: Pose;
}) {
  const nombre = `${lado}${dedo}${nivel}` as const;
  const siguiente = nivel === 3 ? undefined : niveles[nivel];
  return (
    <group
      name={nombre}
      position={[0, nivel === 1 ? 0 : -largo * 1.1, 0]}
      rotation={pose[nombre]}
    >
      <mesh position={[0, -largo * 0.5, 0]}>
        <capsuleGeometry args={[0.033, largo * 0.75, 4, 6]} />
        <meshStandardMaterial color={piel} />
      </mesh>
      {siguiente && (
        <Falange
          lado={lado}
          dedo={dedo}
          largo={largo * 0.86}
          nivel={siguiente}
          pose={pose}
        />
      )}
    </group>
  );
}

function Brazo({ lado, pose }: { lado: 'Left' | 'Right'; pose: Pose }) {
  const signo = lado === 'Left' ? 1 : -1;
  return (
    <group
      name={`${lado}Shoulder`}
      position={[signo * 0.52, 1.12, 0]}
      rotation={pose[`${lado}Shoulder`] ?? [-0.06, 0, signo * 0.35]}
    >
      <mesh position={[0, -0.28, 0]}>
        <capsuleGeometry args={[0.14, 0.36, 6, 10]} />
        <meshStandardMaterial color={uniforme} />
      </mesh>
      <group
        name={`${lado}Elbow`}
        position={[0, -0.56, 0]}
        rotation={pose[`${lado}Elbow`] ?? [-0.4, 0, 0]}
      >
        <mesh position={[0, -0.25, 0]}>
          <capsuleGeometry args={[0.107, 0.36, 6, 10]} />
          <meshStandardMaterial color={piel} />
        </mesh>
        <Mano lado={lado} pose={pose} />
      </group>
    </group>
  );
}

export function gestoGenerico(glosa: string | null, tiempoMs: number): Pose {
  if (!glosa) return {};
  const indice = [...glosa].reduce(
    (suma, letra) => suma + (letra.codePointAt(0) ?? 0),
    0,
  );
  const avance = Math.max(0, Math.min(1, tiempoMs / 1400));
  const elevar = Math.sin(Math.PI * avance);
  const oscilar = Math.sin(avance * Math.PI * 2 * (1 + (indice % 3) / 2));
  const pose: Pose = {};
  for (const lado of ['Left', 'Right'] as const) {
    const signo = lado === 'Left' ? 1 : -1;
    const variacion = (indice % 7) / 20;
    pose[`${lado}Shoulder`] = [
      -elevar * (0.66 + variacion),
      0,
      signo * (0.33 + 0.48 * elevar),
    ];
    pose[`${lado}Elbow`] = [
      -0.3 - (0.7 + signo * 0.08 * oscilar) * elevar,
      0,
      signo * 0.26 * elevar,
    ];
    pose[`${lado}Wrist`] = [
      0.23 * elevar,
      signo * oscilar * elevar * 0.45,
      signo * 0.1 * elevar,
    ];
    dedos.forEach(([dedo], i) =>
      niveles.forEach((nivel) => {
        pose[`${lado}${dedo}${nivel}`] = [
          elevar * (0.2 + ((i + indice) % 4) / 10),
          0,
          0,
        ];
      }),
    );
  }
  return pose;
}

export function FiguraAvatar({ pose }: { pose: Pose }) {
  return (
    <group>
      <mesh position={[0, 0.44, 0]} scale={[1, 1, 0.63]}>
        <capsuleGeometry args={[0.56, 0.61, 8, 18]} />
        <meshStandardMaterial color={uniforme} />
      </mesh>
      <mesh position={[0, 1.28, 0]}>
        <cylinderGeometry args={[0.17, 0.2, 0.31, 14]} />
        <meshStandardMaterial color={piel} />
      </mesh>
      <mesh position={[0, 1.73, 0]} scale={[0.9, 1.05, 0.92]}>
        <sphereGeometry args={[0.43, 24, 16]} />
        <meshStandardMaterial color={piel} />
      </mesh>
      {[-0.133, 0.133].map((x) => (
        <mesh key={x} position={[x, 1.76, 0.367]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshStandardMaterial color="#172c30" />
        </mesh>
      ))}
      <mesh position={[0, 1.58, 0.367]}>
        <boxGeometry args={[0.13, 0.023, 0.02]} />
        <meshStandardMaterial color="#704633" />
      </mesh>
      <Brazo lado="Left" pose={pose} />
      <Brazo lado="Right" pose={pose} />
    </group>
  );
}
