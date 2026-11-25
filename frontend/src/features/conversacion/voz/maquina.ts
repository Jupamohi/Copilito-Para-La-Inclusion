import type { Palabra } from '../../../api/tipos';

export type Transcripcion = { texto: string; latenciaMs: number };
export type EstadoTurnoVoz =
  | { fase: 'lista' | 'permiso' | 'grabando' | 'transcribiendo' }
  | { fase: 'verificar' | 'traduciendo'; transcripcion: Transcripcion }
  | { fase: 'traducida'; transcripcion: Transcripcion; secuencia: Palabra[] }
  | { fase: 'error'; mensaje: string; transcripcion?: Transcripcion };

type Accion =
  | { tipo: 'pedir' | 'grabar' | 'enviar' | 'repetir' | 'traducir' }
  | { tipo: 'verificar'; transcripcion: Transcripcion }
  | { tipo: 'traducida'; secuencia: Palabra[] }
  | { tipo: 'error'; mensaje: string };

export const inicialVoz: EstadoTurnoVoz = { fase: 'lista' };

export function reducirVoz(
  estado: EstadoTurnoVoz,
  accion: Accion,
): EstadoTurnoVoz {
  switch (accion.tipo) {
    case 'pedir':
      return estado.fase === 'lista' ||
        (estado.fase === 'error' && !estado.transcripcion)
        ? { fase: 'permiso' }
        : estado;
    case 'grabar':
      return estado.fase === 'permiso' ? { fase: 'grabando' } : estado;
    case 'enviar':
      return estado.fase === 'grabando' ? { fase: 'transcribiendo' } : estado;
    case 'verificar':
      return estado.fase === 'transcribiendo'
        ? { fase: 'verificar', transcripcion: accion.transcripcion }
        : estado;
    case 'traducir':
      return (estado.fase === 'verificar' || estado.fase === 'error') &&
        estado.transcripcion
        ? { fase: 'traduciendo', transcripcion: estado.transcripcion }
        : estado;
    case 'traducida':
      return estado.fase === 'traduciendo'
        ? { ...estado, fase: 'traducida', secuencia: accion.secuencia }
        : estado;
    case 'error':
      return {
        fase: 'error',
        mensaje: accion.mensaje,
        ...(estado.fase === 'traduciendo'
          ? { transcripcion: estado.transcripcion }
          : {}),
      };
    case 'repetir':
      return estado.fase === 'verificar' ||
        estado.fase === 'traducida' ||
        estado.fase === 'error'
        ? inicialVoz
        : estado;
  }
}
