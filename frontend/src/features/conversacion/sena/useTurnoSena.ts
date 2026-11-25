import { useEffect, useReducer, useRef } from 'react';
import { ErrorApi } from '../../../api/errores';
import { useEstado } from '../../../app/estado';
import { textos } from '../../../i18n/textos';
import { hablarEnEspanol } from '../../../lib/tts';
import { landmarksToVector } from '../../../lib/vector';
import type { DetectedHand } from '../../../lib/vector';
import { inicial, permitePredecir, reducirSena } from './maquina';
import type { ResultadoSena } from './maquina';

export function useTurnoSena(sessionId: string) {
  const { api, dispatch } = useEstado();
  const [estado, cambiar] = useReducer(reducirSena, inicial);
  const consulta = useRef<AbortController | null>(null);
  const ultimaConfirmada = useRef<ResultadoSena | null>(null);
  const detenerVoz = useRef<(() => void) | undefined>(undefined);

  useEffect(
    () => () => {
      consulta.current?.abort();
      consulta.current = null;
      detenerVoz.current?.();
      detenerVoz.current = undefined;
    },
    [],
  );

  async function reconocer(manos: readonly DetectedHand[]) {
    if (consulta.current || !permitePredecir(estado)) return;
    cambiar({ tipo: 'solicitar' });
    const vector = landmarksToVector(manos);
    if (!vector.some((valor) => valor !== 0)) {
      cambiar({ tipo: 'fallar', mensaje: textos.sena.sinCaptura });
      return;
    }

    const abortar = new AbortController();
    consulta.current = abortar;
    const inicio = performance.now();
    try {
      const resultado = await api.predecir(
        { session_id: sessionId, vector },
        abortar.signal,
      );
      if (abortar.signal.aborted) return;
      const latenciaMs = Math.round(performance.now() - inicio);
      if (resultado.aceptada) {
        cambiar({
          tipo: 'mostrar',
          resultado: {
            glosa: resultado.seña,
            texto: resultado.texto?.trim() || resultado.seña,
            confianza: resultado.confianza,
            latenciaMs,
          },
        });
      } else {
        cambiar({ tipo: 'rechazar', latenciaMs });
      }
    } catch (error) {
      if (!abortar.signal.aborted) {
        cambiar({
          tipo: 'fallar',
          mensaje:
            error instanceof ErrorApi ? error.message : textos.api.servidor,
        });
      }
    } finally {
      if (consulta.current === abortar) consulta.current = null;
    }
  }

  function confirmar() {
    if (
      estado.fase !== 'verificar' ||
      ultimaConfirmada.current === estado.resultado
    )
      return;
    const resultado = estado.resultado;
    ultimaConfirmada.current = resultado;
    cambiar({ tipo: 'confirmar' });
    dispatch({
      type: 'confirmarIntervencion',
      sesionId: sessionId,
      datos: {
        interlocutor: 'sordo',
        tipo: 'seña',
        texto: resultado.texto,
        confianza: resultado.confianza,
        confirmada: true,
        latencia_ms: resultado.latenciaMs,
      },
    });
    detenerVoz.current = hablarEnEspanol(resultado.texto, (estado) =>
      cambiar({ tipo: 'voz', estado }),
    );
  }

  function descartar() {
    cambiar({ tipo: 'descartar' });
  }

  return { estado, reconocer, confirmar, descartar };
}
