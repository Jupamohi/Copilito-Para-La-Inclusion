import { Link, useNavigate } from 'react-router';
import { useEstado } from '../../app/estado';
import { AvisoPrivacidad } from '../../components/AvisoPrivacidad';
import { MarcoPantalla } from '../../components/MarcoPantalla';
import { textos } from '../../i18n/textos';
import { useSolicitud } from '../../lib/useSolicitud';
import { AvisoCamara } from './AvisoCamara';
import { camaraVisible, useCamara } from './useCamara';

const contenido = textos.dispositivos;

export function Preparacion() {
  const { estado, dispatch, api } = useEstado();
  const navigate = useNavigate();
  const {
    video,
    estado: camara,
    dispositivos,
    seleccion,
    abrir,
  } = useCamara(estado.camaraId);
  const { cargando, error, ejecutar } = useSolicitud();
  const evaluada = camara.fase === 'evaluada';
  const mostrarVideo = camaraVisible(camara);
  const puedeIniciar = evaluada && camara.luzSuficiente && camara.manos > 0;
  const falloCamara = !mostrarVideo && camara.fase !== 'solicitando';

  function iniciarSesion() {
    if (!puedeIniciar) return;
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
      () => api.iniciarSesion(),
      (sesion) => {
        dispatch({ type: 'sesion', sesion, camaraId: seleccion || null });
        void navigate('/conversacion');
      },
    );
  }

  return (
    <MarcoPantalla titulo={textos.preparacion}>
      <p>{contenido.instrucciones}</p>
      <AvisoPrivacidad />
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
      <video
        ref={video}
        autoPlay
        playsInline
        muted
        aria-label={contenido.vistaPrevia}
        hidden={!mostrarVideo}
        className="vista-camara"
      />
      <AvisoCamara camara={camara} />
      {error && (
        <p className="aviso aviso-error" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
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
        <button
          type="button"
          className="boton"
          disabled={!puedeIniciar || cargando}
          onClick={iniciarSesion}
        >
          {cargando
            ? contenido.iniciandoSesion
            : estado.sesion
              ? contenido.volverSesion
              : contenido.iniciarSesion}
        </button>
        <Link to="/">{textos.inicio}</Link>
      </div>
      <p role="status" className="sr-only">
        {cargando ? contenido.iniciandoSesion : ''}
      </p>
    </MarcoPantalla>
  );
}
