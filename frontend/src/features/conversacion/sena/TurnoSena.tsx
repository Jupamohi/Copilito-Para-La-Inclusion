import { useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { textos } from '../../../i18n/textos';
import { adaptarManos } from '../../../lib/mediapipe/adaptarManos';
import { dibujarManos } from '../../../lib/mediapipe/dibujarManos';
import type { CapturaManos } from '../../../lib/mediapipe/protocolo';
import type { DetectedHand } from '../../../lib/vector';
import { AvisoCamara } from '../../dispositivos/AvisoCamara';
import { camaraVisible, useCamara } from '../../dispositivos/useCamara';
import { IconoConversacion as Icono } from '../IconoConversacion';
import { permitePredecir } from './maquina';
import { useTurnoSena } from './useTurnoSena';

const contenido = textos.sena;
const porcentaje = new Intl.NumberFormat('es-CO', {
  style: 'percent',
  maximumFractionDigits: 1,
});
// TODO(supuesto): ajustar la antigüedad máxima del fotograma en los dispositivos del piloto.
const vigenciaCapturaMs = 750;

export function TurnoSena({
  sessionId,
  camaraId,
}: {
  sessionId: string;
  camaraId: string | null;
}) {
  const { estado, reconocer, confirmar, descartar } = useTurnoSena(sessionId);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const resultadoVisible = useRef<HTMLHeadingElement>(null);
  const botonReconocer = useRef<HTMLButtonElement>(null);
  const ultima = useRef<{ manos: DetectedHand[]; tiempo: number } | null>(null);

  const dibujar = useCallback(
    (captura: CapturaManos, video: HTMLVideoElement) => {
      ultima.current = {
        manos: captura.luzSuficiente ? adaptarManos(captura) : [],
        tiempo: performance.now(),
      };
      if (lienzo.current)
        dibujarManos(lienzo.current, video, captura.landmarks);
    },
    [],
  );
  const {
    video,
    estado: camara,
    seleccion,
    abrir,
  } = useCamara(camaraId, dibujar);
  const visible = camaraVisible(camara);
  const falloCamara = !visible && camara.fase !== 'solicitando';
  const puedeReconocer =
    camara.fase === 'evaluada' &&
    camara.luzSuficiente &&
    camara.manos > 0 &&
    permitePredecir(estado);
  const resultado =
    estado.fase === 'verificar' || estado.fase === 'confirmada'
      ? estado.resultado
      : null;
  const latencia =
    estado.fase === 'rechazada' ? estado.latenciaMs : resultado?.latenciaMs;

  useEffect(() => {
    if (estado.fase === 'verificar' || estado.fase === 'confirmada')
      resultadoVisible.current?.focus();
    if (estado.fase === 'rechazada' || estado.fase === 'error')
      botonReconocer.current?.focus();
  }, [estado.fase]);

  function iniciarPrediccion() {
    if (!puedeReconocer) return;
    const captura = ultima.current;
    const vigente =
      captura && performance.now() - captura.tiempo <= vigenciaCapturaMs;
    void reconocer(vigente ? captura.manos : []);
  }

  return (
    <>
      <p className="sala-privacidad">
        <Icono nombre="candado" /> {textos.privacidadManos}
      </p>
      <div className="sala-paneles">
        <section
          className="sala-tarjeta sala-captura"
          aria-labelledby="titulo-captura"
        >
          <h2 id="titulo-captura">
            <Icono nombre="camara" /> {contenido.captura}
          </h2>
          <div className="sala-video">
            <div className="sala-video-directo" hidden={!visible}>
              <video
                ref={video}
                autoPlay
                playsInline
                muted
                className="vista-camara block"
                aria-label={textos.dispositivos.vistaPrevia}
              />
              <canvas
                ref={lienzo}
                aria-hidden="true"
                className="superposicion-manos"
              />
            </div>
            {!visible && <Icono nombre="camara" />}
            <div className="sala-aviso-camara">
              <AvisoCamara camara={camara} />
            </div>
          </div>
          <p className="sala-instrucciones">{contenido.instrucciones}</p>
          <div className="sala-controles">
            <button
              type="button"
              className="boton"
              ref={botonReconocer}
              disabled={!puedeReconocer}
              onClick={iniciarPrediccion}
            >
              <Icono nombre="reproducir" />
              {estado.fase === 'prediciendo'
                ? contenido.analizando
                : estado.fase === 'error'
                  ? textos.dispositivos.reintentar
                  : contenido.reconocer}
            </button>
            {falloCamara && (
              <button
                type="button"
                className="boton boton-secundario"
                onClick={() => {
                  ultima.current = null;
                  abrir(camara.fase === 'sinCamara' ? null : seleccion || null);
                }}
              >
                <Icono nombre="reintentar" /> {textos.dispositivos.reintentar}
              </button>
            )}
            {visible && (
              <span className="sala-insignia">
                <Icono nombre="camara" /> Cámara activa
              </span>
            )}
            {camara.fase === 'evaluada' && camara.luzSuficiente && (
              <span className="sala-insignia">
                <Icono nombre="luz" /> Buena iluminación
              </span>
            )}
          </div>
          <Link to="/preparacion">{contenido.volverPreparacion}</Link>
        </section>
        <section
          className="sala-tarjeta sala-resultado"
          aria-labelledby="titulo-resultado"
        >
          <h2 id="titulo-resultado">
            <Icono nombre="brillo" /> {contenido.resultado}
          </h2>
          {!resultado && estado.fase === 'lista' && (
            <div className="sala-espera">
              <Icono nombre="mano" />
              <h3>Esperando reconocimiento</h3>
              <p>
                Mantén las manos visibles y selecciona «{contenido.reconocer}».
              </p>
            </div>
          )}
          {!resultado && (
            <dl>
              <dt>{contenido.glosa}</dt>
              <dd>—</dd>
              <dt>{contenido.texto}</dt>
              <dd>—</dd>
            </dl>
          )}
          <p
            role="status"
            aria-atomic="true"
            className={
              estado.fase === 'prediciendo' || estado.fase === 'rechazada'
                ? undefined
                : 'sr-only'
            }
          >
            {estado.fase === 'prediciendo'
              ? contenido.analizando
              : estado.fase === 'rechazada'
                ? contenido.noReconocida
                : ''}
          </p>
          {estado.fase === 'error' && (
            <p className="aviso aviso-error" role="alert">
              {estado.mensaje}
            </p>
          )}
          {resultado && (
            <div className="space-y-3">
              <h3
                className="text-lg font-semibold"
                tabIndex={-1}
                ref={resultadoVisible}
              >
                {estado.fase === 'verificar'
                  ? contenido.verifique
                  : contenido.confirmada}
              </h3>
              <dl className="space-y-2">
                <div>
                  <dt className="font-semibold">{contenido.glosa}</dt>
                  <dd>{resultado.glosa}</dd>
                </div>
                <div>
                  <dt className="font-semibold">{contenido.texto}</dt>
                  <dd>{resultado.texto}</dd>
                </div>
                <div>
                  <dt className="font-semibold">{contenido.confianza}</dt>
                  <dd>{porcentaje.format(resultado.confianza)}</dd>
                </div>
              </dl>
              {estado.fase === 'verificar' && (
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="boton" onClick={confirmar}>
                    {contenido.confirmar}
                  </button>
                  <button
                    type="button"
                    className="boton boton-secundario"
                    onClick={() => {
                      descartar();
                      window.requestAnimationFrame(() =>
                        botonReconocer.current?.focus(),
                      );
                    }}
                  >
                    {contenido.descartar}
                  </button>
                </div>
              )}
              {estado.fase === 'confirmada' && (
                <p role="status" aria-atomic="true">
                  <span aria-hidden="true">
                    {estado.voz === 'reproduciendo'
                      ? '🔊'
                      : estado.voz === 'terminada'
                        ? '✓'
                        : 'ℹ'}
                  </span>{' '}
                  {contenido.voz[estado.voz]}
                </p>
              )}
            </div>
          )}
          {latencia !== undefined && <p>{contenido.latencia(latencia)}</p>}
        </section>
      </div>
    </>
  );
}
