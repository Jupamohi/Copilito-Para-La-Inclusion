import { createContext, useContext, useMemo, useReducer } from 'react';
import type { Dispatch, PropsWithChildren } from 'react';
import { crearApi } from '../api';
import { ErrorApi } from '../api/errores';
import type { Api, Intervencion, Sesion } from '../api/tipos';
import { textos } from '../i18n/textos';
import { crearRegistroDeIntervenciones } from '../lib/intervenciones';

type CierreSesion =
  | { fase: 'abierta' | 'finalizando' }
  | { fase: 'finalizada'; duracionMs: number }
  | { fase: 'error'; mensaje: string };
type EstadoSus = 'pendiente' | 'enviando' | 'enviado';

type Estado = {
  participante: string | null;
  token: string | null;
  sesionAdminVencida: boolean;
  sesion: Sesion | null;
  camaraId: string | null;
  intervencionesPendientes: readonly Intervencion[];
  intervencionesRegistradas: readonly (Intervencion & { id: string })[];
  cierre: CierreSesion;
  sus: EstadoSus;
};

type Accion =
  | { type: 'consentimiento'; participante: string | null }
  | { type: 'consentimientoRevocado'; participante: string }
  | { type: 'sesion'; sesion: Sesion; camaraId: string | null }
  | { type: 'nuevaSesion' }
  | { type: 'cierre'; sesionId: string; cierre: CierreSesion }
  | {
      type: 'sus';
      sesionId: string | null;
      participante: string | null;
      fase: EstadoSus;
    }
  | { type: 'confirmarIntervencion'; sesionId: string; datos: Intervencion }
  | {
      type: 'registrarIntervencion';
      sesionId: string;
      datos: Intervencion;
      id: string;
    }
  | { type: 'autenticacion'; token: string | null }
  | { type: 'tokenVencido'; token: string };

const datosInicialesSesion: Pick<
  Estado,
  | 'sesion'
  | 'camaraId'
  | 'intervencionesPendientes'
  | 'intervencionesRegistradas'
  | 'cierre'
  | 'sus'
> = {
  sesion: null,
  camaraId: null,
  intervencionesPendientes: [],
  intervencionesRegistradas: [],
  cierre: { fase: 'abierta' },
  sus: 'pendiente',
};
const inicial: Estado = {
  participante: null,
  token: null,
  sesionAdminVencida: false,
  ...datosInicialesSesion,
};

function reducir(estado: Estado, accion: Accion): Estado {
  switch (accion.type) {
    case 'consentimiento':
      return estado.participante === accion.participante
        ? estado
        : {
            ...estado,
            ...datosInicialesSesion,
            participante: accion.participante,
          };
    case 'consentimientoRevocado':
      return estado.participante === accion.participante
        ? { ...estado, ...datosInicialesSesion, participante: null }
        : estado;
    case 'nuevaSesion':
      return { ...estado, ...datosInicialesSesion };
    case 'sesion':
      return {
        ...estado,
        ...(estado.sesion?.session_id === accion.sesion.session_id
          ? {}
          : datosInicialesSesion),
        sesion: accion.sesion,
        camaraId: accion.camaraId,
      };
    case 'cierre':
      return estado.sesion?.session_id === accion.sesionId
        ? { ...estado, cierre: accion.cierre }
        : estado;
    case 'sus':
      return (estado.sesion?.session_id ?? null) === accion.sesionId &&
        estado.participante === accion.participante
        ? { ...estado, sus: accion.fase }
        : estado;
    case 'confirmarIntervencion':
      return estado.sesion?.session_id === accion.sesionId &&
        estado.cierre.fase !== 'finalizada' &&
        estado.cierre.fase !== 'finalizando'
        ? {
            ...estado,
            intervencionesPendientes: [
              ...estado.intervencionesPendientes,
              accion.datos,
            ],
          }
        : estado;
    case 'autenticacion':
      return { ...estado, token: accion.token, sesionAdminVencida: false };
    case 'tokenVencido':
      return estado.token === accion.token
        ? { ...estado, token: null, sesionAdminVencida: true }
        : estado;
    case 'registrarIntervencion':
      if (
        estado.sesion?.session_id !== accion.sesionId ||
        !estado.intervencionesPendientes.includes(accion.datos)
      )
        return estado;
      return {
        ...estado,
        intervencionesPendientes: estado.intervencionesPendientes.filter(
          (item) => item !== accion.datos,
        ),
        intervencionesRegistradas: [
          ...estado.intervencionesRegistradas,
          { ...accion.datos, id: accion.id },
        ],
      };
  }
}

const Contexto = createContext<{
  estado: Estado;
  dispatch: Dispatch<Accion>;
  api: Api;
  registrarPendientes: ReturnType<typeof crearRegistroDeIntervenciones>;
  finalizarSesion: (
    sesionId: string,
    pendientes: readonly Intervencion[],
  ) => Promise<void>;
} | null>(null);

export function EstadoProvider({ children }: PropsWithChildren) {
  const [estado, dispatch] = useReducer(reducir, inicial);
  const api = useMemo(
    () => crearApi((token) => dispatch({ type: 'tokenVencido', token })),
    [dispatch],
  );
  const registrarPendientes = useMemo(
    () =>
      crearRegistroDeIntervenciones(api, (sesionId, datos, id) =>
        dispatch({ type: 'registrarIntervencion', sesionId, datos, id }),
      ),
    [api, dispatch],
  );
  const finalizarSesion = useMemo(() => {
    const cierres = new Map<string, Promise<void>>();
    return (sesionId: string, pendientes: readonly Intervencion[]) => {
      const enCurso = cierres.get(sesionId);
      if (enCurso) return enCurso;
      dispatch({ type: 'cierre', sesionId, cierre: { fase: 'finalizando' } });
      const operacion = registrarPendientes(sesionId, pendientes)
        .then(() => api.finalizarSesion(sesionId))
        .then(({ duracion_ms }) => {
          dispatch({
            type: 'cierre',
            sesionId,
            cierre: { fase: 'finalizada', duracionMs: duracion_ms },
          });
        })
        .catch((error: unknown) => {
          const mensaje =
            error instanceof ErrorApi ? error.message : textos.api.servidor;
          dispatch({
            type: 'cierre',
            sesionId,
            cierre: { fase: 'error', mensaje },
          });
        })
        .finally(() => {
          cierres.delete(sesionId);
        });
      cierres.set(sesionId, operacion);
      return operacion;
    };
  }, [api, dispatch, registrarPendientes]);
  return (
    <Contexto.Provider
      value={{ estado, dispatch, api, registrarPendientes, finalizarSesion }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useEstado() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('Se requiere EstadoProvider.');
  return contexto;
}
