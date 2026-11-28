import { useEffect } from 'react';
import { Link } from 'react-router';
import '../styles/como-funciona.css';

const imagenes = '/marca/funcionamiento/';

const trazos = {
  ajustes: 'M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2 M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z',
  mano: 'M8 12V5a1.5 1.5 0 0 1 3 0v6-8a1.5 1.5 0 0 1 3 0v8-6a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v7a7 7 0 0 1-7 7c-3 0-5-2-7-5l-3-4a1.5 1.5 0 0 1 2-2l3 3',
  micro: 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5Z M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-3 0h6',
  modelo: 'M6 6h12v12H6zM9 9h6v6H9zM9 3v3m6-3v3M9 18v3m6-3v3M3 9h3m-3 6h3m12-6h3m-3 6h3',
  texto: 'M6 2h8l4 4v16H6zM14 2v5h4M9 12h6m-6 4h6',
  audio: 'M3 9h4l5-4v14l-5-4H3zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  avatar: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21a8 8 0 0 1 16 0Z',
  permiso: 'M9 4H5v18h14V4h-4M9 3h6v4H9zM8 14l3 3 5-5',
  camara: 'M3 5h13v14H3zM16 10l5-3v10l-5-3',
  chat: 'M3 4h18v13H9l-6 4zM7 9h10m-10 4h6',
  luz: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1',
  encuadre: 'M3 8V3h5m8 0h5v5m0 8v5h-5m-8 0H3v-5',
  escudo: 'M12 2l8 4v6c0 4-4 8-8 10-4-2-8-6-8-10V6zM8 12l3 3 5-5',
  servidor: 'M13 2 5 14h6l-1 8 9-12h-6z',
  interfaz: 'M3 4h18v13H3zM8 21h8m-4-4v4',
  alerta: 'M12 3 2 21h20zM12 9v5m0 3h.01',
  flecha: 'M4 12h16m-6-6 6 6-6 6',
};

type IconoNombre = keyof typeof trazos;

function Icono({ nombre }: { nombre: IconoNombre }) {
  return <svg className="cf-icono" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={trazos[nombre]} />
  </svg>;
}

const modalidades = [
  {
    titulo: 'De señas a texto y voz',
    descripcion: 'Realiza una seña frente a la cámara. Si el modelo la reconoce dentro del vocabulario de Lengua de Señas Colombiana (LSC), Copiloto muestra el texto y puede leerlo en voz alta.',
    imagen: 'senas.png',
    icono: 'mano',
    recorrido: [['mano', 'Seña'], ['modelo', 'Reconocimiento'], ['texto', 'Texto'], ['audio', 'Voz']],
  },
  {
    titulo: 'De voz a señas',
    descripcion: 'Habla por el micrófono. Copiloto transcribe tu mensaje y busca palabras en su vocabulario para representar las señas disponibles mediante un avatar.',
    imagen: 'voz.png',
    icono: 'micro',
    recorrido: [['micro', 'Voz'], ['texto', 'Transcripción'], ['avatar', 'Avatar']],
  },
] as const;

const tecnologias = [
  ['encuadre', 'MediaPipe', 'Detección de manos'],
  ['modelo', 'ONNX Runtime', 'Reconocimiento de señas'],
  ['servidor', 'FastAPI', 'Servicios del backend'],
  ['interfaz', 'React', 'Interfaz de usuario'],
] as const;

const pasos = [
  ['permiso', 'Acepta', 'Lee el consentimiento de uso.'],
  ['camara', 'Configura', 'Prepara la cámara y el micrófono.'],
  ['mano', 'Comunícate', 'Realiza señas o habla.'],
  ['chat', 'Conversa', 'Intercambia mensajes por turnos.'],
] as const;

const consejos = [
  ['luz', 'Buena iluminación', 'Evita espacios demasiado oscuros.'],
  ['encuadre', 'Manos visibles', 'Mantén las manos dentro del encuadre.'],
  ['micro', 'Entorno tranquilo', 'Reduce el ruido de fondo al hablar.'],
] as const;

