const trazos = {
  mano: 'M8 12V5a1.5 1.5 0 0 1 3 0v6-8a1.5 1.5 0 0 1 3 0v8-6a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v7a7 7 0 0 1-7 7c-3 0-5-2-7-5l-3-4a1.5 1.5 0 0 1 2-2l3 3',
  micro:
    'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-3 0h6',
  camara: 'M3 5h13v14H3zM16 10l5-3v10l-5-3',
  candado: 'M5 10h14v11H5zM8 10V6a4 4 0 1 1 8 0v4m-4 4v3',
  brillo: 'M12 3q0 8 8 9-8 1-8 9-1-8-9-9 8-1 9-9ZM20 3v4m-2-2h4',
  reproducir: 'm8 4 12 8-12 8z',
  reintentar:
    'M20 10a8 8 0 0 0-14-4L3 9m0-5v5h5m-4 5a8 8 0 0 0 14 4l3-3m0 5v-5h-5',
  salida: 'M11 4H4v16h7m3-12 4 4-4 4m-5-4h11',
  luz: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1',
  bombilla: 'M9 18h6m-5 3h4m-5-6a6 6 0 1 1 6 0l-1 2h-4z',
  auriculares:
    'M4 13v-2a8 8 0 0 1 16 0v2M4 12h3v8H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Zm16 0h-3v8h3a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Z',
  historial: 'M3 12a9 9 0 1 1 3 7m-3-12v5h5m4-5v5l4 2',
  chat: 'M3 4h18v13H9l-6 4zM7 9h10m-10 4h6',
};

export function IconoConversacion({ nombre }: { nombre: keyof typeof trazos }) {
  return (
    <svg
      className="sala-icono"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={trazos[nombre]} />
    </svg>
  );
}
