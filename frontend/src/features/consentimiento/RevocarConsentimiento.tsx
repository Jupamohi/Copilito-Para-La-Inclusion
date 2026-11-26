import '../../styles/retiro.css';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router';
import type { Api } from '../../api/tipos';
import { useEstado } from '../../app/estado';
import { MarcoPantalla } from '../../components/MarcoPantalla';
import { textos } from '../../i18n/textos';
import { useSolicitud } from '../../lib/useSolicitud';

const trazos = {
  persona: <><circle cx="12" cy="7" r="4" /><path d="M3 21a9 8 0 0 1 18 0" /></>,
  etiqueta: <><path d="M3 12 13 2h7l2 2v7L11 22Z" /><circle cx="17" cy="7" r="1" /></>,
  informacion: <><circle cx="12" cy="12" r="10" /><path d="M12 11v6m0-10v.5" /></>,
  escudo: <><path d="m12 2 9 4v6q0 6-9 10-9-4-9-10V6Z" /><path d="m8 12 3 3 5-6" /></>,
  volver: <path d="m9 5-7 7 7 7M2 12h20" />,
};
function IconoRetiro({ tipo }: { tipo: keyof typeof trazos }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{trazos[tipo]}</svg>;
}

const contenido = textos.revocacion;

export function RevocarConsentimiento() {
  const { api, dispatch } = useEstado();
  const [identificador, setIdentificador] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const [comprobante, setComprobante] =
    useState<Awaited<ReturnType<Api['revocarConsentimiento']>>>();
  const resultado = useRef<HTMLHeadingElement>(null);
  const solicitud = useSolicitud();

  useEffect(() => {
    if (comprobante) resultado.current?.focus();
  }, [comprobante]);

  function retirar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const id = identificador.trim();
    if (!id || !confirmado) return;
    void solicitud.ejecutar(
      async () => {
        const recibido = await api.revocarConsentimiento(id);
        dispatch({ type: 'consentimientoRevocado', participante: id });
        return recibido;
      },
      (recibido) => {
        setComprobante(recibido);
        setIdentificador('');
        setConfirmado(false);
      },
    );
  }

  return (
    <div className="retiro"><MarcoPantalla titulo={textos.revocar}>
      {comprobante ? (
        <section
          className="aviso space-y-3"
          aria-labelledby="titulo-constancia"
        >
          <h2
            id="titulo-constancia"
            ref={resultado}
            tabIndex={-1}
            className="text-xl font-semibold"
          >
            {contenido.retirado}
          </h2>
          <dl className="space-y-2">
            <div>
              <dt className="font-semibold">{contenido.constancia}</dt>
              <dd className="whitespace-pre-wrap">{comprobante.constancia}</dd>
            </div>
            <div>
              <dt className="font-semibold">{contenido.muestrasEliminadas}</dt>
              <dd>{comprobante.muestras_eliminadas}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <form className="space-y-4" onSubmit={retirar}>
          <div className="retiro-intro">
            <img className="retiro-gato" src="/marca/gato-privacidad.png" alt="" />
            <p>Tu privacidad, tu decisión. Puedes retirar tu consentimiento cuando lo desees.</p>
            <aside><IconoRetiro tipo="informacion" /><div><h2>¿Qué sucede al retirar tu consentimiento?</h2>
              <p>Se solicitará la eliminación de tus muestras y recibirás una constancia cuando el servidor confirme la revocación.</p></div></aside>
          </div>
          <div className="retiro-campos">
            <label className="grid gap-2"><span className="font-semibold">Nombre del participante (opcional)</span>
              <span className="retiro-campo"><IconoRetiro tipo="persona" /><input className="campo" placeholder="Ingresa tu nombre" autoComplete="given-name" disabled={solicitud.cargando} /></span>
            </label>
          <label className="grid gap-2">
            <span className="font-semibold">{contenido.identificador}</span>
            <span className="retiro-campo"><IconoRetiro tipo="etiqueta" /><input placeholder="Ej. participante-1" aria-describedby="ayuda-id-retiro"
              className="campo"
              required
              value={identificador}
              disabled={solicitud.cargando}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              onChange={(evento) => setIdentificador(evento.target.value)}
            /></span>
          </label>
          <small id="ayuda-id-retiro">Ingresa el identificador que recibiste al aceptar el consentimiento.</small></div>
          <label className="retiro-confirmar flex items-start gap-3">
            <input
              className="casilla"
              type="checkbox"
              required
              checked={confirmado}
              disabled={solicitud.cargando}
              onChange={(evento) => setConfirmado(evento.target.checked)}
            />
            <span>{contenido.confirmo}</span>
          </label>
          {solicitud.error && (
            <p role="alert" className="aviso aviso-error">
              {solicitud.error}
            </p>
          )}
          <button
            className="boton"
            type="submit"
            disabled={
              solicitud.cargando || !identificador.trim() || !confirmado
            }
          >
            <IconoRetiro tipo="escudo" />{solicitud.cargando
              ? contenido.retirando
              : solicitud.error
                ? textos.dispositivos.reintentar
                : contenido.retirar}
          </button>
          <p role="status" className="sr-only">
            {solicitud.cargando ? contenido.retirando : ''}
          </p>
        </form>
      )}
      <Link className="retiro-volver" to="/"><IconoRetiro tipo="volver" />{textos.inicio}</Link>
    </MarcoPantalla></div>
  );
}
