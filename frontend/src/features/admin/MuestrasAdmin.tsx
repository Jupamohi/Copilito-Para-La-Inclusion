import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useOutletContext } from 'react-router';
import { ErrorApi } from '../../api/errores';
import { useEstado } from '../../app/estado';
import { MarcoPantalla } from '../../components/MarcoPantalla';
import { textos } from '../../i18n/textos';
import { useSolicitud } from '../../lib/useSolicitud';
import { leerVectorMuestra } from './datos';
import { AvisoRecurso, useRecursoAdmin } from './recursos';

const contenido = textos.muestrasAdmin;

export function MuestrasAdmin() {
  const token = useOutletContext<string>();
  const { api } = useEstado();
  const { recurso, reintentar } = useRecursoAdmin(token, api.listarSenas);
  const envio = useSolicitud();
  const [cargada, setCargada] = useState(false);
  const archivoInput = useRef<HTMLInputElement>(null);

  function cargar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const id_sena = String(datos.get('sena') ?? '');
    const id_participante = String(datos.get('participante') ?? '').trim();
    const archivo = archivoInput.current?.files?.[0];
    setCargada(false);
    void envio.ejecutar(
      async () => {
        if (!id_sena || !id_participante || !archivo)
          throw new ErrorApi('muestraIncompleta');
        const texto = await archivo.text().catch(() => {
          throw new ErrorApi('archivoMuestraInvalido');
        });
        await api.cargarMuestra(token, {
          id_sena,
          id_participante,
          vector: leerVectorMuestra(texto),
        });
      },
      () => {
        if (archivoInput.current) archivoInput.current.value = '';
        setCargada(true);
      },
    );
  }

  return (
    <MarcoPantalla titulo={textos.muestras}>
      {recurso.fase !== 'lista' ? (
        <AvisoRecurso estado={recurso} reintentar={reintentar} />
      ) : recurso.datos.length ? (
        <form
          className="max-w-lg space-y-4"
          onSubmit={cargar}
          onChange={() => setCargada(false)}
        >
          <fieldset className="grid min-w-0 gap-4" disabled={envio.cargando}>
            <div className="grid min-w-0 gap-2">
              <label htmlFor="selector-muestra-sena" className="font-semibold">
                {contenido.sena}
              </label>
              <select
                id="selector-muestra-sena"
                className="campo"
                name="sena"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  {contenido.elegir}
                </option>
                {recurso.datos.map(({ id, glosa }) => (
                  <option key={id} value={id}>
                    {glosa}
                  </option>
                ))}
              </select>
            </div>
            <label className="grid gap-2">
              <span className="font-semibold">{contenido.participante}</span>
              <input
                className="campo"
                name="participante"
                required
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </label>
            <label className="grid min-w-0 gap-2">
              <span className="font-semibold">{contenido.archivo}</span>
              <input
                className="campo min-w-0 file:mr-2 file:font-semibold"
                ref={archivoInput}
                type="file"
                required
                accept=".json,application/json"
                aria-describedby="formato-muestra"
              />
            </label>
            <p id="formato-muestra">{contenido.formato}</p>
          </fieldset>
          {envio.error && (
            <p className="aviso aviso-error" role="alert">
              {envio.error}
            </p>
          )}
          <button className="boton" type="submit" disabled={envio.cargando}>
            {envio.cargando
              ? contenido.cargando
              : envio.error
                ? textos.dispositivos.reintentar
                : contenido.cargar}
          </button>
          <p className={cargada ? 'aviso' : 'sr-only'} role="status">
            {cargada
              ? contenido.cargada
              : envio.cargando
                ? contenido.cargando
                : ''}
          </p>
        </form>
      ) : (
        <p>{contenido.sinSenas}</p>
      )}
    </MarcoPantalla>
  );
}
