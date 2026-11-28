import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import '../styles/privacidad.css';

const trazos = {
  escudo: 'M12 2l8 4v6c0 5-5 9-8 10-3-1-8-5-8-10V6zM8 12l3 3 5-5',
  ojo: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  persona: 'M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 21H3v-2a7 7 0 0 1 11-6m0 4 3 3 5-6',
  camara: 'M3 5h13v14H3zM16 10l5-3v10l-5-3',
  micro: 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-3 0h6',
  identificador: 'M2 5h20v14H2zM13 9h6m-6 4h6M9 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-5 6a3 3 0 0 1 6 0',
  documento: 'M5 2h9l5 5v15H5zM14 2v6h5M8 12h8m-8 4h8',
  mano: 'M8 12V5a1.5 1.5 0 0 1 3 0v6-8a1.5 1.5 0 0 1 3 0v8-6a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v7a7 7 0 0 1-7 7c-3 0-5-2-7-5l-3-4a1.5 1.5 0 0 1 2-2l3 3',
  servidor: 'M3 3h18v7H3zM3 14h18v7H3zM7 6.5h4m-4 11h4m6-11h.01m-.01 11h.01',
  candado: 'M5 10h14v11H5zM8 10V6a4 4 0 1 1 8 0v4m-4 4v3',
  retirar: 'M12 2l8 4v6c0 5-5 9-8 10-3-1-8-5-8-10V6zM8 12h8',
  flecha: 'M4 12h16m-6-6 6 6-6 6',
};

type Simbolo = keyof typeof trazos;

function Icono({ nombre }: { nombre: Simbolo }) {
  return <svg className="priv-icono" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={trazos[nombre]} /></svg>;
}

const principios = [
  ['escudo', 'Protección', 'El proyecto busca proteger tu información frente a accesos sin autorización.'],
  ['ojo', 'Transparencia', 'Puedes conocer qué datos usa Copiloto y para qué los utiliza.'],
  ['persona', 'Tu decisión', 'Tú autorizas el acceso a tus dispositivos y puedes solicitar el retiro de tu consentimiento.'],
] as const;

const datos = [
  ['camara', 'Cámara y reconocimiento de manos', 'Con tu permiso, la cámara permite detectar los puntos de referencia de tus manos.'],
  ['micro', 'Micrófono y reconocimiento de voz', 'En el turno de voz, Copiloto solicita permiso para grabar y envía el audio al servidor para transcribirlo.'],
  ['identificador', 'Identificador del participante', 'Permite gestionar tu participación y solicitar el retiro de tu consentimiento.'],
  ['documento', 'Consentimiento informado', 'Registra tu autorización antes de recopilar datos para la investigación.'],
] as const;

const flujo = [
  ['camara', 'Cámara', 'Captura local'],
  ['mano', 'Puntos de las manos', 'Datos numéricos'],
  ['servidor', 'Servidor', 'Reconocimiento de señas'],
] as const;

const preguntas = [
  ['¿Qué sucede con el video de mi cámara?', 'Copiloto procesa el video en tu dispositivo. Para reconocer las señas, envía al servidor las coordenadas de las manos.'],
  ['¿Para qué se utiliza mi voz?', 'El servidor transcribe la grabación del turno de voz. Copiloto usa el texto para buscar las señas disponibles.'],
  ['¿Puedo retirar mi consentimiento?', 'Sí. Usa la opción «Retirar consentimiento» y ten a mano tu identificador de participante.'],
  ['¿Cómo se usan y protegen los datos de investigación?', 'Los datos que autorices se usarán con fines académicos, de evaluación y mejora del prototipo. El equipo seguirá revisando las medidas de seguridad y privacidad durante el desarrollo.'],
] as const;

