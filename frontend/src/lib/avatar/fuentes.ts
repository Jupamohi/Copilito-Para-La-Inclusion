import type { ComponentType } from 'react';

export type FuenteAnimacion =
  | { formato: 'generico' }
  | { formato: 'gltf'; url: string; clip?: string }
  | { formato: 'poses'; url: string };

export type PasoAnimado = {
  glosa: string | null;
  fuente: FuenteAnimacion;
  tiempoMs: number;
  movimientoReducido: boolean;
  informarDuracion: (duracionMs: number) => void;
  usarGestoGenerico: () => void;
};

export type AnimationPlayer3D = ComponentType<PasoAnimado>;

export function carpetaAvatar() {
  return new URL(`${import.meta.env.BASE_URL}avatar/`, window.location.href);
}

export function esRecursoAvatar(url: URL, base: URL) {
  return url.origin === base.origin && url.pathname.startsWith(base.pathname);
}

export function resolverFuente(animacion: string | null): FuenteAnimacion {
  if (!animacion) return { formato: 'generico' };
  try {
    const base = carpetaAvatar();
    const url = new URL(animacion, base);
    if (!esRecursoAvatar(url, base)) return { formato: 'generico' };
    const ruta = url.pathname.toLowerCase();
    if (ruta.endsWith('.json')) return { formato: 'poses', url: url.href };
    if (/\.gl(?:b|tf)$/.test(ruta)) {
      const clip = url.hash ? decodeURIComponent(url.hash.slice(1)) : undefined;
      url.hash = '';
      return { formato: 'gltf', url: url.href, clip };
    }
  } catch {
    return { formato: 'generico' };
  }
  return { formato: 'generico' };
}
