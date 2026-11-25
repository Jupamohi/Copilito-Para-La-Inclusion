import { textos } from '../../i18n/textos';
import { camaraVisible } from './useCamara';
import type { EstadoCamara } from './useCamara';

const contenido = textos.dispositivos;

export function AvisoCamara({ camara }: { camara: EstadoCamara }) {
  const evaluada = camara.fase === 'evaluada';
  const fallo = !camaraVisible(camara) && camara.fase !== 'solicitando';

  return (
    <div
      role="status"
      aria-atomic="true"
      className={fallo ? 'aviso aviso-error' : 'aviso'}
    >
      <span aria-hidden="true">{evaluada ? '✋' : fallo ? '⚠' : '…'}</span>{' '}
      {evaluada ? contenido.conteos[camara.manos] : contenido[camara.fase]}
      {evaluada && !camara.luzSuficiente && <p>{contenido.luzInsuficiente}</p>}
      {evaluada && camara.manos === 0 && <p>{contenido.manoNoDetectada}</p>}
    </div>
  );
}
