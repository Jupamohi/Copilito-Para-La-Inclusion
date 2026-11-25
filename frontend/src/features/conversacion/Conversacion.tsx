import { useEffect, useReducer, useRef } from 'react';
import { Link } from 'react-router';
import { ErrorApi } from '../../api/errores';
import { useEstado } from '../../app/estado';
import { MarcoPantalla } from '../../components/MarcoPantalla';
import { textos } from '../../i18n/textos';
import { TurnoSena } from './sena/TurnoSena';
import { reducirTurnos, turnosIniciales } from './turnos';
import { TurnoVoz } from './voz/TurnoVoz';

const contenido = textos.turnos;

function SesionConversacion({ sessionId }: { sessionId: string }) {
  const { estado, registrarPendientes } = useEstado();
  const [turnos, cambiar] = useReducer(reducirTurnos, turnosIniciales);
  const activa = useRef(false);
  const enCurso = useRef(false);
  useEffect(() => {
    activa.current = true;
    return () => {
      activa.current = false;
    };
  }, []);

  async function alternar() {
    if (enCurso.current) return;
    enCurso.current = true;
    cambiar({ tipo: 'solicitar' });
    try {
      await registrarPendientes(sessionId, estado.intervencionesPendientes);
      if (activa.current) cambiar({ tipo: 'alternar' });
    } catch (error) {
      if (activa.current)
        cambiar({
          tipo: 'fallar',
          mensaje:
            error instanceof ErrorApi ? error.message : textos.api.servidor,
        });
    } finally {
      enCurso.current = false;
    }
  }

  const guardando = turnos.fase === 'guardando';
  const senas = turnos.turno === 'sena';

  return (
    <MarcoPantalla titulo={textos.conversacion}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borde pb-4">
        <p className="font-semibold" role="status" aria-atomic="true">
          <span aria-hidden="true">
            {guardando ? '…' : senas ? '✋' : '🎙️'}
          </span>{' '}
          {guardando
            ? contenido.guardando
            : senas
              ? textos.sena.turno
              : textos.voz.turno}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="boton boton-secundario"
            onClick={() => void alternar()}
            disabled={guardando}
          >
            {turnos.fase === 'error'
              ? contenido.reintentar
              : senas
                ? contenido.pasarAVoz
                : contenido.pasarASenas}
          </button>
          <Link to="/cierre">{contenido.irAlCierre}</Link>
        </div>
      </div>
      {turnos.fase === 'error' && (
        <p className="aviso aviso-error" role="alert">
          {turnos.mensaje}
        </p>
      )}
      {!guardando &&
        (senas ? (
          <TurnoSena sessionId={sessionId} camaraId={estado.camaraId} />
        ) : (
          <TurnoVoz sessionId={sessionId} />
        ))}
    </MarcoPantalla>
  );
}

export function Conversacion() {
  const { estado } = useEstado();
  const sessionId = estado.sesion?.session_id;
  return sessionId ? (
    <SesionConversacion key={sessionId} sessionId={sessionId} />
  ) : null;
}
