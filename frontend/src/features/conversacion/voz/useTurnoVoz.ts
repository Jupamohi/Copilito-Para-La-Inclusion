import { useEffect, useReducer, useRef } from 'react';
import { ErrorApi } from '../../../api/errores';
import { useEstado } from '../../../app/estado';
import { textos } from '../../../i18n/textos';
import { ErrorGrabacion, iniciarGrabacion } from '../../../lib/grabacion';
import { inicialVoz, reducirVoz } from './maquina';

const contenido = textos.voz;

export function useTurnoVoz(sessionId: string) {
  const { api, dispatch } = useEstado();
  const [estado, cambiar] = useReducer(reducirVoz, inicialVoz);
  const operacion = useRef<AbortController | null>(null);
  const detenerGrabacion = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      operacion.current?.abort();
      operacion.current = null;
      detenerGrabacion.current = null;
    },
    [],
  );

  function fallar(error: unknown, control: AbortController) {
    if (control.signal.aborted) return;
    cambiar({
      tipo: 'error',
      mensaje:
        error instanceof ErrorGrabacion
          ? contenido[error.codigo]
          : error instanceof ErrorApi
            ? error.message
            : textos.api.servidor,
    });
  }

  async function transcribir(audio: Blob, control: AbortController) {
    detenerGrabacion.current = null;
    if (control.signal.aborted) return;
    cambiar({ tipo: 'enviar' });
    const inicio = performance.now();
    try {
      const resultado = await api.transcribir(audio, control.signal);
      if (control.signal.aborted) return;
      const texto = resultado.texto?.trim();
      if (texto)
        cambiar({
          tipo: 'verificar',
          transcripcion: {
            texto,
            latenciaMs: Math.round(performance.now() - inicio),
          },
        });
      else cambiar({ tipo: 'error', mensaje: contenido.sinTexto });
    } catch (error) {
      fallar(error, control);
    } finally {
      if (operacion.current === control) operacion.current = null;
    }
  }

  async function hablar() {
    if (
      operacion.current ||
      !(
        estado.fase === 'lista' ||
        (estado.fase === 'error' && !estado.transcripcion)
      )
    )
      return;
    const control = new AbortController();
    operacion.current = control;
    cambiar({ tipo: 'pedir' });
    try {
      const detener = await iniciarGrabacion(
        control.signal,
        (audio) => void transcribir(audio, control),
        (error) => {
          if (operacion.current === control) operacion.current = null;
          detenerGrabacion.current = null;
          fallar(error, control);
        },
      );
      if (!control.signal.aborted) {
        detenerGrabacion.current = detener;
        cambiar({ tipo: 'grabar' });
      }
    } catch (error) {
      if (operacion.current === control) operacion.current = null;
      fallar(error, control);
    }
  }

  function detener() {
    detenerGrabacion.current?.();
    detenerGrabacion.current = null;
  }

  async function confirmar() {
    if (
      operacion.current ||
      !(estado.fase === 'verificar' || estado.fase === 'error') ||
      !estado.transcripcion
    )
      return;
    const control = new AbortController();
    operacion.current = control;
    cambiar({ tipo: 'traducir' });
    const { texto, latenciaMs } = estado.transcripcion;
    const inicio = performance.now();
    try {
      const secuencia = await api.traducir(texto, control.signal);
      if (control.signal.aborted) return;
      dispatch({
        type: 'confirmarIntervencion',
        sesionId: sessionId,
        datos: {
          interlocutor: 'oyente',
          tipo: 'voz',
          texto,
          confianza: null,
          confirmada: true,
          latencia_ms: latenciaMs + Math.round(performance.now() - inicio),
        },
      });
      cambiar({ tipo: 'traducida', secuencia });
    } catch (error) {
      fallar(error, control);
    } finally {
      if (operacion.current === control) operacion.current = null;
    }
  }

  return {
    estado,
    hablar,
    detener,
    confirmar,
    repetir: () => cambiar({ tipo: 'repetir' }),
  };
}
