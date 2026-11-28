import { Link, useNavigate } from 'react-router';
import { useEstado } from '../../app/estado';
import '../../styles/preparacion.css';
import { MarcoPantalla } from '../../components/MarcoPantalla';
import { textos } from '../../i18n/textos';
import { useSolicitud } from '../../lib/useSolicitud';
import { AvisoCamara } from './AvisoCamara';
import { camaraVisible, useCamara } from './useCamara';

const simbolos = {
  camara: <><rect x="2" y="5" width="14" height="14" rx="2" /><path d="m16 10 6-4v12l-6-4" /></>,
  microfono: <><rect x="9" y="2" width="6" height="13" rx="3" /><path d="M5 11a7 7 0 0 0 14 0m-7 7v4m-4 0h8" /></>,
  manos: <path d="M8 13V6a1.5 1.5 0 0 1 3 0v6-8a1.5 1.5 0 0 1 3 0v8-7a1.5 1.5 0 0 1 3 0v8-5a1.5 1.5 0 0 1 3 0v8c0 8-10 9-13 4l-4-6c-1-2 1-3 3-1l2 2Z" />,
  candado: <><rect x="4" y="9" width="16" height="12" rx="2" /><path d="M8 9V6a4 4 0 0 1 8 0v3m-4 5v3" /></>,
  listo: <path d="m3 12 6 6L21 5" />,
  charla: <path d="M5 3h14a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-8l-6 4v-4a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" />,
};
function Icono({ tipo }: { tipo: keyof typeof simbolos }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{simbolos[tipo]}</svg>;
}
const contenido = textos.dispositivos;

export function Preparacion() {
  const { estado, dispatch, api } = useEstado();
  const navigate = useNavigate();
  const {
    video,
    estado: camara, progresoMano,
    dispositivos, nombreCamara, microfonoPrevisto,
    seleccion,
    abrir,
  } = useCamara(estado.camaraId);
  const { cargando, error, ejecutar } = useSolicitud();
  const evaluada = camara.fase === 'evaluada';
  const mostrarVideo = camaraVisible(camara);
  const puedeIniciar = progresoMano === 100;
  const falloCamara = !mostrarVideo && camara.fase !== 'solicitando';

  function iniciarSesion() {
    const participante = estado.participante;
    if (!puedeIniciar || !participante) return;
    if (estado.sesion) {
      dispatch({
        type: 'sesion',
        sesion: estado.sesion,
        camaraId: seleccion || null,
      });
      void navigate('/conversacion');
      return;
    }
    void ejecutar(
      () => api.iniciarSesion(participante),
      (sesion) => {
        dispatch({ type: 'sesion', sesion, camaraId: seleccion || null });
        void navigate('/conversacion');
      },
    );
  }

  return (
    <div className="preparar"><MarcoPantalla titulo={textos.preparacion}>
      <ol className="pasos-dispositivo" aria-label="Progreso de la conversación">
        <li><Icono tipo="listo" /><span>1. Consentimiento</span></li>
        <li aria-current="step"><svg aria-hidden="true" viewBox="0 0 26 24"><rect x="1" y="4" width="17" height="16" rx="3" /><path d="m18 10 7-5v14l-7-5Z" /><circle cx="9.5" cy="12" r="3.5" fill="#d8f3e3" stroke="none" /></svg><span>2. Dispositivos</span></li>
        <li><Icono tipo="charla" /><span>3. Conversación</span></li>
      </ol>
      <div className="intro-dispositivos"><p>{contenido.instrucciones}</p><img src="/marca/gato-camara.png" alt="" /></div>
      {dispositivos.length > 1 && (
        <label className="grid gap-2">
          <span className="font-semibold">{contenido.elegirCamara}</span>
          <select
            className="campo"
            value={seleccion}
            disabled={cargando || camara.fase === 'solicitando'}
            onChange={(evento) => abrir(evento.target.value)}
          >
            {dispositivos.map((dispositivo, indice) => (
              <option value={dispositivo.deviceId} key={dispositivo.deviceId}>
                {dispositivo.label || contenido.camaraSinNombre(indice + 1)}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="paneles-dispositivo"><section><h2><Icono tipo="camara" />Vista de la cámara</h2>
      <video
        ref={video}
        autoPlay
        playsInline
        muted
        aria-label={contenido.vistaPrevia}
        hidden={!mostrarVideo}
        className="vista-camara"
      />
      {!mostrarVideo && <div className="camara-inactiva"><Icono tipo="camara" /><strong>{camara.fase === 'solicitando' ? 'Esperando acceso a la cámara' : 'Vista de cámara desactivada'}</strong></div>}
      <p className="privacidad-video"><Icono tipo="candado" />{textos.privacidadManos}</p></section>
      <section><h2>Comprobación de dispositivos</h2>
        <dl className="comprobaciones">
          <div className={falloCamara ? 'fallo' : ''}><dt><Icono tipo="camara" />Cámara</dt><dd>{mostrarVideo ? (nombreCamara || dispositivos.find((d) => d.deviceId === seleccion)?.label || 'Activa · nombre no disponible') : camara.fase === 'denegada' ? 'Permiso bloqueado' : falloCamara ? 'Vista no disponible' : 'Esperando permiso'}</dd></div>
          <div><dt><Icono tipo="microfono" />Micrófono</dt><dd>{microfonoPrevisto || 'Micrófono predeterminado del dispositivo'}<br />Se solicitará en el turno de voz</dd></div>
          <div><dt><Icono tipo="manos" />Detección de manos</dt><dd>{evaluada ? (camara.manos ? 'Manos visibles' : (puedeIniciar ? 'Comprobación completada' : 'Buscando manos')) : camara.fase === 'detectorNoDisponible' ? 'Detector no disponible' : mostrarVideo ? 'Preparando detector' : 'Esperando cámara'}</dd>
            <dd className="progreso-mano">
              <div><progress aria-label="Detección estable de la mano" max={100} value={progresoMano} /><strong>{progresoMano}%</strong></div>
              <small>{puedeIniciar ? 'Detección completa. Ya puedes continuar.' : 'Mantén una mano visible y bien iluminada hasta llegar al 100%.'}</small>
            </dd></div>
        </dl>
        <div className="mt-3"><>{puedeIniciar ? <p className="aviso" role="status">Cámara lista. Puedes bajar la mano y continuar.</p> : <AvisoCamara camara={camara} />}</></div>
        <button
          type="button"
          className="boton iniciar-conversacion"
          disabled={!puedeIniciar || cargando}
          onClick={iniciarSesion}
        >
          <Icono tipo="charla" />{cargando
            ? contenido.iniciandoSesion
            : estado.sesion
              ? contenido.volverSesion
              : contenido.iniciarSesion}
        </button>
      </section></div>

      {error && (
        <p className="aviso aviso-error" role="alert">
          {error}
        </p>
      )}
      <div className="acciones-dispositivo">
        {falloCamara && (
          <button
            type="button"
            className="boton boton-secundario"
            disabled={cargando}
            onClick={() =>
              abrir(camara.fase === 'sinCamara' ? null : seleccion || null)
            }
          >
            {contenido.reintentar}
          </button>
        )}
        <Link to="/">{textos.inicio}</Link>
      </div>
      <p role="status" className="sr-only">
        {cargando ? contenido.iniciandoSesion : ''}
      </p>
    </MarcoPantalla></div>
  );
}
