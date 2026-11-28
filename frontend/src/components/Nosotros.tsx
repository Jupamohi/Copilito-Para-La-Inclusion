import { useEffect } from 'react';
import { Link } from 'react-router';
import '../styles/historia.css';

const simbolos = {
  meta: 'M20 12a8 8 0 1 1-8-8 M16 12a4 4 0 1 1-4-4 M12 12l8-8 M16 4h4v4',
  ojo: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  charla: 'M3 4h18v12H9l-6 5V4Z M7 8h10 M7 12h6',
  aprendizaje: 'm2 8 10-5 10 5-10 5L2 8Z M6 11v5q6 6 12 0v-5',
  luz: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',
  equipo: 'M14 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M3 21v-2a8 8 0 0 1 16 0v2H3Z M17 4q6 3 1 7m2 3q3 2 3 6',
};

function Icono({ nombre }: { nombre: keyof typeof simbolos }) {
  return <span className="hist-icono" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={simbolos[nombre]} /></svg></span>;
}

const limites = [
  ['charla', 'El papel del intérprete', 'Copiloto complementa el trabajo de los intérpretes de LSC.'],
  ['aprendizaje', 'Aprendizaje continuo', 'El reconocimiento de una seña puede ser impreciso.'],
  ['luz', 'Condiciones de uso', 'La luz, la posición de las manos y la cámara influyen en la captura.'],
  ['equipo', 'Validación comunitaria', 'Las personas usuarias de LSC ayudarán a evaluar la utilidad del prototipo.'],
] as const;

const pasos = [
  ['Construcción del vocabulario', 'Definir y validar entre 15 y 20 señas frecuentes en el estudio y el trabajo.'],
  ['Entrenamiento del modelo', 'Mejorar el reconocimiento y la clasificación de las señas.'],
  ['Pruebas con la comunidad', 'Probar el prototipo con personas usuarias de LSC e intérpretes.'],
  ['Evaluación y mejora', 'Medir precisión, tiempo de respuesta y facilidad de uso e incorporar las recomendaciones de la comunidad.'],
];

export function Nosotros() {
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, []);

  return <article className="historia">
    <header className="hist-hero">
      <div><span className="hist-tag">Conoce nuestra historia</span>
        <h1>La inclusión comienza con una conversación.</h1>
        <p>Somos dos estudiantes de Ingeniería de Sistemas de la Institución Universitaria Antonio José Camacho. En Cali nació nuestro trabajo de grado, Copiloto para la Inclusión.</p>
        <a className="accion" href="#proyecto">Conoce nuestro proyecto <span aria-hidden="true">→</span></a>
      </div>
      <img src="/marca/historia/equipo.png" alt="Dos gatos de Copiloto conversan en señas y voz frente a un portátil." />
    </header>
    <section id="proyecto" tabIndex={-1}>
      <h2>Nuestro propósito</h2>
      <p className="hist-intro">Acercar a personas con diversidad auditiva y personas oyentes en las aulas y los lugares de trabajo de Cali.</p>
      <div className="hist-par">
        <article className="hist-ficha"><Icono nombre="meta" /><div><h3>Nuestra misión</h3><p>Desarrollar un asistente que traduzca señas de la Lengua de Señas Colombiana (LSC) a texto y voz, y represente la voz con un avatar en dos dimensiones.</p></div></article>
        <article className="hist-ficha"><Icono nombre="ojo" /><div><h3>Nuestra visión</h3><p>Que cada persona pueda participar en una conversación en su forma de comunicarse y encontrar espacios educativos y laborales más accesibles.</p></div></article>
      </div>
    </section>
    <section><h2>Las personas detrás de Copiloto</h2>
      <div className="hist-par">{[['SM','Samuel Montenegro','Scrum Master'],['JM','Juan Pablo Mosquera','Product Owner']].map(([siglas,nombre,rol]) =>
        <article className="hist-ficha" key={nombre}><span className="hist-avatar" aria-hidden="true">{siglas}</span><div><h3>{nombre}</h3><span className="hist-tag">{rol} · Desarrollador</span><p>Estudiante de Ingeniería de Sistemas · UNIAJC</p></div></article>)}</div>
    </section>
    <section className="hist-cali">
      <div className="hist-par hist-mascota"><img loading="lazy" src="/marca/historia/jardin.png" alt="" /><div><h2>¿Por qué un gato?</h2><p>Para contar de dónde viene nuestra mascota hay que volver a Cali. El Gato del Río y las gatas que lo acompañan inspiraron a este pequeño compañero.</p></div></div>
      <div className="hist-par">{[['rio','El Gato del Río','Escultura de un gato de bronce entre los árboles de Cali.','Su silueta es parte de la identidad artística de la ciudad donde nació Copiloto.'],['escultura','Las gatas de Cali','Escultura de una gata azul y amarilla en un jardín de Cali.','Su variedad de formas y colores inspiró una mascota que transmite cercanía, empatía y compañía.']].map(([foto,titulo,alt,detalle]) =>
        <figure key={foto}><img loading="lazy" src={'/marca/historia/'+foto+'.jpg'} alt={alt} /><figcaption><strong>{titulo}</strong>{detalle}</figcaption></figure>)}</div>
    </section>
    <section><h2>Un proyecto en evolución</h2><div className="hist-limites">{limites.map(([icono,titulo,detalle]) => <article className="hist-ficha" key={titulo}><Icono nombre={icono} /><div><h3>{titulo}</h3><p>{detalle}</p></div></article>)}</div></section>
    <div className="hist-par hist-final"><section><h2>Nuestros próximos pasos</h2><ol>{pasos.map(([titulo,detalle]) => <li key={titulo}><strong>{titulo}</strong><p>{detalle}</p></li>)}</ol></section>
      <section className="hist-cta"><h2>Construyamos juntos una Cali más inclusiva.</h2><p>Queremos construir esta herramienta con la comunidad.</p><Link className="accion" to="/consentimiento">Conocer el prototipo <span aria-hidden="true">→</span></Link>
      <svg aria-hidden="true" viewBox="0 0 400 60" preserveAspectRatio="none"><path fill="#82c8aa" d="M0 30Q60 8 130 36T280 32T400 10V60H0Z"/><path fill="#388665" d="M0 52Q100 68 210 42T400 30V60H0Z"/></svg></section>
    </div>
  </article>;
}