export function ComoFunciona() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return <article className="cf ancho">
    <header className="cf-hero cf-panel">
      <div>
        <span className="cf-etiqueta"><Icono nombre="ajustes" /> Cómo funciona Copiloto</span>
        <h1>Dos formas de comunicarse.<br />Una misma conversación.</h1>
        <p>Copiloto conecta la Lengua de Señas Colombiana (LSC) y el español mediante inteligencia artificial, facilitando la comunicación entre personas con diversidad auditiva y oyentes.</p>
        <Link to="/consentimiento" className="accion">Probar Copiloto <Icono nombre="flecha" /></Link>
      </div>
      <img src={imagenes + 'duo.png'} alt="" />
    </header>

    <section>
      <h2>Comunicación en ambos sentidos</h2>
      <div className="cf-modalidades">
        {modalidades.map(({ titulo, descripcion, imagen, icono, recorrido }) =>
          <article className="cf-panel cf-modalidad" key={titulo}>
            <img src={imagenes + imagen} alt="" />
            <div>
              <h3 className="cf-etiqueta"><Icono nombre={icono} />{titulo}</h3>
              <p>{descripcion}</p>
            </div>
            <ol className="cf-recorrido" aria-label={'Etapas de ' + titulo.toLowerCase()}>
              {recorrido.map(([simbolo, nombre]) => <li key={nombre}><Icono nombre={simbolo} /><span>{nombre}</span></li>)}
            </ol>
          </article>,
        )}
      </div>
    </section>

    <div className="cf-tecnica">
      <section className="cf-panel">
        <h2>¿Cómo reconoce tus manos?</h2>
        <div className="cf-deteccion">
          <div>
            <p>MediaPipe identifica 21 puntos de referencia por mano, desde la muñeca hasta las puntas de los dedos. El modelo usa sus posiciones para intentar identificar la seña.</p>
            <p className="cf-privacidad"><Icono nombre="escudo" /> El video de la cámara se procesa en tu dispositivo. Al servidor se envían los puntos de las manos para reconocer la seña.</p>
          </div>
          <img src={imagenes + 'puntos.png'} alt="Diagrama de los 21 puntos numerados de la muñeca y los dedos." loading="lazy" />
        </div>
        <figure>
          <img className="cf-captura" src={imagenes + 'captura.jpg'} alt="Cinco posiciones de una mano con líneas verdes y puntos sobre las articulaciones." loading="lazy" />
          <figcaption>Ejemplos de seguimiento de las manos.</figcaption>
        </figure>
      </section>
      <section className="cf-panel">
        <h2>Tecnologías que usamos</h2>
        <ul className="cf-tecnologias">
          {tecnologias.map(([icono, titulo, texto]) => <li key={titulo}><Icono nombre={icono} /><strong>{titulo}</strong><span>{texto}</span></li>)}
        </ul>
      </section>
    </div>

    <section>
      <h2>Comienza en cuatro sencillos pasos</h2>
      <ol className="cf-pasos">
        {pasos.map(([icono, titulo, texto], posicion) => <li className="cf-panel" key={titulo}>
          <span className="cf-numero" aria-hidden="true">{posicion + 1}</span><Icono nombre={icono} /><h3>{titulo}</h3><p>{texto}</p>
        </li>)}
      </ol>
    </section>

    <section>
      <h2>Consejos para una mejor experiencia</h2>
      <ul className="cf-consejos cf-panel">
        {consejos.map(([icono, titulo, texto]) => <li key={titulo}><Icono nombre={icono} /><div><h3>{titulo}</h3><p>{texto}</p></div></li>)}
      </ul>
    </section>

    <aside className="cf-aviso">
      <Icono nombre="alerta" />
      <div><h3>Un prototipo en evolución</h3><p>El vocabulario inicial previsto es de 15 a 20 señas. El reconocimiento puede presentar errores y su precisión está pendiente de validación con la comunidad. Copiloto es una herramienta de apoyo y no reemplaza a un intérprete de LSC.</p></div>
    </aside>

    <section className="cf-final">
      <h2>¿Listo para comunicarte sin barreras?</h2>
      <Link to="/consentimiento" className="accion">Iniciar conversación <Icono nombre="flecha" /></Link>
      <img src="/marca/gato-tarjetas.png" alt="" loading="lazy" />
      <svg className="cf-ondas" aria-hidden="true" viewBox="0 0 1200 80" preserveAspectRatio="none">
        <path fill="#a6d9bf" d="M0 36C180-4 250 85 450 52S715 20 896 46s203-39 304-30v64H0Z" />
        <path fill="#5fa889" d="M0 63c181-37 234 22 406 10s212-47 424-25 239 12 370-9v41H0Z" />
      </svg>
    </section>
  </article>;
}

