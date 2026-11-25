import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router';
import { useEstado } from '../../app/estado';
import '../../styles/consentimiento.css';
import { MarcoPantalla } from '../../components/MarcoPantalla';
import { textos } from '../../i18n/textos';
import { useSolicitud } from '../../lib/useSolicitud';

// TODO(supuesto): acordar el alcance y la versión oficial con el equipo del piloto.
const formatoConsentimiento = {
  alcance: 'uso_del_prototipo',
  version_formato: '1',
};
const contenido = textos.consentimiento;

function Simbolo({ tipo }: { tipo: 'candado' | 'microfono' | 'escudo' }) {
  const dibujos = {
    candado: <><rect x="4" y="10" width="16" height="12" rx="2" /><path d="M7 10V7a5 5 0 0 1 10 0v3m-5 5v3" /></>,
    microfono: <><rect x="9" y="2" width="6" height="13" rx="3" /><path d="M5 11a7 7 0 0 0 14 0m-7 7v4m-4 0h8" /></>,
    escudo: <><path d="M12 2 3 5v6c0 6 4 9 9 12 5-3 9-6 9-12V5Z" /><path d="m8 12 3 3 5-6" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{dibujos[tipo]}</svg>;
}

export function Bienvenida() {
  const { estado, dispatch, api } = useEstado();
  const [aceptado, setAceptado] = useState(false);
  const [rechazado, setRechazado] = useState(false);
  const detalle = useRef<HTMLHeadingElement>(null);
  const { cargando, error, ejecutar } = useSolicitud();

  useEffect(() => {
    detalle.current?.focus();
  }, [estado.participante, rechazado]);

  function aceptar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!aceptado) return;
    void ejecutar(
      () => api.aceptarConsentimiento(formatoConsentimiento),
      ({ id_participante }) => {
        dispatch({ type: 'consentimiento', participante: id_participante });
      },
    );
  }

  function volverALeer() {
    setAceptado(false);
    setRechazado(false);
    document.getElementById('titulo-pantalla')?.focus();
  }

  return (
    <MarcoPantalla titulo={textos.bienvenida}>
      {estado.participante ? (
        <div className="space-y-4">
          <h2 ref={detalle} tabIndex={-1} className="text-xl font-semibold">
            {contenido.guardado}
          </h2>
          <div className="aviso space-y-2">
            <p>
              {contenido.identificador}{' '}
              <strong className="wrap-anywhere">{estado.participante}</strong>
            </p>
            <p>{contenido.guardeIdentificador}</p>
          </div>
          <Link className="boton" to="/preparacion">
            {contenido.irPreparacion}
          </Link>
        </div>
      ) : rechazado ? (
        <div className="space-y-4">
          <h2 ref={detalle} tabIndex={-1} className="text-xl font-semibold">
            {contenido.rechazado}
          </h2>
          <button
            type="button"
            className="boton boton-secundario"
            onClick={volverALeer}
          >
            {contenido.volverALeer}
          </button>
        </div>
      ) : (
        <>
          <p className="intro-consentimiento">{contenido.introduccion}</p>
          <div className="datos-consentimiento">
            <p><Simbolo tipo="candado" /><strong>{textos.privacidadManos}</strong></p>
            <p><Simbolo tipo="microfono" />{contenido.audio}</p>
            <p><Simbolo tipo="escudo" />Puede retirar su consentimiento cuando lo desee.</p>
          </div>
          <form className="space-y-4" onSubmit={aceptar}>
            <label className="flex items-start gap-3">
              <input
                className="casilla"
                type="checkbox"
                checked={aceptado}
                disabled={cargando}
                onChange={(evento) => setAceptado(evento.target.checked)}
              />
              <span>{contenido.aceptacion}</span>
            </label>
            {error && (
              <p className="aviso aviso-error" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="boton"
                disabled={!aceptado || cargando}
              >
                {cargando ? contenido.guardando : contenido.aceptar}
              </button>
              <button
                type="button"
                className="boton boton-secundario"
                disabled={cargando}
                onClick={() => setRechazado(true)}
              >
                {contenido.noAceptar}
              </button>
            </div>
            <p role="status" className="sr-only">
              {cargando ? contenido.guardando : ''}
            </p>
          </form>
        </>
      )}
      <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-borde pt-5">
        <Link to="/retirar-consentimiento">{textos.revocar}</Link>
        <Link to="/admin/login">{textos.admin}</Link>
      </div>
    </MarcoPantalla>
  );
}

