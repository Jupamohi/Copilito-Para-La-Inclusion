export type EstadoVoz =
  | 'preparando'
  | 'reproduciendo'
  | 'terminada'
  | 'noDisponible'
  | 'error';

function elegirVoz(voces: SpeechSynthesisVoice[]) {
  const locales = voces.filter(
    ({ localService, lang }) => localService && /^es(?:[-_]|$)/i.test(lang),
  );
  return locales.find(({ lang }) => /^es[-_]co$/i.test(lang)) ?? locales[0];
}

export function hablarEnEspanol(
  texto: string,
  actualizar: (estado: EstadoVoz) => void,
) {
  const sintesis = window.speechSynthesis;
  if (!sintesis || typeof window.SpeechSynthesisUtterance !== 'function') {
    actualizar('noDisponible');
    return;
  }

  let cerrada = false;
  let espera: number | undefined;
  let locucion: SpeechSynthesisUtterance | undefined;

  function concluir(estado?: EstadoVoz, cancelar = false) {
    if (cerrada) return;
    cerrada = true;
    window.clearTimeout(espera);
    sintesis.removeEventListener('voiceschanged', intentar);
    if (locucion) {
      locucion.onstart = null;
      locucion.onend = null;
      locucion.onerror = null;
      if (cancelar) sintesis.cancel();
    }
    if (estado) actualizar(estado);
  }

  function intentar() {
    if (cerrada || locucion) return;
    try {
      const voz = elegirVoz(sintesis.getVoices());
      if (!voz) return;
      sintesis.removeEventListener('voiceschanged', intentar);
      window.clearTimeout(espera);
      locucion = new SpeechSynthesisUtterance(texto);
      locucion.voice = voz;
      locucion.lang = voz.lang;
      locucion.onstart = () => {
        window.clearTimeout(espera);
        espera = window.setTimeout(
          () => concluir('error', true),
          Math.max(15_000, texto.length * 200),
        );
        actualizar('reproduciendo');
      };
      locucion.onend = () => concluir('terminada');
      locucion.onerror = () => concluir('error');
      espera = window.setTimeout(() => concluir('error', true), 8_000);
      sintesis.speak(locucion);
    } catch {
      concluir('error', true);
    }
  }

  actualizar('preparando');
  sintesis.addEventListener('voiceschanged', intentar);
  espera = window.setTimeout(() => concluir('noDisponible'), 1_500);
  intentar();
  return () => concluir(undefined, true);
}
