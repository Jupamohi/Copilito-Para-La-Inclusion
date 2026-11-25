import { useEffect, useRef } from 'react';
import { Avatar3D } from '../../../components/avatar/Avatar3D';
import { textos } from '../../../i18n/textos';
import { useTurnoVoz } from './useTurnoVoz';

const contenido = textos.voz;

export function TurnoVoz({ sessionId }: { sessionId: string }) {
  const { estado, hablar, detener, confirmar, repetir } =
    useTurnoVoz(sessionId);
  const botonDetener = useRef<HTMLButtonElement>(null);
  const revision = useRef<HTMLHeadingElement>(null);
  const microfono =
    estado.fase === 'lista' ||
    (estado.fase === 'error' && !estado.transcripcion);
  const confirmarTexto =
    estado.fase === 'verificar' ||
    (estado.fase === 'error' && estado.transcripcion);
  const transcripcion =
    'transcripcion' in estado ? estado.transcripcion : undefined;

  useEffect(() => {
    if (estado.fase === 'verificar' || estado.fase === 'traducida')
      revision.current?.focus();
    if (estado.fase === 'grabando') botonDetener.current?.focus();
  }, [estado.fase]);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
      <section aria-labelledby="titulo-grabacion" className="space-y-4">
        <h2 className="text-xl font-semibold" id="titulo-grabacion">
          {contenido.grabacion}
        </h2>
        <p>{contenido.instrucciones}</p>
        <div role="status" aria-atomic="true" className="aviso">
          <span aria-hidden="true">
            {estado.fase === 'grabando' ? '●' : '🎙️'}
          </span>{' '}
          {contenido.estados[estado.fase]}
        </div>
        <div className="flex flex-wrap gap-2">
          {microfono && (
            <button
              type="button"
              className="boton"
              onClick={() => void hablar()}
            >
              {estado.fase === 'error'
                ? textos.dispositivos.reintentar
                : contenido.hablar}
            </button>
          )}
          {estado.fase === 'grabando' && (
            <button
              ref={botonDetener}
              type="button"
              className="boton"
              onClick={detener}
            >
              {contenido.detener}
            </button>
          )}
        </div>
        {estado.fase === 'error' && (
          <p role="alert" className="aviso aviso-error">
            {estado.mensaje}
          </p>
        )}
        {transcripcion && (
          <div className="rounded-xl border border-borde bg-fondo p-4 space-y-3">
            <h3 tabIndex={-1} ref={revision} className="text-lg font-semibold">
              {estado.fase === 'traducida'
                ? contenido.transcripcionConfirmada
                : contenido.transcripcion}
            </h3>
            {estado.fase !== 'traducida' && <p>{transcripcion.texto}</p>}
            <div className="flex flex-wrap gap-2">
              {confirmarTexto && (
                <button
                  type="button"
                  className="boton"
                  onClick={() => void confirmar()}
                >
                  {estado.fase === 'error'
                    ? textos.dispositivos.reintentar
                    : contenido.confirmar}
                </button>
              )}
              {estado.fase !== 'traduciendo' && (
                <button
                  type="button"
                  className="boton boton-secundario"
                  onClick={repetir}
                >
                  {contenido.repetir}
                </button>
              )}
            </div>
          </div>
        )}
      </section>
      {estado.fase === 'traducida' && (
        <Avatar3D
          frase={estado.transcripcion.texto}
          secuencia={estado.secuencia}
        />
      )}
    </div>
  );
}
