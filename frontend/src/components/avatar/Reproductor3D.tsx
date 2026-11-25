import { useEffect, useState } from 'react';
import {
  AnimationMixer,
  BufferGeometry,
  LoadingManager,
  LoopOnce,
  Material,
  Mesh,
  SkinnedMesh,
  Texture,
} from 'three';
import type { AnimationAction } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { carpetaAvatar, esRecursoAvatar } from '../../lib/avatar/fuentes';
import type {
  AnimationPlayer3D,
  FuenteAnimacion,
  PasoAnimado,
} from '../../lib/avatar/fuentes';
import { interpolarPose, leerPoses } from '../../lib/avatar/poses';
import { FiguraAvatar, gestoGenerico } from './FiguraAvatar';

function desechar(modelo: GLTF) {
  const recursos = new Set<BufferGeometry | Material | Texture>();
  for (const escena of modelo.scenes)
    escena.traverse((objeto) => {
      if (!(objeto instanceof Mesh)) return;
      if (objeto instanceof SkinnedMesh) objeto.skeleton.dispose();
      recursos.add(objeto.geometry);
      for (const material of Array.isArray(objeto.material)
        ? objeto.material
        : [objeto.material]) {
        recursos.add(material);
        for (const valor of Object.values(material))
          if (valor instanceof Texture) recursos.add(valor);
      }
    });
  const imagenes = new Set<ImageBitmap>();
  recursos.forEach((recurso) => {
    if (
      recurso instanceof Texture &&
      typeof ImageBitmap !== 'undefined' &&
      recurso.source.data instanceof ImageBitmap
    ) {
      imagenes.add(recurso.source.data);
    }
    recurso.dispose();
  });
  imagenes.forEach((imagen) => imagen.close());
}

function ReproductorGLTF({
  fuente,
  tempo,
  informarDuracion,
  usarGestoGenerico,
}: {
  fuente: Extract<FuenteAnimacion, { formato: 'gltf' }>;
  tempo: number;
  informarDuracion: PasoAnimado['informarDuracion'];
  usarGestoGenerico: PasoAnimado['usarGestoGenerico'];
}) {
  const [actual, setActual] = useState<{
    modelo: GLTF;
    mezclador: AnimationMixer;
    accion: AnimationAction;
  }>();

  useEffect(() => {
    const control = new AbortController();
    let modelo: GLTF | undefined;
    let mezclador: AnimationMixer | undefined;
    const base = carpetaAvatar();
    const gestor = new LoadingManager();
    gestor.setURLModifier((valor) => {
      const url = new URL(valor, fuente.url);
      if (
        url.protocol === 'data:' ||
        url.protocol === 'blob:' ||
        esRecursoAvatar(url, base)
      )
        return url.href;
      throw new Error('Recurso fuera de la carpeta local del avatar.');
    });

    async function cargar() {
      try {
        const { GLTFLoader } =
          await import('three/addons/loaders/GLTFLoader.js');
        const respuesta = await fetch(fuente.url, {
          signal: control.signal,
          redirect: 'error',
        });
        if (!respuesta.ok) throw new Error('No se pudo abrir el modelo.');
        modelo = await new GLTFLoader(gestor).parseAsync(
          await respuesta.arrayBuffer(),
          new URL('.', fuente.url).href,
        );
        if (control.signal.aborted) {
          desechar(modelo);
          return;
        }
        const clip = fuente.clip
          ? modelo.animations.find(({ name }) => name === fuente.clip)
          : modelo.animations[0];
        if (!clip || !Number.isFinite(clip.duration) || clip.duration <= 0)
          throw new Error('No se encontró el clip.');
        mezclador = new AnimationMixer(modelo.scene);
        const accion = mezclador.clipAction(clip).setLoop(LoopOnce, 1);
        accion.clampWhenFinished = true;
        accion.play();
        setActual({ modelo, mezclador, accion });
        informarDuracion(clip.duration * 1000);
      } catch {
        if (!control.signal.aborted) usarGestoGenerico();
      }
    }

    void cargar();
    return () => {
      control.abort();
      if (modelo) {
        mezclador?.stopAllAction();
        mezclador?.uncacheRoot(modelo.scene);
        desechar(modelo);
      }
    };
  }, [fuente.clip, fuente.url, informarDuracion, usarGestoGenerico]);

  useEffect(() => {
    if (!actual) return;
    const { mezclador, accion } = actual;
    // Reanudar la acción permite volver a un punto anterior al repetir o pausar.
    accion.reset().play();
    mezclador.setTime(
      Math.min(tempo / 1000, Math.max(0, accion.getClip().duration - 0.001)),
    );
  }, [actual, tempo]);

  return actual ? (
    <primitive object={actual.modelo.scene} dispose={null} />
  ) : (
    <FiguraAvatar pose={{}} />
  );
}

function ReproductorPoses({
  url,
  tiempoMs,
  informarDuracion,
  usarGestoGenerico,
}: {
  url: string;
  tiempoMs: number;
  informarDuracion: PasoAnimado['informarDuracion'];
  usarGestoGenerico: PasoAnimado['usarGestoGenerico'];
}) {
  const [fotogramas, setFotogramas] = useState<ReturnType<typeof leerPoses>>(
    [],
  );
  useEffect(() => {
    const control = new AbortController();
    async function cargar() {
      try {
        const respuesta = await fetch(url, {
          signal: control.signal,
          redirect: 'error',
        });
        if (!respuesta.ok) throw new Error('No se pudieron abrir las poses.');
        const poses = leerPoses(await respuesta.json());
        if (control.signal.aborted) return;
        setFotogramas(poses);
        informarDuracion(poses[poses.length - 1].tiempo_ms);
      } catch {
        if (!control.signal.aborted) usarGestoGenerico();
      }
    }
    void cargar();
    return () => control.abort();
  }, [url, informarDuracion, usarGestoGenerico]);
  return <FiguraAvatar pose={interpolarPose(fotogramas, tiempoMs)} />;
}

export const Reproductor3D: AnimationPlayer3D = (paso) => {
  const { fuente, glosa, tiempoMs, informarDuracion, usarGestoGenerico } = paso;
  if (fuente.formato === 'gltf') {
    return (
      <ReproductorGLTF
        fuente={fuente}
        tempo={tiempoMs}
        informarDuracion={informarDuracion}
        usarGestoGenerico={usarGestoGenerico}
      />
    );
  }
  if (fuente.formato === 'poses') {
    return (
      <ReproductorPoses
        url={fuente.url}
        tiempoMs={tiempoMs}
        informarDuracion={informarDuracion}
        usarGestoGenerico={usarGestoGenerico}
      />
    );
  }
  return <FiguraAvatar pose={gestoGenerico(glosa, tiempoMs)} />;
};
