import json
import os
from functools import lru_cache
from pathlib import Path
from fastapi import APIRouter, File, HTTPException, UploadFile
from datos import conexion, sesion
from esquemas import Prediccion, ResultadoPrediccion, Transcripcion

rutas_motores = APIRouter()


def directorio_modelo(version):
    raiz = os.getenv("COPILOTO_MODELOS")
    if not raiz or Path(version).name != version or version in (".", ".."):
        raise HTTPException(503, "Configure el directorio y la versión del modelo")
    base = Path(raiz).resolve()
    carpeta = (base / version).resolve()
    if carpeta.parent != base or not all((carpeta / f).is_file() for f in ("modelo.onnx", "etiquetas.json")):
        raise HTTPException(503, "Faltan el clasificador ONNX o sus etiquetas")
    return carpeta


@lru_cache(maxsize=2)
def clasificador(carpeta):
    import onnxruntime as ort
    etiquetas = json.loads((carpeta / "etiquetas.json").read_text(encoding="utf-8"))
    if not isinstance(etiquetas, list) or not etiquetas or not all(isinstance(e, str) and e.strip() for e in etiquetas):
        raise ValueError("Etiquetas inválidas")
    motor = ort.InferenceSession(str(carpeta / "modelo.onnx"), providers=["CPUExecutionProvider"])
    entradas = motor.get_inputs()
    if len(entradas) != 1 or entradas[0].type != "tensor(float)" or len(entradas[0].shape) != 2 or entradas[0].shape[-1] != 126:
        raise ValueError("Se requiere una entrada float32 de 126 valores")
    return motor, etiquetas


@rutas_motores.post("/predict", response_model=ResultadoPrediccion)
def predecir(datos: Prediccion):
    with conexion() as db:
        s = sesion(db, datos.session_id)
        if s["fin"]:
            raise HTTPException(409, "Sesión cerrada")
        modelo = db.execute("SELECT nombre,umbral_confianza FROM version_modelo WHERE id_version=%s", (s["id_version"],)).fetchone()
    if not modelo:
        raise HTTPException(503, "La sesión no tiene un clasificador configurado")
    carpeta = directorio_modelo(modelo["nombre"])
    try:
        import numpy as np
        motor, etiquetas = clasificador(carpeta)
        salida = np.asarray(motor.run(None, {motor.get_inputs()[0].name: np.asarray([datos.vector], dtype=np.float32)})[0])
        if salida.shape != (1, len(etiquetas)) or not np.isfinite(salida).all() or np.any(salida < 0) or np.any(salida > 1):
            raise ValueError("Se esperaban probabilidades por clase")
        indice = int(np.argmax(salida[0]))
        confianza = float(salida[0, indice])
        return {"seña": etiquetas[indice], "confianza": confianza, "aceptada": confianza >= float(modelo["umbral_confianza"])}
    except Exception as exc:
        raise HTTPException(503, "Clasificador ausente o incompatible") from exc


@lru_cache(maxsize=1)
def transcriptor(carpeta):
    from faster_whisper import WhisperModel
    return WhisperModel(carpeta, device="cpu", compute_type="int8", local_files_only=True)


@rutas_motores.post("/stt", response_model=Transcripcion)
def transcribir(audio: UploadFile = File(...)):
    if not audio.content_type or audio.content_type.split(";")[0] not in {"audio/webm", "audio/ogg", "audio/mp4", "audio/wav"}:
        raise HTTPException(415, "Formato de audio no admitido")
    if not audio.size:
        raise HTTPException(422, "Audio vacío")
    if audio.size > 10 * 1024 * 1024:
        raise HTTPException(413, "Audio mayor de 10 MiB")
    carpeta = os.getenv("COPILOTO_STT")
    if not carpeta or not Path(carpeta).is_dir():
        raise HTTPException(503, "Transcripción local sin configurar")
    try:
        motor = transcriptor(carpeta)
    except Exception as exc:
        raise HTTPException(503, "No se pudo cargar el transcriptor") from exc
    try:
        segmentos, _ = motor.transcribe(audio.file, language="es", beam_size=1)
        return {"texto": " ".join(s.text.strip() for s in segmentos).strip()}
    except (ValueError, RuntimeError, OSError) as exc:
        raise HTTPException(422, "No se pudo interpretar el audio") from exc
