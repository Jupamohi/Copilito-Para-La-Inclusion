import { OrbitControls } from '@react-three/drei/core/OrbitControls';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Component, useEffect, useRef } from 'react';
import type { ComponentRef, PropsWithChildren } from 'react';
import { Spherical, Vector3 } from 'three';
import { textos } from '../../i18n/textos';
import type { PasoAnimado } from '../../lib/avatar/fuentes';
import { Reproductor3D } from './Reproductor3D';

export type OrdenVista =
  | 'izquierda'
  | 'derecha'
  | 'acercar'
  | 'alejar'
  | 'restablecer';
type Orden = { tipo: OrdenVista } | null;
const posicionInicial = [0, 0.9, 6] as const;
const objetivo: [number, number, number] = [0, 0.78, 0];

function Vista({ orden }: { orden: Orden }) {
  const control = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera, invalidate } = useThree();

  useEffect(() => {
    const orbit = control.current;
    if (!orden || !orbit) return;
    if (orden.tipo === 'restablecer') {
      camera.position.set(...posicionInicial);
      orbit.target.set(...objetivo);
    } else {
      const coordenadas = new Spherical().setFromVector3(
        camera.position.clone().sub(orbit.target),
      );
      if (orden.tipo === 'izquierda') coordenadas.theta -= Math.PI / 10;
      if (orden.tipo === 'derecha') coordenadas.theta += Math.PI / 10;
      if (orden.tipo === 'acercar')
        coordenadas.radius = Math.max(3.2, coordenadas.radius * 0.85);
      if (orden.tipo === 'alejar')
        coordenadas.radius = Math.min(8, coordenadas.radius / 0.85);
      camera.position
        .copy(orbit.target)
        .add(new Vector3().setFromSpherical(coordenadas));
    }
    orbit.update();
    invalidate();
  }, [camera, invalidate, orden]);

  return (
    <OrbitControls
      ref={control}
      target={objetivo}
      enablePan={false}
      enableDamping={false}
      minDistance={3.2}
      maxDistance={8}
      minPolarAngle={0.72}
      maxPolarAngle={2}
    />
  );
}

function Ciclo({
  tiempo,
  enMarcha,
  alFallar,
  bajarCalidad,
}: {
  tiempo: number;
  enMarcha: boolean;
  alFallar: () => void;
  bajarCalidad: () => void;
}) {
  const { gl, invalidate } = useThree();
  const lentos = useRef(0);
  useEffect(() => {
    invalidate();
  }, [invalidate, tiempo]);
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', textos.avatar.lienzo);
    canvas.addEventListener('webglcontextlost', alFallar);
    return () => canvas.removeEventListener('webglcontextlost', alFallar);
  }, [alFallar, gl]);

  useFrame((_estado, delta) => {
    if (!enMarcha || document.visibilityState !== 'visible') {
      lentos.current = 0;
      return;
    }
    lentos.current = delta > 0.09 ? lentos.current + 1 : 0;
    if (lentos.current === 6) bajarCalidad();
  });
  return null;
}

function NotificarError({ alFallar }: { alFallar: () => void }) {
  useEffect(alFallar, [alFallar]);
  return null;
}

class LimiteWebGL extends Component<
  PropsWithChildren<{ alFallar: () => void }>,
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <NotificarError alFallar={this.props.alFallar} />
    ) : (
      this.props.children
    );
  }
}

export default function EscenaAvatar({
  paso,
  indice,
  orden,
  alFallar,
  alIniciar,
  bajarCalidad,
  calidadBaja,
  enMarcha,
}: {
  paso: PasoAnimado;
  indice: string;
  orden: Orden;
  alFallar: () => void;
  alIniciar: () => void;
  bajarCalidad: () => void;
  calidadBaja: boolean;
  enMarcha: boolean;
}) {
  return (
    <LimiteWebGL alFallar={alFallar}>
      <Canvas
        dpr={calidadBaja ? 1 : [1, 1.5]}
        frameloop="demand"
        camera={{ position: [...posicionInicial], fov: 39 }}
        gl={{ alpha: false, antialias: true }}
        fallback={textos.avatar.sinWebGL}
        onCreated={alIniciar}
      >
        <color attach="background" args={['#e6efee']} />
        <hemisphereLight args={['#ffffff', '#cadbd8', 1.1]} />
        <directionalLight position={[3, 5, 6]} intensity={1.8} />
        <directionalLight position={[-4, 2, 3]} intensity={0.5} />
        <Reproductor3D key={indice} {...paso} />
        <Vista orden={orden} />
        <Ciclo
          tiempo={paso.tiempoMs}
          enMarcha={enMarcha}
          alFallar={alFallar}
          bajarCalidad={bajarCalidad}
        />
      </Canvas>
    </LimiteWebGL>
  );
}
