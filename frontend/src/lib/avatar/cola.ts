export const duracionBaseMs = 1_400;

export type ColaAvatar = {
  indice: number;
  vuelta: number;
  tiempoMs: number;
  duracionMs: number;
  modo: 'reproduciendo' | 'pausada' | 'terminada';
  velocidad: 'normal' | 'lenta';
};

export type AccionCola =
  | { tipo: 'avanzar'; deltaMs: number; longitud: number }
  | { tipo: 'siguiente'; longitud: number }
  | { tipo: 'duracion'; ms: number }
  | { tipo: 'repetir'; pasoAPaso: boolean }
  | { tipo: 'pausar' | 'continuar' }
  | { tipo: 'velocidad'; velocidad: ColaAvatar['velocidad'] };

export function iniciarCola(pasoAPaso: boolean): ColaAvatar {
  return {
    indice: 0,
    vuelta: 0,
    tiempoMs: 0,
    duracionMs: duracionBaseMs,
    modo: pasoAPaso ? 'pausada' : 'reproduciendo',
    velocidad: 'normal',
  };
}

function siguiente(estado: ColaAvatar, longitud: number): ColaAvatar {
  if (estado.indice + 1 >= longitud)
    return { ...estado, modo: 'terminada', tiempoMs: estado.duracionMs };
  return {
    ...estado,
    indice: estado.indice + 1,
    tiempoMs: 0,
    duracionMs: duracionBaseMs,
  };
}

export function reducirCola(
  estado: ColaAvatar,
  accion: AccionCola,
): ColaAvatar {
  switch (accion.tipo) {
    case 'avanzar': {
      if (estado.modo !== 'reproduciendo' || !accion.longitud) return estado;
      const tiempoMs =
        estado.tiempoMs +
        accion.deltaMs * (estado.velocidad === 'lenta' ? 0.5 : 1);
      return tiempoMs >= estado.duracionMs
        ? siguiente(estado, accion.longitud)
        : { ...estado, tiempoMs };
    }
    case 'siguiente':
      return siguiente({ ...estado, modo: 'pausada' }, accion.longitud);
    case 'duracion':
      return estado.duracionMs === accion.ms
        ? estado
        : { ...estado, duracionMs: accion.ms };
    case 'repetir':
      return {
        ...iniciarCola(accion.pasoAPaso),
        velocidad: estado.velocidad,
        vuelta: estado.vuelta + 1,
      };
    case 'pausar':
      return estado.modo === 'reproduciendo'
        ? { ...estado, modo: 'pausada' }
        : estado;
    case 'continuar':
      return estado.modo === 'pausada'
        ? { ...estado, modo: 'reproduciendo' }
        : estado;
    case 'velocidad':
      return { ...estado, velocidad: accion.velocidad };
  }
}
