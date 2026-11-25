export type EstadoTurnos = { turno: 'sena' | 'voz' } & (
  | { fase: 'activo' | 'guardando' }
  | { fase: 'error'; mensaje: string }
);
type Accion =
  | { tipo: 'solicitar' | 'alternar' }
  | { tipo: 'fallar'; mensaje: string };

export const turnosIniciales: EstadoTurnos = { turno: 'sena', fase: 'activo' };

export function reducirTurnos(
  estado: EstadoTurnos,
  accion: Accion,
): EstadoTurnos {
  switch (accion.tipo) {
    case 'solicitar':
      return estado.fase === 'guardando'
        ? estado
        : { turno: estado.turno, fase: 'guardando' };
    case 'alternar':
      return estado.fase === 'guardando'
        ? { turno: estado.turno === 'sena' ? 'voz' : 'sena', fase: 'activo' }
        : estado;
    case 'fallar':
      return estado.fase === 'guardando'
        ? { turno: estado.turno, fase: 'error', mensaje: accion.mensaje }
        : estado;
  }
}
