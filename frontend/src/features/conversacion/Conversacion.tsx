import { useEffect, useReducer, useRef } from 'react';
import { Link } from 'react-router';
import { ErrorApi } from '../../api/errores';
import { useEstado } from '../../app/estado';
import { MarcoPantalla } from '../../components/MarcoPantalla';
import { textos } from '../../i18n/textos';
import { IconoConversacion as Icono } from './IconoConversacion';
import '../../styles/conversacion.css';
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
  const historial = [
    ...estado.intervencionesRegistradas,
    ...estado.intervencionesPendientes,
  ];

  return (
    <MarcoPantalla titulo={textos.conversacion}>
      <div className="sala">
        <div className="sala-turno">
          <p className="font-semibold" role="status" aria-atomic="true">
            <Icono nombre={senas ? 'mano' : 'micro'} />
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
              <Icono nombre={senas ? 'micro' : 'mano'} />
              {turnos.fase === 'error'
                ? contenido.reintentar
                : senas
                  ? contenido.pasarAVoz
                  : contenido.pasarASenas}
            </button>
            <Link to="/cierre">
              <Icono nombre="salida" /> {contenido.irAlCierre}
            </Link>
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
        <div className="sala-inferior">
          <aside className="sala-tarjeta sala-consejos" aria-label="Consejos">
            <h2>
              <Icono nombre="bombilla" /> Consejos
            </h2>
            <ul>
              <li>
                <Icono nombre="mano" /> <span>Mantén tus manos visibles.</span>
              </li>
              <li>
                <Icono nombre="luz" /> <span>Usa buena iluminación.</span>
              </li>
              <li>
                <Icono nombre="auriculares" />{' '}
                <span>Procura un entorno tranquilo.</span>
              </li>
            </ul>
          </aside>
          <details className="sala-tarjeta sala-historial">
            <summary>
              <Icono nombre="historial" /> Historial de la sesión{' '}
              <span>{historial.length}</span>
            </summary>
            {historial.length === 0 ? (
              <p>Aún no hay intervenciones confirmadas.</p>
            ) : (
              <ol>
                {historial.map((item, indice) => (
                  <li key={indice}>
                    <strong>{item.tipo === 'seña' ? 'Seña' : 'Voz'}:</strong>{' '}
                    {item.texto}
                  </li>
                ))}
              </ol>
            )}
          </details>
        </div>
      </div>
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
