import { textos } from '../i18n/textos';
import { LONGITUD_VECTOR } from './tipos';
import type { RespuestaSus } from './tipos';

type Codigo = keyof typeof textos.api;

export class ErrorApi extends Error {
  constructor(
    public readonly codigo: Codigo,
    public readonly estado?: number,
  ) {
    super(textos.api[codigo]);
    this.name = 'ErrorApi';
  }
}

export function validarVector(vector: number[]) {
  if (
    vector.length !== LONGITUD_VECTOR ||
    !Array.from(vector).every(Number.isFinite)
  ) {
    throw new ErrorApi('vectorInvalido');
  }
}

export function validarSus(respuestas: readonly RespuestaSus[]) {
  if (
    respuestas.length !== 10 ||
    !Array.from(respuestas).every(
      (valor) => Number.isInteger(valor) && valor >= 1 && valor <= 5,
    )
  ) {
    throw new ErrorApi('susIncompleto');
  }
}
