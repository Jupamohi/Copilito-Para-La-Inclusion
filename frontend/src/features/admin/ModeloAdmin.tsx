import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useOutletContext } from 'react-router';
import type { Modelo } from '../../api/tipos';
import { useEstado } from '../../app/estado';
import { MarcoPantalla } from '../../components/MarcoPantalla';
import { textos } from '../../i18n/textos';
import { useSolicitud } from '../../lib/useSolicitud';
import { leerModelo, matrizVacia, metricas } from './datos';
import { AvisoRecurso, useRecursoAdmin } from './recursos';

const contenido = textos.modeloAdmin;
const objetivoExactitud = 0.85;
const porcentaje = new Intl.NumberFormat('es-CO', {
  style: 'percent',
  maximumFractionDigits: 2,
});
const cantidad = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 4 });

function MatrizConfusion({
  matriz,
}: {
  matriz: Modelo['matriz_confusion'] | null;
}) {
  if (!matriz?.etiquetas?.length) return <p>{contenido.matrizVacia}</p>;

  return (
    <div
      role="group"
      aria-label={contenido.matriz}
      tabIndex={0}
      className="max-w-full overflow-x-auto rounded-lg border border-borde"
    >
      <table className="w-full border-collapse text-left">
        <caption className="border-b border-borde bg-fondo p-3 text-left font-semibold">
          {contenido.matrizGuia}
        </caption>
        <thead>
          <tr className="bg-fondo">
            <th scope="col" className="border-b border-borde p-3">
              {contenido.realPredicha}
            </th>
            {matriz.etiquetas.map((etiqueta, i) => (
              <th scope="col" className="border-b border-borde p-3" key={i}>
                {etiqueta}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matriz.etiquetas.map((etiqueta, i) => (
            <tr key={i} className="even:bg-fondo">
              <th scope="row" className="border-b border-borde p-3">
                {etiqueta}
              </th>
              {matriz.etiquetas.map((_, columna) => {
                const valor = matriz.valores?.[i]?.[columna];
                return (
                  <td
                    key={columna}
                    className="border-b border-borde p-3 tabular-nums"
                  >
                    {Number.isFinite(valor)
                      ? cantidad.format(valor)
                      : textos.resumen.datoNoDisponible}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormularioModelo({
  modelo,
  token,
  alGuardar,
  cancelar,
}: {
  modelo: Modelo | null;
  token: string;
  alGuardar: (modelo: Modelo) => void;
  cancelar: () => void;
}) {
  const { api } = useEstado();
  const envio = useSolicitud();
  const version = useRef<HTMLInputElement>(null);
  useEffect(() => {
    version.current?.focus();
  }, []);

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    void envio.ejecutar(
      async () => api.guardarModelo(token, leerModelo(datos)),
      alGuardar,
    );
  }

  return (
    <form className="space-y-4" onSubmit={guardar}>
      <h2 className="text-xl font-semibold">
        {modelo ? contenido.sustituir : contenido.registrar}
      </h2>
      <fieldset className="space-y-4" disabled={envio.cargando}>
        <label className="grid gap-2">
          <span className="font-semibold">{contenido.version}</span>
          <input
            ref={version}
            className="campo"
            name="version"
            required
            defaultValue={modelo?.version}
            spellCheck={false}
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {metricas.map((metrica) => (
            <label key={metrica} className="grid gap-2">
              <span className="font-semibold">
                {contenido.medida(contenido.metricas[metrica])}
              </span>
              <input
                className="campo"
                name={metrica}
                type="number"
                min="0"
                max="100"
                step="any"
                required
                defaultValue={
                  modelo ? Math.round(modelo[metrica] * 1e8) / 1e6 : undefined
                }
              />
            </label>
          ))}
        </div>
        <div className="grid gap-2">
          <label htmlFor="modelo-matriz" className="font-semibold">
            {contenido.matrizJson}
          </label>
          <textarea
            id="modelo-matriz"
            className="campo font-mono"
            rows={7}
            name="matriz_confusion"
            required
            spellCheck={false}
            aria-describedby="formato-matriz"
            defaultValue={JSON.stringify(
              modelo?.matriz_confusion ?? matrizVacia,
              null,
              2,
            )}
          />
        </div>
        <p id="formato-matriz">{contenido.formatoMatriz}</p>
      </fieldset>
      {envio.error && (
        <p className="aviso aviso-error" role="alert">
          {envio.error}
        </p>
      )}
      <p role="status" className="sr-only">
        {envio.cargando ? contenido.guardando : ''}
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="boton" disabled={envio.cargando}>
          {envio.cargando
            ? contenido.guardando
            : envio.error
              ? textos.dispositivos.reintentar
              : contenido.guardar}
        </button>
        <button
          type="button"
          className="boton boton-secundario"
          disabled={envio.cargando}
          onClick={cancelar}
        >
          {contenido.cancelar}
        </button>
      </div>
    </form>
  );
}

export function ModeloAdmin() {
  const token = useOutletContext<string>();
  const { api } = useEstado();
  const { recurso, reintentar, actualizar } = useRecursoAdmin(
    token,
    api.consultarModelo,
  );
  const [edicion, setEdicion] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const botonEditar = useRef<HTMLButtonElement>(null);
  const restaurarFoco = useRef(false);
  const modelo = recurso.fase === 'lista' ? recurso.datos : null;
  const estadoVisible =
    recurso.fase === 'lista' ||
    (recurso.fase === 'error' && recurso.estado === 404);

  function editar() {
    restaurarFoco.current = true;
    setGuardado(false);
    setEdicion(true);
  }

  useEffect(() => {
    if (!edicion && restaurarFoco.current) {
      restaurarFoco.current = false;
      botonEditar.current?.focus();
    }
  }, [edicion]);

  return (
    <MarcoPantalla titulo={textos.modelo}>
      {!estadoVisible ? (
        <AvisoRecurso estado={recurso} reintentar={reintentar} />
      ) : edicion ? (
        <FormularioModelo
          modelo={modelo}
          token={token}
          cancelar={() => setEdicion(false)}
          alGuardar={(recibido) => {
            actualizar(recibido);
            setEdicion(false);
            setGuardado(true);
          }}
        />
      ) : (
        <>
          <p role="status" className={guardado ? 'aviso' : 'sr-only'}>
            {guardado ? contenido.guardado : ''}
          </p>
          {modelo ? (
            <>
              <section aria-labelledby="modelo-vigente" className="space-y-3">
                <h2 id="modelo-vigente" className="text-xl font-semibold">
                  {contenido.vigente} {modelo.version}
                </h2>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {metricas.map((metrica) => (
                    <div
                      key={metrica}
                      className="rounded-lg border border-borde bg-fondo p-3"
                    >
                      <dt className="font-semibold">
                        {contenido.metricas[metrica]}
                      </dt>
                      <dd className="text-lg tabular-nums">
                        {Number.isFinite(modelo[metrica])
                          ? porcentaje.format(modelo[metrica])
                          : textos.resumen.datoNoDisponible}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="aviso">
                  <span aria-hidden="true">
                    {modelo.exactitud > objetivoExactitud ? '✓' : 'ℹ'}
                  </span>{' '}
                  {modelo.exactitud > objetivoExactitud
                    ? contenido.supera
                    : contenido.hasta}
                </p>
              </section>
              <section aria-labelledby="titulo-matriz" className="space-y-3">
                <h2 id="titulo-matriz" className="text-xl font-semibold">
                  {contenido.matriz}
                </h2>
                <MatrizConfusion matriz={modelo.matriz_confusion} />
              </section>
            </>
          ) : (
            <p>{contenido.sinModelo}</p>
          )}
          <button
            ref={botonEditar}
            type="button"
            className="boton"
            onClick={editar}
          >
            {modelo ? contenido.sustituir : contenido.registrar}
          </button>
        </>
      )}
    </MarcoPantalla>
  );
}
