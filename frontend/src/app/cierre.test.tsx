import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { useLayoutEffect } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import type { Intervencion } from '../api/tipos';
import { textos } from '../i18n/textos';
import { EstadoProvider, useEstado } from './estado';
import { AppRoutes } from './router';

const sesion = {
  session_id: 'sesion-prueba',
  inicio: '2026-11-23T20:00:00.000Z',
};
const participante = 'participante-de-prueba';
const intervenciones: Intervencion[] = [
  {
    interlocutor: 'sordo',
    tipo: 'seña',
    texto: 'Hola.',
    confianza: 0.9,
    confirmada: true,
    latencia_ms: 14,
  },
  {
    interlocutor: 'oyente',
    tipo: 'voz',
    texto: 'Muchas gracias.',
    confianza: null,
    confirmada: true,
    latencia_ms: 23,
  },
];

function PrepararEstado({ piloto }: { piloto: boolean }) {
  const { dispatch } = useEstado();
  useLayoutEffect(() => {
    dispatch({ type: 'consentimiento', participante });
    dispatch({ type: 'sesion', sesion, camaraId: null });
    for (const datos of intervenciones)
      dispatch({
        type: 'confirmarIntervencion',
        sesionId: sesion.session_id,
        datos,
      });
  }, [dispatch]);
  return <AppRoutes piloto={piloto} />;
}

function abrir(ruta: string, fetcher: typeof fetch, piloto = true) {
  vi.stubEnv('VITE_USE_MOCK', 'false');
  vi.stubGlobal('fetch', fetcher);
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <EstadoProvider>
        <PrepararEstado piloto={piloto} />
      </EstadoProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('registra las dos personas antes del cierre y reintenta solo el PATCH que falló', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ id: 'i-1' }))
    .mockResolvedValueOnce(Response.json({ id: 'i-2' }))
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(Response.json({ duracion_ms: 65_000 }));
  abrir('/cierre', fetcher);
  const lista = within(screen.getByRole('list'));
  expect(lista.getByText('Persona sorda')).toBeTruthy();
  expect(lista.getByText('Persona oyente')).toBeTruthy();
  expect(
    screen.queryByRole('button', { name: textos.resumen.exportar }),
  ).toBeNull();

  const finalizar = screen.getByRole('button', {
    name: textos.resumen.finalizar,
  });
  fireEvent.click(finalizar);
  fireEvent.click(finalizar);
  await screen.findByRole('alert');
  expect(fetcher.mock.calls.map(([url, ini]) => [url, ini?.method])).toEqual([
    [`/api/v1/sessions/${sesion.session_id}/interventions`, 'POST'],
    [`/api/v1/sessions/${sesion.session_id}/interventions`, 'POST'],
    [`/api/v1/sessions/${sesion.session_id}/end`, 'PATCH'],
  ]);
  fireEvent.click(
    screen.getByRole('button', { name: textos.resumen.reintentarCierre }),
  );
  const titulo = await screen.findByRole('heading', {
    name: textos.resumen.finalizada,
  });
  expect(document.activeElement).toBe(titulo);
  expect(fetcher).toHaveBeenCalledTimes(4);
  expect(fetcher.mock.calls[3][1]?.method).toBe('PATCH');
  expect(screen.getByText('1 minuto, 5 segundos')).toBeTruthy();
  expect(
    screen.getByRole('link', { name: textos.resumen.responder }),
  ).toBeTruthy();
  fireEvent.click(
    screen.getByRole('button', { name: textos.resumen.nuevaSesion }),
  );
  expect(
    await screen.findByRole('heading', { name: textos.bienvenida }),
  ).toBeTruthy();
  expect(screen.getByText(participante)).toBeTruthy();
});

it('valida las diez respuestas y confirma el SUS conservando el orden de las respuestas', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ puntaje: 50 }));
  abrir('/sus', fetcher);
  const grupos = screen.getAllByRole('group');
  expect(grupos).toHaveLength(10);
  expect(screen.getAllByRole('radio')).toHaveLength(50);
  fireEvent.click(
    screen.getByRole('button', { name: textos.cuestionario.enviar }),
  );
  expect(screen.getByRole('alert').textContent).toBe(textos.api.susIncompleto);
  expect(document.activeElement).toBe(
    within(grupos[0]).getByRole('radio', { name: '1' }),
  );
  expect(fetcher).not.toHaveBeenCalled();

  const respuestas = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
  grupos.forEach((grupo, i) =>
    fireEvent.click(
      within(grupo).getByRole('radio', { name: String(respuestas[i]) }),
    ),
  );
  fireEvent.click(
    screen.getByRole('button', { name: textos.cuestionario.enviar }),
  );
  expect(
    await screen.findByRole('heading', { name: textos.cuestionario.gracias }),
  ).toBeTruthy();
  const [url, solicitud] = fetcher.mock.calls[0];
  expect(url).toBe('/api/v1/sus');
  expect(JSON.parse(String(solicitud?.body))).toEqual({ respuestas });
});

