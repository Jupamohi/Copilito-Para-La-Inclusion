import { crearClienteHttp } from './cliente';
import { crearMock } from './mock';
import type { Api } from './tipos';

export function crearApi(alExpirarToken: (token: string) => void): Api {
  return import.meta.env.VITE_USE_MOCK === 'true'
    ? crearMock({ alExpirarToken })
    : crearClienteHttp({
        baseUrl: import.meta.env.VITE_API_BASE_URL,
        alExpirarToken,
      });
}
