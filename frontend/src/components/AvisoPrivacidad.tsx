import { textos } from '../i18n/textos';

export function AvisoPrivacidad() {
  return (
    <p className="aviso">
      <span aria-hidden="true">🔒</span> {textos.privacidadManos}
    </p>
  );
}
