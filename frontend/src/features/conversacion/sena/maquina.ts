import type { EstadoVoz } from '../../../lib/tts';

export type ResultadoSena = {
  glosa: string;
  texto: string;
  confianza: number;
  latenciaMs: number;
};
type EstadoSena =
  | { fase: 'lista' | 'prediciendo' }
  | { fase: 'rechazada'; latenciaMs: number }
  | { fase: 'error'; mensaje: string }
  | { fase: 'verificar'; resultado: ResultadoSena }
  | { fase: 'confirmada'; resultado: ResultadoSena; voz: EstadoVoz };

type Accion =
  | { tipo: 'solicitar' | 'descartar' | 'confirmar' }
  | { tipo: 'rechazar'; latenciaMs: number }
  | { tipo: 'fallar'; mensaje: string }
  | { tipo: 'mostrar'; resultado: ResultadoSena }
  | { tipo: 'voz'; estado: EstadoVoz };

export const inicial: EstadoSena = { fase: 'lista' };

export function permitePredecir(estado: EstadoSena) {
  return (
    estado.fase !== 'prediciendo' &&
    estado.fase !== 'verificar' &&
    !(
      estado.fase === 'confirmada' &&
      (estado.voz === 'preparando' || estado.voz === 'reproduciendo')
    )
  );
}

export function reducirSena(estado: EstadoSena, accion: Accion): EstadoSena {
  switch (accion.tipo) {
    case 'solicitar':
      return permitePredecir(estado) ? { fase: 'prediciendo' } : estado;
    case 'mostrar':
      return estado.fase === 'prediciendo'
        ? { fase: 'verificar', resultado: accion.resultado }
        : estado;
    case 'rechazar':
      return estado.fase === 'prediciendo'
        ? { fase: 'rechazada', latenciaMs: accion.latenciaMs }
        : estado;
    case 'fallar':
      return estado.fase === 'prediciendo'
        ? { fase: 'error', mensaje: accion.mensaje }
        : estado;
    case 'descartar':
      return estado.fase === 'verificar' ? inicial : estado;
    case 'confirmar':
      return estado.fase === 'verificar'
        ? { fase: 'confirmada', resultado: estado.resultado, voz: 'preparando' }
        : estado;
    case 'voz':
      return estado.fase === 'confirmada'
        ? { ...estado, voz: accion.estado }
        : estado;
  }
}
