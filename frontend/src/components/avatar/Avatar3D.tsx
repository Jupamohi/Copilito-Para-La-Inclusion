import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useState,
} from 'react';
import type { KeyboardEvent } from 'react';
import type { Palabra } from '../../api/tipos';
import { textos } from '../../i18n/textos';
import {
  duracionBaseMs,
  iniciarCola,
  reducirCola,
} from '../../lib/avatar/cola';
import { resolverFuente } from '../../lib/avatar/fuentes';
import type { OrdenVista } from './EscenaAvatar';

const contenido = textos.avatar;
const opcionesVista = [
  'izquierda',
  'derecha',
  'acercar',
  'alejar',
  'restablecer',
] as const;
const teclas: Record<string, OrdenVista> = {
  ArrowLeft: 'izquierda',
  ArrowRight: 'derecha',
  '+': 'acercar',
  '=': 'acercar',
  '-': 'alejar',
  Home: 'restablecer',
};
const Escena = lazy(() =>
  import('./EscenaAvatar').catch(() => ({ default: ErrorDeCarga })),
);

function ErrorDeCarga({ alFallar }: { alFallar: () => void }) {
  useEffect(alFallar, [alFallar]);
  return <></>;
}

function useMovimientoReducido() {
  const consulta = '(prefers-reduced-motion: reduce)';
  const [reducido, setReducido] = useState(
    () => window.matchMedia?.(consulta).matches ?? false,
  );
  useEffect(() => {
    const media = window.matchMedia?.(consulta);
    const actualizar = (evento: MediaQueryListEvent) =>
      setReducido(evento.matches);
    media?.addEventListener('change', actualizar);
    return () => media?.removeEventListener('change', actualizar);
  }, []);
  return reducido;
}

