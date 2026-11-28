// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { crearClienteHttp } from './cliente';
import { crearApi } from './index';
import { crearMock } from './mock';
import { LONGITUD_VECTOR } from './tipos';
import type { RespuestaSus } from './tipos';

const vector = Array.from({ length: LONGITUD_VECTOR }, () => 0);
const respuestas = Array.from<RespuestaSus>({ length: 10 }).fill(3);

it('selecciona el adaptador con VITE_USE_MOCK y respeta la URL configurada', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ session_id: 'real' }));
  vi.stubGlobal('fetch', fetcher);
  try {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/api/v1');
    vi.stubEnv('VITE_USE_MOCK', 'true');
    await expect(crearApi(vi.fn()).iniciarSesion('participante-prueba')).resolves.toMatchObject({
      session_id: 'sesion-1',
    });
    expect(fetcher).not.toHaveBeenCalled();

    vi.stubEnv('VITE_USE_MOCK', 'false');
    await expect(crearApi(vi.fn()).iniciarSesion('participante-prueba')).resolves.toMatchObject({
      session_id: 'real',
    });
    expect(fetcher.mock.calls[0][0]).toBe(
      'https://api.example.test/api/v1/sessions',
    );
  } finally {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  }
});

it('envía solo el identificador y 126 puntos finitos al predecir', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      seña: 'HOLA',
      confianza: 0.9,
      aceptada: true,
    }),
  );
  const api = crearClienteHttp({ baseUrl: '/api/v1/', fetcher });
  const entrada = {
    session_id: 'sesion-1',
    vector,
    imagen: 'dato ajeno al contrato',
  };
  await expect(api.predecir(entrada)).resolves.toMatchObject({
    aceptada: true,
  });
  const [url, solicitud] = fetcher.mock.calls[0];
  expect(url).toBe('/api/v1/predict');
  expect(solicitud?.method).toBe('POST');
  expect(JSON.parse(String(solicitud?.body))).toEqual({
    session_id: 'sesion-1',
    vector,
  });
  await expect(
    api.predecir({ session_id: 'sesion-1', vector: vector.slice(0, 63) }),
  ).rejects.toMatchObject({ codigo: 'vectorInvalido' });
  await expect(
    api.predecir({ session_id: 'sesion-1', vector: [...vector.slice(1), NaN] }),
  ).rejects.toMatchObject({ codigo: 'vectorInvalido' });
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it('envía audio multipart y lee la exportación como texto plano', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ texto: 'Hola' }))
    .mockResolvedValueOnce(new Response('oyente: Hola'));
  const api = crearClienteHttp({ fetcher });
  const audio = new Blob(['audio de prueba'], {
    type: 'audio/webm;codecs=opus',
  });
  await expect(api.transcribir(audio)).resolves.toEqual({ texto: 'Hola' });
  const [url, solicitud] = fetcher.mock.calls[0];
  expect(url).toBe('/api/v1/stt');
  expect(new Headers(solicitud?.headers).has('Content-Type')).toBe(false);
  expect(solicitud?.body).toBeInstanceOf(FormData);
  const formulario = solicitud?.body as FormData;
  expect([...formulario.keys()]).toEqual(['audio']);
  expect(formulario.get('audio')).toMatchObject({
    name: 'grabacion.webm',
    size: audio.size,
  });
  await expect(api.exportarSesion('a/b')).resolves.toBe('oyente: Hola');
  expect(fetcher.mock.calls[1][0]).toBe('/api/v1/sessions/a%2Fb/export');
  await expect(
    api.transcribir(new Blob(['video'], { type: 'video/webm' })),
  ).rejects.toMatchObject({ codigo: 'audioInvalido' });
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it('distingue errores de acceso, token vencido y conexión', async () => {
  const alExpirarToken = vi.fn();
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockRejectedValueOnce(new TypeError('Fetch failed'));
  const api = crearClienteHttp({ fetcher, alExpirarToken });
  await expect(
    api.iniciarSesionAdmin({ usuario: 'admin', contraseña: 'incorrecta' }),
  ).rejects.toMatchObject({ codigo: 'credenciales', estado: 401 });
  expect(alExpirarToken).not.toHaveBeenCalled();
  await expect(api.listarSenas('vencido')).rejects.toMatchObject({
    codigo: 'sesionAdmin',
  });
  expect(
    new Headers(fetcher.mock.calls[1][1]?.headers).get('Authorization'),
  ).toBe('Bearer vencido');
  expect(alExpirarToken).toHaveBeenCalledExactlyOnceWith('vencido');
  await expect(api.iniciarSesion("participante-prueba")).rejects.toMatchObject({
    codigo: 'conexion',
  });
});

