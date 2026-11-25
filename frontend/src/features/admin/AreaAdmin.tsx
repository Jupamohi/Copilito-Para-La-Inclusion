import { NavLink, Navigate, Outlet, useLocation } from 'react-router';
import { useEstado } from '../../app/estado';
import { textos } from '../../i18n/textos';

export const seccionesAdmin = [
  { ruta: '/admin/catalogo', titulo: textos.catalogo },
  { ruta: '/admin/muestras', titulo: textos.muestras },
  { ruta: '/admin/modelo', titulo: textos.modelo },
] as const;

export function AreaAdmin() {
  const { estado, dispatch } = useEstado();
  const { pathname } = useLocation();
  // TODO(supuesto): el contrato confirma la vigencia al acceder al recurso protegido.
  if (!estado.token)
    return <Navigate to="/admin/login" state={{ desde: pathname }} replace />;

  return (
    <div className="space-y-4">
      <nav
        aria-label={textos.administracion.navegacion}
        className="flex flex-wrap items-center gap-2 rounded-xl border border-borde bg-superficie p-3"
      >
        {seccionesAdmin.map(({ ruta, titulo }) => (
          <NavLink
            key={ruta}
            to={ruta}
            className={({ isActive }) =>
              `rounded-md px-2 py-2 ${isActive ? 'bg-fondo font-semibold text-tinta' : ''}`
            }
          >
            {titulo}
          </NavLink>
        ))}
        <button
          type="button"
          className="boton boton-secundario sm:ml-auto"
          onClick={() => dispatch({ type: 'autenticacion', token: null })}
        >
          {textos.administracion.salir}
        </button>
      </nav>
      <Outlet key={estado.token} context={estado.token} />
    </div>
  );
}
