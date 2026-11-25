import { ErrorApi, validarVector } from '../../api/errores';
import type { Modelo } from '../../api/tipos';

export const metricas = [
  'exactitud',
  'precision',
  'sensibilidad',
  'f1',
  'umbral',
] as const;
export const matrizVacia: Modelo['matriz_confusion'] = {
  etiquetas: [],
  valores: [],
};
// TODO(supuesto): confirmar el JSON de muestras normalizadas y el tamaño de vector en FastAPI.
export function leerVectorMuestra(contenido: string): number[] {
  try {
    const entrada: unknown = JSON.parse(contenido);
    const vector =
      entrada && typeof entrada === 'object' && 'vector' in entrada
        ? entrada.vector
        : entrada;
    if (!Array.isArray(vector)) throw new Error();
    validarVector(vector);
    return vector;
  } catch {
    throw new ErrorApi('archivoMuestraInvalido');
  }
}

function leerMatriz(contenido: string): Modelo['matriz_confusion'] {
  try {
    const entrada: unknown = JSON.parse(contenido);
    if (
      !entrada ||
      typeof entrada !== 'object' ||
      !('etiquetas' in entrada) ||
      !Array.isArray(entrada.etiquetas) ||
      !('valores' in entrada) ||
      !Array.isArray(entrada.valores)
    )
      throw new Error();
    const etiquetas = entrada.etiquetas.map((valor: unknown) =>
      typeof valor === 'string' ? valor.trim() : '',
    );
    const valores: unknown[] = entrada.valores;
    const dimension = etiquetas.length;
    if (
      etiquetas.some((etiqueta) => !etiqueta) ||
      new Set(etiquetas).size !== dimension ||
      valores.length !== dimension ||
      !valores.every(
        (fila): fila is number[] =>
          Array.isArray(fila) &&
          fila.length === dimension &&
          fila.every(
            (valor: unknown) =>
              typeof valor === 'number' && Number.isFinite(valor) && valor >= 0,
          ),
      )
    )
      throw new Error();
    return { etiquetas, valores };
  } catch {
    throw new ErrorApi('matrizInvalida');
  }
}

export function leerModelo(formulario: FormData): Modelo {
  const version = String(formulario.get('version') ?? '').trim();
  if (!version) throw new ErrorApi('modeloInvalido');
  const datos = {
    version,
    matriz_confusion: leerMatriz(
      String(formulario.get('matriz_confusion') ?? ''),
    ),
  };
  const valores = {} as Pick<Modelo, (typeof metricas)[number]>;
  for (const clave of metricas) {
    const texto = String(formulario.get(clave) ?? '').trim();
    const porcentaje = Number(texto);
    if (
      !texto ||
      !Number.isFinite(porcentaje) ||
      porcentaje < 0 ||
      porcentaje > 100
    )
      throw new ErrorApi('modeloInvalido');
    valores[clave] = porcentaje / 100;
  }
  return { ...datos, ...valores };
}
