import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import '../styles/portada.css';

export function Marca() {
  return <Link to="/" aria-label="Copiloto, inicio"><img className="marca" src="/marca/copiloto.png" alt="Copiloto" /></Link>;
}

export function Cabecera() {
  const { pathname } = useLocation();
  const ocultarProbar = /^\/(consentimiento|preparacion|conversacion)\/*$/i.test(pathname);
  return <header className="barra"><div className="ancho fila">
    <Marca />
    <nav aria-label="Principal"><Link to="/">Inicio</Link><Link to="/#funciones">Cómo funciona</Link><Link to="/#nosotros">Nosotros</Link><Link to="/#accesibilidad">Accesibilidad</Link></nav>
    {!ocultarProbar && <Link className="accion" to="/consentimiento">Probar <span aria-hidden="true">→</span></Link>}
  </div></header>;
}

export function Pie() {
  return <footer className="pie">
    <div className="ondas" aria-hidden="true">
      <svg viewBox="0 0 1200 100" preserveAspectRatio="none">
        <path fill="#cce9dd" d="M0 42 C165 12 216 109 420 73 S734 5 930 49 S1110 23 1200 6 V100 H0Z" />
        <path fill="#9ed5bf" d="M0 71 C170 22 260 50 451 85 S750 39 948 63 S1090 41 1200 27 V100 H0Z" />
      </svg>
      <img src="/marca/gato-pie.png" alt="" />
      <svg className="onda-frontal" viewBox="0 0 1200 100" preserveAspectRatio="none">
        <path fill="#164b3b" d="M0 80 C150 36 310 104 542 85 S836 37 1015 58 S1130 47 1200 41 V100 H0Z" />
      </svg>
    </div><div className="ancho">
    <div className="pie-columnas"><div><Marca /><p>Comunicación sin barreras</p></div>
    <nav aria-label="Enlaces del pie"><strong>Explorar</strong><Link to="/">Inicio</Link><Link to="/#funciones">Cómo funciona</Link><Link to="/consentimiento">Traductor</Link></nav>
    <nav aria-label="Recursos del pie"><strong>Privacidad y acceso</strong><Link to="/consentimiento">Información de consentimiento</Link><Link to="/retirar-consentimiento">Retirar mi autorización</Link><Link to="/admin/login">Área administrativa</Link></nav></div>
    <small>© Copiloto · Cali, Colombia</small>
  </div></footer>;
}

const trazos = {
  texto: <path d="M2 5h12M8 5v14m-3 0h6m4-8h7m-4-4v10q0 3 4 2" />,
  voz: <><rect x="9" y="2" width="6" height="13" rx="3" /><path d="M5 11a7 7 0 0 0 14 0m-7 7v4m-4 0h8" /></>,
  grupo: <><circle cx="12" cy="8" r="3" /><path d="M6 20v-2a6 6 0 0 1 12 0v2ZM5 6a2.5 2.5 0 1 0 0 5m14-5a2.5 2.5 0 1 1 0 5M2 18v-1a4 4 0 0 1 3-4m17 5v-1a4 4 0 0 0-3-4" /></>,
  camara: <><path d="M3 7h4l2-3h6l2 3h4a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.5" /></>,
  flechas: <path d="M9 7h13l-4-4m4 4-4 4M15 17H2l4-4m-4 4 4 4" />,
  avatar: <><circle cx="12" cy="7" r="4" /><path d="M3 21a9 8 0 0 1 18 0Z" /></>,
};

function IconoPortada({ nombre }: { nombre: keyof typeof trazos }) {
  return <svg className="icono-portada" viewBox="0 0 24 24" aria-hidden="true"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {trazos[nombre]}
  </svg>;
}
const funciones = [
  ['camara', 'Reconocimiento de LSC', 'La cámara detecta los puntos de tus manos para interpretar las señas del catálogo.'],
  ['flechas', 'Traducción bidireccional', 'Alterna entre señas, texto y voz durante la conversación.'],
  ['avatar', 'Avatar visual', 'Un avatar animado representa las señas disponibles para el mensaje.'],
] as const;

export function Portada() {
  const { hash } = useLocation();
  useEffect(() => {
    document.getElementById(hash.slice(1) || 'portada-titulo')?.focus();
  }, [hash]);
  return <div className="portada ancho">
    <section className="hero"><div><h1 id="portada-titulo" tabIndex={-1}>Comunicación<br />sin barreras</h1>
    <p>El copiloto es un asistente con inteligencia artificial que facilita la comunicación entre <strong>personas sordas y oyentes</strong> en entornos educativos y laborales de Cali.</p>
    <div className="acciones"><Link className="accion" to="/consentimiento">Probar traductor →</Link><Link className="accion suave" to="/#funciones">Ver funciones</Link></div></div>
    <img src="/marca/manos.png" alt="Dos manos con los puntos de seguimiento de sus articulaciones." /></section>
    <ul className="banda"><li><IconoPortada nombre="texto" />Señas a texto y voz</li><li><IconoPortada nombre="voz" />Voz a señas</li><li><IconoPortada nombre="grupo" />Conversación por turnos</li></ul>
    <section className="nosotros" id="nosotros" tabIndex={-1}><img src="/marca/aprendizaje.png" alt="Una niña practica señas con una adulta." />
    <div><span className="etiqueta">Sobre Copiloto</span><h2>Más que un traductor</h2><p>Dos personas pueden compartir una conversación. Una se expresa con las manos y la otra con la voz. El texto en pantalla permite seguir cada turno.</p><Link className="accion" to="/#funciones">Conocer más →</Link></div>
    <aside id="accesibilidad" tabIndex={-1}><strong>Inclusión educativa</strong><p>Participación en el aula.</p><strong>Accesibilidad</strong><p>Mensajes visuales y sonoros.</p><strong>Apoyo en la conversación</strong><p>Traducción durante cada turno.</p></aside></section>
    <section id="funciones" tabIndex={-1}><h2>Funciones destacadas</h2><p>Herramientas para una comunicación inclusiva, sencilla y en tiempo real.</p><div className="tarjetas">{funciones.map(([icono,titulo,detalle]) => <article key={titulo}><IconoPortada nombre={icono} /><h3>{titulo}</h3><p>{detalle}</p><Link className="flecha" aria-label={`Probar: ${titulo}`} to="/consentimiento">→</Link></article>)}</div></section>
  </div>;
}