it('exige el consentimiento explícito para revocar, muestra la constancia y deshabilita la preparación', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(null, { status: 404 }))
    .mockResolvedValueOnce(
      Response.json({
        constancia: 'constancia-prueba',
        muestras_eliminadas: 2,
      }),
    );
  abrir('/retirar-consentimiento', fetcher);
  const campo = screen.getByRole('textbox', {
    name: textos.revocacion.identificador,
  });
  fireEvent.change(campo, { target: { value: ` ${participante} ` } });
  const boton = screen.getByRole<HTMLButtonElement>('button', {
    name: textos.revocacion.retirar,
  });
  expect(boton.disabled).toBe(true);
  fireEvent.click(boton);
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('checkbox', { name: textos.revocacion.confirmo }),
  );
  fireEvent.click(boton);
  await screen.findByRole('alert');
  fireEvent.click(
    screen.getByRole('button', { name: textos.dispositivos.reintentar }),
  );
  expect(await screen.findByText('constancia-prueba')).toBeTruthy();
  expect(screen.getByText('2')).toBeTruthy();
  expect(fetcher.mock.calls[1][0]).toBe(
    `/api/v1/consents/${participante}/revoke`,
  );
  fireEvent.click(screen.getByRole('link', { name: textos.inicio }));
  fireEvent.click(await screen.findByRole('link', { name: /Probar traductor/ }));
  expect(
    await screen.findByRole('checkbox', {
      name: textos.consentimiento.aceptacion,
    }),
  ).toBeTruthy();
  expect(
    screen.queryByRole('link', { name: textos.consentimiento.irPreparacion }),
  ).toBeNull();
});

it('omite el enlace al cuestionario fuera del modo piloto', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ id: 'i-1' }))
    .mockResolvedValueOnce(Response.json({ id: 'i-2' }))
    .mockResolvedValueOnce(Response.json({ duracion_ms: 65_000 }));
  abrir('/cierre', fetcher, false);
  fireEvent.click(
    screen.getByRole('button', { name: textos.resumen.finalizar }),
  );
  await screen.findByRole('heading', { name: textos.resumen.finalizada });
  expect(
    screen.queryByRole('link', { name: textos.resumen.responder }),
  ).toBeNull();
});

it('mantiene un único envío del SUS si se vuelve al formulario mientras se espera la respuesta', async () => {
  let responder: (respuesta: Response) => void = () => {};
  const respuesta = new Promise<Response>((resolve) => {
    responder = resolve;
  });
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ id: 'i-1' }))
    .mockResolvedValueOnce(Response.json({ id: 'i-2' }))
    .mockResolvedValueOnce(Response.json({ duracion_ms: 65_000 }))
    .mockReturnValueOnce(respuesta);
  abrir('/cierre', fetcher);
  fireEvent.click(
    screen.getByRole('button', { name: textos.resumen.finalizar }),
  );
  fireEvent.click(
    await screen.findByRole('link', { name: textos.resumen.responder }),
  );
  screen
    .getAllByRole('radio', { name: '3' })
    .forEach((opcion) => fireEvent.click(opcion));
  fireEvent.click(
    screen.getByRole('button', { name: textos.cuestionario.enviar }),
  );
  fireEvent.click(
    screen.getByRole('link', { name: textos.cuestionario.volverCierre }),
  );
  fireEvent.click(screen.getByRole('link', { name: textos.resumen.responder }));
  const boton = screen.getByRole<HTMLButtonElement>('button', {
    name: textos.cuestionario.enviando,
  });
  expect(boton.disabled).toBe(true);
  fireEvent.click(boton);
  expect(fetcher).toHaveBeenCalledTimes(4);
  await act(async () => responder(Response.json({ puntaje: 50 })));
  expect(
    screen.getByRole('heading', { name: textos.cuestionario.gracias }),
  ).toBeTruthy();
});


