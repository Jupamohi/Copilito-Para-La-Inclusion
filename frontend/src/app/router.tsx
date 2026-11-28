import { Cabecera, Pie, Portada } from '../components/Portada';
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
import { Privacidad } from '../components/Privacidad';
import { ComoFunciona } from '../components/ComoFunciona';
import { Nosotros } from '../components/Nosotros';
import { MarcoPantalla } from '../components/MarcoPantalla';
import { AccesoAdmin } from '../features/admin/AccesoAdmin';
import { AreaAdmin } from '../features/admin/AreaAdmin';
import { CatalogoAdmin } from '../features/admin/CatalogoAdmin';
import { ModeloAdmin } from '../features/admin/ModeloAdmin';
import { MuestrasAdmin } from '../features/admin/MuestrasAdmin';
import { Cierre } from '../features/cierre/Cierre';
import { Bienvenida } from '../features/consentimiento/Bienvenida';
import { RevocarConsentimiento } from '../features/consentimiento/RevocarConsentimiento';
import { Conversacion } from '../features/conversacion/Conversacion';
import { Preparacion } from '../features/dispositivos/Preparacion';
import { CuestionarioSus } from '../features/sus/CuestionarioSus';
import { textos } from '../i18n/textos';
import { useEstado } from './estado';

function Layout() {
  const { pathname } = useLocation();
  const consentimiento = pathname.replace(/\/+$/, '') === '/consentimiento';
  return (
    <>
      <a className="salto" href="#contenido">
        {textos.saltar}
      </a>
      <Cabecera />
      <main className={pathname === '/' ? 'inicio' : consentimiento ? 'pantalla-consentimiento' : 'contenedor py-10'} id="contenido" tabIndex={-1}>
        <Outlet />
      </main>
      <Pie />
    </>
  );
}

function PaginaAusente() {
  return (
    <MarcoPantalla titulo={textos.paginaAusente}>
      <Link to="/">{textos.inicio}</Link>
    </MarcoPantalla>
  );
}

function RequiereSesion() {
  const { estado } = useEstado();
  return estado.sesion ? <Outlet /> : <Navigate to="/preparacion" replace />;
}

function RequiereConsentimiento() {
  const { estado } = useEstado();
  return estado.participante ? <Outlet /> : <Navigate to="/consentimiento" replace />;
}

function RequiereSesionSinCerrar() {
  const { estado } = useEstado();
  return estado.cierre.fase === 'finalizada' ||
    estado.cierre.fase === 'finalizando' ? (
    <Navigate to="/cierre" replace />
  ) : (
    <Outlet />
  );
}

export function AppRoutes({
  piloto = import.meta.env.VITE_PILOT_MODE === 'true',
}) {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Portada />} />
        <Route path="nosotros" element={<Nosotros />} />
        <Route path="como-funciona" element={<ComoFunciona />} />
        <Route path="privacidad" element={<Privacidad />} />
        <Route path="consentimiento" element={<Bienvenida />} />
        <Route element={<RequiereConsentimiento />}>
          <Route element={<RequiereSesionSinCerrar />}>
            <Route path="preparacion" element={<Preparacion />} />
            <Route element={<RequiereSesion />}>
              <Route path="conversacion" element={<Conversacion />} />
            </Route>
          </Route>
        </Route>
        <Route path="cierre" element={<Cierre piloto={piloto} />} />
        {piloto && <Route path="sus" element={<CuestionarioSus />} />}
        <Route
          path="retirar-consentimiento"
          element={<RevocarConsentimiento />}
        />
        <Route path="admin/login" element={<AccesoAdmin />} />
        <Route path="admin" element={<AreaAdmin />}>
          <Route index element={<Navigate to="catalogo" replace />} />
          <Route path="catalogo" element={<CatalogoAdmin />} />
          <Route path="muestras" element={<MuestrasAdmin />} />
          <Route path="modelo" element={<ModeloAdmin />} />
          <Route path="*" element={<PaginaAusente />} />
        </Route>
        <Route path="*" element={<PaginaAusente />} />
      </Route>
    </Routes>
  );
}


