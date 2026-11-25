import { ErrorApi, validarSus, validarVector } from './errores';
import { UMBRAL_INICIAL } from './tipos';
import type { Api, Intervencion, Modelo, Palabra, Sena, Sesion } from './tipos';

const catalogo: Sena[] = [
  { id: '1', glosa: 'HOLA', descripcion: 'Saludo', animacion: null },
  { id: '2', glosa: 'GRACIAS', descripcion: 'Agradecimiento', animacion: null },
  {
    id: '3',
    glosa: 'AYUDA',
    descripcion: 'Solicitud de ayuda',
    animacion: null,
  },
  {
    id: '4',
    glosa: 'BUENOS DÍAS',
    descripcion: 'Saludo de la mañana',
    animacion: null,
  },
  {
    id: '5',
    glosa: 'POR FAVOR',
    descripcion: 'Expresión de cortesía',
    animacion: null,
  },
];
const tokenDemo = 'token-copilito-demo';
const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
    .toUpperCase();

function traducirTexto(texto: string): Palabra[] {
  const palabras = texto.match(/\S+/g) ?? [];
  const resultado: Palabra[] = [];
  for (let indice = 0; indice < palabras.length; ) {
    const actual = normalizar(palabras[indice]);
    const siguiente = normalizar(palabras[indice + 1] ?? '');
    const doble = catalogo.find(
      ({ glosa }) => normalizar(glosa) === `${actual} ${siguiente}`,
    );
    const sena =
      doble ?? catalogo.find(({ glosa }) => normalizar(glosa) === actual);
    const longitud = doble ? 2 : 1;
    const palabra = palabras.slice(indice, indice + longitud).join(' ');
    resultado.push(
      sena
        ? {
            palabra,
            fuera_de_vocabulario: false,
            glosa: sena.glosa,
            animacion: sena.animacion,
          }
        : { palabra, fuera_de_vocabulario: true },
    );
    indice += longitud;
  }
  return resultado;
}

type SesionMock = Sesion & {
  intervenciones: Intervencion[];
  duracion_ms?: number;
};

export function crearMock({
  aleatorio = Math.random,
  alExpirarToken,
}: {
  aleatorio?: () => number;
  alExpirarToken?: (token: string) => void;
} = {}): Api {
  const participantes = new Map<string, number>();
  const sesiones = new Map<string, SesionMock>();
  let contador = 0;
  let adminAutenticado = false;
  let modelo: Modelo = {
    version: 'demo-1',
    exactitud: 0.87,
    precision: 0.88,
    sensibilidad: 0.86,
    f1: 0.87,
    matriz_confusion: {
      etiquetas: ['HOLA', 'GRACIAS'],
      valores: [
        [44, 6],
        [7, 43],
      ],
    },
    umbral: UMBRAL_INICIAL,
  };

  function requerirAdmin(token: string) {
    if (!adminAutenticado || token !== tokenDemo) {
      alExpirarToken?.(token);
      throw new ErrorApi('sesionAdmin', 401);
    }
  }

  function obtenerSesion(id: string) {
    const sesion = sesiones.get(id);
    if (!sesion) throw new ErrorApi('servidor', 404);
    return sesion;
  }

  function obtenerSesionAbierta(id: string) {
    const sesion = obtenerSesion(id);
    if (sesion.duracion_ms !== undefined) throw new ErrorApi('servidor', 409);
    return sesion;
  }

  return {
    async aceptarConsentimiento() {
      const id = `participante-${++contador}`;
      participantes.set(id, 0);
      return { id_participante: id };
    },
    async revocarConsentimiento(id) {
      const muestras = participantes.get(id);
      if (muestras === undefined)
        throw new ErrorApi('consentimientoNoEncontrado', 404);
      participantes.delete(id);
      return { constancia: `constancia-${id}`, muestras_eliminadas: muestras };
    },
    async iniciarSesion() {
      const sesion = {
        session_id: `sesion-${++contador}`,
        inicio: new Date().toISOString(),
      };
      sesiones.set(sesion.session_id, { ...sesion, intervenciones: [] });
      return sesion;
    },
    async finalizarSesion(id) {
      const sesion = obtenerSesion(id);
      sesion.duracion_ms ??= Math.max(
        0,
        Date.now() - Date.parse(sesion.inicio),
      );
      return { duracion_ms: sesion.duracion_ms };
    },
    async predecir({ session_id, vector }, signal) {
      signal?.throwIfAborted();
      validarVector(vector);
      obtenerSesionAbierta(session_id);
      const { glosa } = catalogo[Math.floor(aleatorio() * catalogo.length)];
      const confianza = Math.round((0.55 + aleatorio() * 0.44) * 100) / 100;
      return {
        seña: glosa,
        texto: glosa,
        confianza,
        aceptada: confianza >= modelo.umbral,
      };
    },
    async transcribir(audio, signal) {
      signal?.throwIfAborted();
      if (!audio.type.startsWith('audio/') || !audio.size)
        throw new ErrorApi('audioInvalido');
      return { texto: 'Buenos días, necesito ayuda, por favor.' };
    },
    async traducir(texto, signal) {
      signal?.throwIfAborted();
      return traducirTexto(texto);
    },
    async registrarIntervencion(id, datos) {
      obtenerSesionAbierta(id).intervenciones.push({ ...datos });
      return { id: `intervencion-${++contador}` };
    },
    async exportarSesion(id) {
      return obtenerSesion(id)
        .intervenciones.map(
          ({ interlocutor, texto }) => `${interlocutor}: ${texto}`,
        )
        .join('\n');
    },
    async iniciarSesionAdmin({ usuario, contraseña }) {
      if (usuario !== 'admin' || contraseña !== 'copilito-demo')
        throw new ErrorApi('credenciales', 401);
      adminAutenticado = true;
      return { token: tokenDemo };
    },
    async listarSenas(token) {
      requerirAdmin(token);
      return catalogo.map((sena) => ({ ...sena }));
    },
    async cargarMuestra(token, { id_sena, id_participante, vector }) {
      requerirAdmin(token);
      validarVector(vector);
      const muestras = participantes.get(id_participante);
      if (muestras === undefined)
        throw new ErrorApi('muestraSinConsentimiento', 403);
      if (!catalogo.some(({ id }) => id === id_sena))
        throw new ErrorApi('servidor', 404);
      participantes.set(id_participante, muestras + 1);
      return { id: `muestra-${++contador}` };
    },
    async consultarModelo(token) {
      requerirAdmin(token);
      return structuredClone(modelo);
    },
    async guardarModelo(token, datos) {
      requerirAdmin(token);
      modelo = structuredClone(datos);
      return structuredClone(modelo);
    },
    async enviarSus(respuestas) {
      validarSus(respuestas);
      const suma = respuestas.reduce<number>(
        (total, valor, indice) =>
          total + (indice % 2 === 0 ? valor - 1 : 5 - valor),
        0,
      );
      return { puntaje: suma * 2.5 };
    },
  };
}
