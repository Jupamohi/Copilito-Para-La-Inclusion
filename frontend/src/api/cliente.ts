import { ErrorApi, validarSus, validarVector } from './errores';
import type { Api } from './tipos';

type Opciones = {
  baseUrl?: string;
  fetcher?: typeof fetch;
  alExpirarToken?: (token: string) => void;
};

type Peticion = {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'PUT';
  datos?: object;
  formulario?: FormData;
  token?: string;
  signal?: AbortSignal;
  texto?: boolean;
};

export function crearClienteHttp({
  baseUrl = '/api/v1',
  fetcher = fetch,
  alExpirarToken,
}: Opciones = {}): Api {
  const base = baseUrl.trim().replace(/\/+$/, '') || '/api/v1';

  const envios = new WeakMap<object, string>();

  async function solicitar<T>(
    ruta: string,
    { metodo = 'GET', datos, formulario, token, signal, texto }: Peticion = {},
  ): Promise<T> {
    const headers = new Headers({
      Accept: texto ? 'text/plain' : 'application/json',
    });
    if (datos !== undefined) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    let respuesta: Response;
    try {
      respuesta = await fetcher(`${base}${ruta}`, {
        method: metodo,
        headers,
        signal,
        credentials: 'omit',
        body:
          formulario ??
          (datos === undefined ? undefined : JSON.stringify(datos)),
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new ErrorApi('conexion');
    }

    if (!respuesta.ok) {
      const estado = respuesta.status;
      if (ruta === '/auth/login' && (estado === 401 || estado === 403)) {
        throw new ErrorApi('credenciales', estado);
      }
      if (estado === 401 && token) {
        alExpirarToken?.(token);
        throw new ErrorApi('sesionAdmin', estado);
      }
      if (
        estado === 404 &&
        ruta.startsWith('/consents/') &&
        ruta.endsWith('/revoke')
      ) {
        throw new ErrorApi('consentimientoNoEncontrado', estado);
      }
      if (ruta === '/samples' && estado === 403) {
        const error = await respuesta.json().catch(() => null);
        if (error?.detail?.code === 'CONSENT_REQUIRED') {
          throw new ErrorApi('muestraSinConsentimiento', estado);
        }
      }
      if (estado === 503 && ruta === '/predict') throw new ErrorApi('clasificadorNoDisponible', estado);
      if (estado === 503 && ruta === '/stt') throw new ErrorApi('transcriptorNoDisponible', estado);
      throw new ErrorApi('servidor', estado);
    }

    try {
      return (texto ? await respuesta.text() : await respuesta.json()) as T;
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new ErrorApi('respuestaInvalida');
    }
  }

  const sesion = (id: string) => `/sessions/${encodeURIComponent(id)}`;

  return {
    aceptarConsentimiento: (datos) =>
      solicitar('/consents', { metodo: 'POST', datos }),
    revocarConsentimiento: (id) =>
      solicitar(`/consents/${encodeURIComponent(id)}/revoke`, {
        metodo: 'POST',
      }),
    iniciarSesion: (idParticipante) => solicitar('/sessions', { metodo: 'POST', datos: { id_participante: idParticipante } }),
    finalizarSesion: (id) =>
      solicitar(`${sesion(id)}/end`, { metodo: 'PATCH' }),
    async predecir({ session_id, vector }, signal) {
      validarVector(vector);
      return solicitar('/predict', {
        metodo: 'POST',
        datos: { session_id, vector: [...vector] },
        signal,
      });
    },
    transcribir(audio, signal) {
      const formulario = new FormData();
      const extensiones: Record<string, string> = {
        'audio/webm': 'webm',
        'audio/ogg': 'ogg',
        'audio/mp4': 'm4a',
        'audio/wav': 'wav',
      };
      const tipo = audio.type.split(';')[0];
      if (!tipo.startsWith('audio/') || !audio.size)
        return Promise.reject(new ErrorApi('audioInvalido'));
      formulario.append(
        'audio',
        audio,
        `grabacion.${extensiones[tipo] ?? 'audio'}`,
      );
      return solicitar('/stt', { metodo: 'POST', formulario, signal });
    },
    traducir: (texto, signal) =>
      solicitar('/translate', { metodo: 'POST', datos: { texto }, signal }),
    registrarIntervencion(id, datos) {
      const clave = envios.get(datos) ?? crypto.randomUUID();
      envios.set(datos, clave);
      return solicitar(`${sesion(id)}/interventions`, {
        metodo: 'POST', datos: { ...datos, clave_envio: clave },
      });
    },
    exportarSesion: (id) => solicitar(`${sesion(id)}/export`, { texto: true }),
    iniciarSesionAdmin: (datos) =>
      solicitar('/auth/login', { metodo: 'POST', datos }),
    listarSenas: (token) => solicitar('/signs', { token }),
    async cargarMuestra(token, { id_sena, id_participante, vector }) {
      validarVector(vector);
      return solicitar('/samples', {
        metodo: 'POST',
        token,
        datos: { id_sena, id_participante, vector: [...vector] },
      });
    },
    consultarModelo: (token) => solicitar('/model', { token }),
    guardarModelo: (token, datos) =>
      solicitar('/model', { metodo: 'PUT', token, datos }),
    async enviarSus(respuestas, sesionId) {
      validarSus(respuestas);
      return solicitar('/sus', {
        metodo: 'POST',
        datos: { session_id: sesionId, respuestas: [...respuestas] },
      });
    },
  };
}
