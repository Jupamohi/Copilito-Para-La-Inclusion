import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router';
import type { RespuestaSus } from '../../api/tipos';
import { useEstado } from '../../app/estado';
import { MarcoPantalla } from '../../components/MarcoPantalla';
import { textos } from '../../i18n/textos';
import { useSolicitud } from '../../lib/useSolicitud';

const contenido = textos.cuestionario;
const opciones = [1, 2, 3, 4, 5] as const;

export function CuestionarioSus() {
  const { api, estado, dispatch } = useEstado();
  const [respuestas, setRespuestas] = useState<(RespuestaSus | null)[]>(() =>
    contenido.items.map(() => null),
  );
  const [incompleto, setIncompleto] = useState(false);
  const confirmacion = useRef<HTMLHeadingElement>(null);
  const envio = useSolicitud();
  const enviando = estado.sus === 'enviando' || envio.cargando;
  const volver = estado.cierre.fase === 'finalizada' ? '/cierre' : '/';
  const etiquetaVolver =
    volver === '/cierre' ? contenido.volverCierre : textos.inicio;

  useEffect(() => {
    if (estado.sus === 'enviado') confirmacion.current?.focus();
  }, [estado.sus]);

  function cambiar(indice: number, valor: RespuestaSus) {
    setRespuestas((previas) =>
      previas.map((anterior, i) => (i === indice ? valor : anterior)),
    );
    setIncompleto(false);
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (estado.sus !== 'pendiente') return;
    const vacio = respuestas.indexOf(null);
    if (vacio >= 0) {
      setIncompleto(true);
      evento.currentTarget
        .querySelector<HTMLInputElement>(`[name="sus-${vacio}"]`)
        ?.focus();
      return;
    }
    const datos = respuestas.filter((valor) => valor !== null);
    void envio.ejecutar(async () => {
      const envioActual = {
        type: 'sus' as const,
        sesionId: estado.sesion?.session_id ?? null,
        participante: estado.participante,
      };
      dispatch({ ...envioActual, fase: 'enviando' });
      try {
        await api.enviarSus(datos);
        dispatch({ ...envioActual, fase: 'enviado' });
      } catch (error) {
        dispatch({ ...envioActual, fase: 'pendiente' });
        throw error;
      }
    });
  }

  return (
    <MarcoPantalla titulo={textos.sus}>
      {estado.sus === 'enviado' ? (
        <div className="aviso">
          <h2
            ref={confirmacion}
            tabIndex={-1}
            className="text-xl font-semibold"
          >
            {contenido.gracias}
          </h2>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={enviar} noValidate>
          <p id="escala-sus">{contenido.escala}</p>
          {contenido.items.map((item, indice) => (
            <fieldset
              key={item}
              className="min-w-0 rounded-lg border border-borde p-3"
              disabled={enviando}
            >
              <legend className="max-w-full px-1 font-semibold">
                {indice + 1}. {item}
              </legend>
              <div className="flex flex-wrap gap-2">
                {opciones.map((valor) => (
                  <label
                    key={valor}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-borde px-3"
                  >
                    <input
                      className="size-4 shrink-0 accent-enlace"
                      required
                      type="radio"
                      name={`sus-${indice}`}
                      value={valor}
                      checked={respuestas[indice] === valor}
                      onChange={() => cambiar(indice, valor)}
                      aria-describedby="escala-sus"
                    />
                    <span>{valor}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          {(incompleto || envio.error) && (
            <p className="aviso aviso-error" role="alert">
              {incompleto ? textos.api.susIncompleto : envio.error}
            </p>
          )}
          <button className="boton" type="submit" disabled={enviando}>
            {enviando
              ? contenido.enviando
              : envio.error
                ? textos.dispositivos.reintentar
                : contenido.enviar}
          </button>
          <p role="status" className="sr-only">
            {enviando ? contenido.enviando : ''}
          </p>
        </form>
      )}
      <Link to={volver}>{etiquetaVolver}</Link>
    </MarcoPantalla>
  );
}