export function Avatar3D({
  frase,
  secuencia,
  titulo = contenido.titulo,
}: {
  frase: string;
  secuencia: readonly Palabra[];
  titulo?: string;
}) {
  const pasoAPaso = useMovimientoReducido();
  const [cola, cambiar] = useReducer(reducirCola, pasoAPaso, iniciarCola);
  const [orden, setOrden] = useState<{ tipo: OrdenVista } | null>(null);
  const [sinWebGL, setSinWebGL] = useState(false);
  const [escenaLista, setEscenaLista] = useState(false);
  const [calidadBaja, setCalidadBaja] = useState(false);
  const [recurso, setRecurso] = useState<{
    clave: string;
    duracionMs: number;
    generico: boolean;
  }>();
  const tituloId = useId();
  const palabra = secuencia[cola.indice];
  const animacion =
    palabra && !palabra.fuera_de_vocabulario ? palabra.animacion : null;
  const fuenteOriginal = useMemo(() => resolverFuente(animacion), [animacion]);
  const clave = `${cola.vuelta}:${cola.indice}`;
  const vigente = recurso?.clave === clave ? recurso : undefined;
  const fuente = vigente?.generico
    ? { formato: 'generico' as const }
    : fuenteOriginal;
  const listo =
    sinWebGL ||
    (escenaLista && (fuente.formato === 'generico' || Boolean(vigente)));
  const enMarcha =
    !pasoAPaso &&
    listo &&
    cola.modo === 'reproduciendo' &&
    secuencia.length > 0;
  const glosa = palabra && !palabra.fuera_de_vocabulario ? palabra.glosa : null;
  const tiempoMs =
    pasoAPaso && cola.modo !== 'terminada'
      ? cola.duracionMs / 2
      : cola.tiempoMs;
  const alFallar = useCallback(() => setSinWebGL(true), []);
  const alIniciar = useCallback(() => setEscenaLista(true), []);
  const bajarCalidad = useCallback(() => setCalidadBaja(true), []);
  const informarDuracion = useCallback(
    (duracionMs: number) => {
      setRecurso({ clave, duracionMs, generico: false });
    },
    [clave],
  );
  const usarGestoGenerico = useCallback(() => {
    setRecurso({ clave, duracionMs: duracionBaseMs, generico: true });
  }, [clave]);

  useEffect(() => {
    if (pasoAPaso) cambiar({ tipo: 'pausar' });
  }, [pasoAPaso]);
  useEffect(() => {
    if (vigente) cambiar({ tipo: 'duracion', ms: vigente.duracionMs });
  }, [vigente]);
  useEffect(() => {
    if (!enMarcha) return;
    let ultimo = performance.now();
    const intervalo = window.setInterval(() => {
      const ahora = performance.now();
      cambiar({
        tipo: 'avanzar',
        deltaMs: Math.min(ahora - ultimo, 150),
        longitud: secuencia.length,
      });
      ultimo = ahora;
    }, 40);
    return () => window.clearInterval(intervalo);
  }, [enMarcha, clave, secuencia.length]);

  function controlarVista(evento: KeyboardEvent<HTMLDivElement>) {
    const accion = teclas[evento.key];
    if (evento.target !== evento.currentTarget || !accion) return;
    evento.preventDefault();
    setOrden({ tipo: accion });
  }

  return (
    <section
      aria-labelledby={tituloId}
      className="min-w-0 space-y-3 rounded-xl border border-borde bg-fondo p-4"
    >
      <h2 id={tituloId} className="text-xl font-semibold">
        {titulo}
      </h2>
      <p>
        {contenido.frase} <strong>{frase}</strong>
      </p>
      {!secuencia.length && <p role="status">{contenido.sinSecuencia}</p>}
      {palabra && (
        <>
          <div className="aviso" role="status" aria-atomic="true">
            {palabra.fuera_de_vocabulario
              ? `${contenido.fuera}: ${palabra.palabra}`
              : `${contenido.glosa}: ${palabra.glosa}`}
            {cola.modo === 'terminada' && <p>{contenido.terminada}</p>}
          </div>
          {sinWebGL ? (
            <p className="aviso" role="status">
              {contenido.sinWebGL}
            </p>
          ) : (
            <>
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-fondo-avatar">
                <Suspense fallback={null}>
                  <Escena
                    indice={clave}
                    orden={orden}
                    alFallar={alFallar}
                    alIniciar={alIniciar}
                    bajarCalidad={bajarCalidad}
                    calidadBaja={calidadBaja}
                    enMarcha={enMarcha}
                    paso={{
                      glosa,
                      fuente,
                      tiempoMs,
                      movimientoReducido: pasoAPaso,
                      informarDuracion,
                      usarGestoGenerico,
                    }}
                  />
                </Suspense>
              </div>
              {!listo && <p role="status">{contenido.cargando}</p>}
              {glosa && fuente.formato === 'generico' && (
                <p>{contenido.demostracion}</p>
              )}
              {calidadBaja && <p role="status">{contenido.calidadReducida}</p>}
              <div
                role="group"
                aria-label={contenido.vista}
                tabIndex={0}
                onKeyDown={controlarVista}
                className="space-y-2 rounded-lg"
              >
                <p>{contenido.teclado}</p>
                <div className="flex flex-wrap gap-2">
                  {opcionesVista.map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      className="boton boton-secundario"
                      onClick={() => setOrden({ tipo })}
                    >
                      {contenido.ordenes[tipo]}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <button
              type="button"
              className="boton boton-secundario"
              onClick={() => cambiar({ tipo: 'repetir', pasoAPaso })}
            >
              {contenido.repetir}
            </button>
            {pasoAPaso ? (
              <button
                type="button"
                className="boton boton-secundario"
                disabled={cola.modo === 'terminada'}
                onClick={() =>
                  cambiar({ tipo: 'siguiente', longitud: secuencia.length })
                }
              >
                {contenido.siguiente}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="boton boton-secundario"
                  disabled={cola.modo === 'terminada'}
                  onClick={() =>
                    cambiar({
                      tipo: cola.modo === 'pausada' ? 'continuar' : 'pausar',
                    })
                  }
                >
                  {cola.modo === 'pausada'
                    ? contenido.continuar
                    : contenido.pausar}
                </button>
                <label className="grid gap-1">
                  <span>{contenido.velocidad}</span>
                  <select
                    className="campo"
                    value={cola.velocidad}
                    onChange={(evento) =>
                      cambiar({
                        tipo: 'velocidad',
                        velocidad:
                          evento.target.value === 'lenta' ? 'lenta' : 'normal',
                      })
                    }
                  >
                    <option value="normal">{contenido.normal}</option>
                    <option value="lenta">{contenido.lenta}</option>
                  </select>
                </label>
              </>
            )}
          </div>
          <ul className="flex flex-wrap gap-2" aria-label={contenido.lista}>
            {secuencia.map((item, indice) => (
              <li
                key={indice}
                aria-current={
                  cola.indice === indice && cola.modo !== 'terminada'
                    ? 'step'
                    : undefined
                }
                className={
                  item.fuera_de_vocabulario
                    ? 'rounded-md border border-error bg-fondo-error px-2 text-error'
                    : 'rounded-md border border-borde bg-superficie px-2'
                }
              >
                {item.fuera_de_vocabulario
                  ? `${contenido.fuera}: ${item.palabra}`
                  : item.glosa}
              </li>
            ))}
          </ul>
          {secuencia.some((item) => item.fuera_de_vocabulario) && (
            <p>{contenido.palabraFuera}</p>
          )}
        </>
      )}
    </section>
  );
}
