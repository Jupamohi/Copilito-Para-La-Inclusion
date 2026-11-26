import { EnlacePrivacidadAcceso } from '../../components/EnlacePrivacidadAcceso';
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

function Simbolo({ tipo }: { tipo: 'candado' | 'microfono' | 'escudo' | 'persona' | 'tarjeta' | 'copiar' | 'portatil' | 'listo' }) {
  const dibujos = {
    persona: <><circle cx="12" cy="8" r="4" /><path d="M3 22a9 8 0 0 1 18 0" /></>,
    tarjeta: <><rect x="1" y="5" width="22" height="16" rx="2" /><circle cx="8" cy="11" r="2" /><path d="M4 18a4 4 0 0 1 8 0m3-8h5m-5 4h4" /></>,
    copiar: <><rect x="8" y="8" width="12" height="14" rx="2" /><path d="M5 17H4V4h12v1" /></>,
    portatil: <><rect x="4" y="4" width="16" height="13" rx="1" /><path d="m4 17-3 4h22l-3-4" /></>,
    listo: <path d="m4 13 5 5L21 6" />,
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
  const [nombre, setNombre] = useState('');
  const [mensajeCopia, setMensajeCopia] = useState('');
  async function copiarIdentificador(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setMensajeCopia('Identificador copiado.');
    } catch {
      setMensajeCopia('Seleccione el identificador y cópielo manualmente.');
    }
  }
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
        <div className="registro">
          <h2 ref={detalle} tabIndex={-1}><Simbolo tipo="listo" />{contenido.guardado}</h2>
          <div className="registro-nombre">
            <Simbolo tipo="persona" />
            <div><label htmlFor="nombre-participante">Nombre del participante</label>
              <input className="campo" id="nombre-participante" placeholder="Escribe tu nombre" value={nombre}
                onChange={(evento) => setNombre(evento.target.value)} aria-describedby="ayuda-nombre" maxLength={80} />
              <small id="ayuda-nombre">Opcional, para personalizar esta pantalla.</small>
            </div>
          </div>
          <div className="registro-id">
            <Simbolo tipo="tarjeta" />
            <div><p>{nombre.trim() ? `${nombre.trim()}, este es su identificador` : contenido.identificador}</p>
              <strong>{estado.participante}</strong>
              <p>{contenido.guardeIdentificador}</p>
            </div>
            <button type="button" aria-label="Copiar identificador" onClick={() => void copiarIdentificador(estado.participante!)}><Simbolo tipo="copiar" /></button>
          </div>
          {mensajeCopia && <p role="status">{mensajeCopia}</p>}
          <Link className="boton" to="/preparacion"><Simbolo tipo="portatil" />{contenido.irPreparacion}<span aria-hidden="true">→</span></Link>
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
        <EnlacePrivacidadAcceso tipo="retirar">{textos.revocar}</EnlacePrivacidadAcceso>
        <EnlacePrivacidadAcceso tipo="administrador">{textos.admin}</EnlacePrivacidadAcceso>
      </div>
    </MarcoPantalla>
  );
}

