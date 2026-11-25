import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';
import { useEstado } from '../../app/estado';
import { Avatar3D } from '../../components/avatar/Avatar3D';
import { MarcoPantalla } from '../../components/MarcoPantalla';
import { textos } from '../../i18n/textos';
import { AvisoRecurso, useRecursoAdmin } from './recursos';

const contenido = textos.catalogoAdmin;

export function CatalogoAdmin() {
  const token = useOutletContext<string>();
  const { api } = useEstado();
  const { recurso, reintentar } = useRecursoAdmin(token, api.listarSenas);
  const [seleccion, setSeleccion] = useState<string>();
  const vista = useRef<HTMLDivElement>(null);
  const sena =
    recurso.fase === 'lista'
      ? recurso.datos.find(({ id }) => id === seleccion)
      : undefined;

  useEffect(() => {
    if (sena) vista.current?.focus();
  }, [sena]);

  return (
    <MarcoPantalla titulo={textos.catalogo}>
      {recurso.fase !== 'lista' ? (
        <AvisoRecurso estado={recurso} reintentar={reintentar} />
      ) : recurso.datos.length ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <ul className="min-w-0 space-y-3">
            {recurso.datos.map((entrada) => (
              <li
                key={entrada.id}
                className="space-y-2 rounded-lg border border-borde p-3"
              >
                <h2 className="text-lg font-semibold">{entrada.glosa}</h2>
                <p>{entrada.descripcion}</p>
                <button
                  type="button"
                  className="boton boton-secundario"
                  aria-label={contenido.verSena(entrada.glosa)}
                  onClick={() => {
                    if (seleccion === entrada.id) vista.current?.focus();
                    else setSeleccion(entrada.id);
                  }}
                >
                  {contenido.ver}
                </button>
              </li>
            ))}
          </ul>
          {sena && (
            <div
              ref={vista}
              tabIndex={-1}
              className="min-w-0 rounded-xl"
              aria-label={contenido.vista(sena.glosa)}
                role="group"
            >
              <Avatar3D
                key={sena.id}
                frase={sena.glosa}
                titulo={contenido.vista(sena.glosa)}
                secuencia={[
                  {
                    palabra: sena.glosa,
                    glosa: sena.glosa,
                    fuera_de_vocabulario: false,
                    animacion: sena.animacion,
                  },
                ]}
              />
            </div>
          )}
        </div>
      ) : (
        <p>{contenido.vacio}</p>
      )}
    </MarcoPantalla>
  );
}
