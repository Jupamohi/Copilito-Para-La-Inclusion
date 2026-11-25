import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useEstado } from '../../app/estado';
import { MarcoPantalla } from '../../components/MarcoPantalla';
import { textos } from '../../i18n/textos';
import { useSolicitud } from '../../lib/useSolicitud';

const contenido = textos.resumen;
const fecha = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
  timeZone: 'America/Bogota',
});
const hora = new Intl.DateTimeFormat('es-CO', {
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});
const unidades = (unit: 'hour' | 'minute' | 'second') =>
  new Intl.NumberFormat('es-CO', { style: 'unit', unit, unitDisplay: 'long' });
const reloj = {
  horas: unidades('hour'),
  minutos: unidades('minute'),
  segundos: unidades('second'),
};

function formatearDuracion(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return contenido.datoNoDisponible;
  const segundos = Math.floor(ms / 1000);
  if (!segundos && ms > 0) return contenido.menosDeUnSegundo;
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor(segundos / 60) % 60;
  return [
    horas ? reloj.horas.format(horas) : '',
    minutos ? reloj.minutos.format(minutos) : '',
    reloj.segundos.format(segundos % 60),
  ]
    .filter(Boolean)
    .join(', ');
}

function descargarTexto(texto: string) {
  const url = URL.createObjectURL(
    new Blob([texto], { type: 'text/plain;charset=utf-8' }),
  );
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'copilito-conversacion.txt';
  document.body.append(enlace);
  try {
    enlace.click();
  } finally {
    enlace.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export function Cierre({ piloto }: { piloto: boolean }) {
  const { api, estado, dispatch, finalizarSesion } = useEstado();
  const navigate = useNavigate();
  const descarga = useSolicitud();
  const [descargada, setDescargada] = useState(false);
  const resultado = useRef<HTMLHeadingElement>(null);
  const cierre = estado.cierre;
  const id = estado.sesion?.session_id;

  useEffect(() => {
    if (cierre.fase === 'finalizada') resultado.current?.focus();
  }, [cierre.fase]);

  if (!estado.sesion || !id) {
    return (
      <MarcoPantalla titulo={textos.cierre}>
        <p>{contenido.sinSesion}</p>
        <Link to="/">{textos.inicio}</Link>
      </MarcoPantalla>
    );
  }

  const inicio = new Date(estado.sesion.inicio);
  const fechaValida = Number.isFinite(inicio.getTime());
  const historial = [
    ...estado.intervencionesRegistradas,
    ...estado.intervencionesPendientes,
  ];
  const finalizando = cierre.fase === 'finalizando';

  function exportar(sesionId: string) {
    setDescargada(false);
    void descarga.ejecutar(
      () => api.exportarSesion(sesionId),
      (texto) => {
        descargarTexto(texto);
        setDescargada(true);
      },
    );
  }

  function nuevaSesion() {
    dispatch({ type: 'nuevaSesion' });
    void navigate('/consentimiento', { replace: true });
  }

  return (
    <MarcoPantalla titulo={textos.cierre}>
      <section className="space-y-3" aria-labelledby="resumen-sesion">
        <h2
          ref={resultado}
          id="resumen-sesion"
          tabIndex={-1}
          className="text-xl font-semibold"
        >
          {cierre.fase === 'finalizada'
            ? contenido.finalizada
            : contenido.datos}
        </h2>
        <dl className="grid grid-cols-1 gap-3 rounded-xl border border-borde bg-fondo p-4 sm:grid-cols-3">
          <div>
            <dt className="font-semibold">{contenido.fecha}</dt>
            <dd>
              {fechaValida ? (
                <time dateTime={estado.sesion.inicio}>
                  {fecha.format(inicio)}
                </time>
              ) : (
                contenido.datoNoDisponible
              )}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">{contenido.hora}</dt>
            <dd>
              {fechaValida ? (
                <time dateTime={estado.sesion.inicio}>
                  {hora.format(inicio)}
                </time>
              ) : (
                contenido.datoNoDisponible
              )}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">{contenido.duracion}</dt>
            <dd>
              {cierre.fase === 'finalizada'
                ? formatearDuracion(cierre.duracionMs)
                : contenido.duracionPendiente}
            </dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="historial-sesion" className="space-y-3">
        <h2 id="historial-sesion" className="text-xl font-semibold">
          {contenido.historial}
        </h2>
        {historial.length ? (
          <ol className="space-y-2">
            {historial.map((intervencion, indice) => (
              <li className="rounded-lg border border-borde p-3" key={indice}>
                <p className="font-semibold">
                  {contenido.interlocutores[intervencion.interlocutor]}
                </p>
                <p className="whitespace-pre-wrap">{intervencion.texto}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p>{contenido.historialVacio}</p>
        )}
      </section>
      {cierre.fase === 'error' && (
        <p role="alert" className="aviso aviso-error">
          {cierre.mensaje}
        </p>
      )}
      {descarga.error && (
        <p role="alert" className="aviso aviso-error">
          {descarga.error}
        </p>
      )}
      <p
        role="status"
        className={
          finalizando || descarga.cargando || descargada ? 'aviso' : 'sr-only'
        }
      >
        {finalizando
          ? contenido.finalizando
          : descarga.cargando
            ? contenido.exportando
            : descargada
              ? contenido.descargaLista
              : ''}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {cierre.fase === 'finalizada' ? (
          <>
            <button
              type="button"
              className="boton"
              disabled={descarga.cargando}
              onClick={() => exportar(id)}
            >
              {descarga.error
                ? contenido.reintentarExportacion
                : contenido.exportar}
            </button>
            {piloto && (
              <Link className="boton boton-secundario" to="/sus">
                {contenido.responder}
              </Link>
            )}
            <button
              type="button"
              className="boton boton-secundario"
              onClick={nuevaSesion}
            >
              {contenido.nuevaSesion}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="boton"
              disabled={finalizando}
              onClick={() =>
                void finalizarSesion(id, estado.intervencionesPendientes)
              }
            >
              {cierre.fase === 'error'
                ? contenido.reintentarCierre
                : contenido.finalizar}
            </button>
            {!finalizando && (
              <Link to="/conversacion">{contenido.volverConversacion}</Link>
            )}
          </>
        )}
      </div>
    </MarcoPantalla>
  );
}

