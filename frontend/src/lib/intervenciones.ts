import type { Api, Intervencion } from '../api/tipos';

export function crearRegistroDeIntervenciones(
  api: Pick<Api, 'registrarIntervencion'>,
  alRegistrar: (sesionId: string, datos: Intervencion, id: string) => void,
) {
  const envios = new WeakMap<Intervencion, Promise<void>>();

  return async function registrarPendientes(
    sesionId: string,
    pendientes: readonly Intervencion[],
  ) {
    for (const datos of pendientes) {
      let envio = envios.get(datos);
      if (!envio) {
        envio = api
          .registrarIntervencion(sesionId, datos)
          .then(({ id }) => {
            alRegistrar(sesionId, datos, id);
          })
          .catch((error: unknown) => {
            envios.delete(datos);
            throw error;
          });
        envios.set(datos, envio);
      }
      await envio;
    }
  };
}
