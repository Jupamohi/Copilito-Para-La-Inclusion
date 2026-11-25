import { useEffect, useRef } from 'react';
import type { PropsWithChildren } from 'react';
import { useLocation } from 'react-router';

export function MarcoPantalla({
  titulo,
  children,
}: PropsWithChildren<{ titulo: string }>) {
  const encabezado = useRef<HTMLHeadingElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    encabezado.current?.focus();
  }, [pathname, titulo]);

  return (
    <section className="panel space-y-6" aria-labelledby="titulo-pantalla">
      <h1
        ref={encabezado}
        id="titulo-pantalla"
        tabIndex={-1}
        className="text-3xl font-semibold"
      >
        {titulo}
      </h1>
      {children}
    </section>
  );
}