export function Privacidad() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash === '#politica-de-privacidad') {
      const politica = document.getElementById('politica-de-privacidad');
      politica?.focus({ preventScroll: true });
      politica?.scrollIntoView();
    } else if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return <article className="privacidad ancho">
    <header className="priv-hero priv-panel">
      <div>
        <span className="priv-etiqueta"><Icono nombre="escudo" /> Privacidad y protección de datos</span>
        <h1>Tu privacidad,<br />nuestro compromiso.</h1>
        <p>En Copiloto creemos que comunicarse sin barreras también significa hacerlo con confianza. Conoce cómo tratamos tus datos y respetamos tus decisiones.</p>
        <Link className="accion" to="#politica-de-privacidad">Conocer política de privacidad <Icono nombre="flecha" /></Link>
      </div>
      <img src="/marca/gato-escudo-privacidad.png" alt="" />
    </header>

    <section>
      <h2>Nuestros principios de privacidad</h2>
      <ul className="priv-principios">
        {principios.map(([icono, titulo, descripcion]) => <li className="priv-panel priv-fila" key={titulo}>
          <span className="priv-casilla"><Icono nombre={icono} /></span>
          <div><h3>{titulo}</h3><p>{descripcion}</p></div>
        </li>)}
      </ul>
    </section>

    <div className="priv-doble">
      <section className="priv-panel">
        <h2>¿Qué información utilizamos?</h2>
        <ul className="priv-datos">
          {datos.map(([icono, titulo, descripcion]) => <li className="priv-fila" key={titulo}>
            <span className="priv-casilla"><Icono nombre={icono} /></span>
            <div><h3>{titulo}</h3><p>{descripcion}</p></div>
          </li>)}
        </ul>
      </section>
      <section className="priv-panel">
        <h2>¿Qué sucede con tu video?</h2>
        <ol className="priv-flujo">
          {flujo.map(([icono, titulo, descripcion]) => <li key={titulo}>
            <span className="priv-casilla"><Icono nombre={icono} /></span>
            <strong>{titulo}</strong><span>{descripcion}</span>
          </li>)}
        </ol>
        <p className="priv-aviso"><Icono nombre="candado" /> Tu video original permanece en tu dispositivo durante el reconocimiento de señas.</p>
      </section>
    </div>

    <section>
      <h2>Tú tienes el control</h2>
      <div className="priv-doble">
        <article className="priv-panel priv-fila">
          <span className="priv-casilla"><Icono nombre="documento" /></span>
          <div><h3>Consultar el consentimiento</h3><p>Conoce las condiciones para participar en el prototipo.</p><Link to="/consentimiento">Consultar información <Icono nombre="flecha" /></Link></div>
        </article>
        <article className="priv-panel priv-fila">
          <span className="priv-casilla"><Icono nombre="retirar" /></span>
          <div><h3>Retirar mi consentimiento</h3><p>Solicita revocar tu autorización y eliminar tus muestras.</p><Link to="/retirar-consentimiento">Retirar consentimiento <Icono nombre="flecha" /></Link></div>
        </article>
      </div>
    </section>

    <section>
      <h2>Preguntas frecuentes</h2>
      <div className="priv-preguntas">
        {preguntas.map(([pregunta, respuesta]) => <details key={pregunta}>
          <summary><span className="priv-interrogacion" aria-hidden="true">?</span>{pregunta}<span className="priv-expandir" aria-hidden="true" /></summary>
          <p>{respuesta}</p>
        </details>)}
      </div>
    </section>

    <section className="priv-final" id="politica-de-privacidad" tabIndex={-1}>
      <h2>La privacidad también debe ser accesible.</h2>
      <p>El proyecto toma como referencia la Ley 1581 de 2012 de Colombia sobre protección de datos personales. Durante el desarrollo del prototipo, seguimos revisando cómo protegemos la información y explicamos su uso.</p>
      <div className="priv-enlaces">
        <Link className="accion" to="/consentimiento">Leer el consentimiento <Icono nombre="flecha" /></Link>
        <a href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981">Consultar la Ley 1581 de 2012</a>
      </div>
      <img src="/marca/gato-tarjetas.png" alt="" loading="lazy" />
      <svg className="priv-ondas" aria-hidden="true" viewBox="0 0 1200 92" preserveAspectRatio="none">
        <path fill="#a6dec4" d="M0 57C160-7 236 13 390 57S690 32 804 49s214-86 396-33v76H0Z" />
        <path fill="#75c4a6" d="M0 74C170 9 280 35 435 71S718 43 871 65s182-45 329-31v58H0Z" />
        <path fill="#327e60" d="M0 81C203 43 271 65 480 85s196-28 410-8 202-35 310-22v37H0Z" />
      </svg>
    </section>
  </article>;
}

