import '../../styles/acceso-admin.css';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { ErrorApi } from '../../api/errores';
import { useEstado } from '../../app/estado';
import { MarcoPantalla } from '../../components/MarcoPantalla';
import { textos } from '../../i18n/textos';
import { useSolicitud } from '../../lib/useSolicitud';
import { seccionesAdmin } from './AreaAdmin';

const contenido = textos.administracion;

export function AccesoAdmin() {
  const { api, estado, dispatch } = useEstado();
  const ubicacion = useLocation();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [visible, setVisible] = useState(false);
  const solicitud = useSolicitud();
  const desde = (ubicacion.state as { desde?: unknown } | null)?.desde;
  const destino =
    seccionesAdmin.find(({ ruta }) => ruta === desde)?.ruta ??
    seccionesAdmin[0].ruta;

  if (estado.token) return <Navigate to={destino} replace />;

  function iniciar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!usuario.trim() || !contrasena) return;
    void solicitud.ejecutar(
      async () => {
        const resultado = await api.iniciarSesionAdmin({
          usuario: usuario.trim(),
          contraseña: contrasena,
        });
        if (typeof resultado.token !== 'string' || !resultado.token.trim())
          throw new ErrorApi('respuestaInvalida');
        return resultado.token.trim();
      },
      (token) => dispatch({ type: 'autenticacion', token }),
    );
  }

  return (
    <div className="acceso-admin">
      <div className="presentacion-admin">
        <img src="/marca/gato-administrador.png" width="1536" height="1024" alt="" />
        <p className="lema-admin">Gestiona la inclusión</p>
        <p>Accede al panel de administración de Copiloto para gestionar el catálogo de señas, las muestras y el modelo.</p>
      </div>
      <MarcoPantalla titulo={textos.acceso}>
      <p>Inicia sesión para acceder al panel de administración de Copiloto.</p>
      {estado.sesionAdminVencida && !solicitud.error && (
        <p className="aviso" role="status">
          {textos.api.sesionAdmin}
        </p>
      )}
      <form className="space-y-4" onSubmit={iniciar}>
        <div className="entrada-admin">
          <label htmlFor="admin-usuario">{contenido.usuario}</label>
          <div className="control-admin">
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4" /><path d="M3 21a9 7 0 0 1 18 0Z" /></svg>
          <input
            className="campo"
            required
            id="admin-usuario" autoComplete="username"
            autoCapitalize="off"
            spellCheck={false}
            value={usuario}
            disabled={solicitud.cargando}
            onChange={(evento) => setUsuario(evento.target.value)}
          />
          </div></div>
        <div className="entrada-admin">
          <label htmlFor="admin-clave">{contenido.contrasena}</label>
          <div className="control-admin">
          <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M7 10V7a5 5 0 0 1 10 0v3m-5 5v2" /></svg>
          <input
            id="admin-clave" type={visible ? 'text' : 'password'}
            className="campo"
            required
            autoComplete="current-password"
            value={contrasena}
            disabled={solicitud.cargando}
            onChange={(evento) => setContrasena(evento.target.value)}
          />
          <button type="button" className="ver-clave" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setVisible(!visible)}>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12q10-15 20 0-10 15-20 0Z" /><circle cx="12" cy="12" r="3" />{visible && <path d="m3 3 18 18" />}</svg>
          </button>
          </div></div>
        {solicitud.error && (
          <p className="aviso aviso-error" role="alert">
            {solicitud.error}
          </p>
        )}
        <button
          type="submit"
          className="boton"
          disabled={solicitud.cargando || !usuario.trim() || !contrasena}
        >
          {solicitud.cargando ? contenido.entrando : contenido.entrar}
        </button>
        <p className="sr-only" role="status">
          {solicitud.cargando ? contenido.entrando : ''}
        </p>
      </form>
      <Link to="/">{textos.inicio}</Link>
    </MarcoPantalla></div>
  );
}

