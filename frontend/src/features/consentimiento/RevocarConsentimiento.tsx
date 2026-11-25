import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router';
import type { Api } from '../../api/tipos';
import { useEstado } from '../../app/estado';
import { MarcoPantalla } from '../../components/MarcoPantalla';
import { textos } from '../../i18n/textos';
import { useSolicitud } from '../../lib/useSolicitud';

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
    <MarcoPantalla titulo={textos.revocar}>
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
          <p>{contenido.instrucciones}</p>
          <label className="grid gap-2">
            <span className="font-semibold">{contenido.identificador}</span>
            <input
              className="campo"
              required
              value={identificador}
              disabled={solicitud.cargando}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              onChange={(evento) => setIdentificador(evento.target.value)}
            />
          </label>
          <label className="flex items-start gap-3">
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
            {solicitud.cargando
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
      <Link to="/">{textos.inicio}</Link>
    </MarcoPantalla>
  );
}
