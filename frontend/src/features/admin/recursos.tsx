import { useEffect, useState } from 'react';
import { ErrorApi } from '../../api/errores';
import { textos } from '../../i18n/textos';

type EstadoCarga =
  | { fase: 'cargando' }
  | { fase: 'error'; mensaje: string; estado?: number };
type Recurso<T> = EstadoCarga | { fase: 'lista'; datos: T };

export function useRecursoAdmin<T>(
  token: string,
  cargar: (token: string) => Promise<T>,
) {
  const [recurso, setRecurso] = useState<Recurso<T>>({ fase: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    void cargar(token)
      .then((datos) => {
        if (vigente) setRecurso({ fase: 'lista', datos });
      })
      .catch((error: unknown) => {
        if (!vigente) return;
        setRecurso(
          error instanceof ErrorApi
            ? { fase: 'error', mensaje: error.message, estado: error.estado }
            : { fase: 'error', mensaje: textos.api.servidor },
        );
      });
    return () => {
      vigente = false;
    };
  }, [token, cargar, intento]);

  function reintentar() {
    setRecurso({ fase: 'cargando' });
    setIntento((anterior) => anterior + 1);
  }

  return {
    recurso,
    reintentar,
    actualizar: (datos: T) => setRecurso({ fase: 'lista', datos }),
  };
}

export function AvisoRecurso({
  estado,
  reintentar,
}: {
  estado: EstadoCarga;
  reintentar: () => void;
}) {
  if (estado.fase === 'cargando')
    return (
      <p className="aviso" role="status">
        {textos.administracion.cargando}
      </p>
    );
  return (
    <div className="space-y-3">
      <p className="aviso aviso-error" role="alert">
        {estado.mensaje}
      </p>
      <button
        type="button"
        className="boton boton-secundario"
        onClick={reintentar}
      >
        {textos.dispositivos.reintentar}
      </button>
    </div>
  );
}