it('envía únicamente los identificadores y puntos de una muestra administrativa', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json(
      {
        detail: { code: 'CONSENT_REQUIRED' },
      },
      { status: 403 },
    ),
  );
  const api = crearClienteHttp({ fetcher });
  const muestra = {
    id_sena: '1',
    id_participante: 'participante-1',
    vector,
    imagen: new Blob(),
  };
  await expect(api.cargarMuestra('demo', muestra)).rejects.toMatchObject({
    codigo: 'muestraSinConsentimiento',
    estado: 403,
  });
  const [url, solicitud] = fetcher.mock.calls[0];
  expect(url).toBe('/api/v1/samples');
  expect(JSON.parse(String(solicitud?.body))).toEqual({
    id_sena: '1',
    id_participante: 'participante-1',
    vector,
  });
});

it('simula sesión, ambas ramas de predicción, STT, traducción, exportación y SUS', async () => {
  const aleatorio = vi
    .fn()
    .mockReturnValueOnce(0.21)
    .mockReturnValueOnce(0)
    .mockReturnValueOnce(0.01)
    .mockReturnValueOnce(0.9);
  const api = crearMock({ aleatorio });
  const { session_id } = await api.iniciarSesion("participante-prueba");
  await expect(api.predecir({ session_id, vector })).resolves.toMatchObject({
    seña: 'GRACIAS',
    aceptada: false,
  });
  await expect(api.predecir({ session_id, vector })).resolves.toMatchObject({
    seña: 'HOLA',
    aceptada: true,
  });
  const { texto } = await api.transcribir(
    new Blob(['prueba'], { type: 'audio/webm' }),
  );
  await expect(api.traducir(texto)).resolves.toEqual([
    {
      palabra: 'Buenos días,',
      glosa: 'BUENOS DÍAS',
      animacion: null,
      fuera_de_vocabulario: false,
    },
    { palabra: 'necesito', fuera_de_vocabulario: true },
    {
      palabra: 'ayuda,',
      glosa: 'AYUDA',
      animacion: null,
      fuera_de_vocabulario: false,
    },
    {
      palabra: 'por favor.',
      glosa: 'POR FAVOR',
      animacion: null,
      fuera_de_vocabulario: false,
    },
  ]);
  await api.registrarIntervencion(session_id, {
    interlocutor: 'oyente',
    tipo: 'voz',
    texto,
    confianza: null,
    confirmada: true,
    latencia_ms: 20,
  });
  expect(await api.finalizarSesion(session_id)).toEqual(
    await api.finalizarSesion(session_id),
  );
  await expect(api.exportarSesion(session_id)).resolves.toBe(
    `oyente: ${texto}`,
  );
  await expect(api.enviarSus(respuestas, session_id)).resolves.toEqual({ puntaje: 50 });
  await expect(api.enviarSus([3], session_id)).rejects.toMatchObject({
    codigo: 'susIncompleto',
  });
});

it('simula acceso, catálogo, modelo, carga de muestra y revocación de consentimiento', async () => {
  const api = crearMock();
  await expect(api.listarSenas('invalido')).rejects.toMatchObject({
    codigo: 'sesionAdmin',
  });
  const { token } = await api.iniciarSesionAdmin({
    usuario: 'admin',
    contraseña: 'copilito-demo',
  });
  const senas = await api.listarSenas(token);
  expect(senas).toHaveLength(5);
  const modelo = await api.consultarModelo(token);
  await api.guardarModelo(token, { ...modelo, version: 'demo-2' });
  await expect(api.consultarModelo(token)).resolves.toMatchObject({
    version: 'demo-2',
  });

  const { id_participante } = await api.aceptarConsentimiento({
    alcance: 'demo',
    version_formato: '1',
  });
  const muestra = { id_sena: senas[0].id, id_participante, vector };
  await expect(api.cargarMuestra(token, muestra)).resolves.toHaveProperty('id');
  await expect(
    api.revocarConsentimiento(id_participante),
  ).resolves.toMatchObject({ muestras_eliminadas: 1 });
  await expect(api.cargarMuestra(token, muestra)).rejects.toMatchObject({
    codigo: 'muestraSinConsentimiento',
  });
});
