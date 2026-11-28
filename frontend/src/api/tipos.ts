export const LONGITUD_VECTOR = 126; // TODO(supuesto): coordinar el cambio de 63 a 126 con la CNN.
export const UMBRAL_INICIAL = 0.8;
export type Consentimiento = { alcance: string; version_formato: string };
export type Sesion = { session_id: string; inicio: string };
export type SolicitudPrediccion = { session_id: string; vector: number[] };
export type Prediccion = {
  seña: string;
  confianza: number;
  aceptada: boolean;
  texto?: string;
};
export type Palabra = {
  palabra: string;
} & (
  | { fuera_de_vocabulario: true }
  | { fuera_de_vocabulario: false; glosa: string; animacion: string | null }
);
export type Intervencion = {
  interlocutor: 'sordo' | 'oyente';
  tipo: 'seña' | 'voz';
  texto: string;
  confianza: number | null;
  confirmada: boolean;
  latencia_ms: number;
};
export type Credenciales = { usuario: string; contraseña: string };
export type Sena = {
  id: string;
  glosa: string;
  descripcion: string;
  animacion: string | null;
};
export type Muestra = {
  id_sena: string;
  id_participante: string;
  vector: number[];
};
export type Modelo = {
  version: string;
  exactitud: number;
  precision: number;
  sensibilidad: number;
  f1: number;
  matriz_confusion: { etiquetas: string[]; valores: number[][] };
  umbral: number;
};
export type RespuestaSus = 1 | 2 | 3 | 4 | 5;

export interface Api {
  aceptarConsentimiento(
    datos: Consentimiento,
  ): Promise<{ id_participante: string }>;
  revocarConsentimiento(
    id: string,
  ): Promise<{ constancia: string; muestras_eliminadas: number }>;
  iniciarSesion(idParticipante: string): Promise<Sesion>;
  finalizarSesion(id: string): Promise<{ duracion_ms: number }>;
  predecir(
    datos: SolicitudPrediccion,
    signal?: AbortSignal,
  ): Promise<Prediccion>;
  transcribir(audio: Blob, signal?: AbortSignal): Promise<{ texto: string }>;
  traducir(texto: string, signal?: AbortSignal): Promise<Palabra[]>;
  registrarIntervencion(
    id: string,
    datos: Intervencion,
  ): Promise<{ id: string }>;
  exportarSesion(id: string): Promise<string>;
  iniciarSesionAdmin(datos: Credenciales): Promise<{ token: string }>;
  listarSenas(token: string): Promise<Sena[]>;
  cargarMuestra(token: string, datos: Muestra): Promise<{ id: string }>;
  consultarModelo(token: string): Promise<Modelo>;
  guardarModelo(token: string, datos: Modelo): Promise<Modelo>;
  enviarSus(respuestas: readonly RespuestaSus[], sesionId: string): Promise<{ puntaje: number }>;
}
