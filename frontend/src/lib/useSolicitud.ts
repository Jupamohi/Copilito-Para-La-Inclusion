import { useEffect, useRef, useState } from 'react';
import { ErrorApi } from '../api/errores';
import { textos } from '../i18n/textos';

export function useSolicitud() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendiente = useRef(false);
  const activo = useRef(false);

  useEffect(() => {
    activo.current = true;
    return () => {
      activo.current = false;
    };
  }, []);

  async function ejecutar<T>(
    solicitud: () => Promise<T>,
    alCompletar?: (resultado: T) => void,
  ) {
    if (pendiente.current) return;
    pendiente.current = true;
    setCargando(true);
    setError(null);
    try {
      const resultado = await solicitud();
      if (activo.current) alCompletar?.(resultado);
    } catch (error) {
      if (activo.current)
        setError(
          error instanceof ErrorApi ? error.message : textos.api.servidor,
        );
    } finally {
      pendiente.current = false;
      if (activo.current) setCargando(false);
    }
  }

  return { cargando, error, ejecutar };
}
