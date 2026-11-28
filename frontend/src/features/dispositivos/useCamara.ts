import { useEffect, useRef, useState } from 'react';
import { observarManos } from '../../lib/mediapipe/detector';
import type { CapturaManos } from '../../lib/mediapipe/protocolo';
import { countHands } from '../../lib/vector';

type Falla =
  | 'denegada'
  | 'perdida'
  | 'sinCamara'
  | 'camaraNoDisponible'
  | 'detectorNoDisponible';
const lecturasNecesarias = 8;

export type EstadoCamara =
  | { fase: 'solicitando' | 'calibrando' | Falla }
  | { fase: 'evaluada'; manos: 0 | 1 | 2; luzSuficiente: boolean; lecturas: number };

function clasificarError(error: unknown): Falla {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError')
      return 'denegada';
    if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError')
      return 'sinCamara';
  }
  return 'camaraNoDisponible';
}

export function camaraVisible(estado: EstadoCamara) {
  return estado.fase === 'calibrando' || estado.fase === 'evaluada';
}

export function useCamara(
  preferida: string | null,
  alCapturar?: (captura: CapturaManos, video: HTMLVideoElement) => void,
) {
  const video = useRef<HTMLVideoElement>(null);
  const [solicitud, setSolicitud] = useState({
    dispositivo: preferida,
    intento: 0,
  });
  const [dispositivos, setDispositivos] = useState<MediaDeviceInfo[]>([]);
  const [nombreCamara, setNombreCamara] = useState('');
  const [microfonoPrevisto, setMicrofonoPrevisto] = useState('');
  const [dispositivoActivo, setDispositivoActivo] = useState<string | null>(
    null,
  );
  const [estado, setEstado] = useState<EstadoCamara>({ fase: 'solicitando' });

  useEffect(() => {
    const vista = video.current;
    if (!vista) return;
    let activo = true;
    let medio: MediaStream | null = null;
    let cerrarDetector: (() => void) | undefined;

    function liberar() {
      cerrarDetector?.();
      cerrarDetector = undefined;
      medio?.getTracks().forEach((pista) => {
        pista.removeEventListener('ended', alPerderCamara);
        pista.stop();
      });
      if (vista && vista.srcObject === medio) vista.srcObject = null;
      medio = null;
    }

    function fallar(fase: Falla) {
      if (!activo) return;
      liberar();
      setEstado({ fase });
    }

    function alPerderCamara() {
      fallar('perdida');
    }

    async function iniciar(elemento: HTMLVideoElement) {
      const media = navigator.mediaDevices;
      if (!media?.getUserMedia) {
        fallar('camaraNoDisponible');
        return;
      }

      let captura: MediaStream | undefined;
      try {
        captura = await media.getUserMedia({
          audio: false,
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            ...(solicitud.dispositivo
              ? { deviceId: { exact: solicitud.dispositivo } }
              : { facingMode: 'user' }),
          },
        });
        if (!activo) {
          captura.getTracks().forEach((pista) => pista.stop());
          return;
        }

        medio = captura;
        const pista = captura.getVideoTracks()[0];
        if (!pista) {
          fallar('sinCamara');
          return;
        }
        if (pista.readyState === 'ended') {
          alPerderCamara();
          return;
        }
        pista.addEventListener('ended', alPerderCamara);
        setNombreCamara(pista.label);
        setDispositivoActivo(
          pista.getSettings().deviceId ?? solicitud.dispositivo,
        );
        setEstado({ fase: 'calibrando' });
        elemento.srcObject = captura;
        void media
          .enumerateDevices()
          .then((registrados) => {
            if (activo && medio === captura) {
              const entradas = registrados.filter((d) => d.kind === 'audioinput');
              setMicrofonoPrevisto((entradas.find((d) => d.deviceId === 'default') ?? entradas[0])?.label ?? '');
              setDispositivos(
                registrados.filter(
                  (dispositivo) => dispositivo.kind === 'videoinput',
                ),
              );
            }
          })
          .catch(() => {
            /* La cámara sigue disponible si no se puede enumerar. */
          });
        await elemento.play();
        if (!activo || medio !== captura) return;
      } catch (error) {
        if (!captura || medio === captura) fallar(clasificarError(error));
        return;
      }

      try {
        cerrarDetector = observarManos(
          elemento,
          (captura) => {
            if (!activo) return;
            const { landmarks, luzSuficiente } = captura;
            const manos = countHands(
              landmarks.map((puntos) => ({ landmarks: puntos })),
            );
            setEstado((anterior) => {
              const previa = anterior.fase === 'evaluada' ? anterior.lecturas : 0;
              let lecturas = previa;
              if (previa < lecturasNecesarias) lecturas = manos && luzSuficiente ? previa + 1 : 0;
              if (anterior.fase === 'evaluada' && anterior.manos === manos &&
                  anterior.luzSuficiente === luzSuficiente && anterior.lecturas === lecturas) return anterior;
              return { fase: 'evaluada', manos, luzSuficiente, lecturas };
            });
            alCapturar?.(captura, elemento);
          },
          () => fallar('detectorNoDisponible'),
        );
      } catch {
        fallar('detectorNoDisponible');
      }
    }

    // Aplazar la primera solicitud permite cancelar el montaje de comprobación de StrictMode.
    const arranque = window.setTimeout(() => void iniciar(vista), 0);
    return () => {
      activo = false;
      window.clearTimeout(arranque);
      liberar();
    };
  }, [solicitud, alCapturar]);

  function abrir(dispositivo: string | null) {
    setEstado({ fase: 'solicitando' });
    setDispositivoActivo(null);
    setSolicitud((anterior) => ({
      dispositivo,
      intento: anterior.intento + 1,
    }));
  }

  const seleccion =
    dispositivoActivo ??
    solicitud.dispositivo ??
    dispositivos[0]?.deviceId ??
    '';
  const progresoMano = estado.fase === 'evaluada' ? Math.round(100 * estado.lecturas / lecturasNecesarias) : 0;
  return { video, estado, progresoMano, dispositivos, seleccion, abrir, nombreCamara, microfonoPrevisto };
}
