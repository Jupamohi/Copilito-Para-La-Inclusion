"""Prueba HTTP real. Ejecutar únicamente con una base dedicada a pruebas."""
import argparse
import json
import os
from pathlib import Path
from uuid import uuid4
from urllib.error import HTTPError
from urllib.request import Request, urlopen


def verificar(base, swagger, usuario, clave):
    def llamar(ruta, datos=None, metodo="GET", token=None, esperado=200, cabeceras=None):
        headers = dict(cabeceras or {})
        if token:
            headers["Authorization"] = "Bearer " + token
        body = None
        if datos is not None:
            headers["Content-Type"] = "application/json"
            body = json.dumps(datos).encode()
        try:
            respuesta = urlopen(Request(base + ruta, body, headers, method=metodo), timeout=20)
        except HTTPError as exc:
            respuesta = exc
        with respuesta:
            assert respuesta.status == esperado, (metodo, ruta, respuesta.status, esperado)
            raw = respuesta.read()
            return json.loads(raw) if "json" in respuesta.headers.get("Content-Type", "") else raw.decode()

    with urlopen(swagger + "/docs") as response:
        assert "SwaggerUIBundle" in response.read().decode()
    with urlopen(swagger + "/openapi.json") as response:
        esquema = json.load(response)
        assert sum(len(ops) for ops in esquema["paths"].values()) == 15
    origen = "http://localhost:5173"
    preflight = Request(swagger + "/api/v1/signs", method="OPTIONS",
                        headers={"Origin": origen, "Access-Control-Request-Method": "GET",
                                 "Access-Control-Request-Headers": "Authorization"})
    with urlopen(preflight, timeout=10) as r:
        assert r.headers["access-control-allow-origin"] == origen
    print("Swagger UI, CORS y 15 operaciones OpenAPI disponibles")
    llamar("/signs", esperado=401)
    llamar("/sessions", {"id_participante": "inexistente"}, "POST", esperado=403)
    token = llamar("/auth/login", {"usuario": usuario, "contraseña": clave}, "POST")["token"]
    catalogo = llamar("/signs", token=token)
    assert any(s["glosa"] == "HOLA" for s in catalogo)
    p = llamar("/consents", {"alcance": "prueba_integracion", "version_formato": "1"}, "POST", esperado=201)["id_participante"]
    muestra = {"id_participante": p, "id_sena": catalogo[0]["id"], "vector": [0.0] * 126}
    llamar("/samples", muestra, "POST", token, 201)
    sid = llamar("/sessions", {"id_participante": p}, "POST", esperado=201)["session_id"]
    ruta = "/sessions/" + sid
    palabras = llamar("/translate", {"texto": "Buenos días, desconocida"}, "POST")
    assert palabras[0]["glosa"] == "BUENOS DÍAS" and palabras[1]["fuera_de_vocabulario"]
    llamar("/predict", {"session_id": sid, "vector": [1]}, "POST", esperado=422)
    llamar("/predict", {"session_id": sid, "vector": muestra["vector"]}, "POST", esperado=503)
    turno = {"interlocutor": "oyente", "tipo": "voz", "texto": "Hola", "confianza": None,
             "confirmada": True, "latencia_ms": 5, "clave_envio": str(uuid4())}
    recibo_turno = llamar(ruta + "/interventions", turno, "POST", esperado=201)
    assert llamar(ruta + "/interventions", turno, "POST", esperado=201) == recibo_turno
    assert "Hola" in llamar(ruta + "/export")
    assert llamar(ruta + "/end", metodo="PATCH") == llamar(ruta + "/end", metodo="PATCH")
    assert llamar("/sus", {"session_id": sid, "respuestas": [3] * 10}, "POST")["puntaje"] == 50
    recibo = llamar("/consents/" + p + "/revoke", metodo="POST")
    assert recibo["muestras_eliminadas"] == 1
    assert llamar("/consents/" + p + "/revoke", metodo="POST") == recibo
    assert llamar("/model", token=token, esperado=404)["detail"]
    llamar("/model", {"version":"ausente","exactitud":0,"precision":0,"sensibilidad":0,"f1":0,
          "umbral":0.8,"matriz_confusion":{"etiquetas":[],"valores":[]}}, "PUT", token, 503)
    llamar("/samples", muestra, "POST", token, 403)
    if wav := os.getenv("TEST_WAV"):
        borde = uuid4().hex
        cabecera = (f'--{borde}\r\nContent-Disposition: form-data; name="audio"; filename="prueba.wav"\r\n'
                    'Content-Type: audio/wav\r\n\r\n').encode()
        cuerpo = cabecera + Path(wav).read_bytes() + f"\r\n--{borde}--\r\n".encode()
        req = Request(base + "/stt", cuerpo, {"Content-Type": f"multipart/form-data; boundary={borde}"})
        with urlopen(req, timeout=90) as response:
            texto = json.load(response)["texto"]
            assert texto.strip(), "La prueba de voz requiere una frase audible"
            print("Transcripción HTTP:", texto)
    print("Verificados login, catálogo, consentimiento, muestras, revocación, sesión, traducción, exportación, SUS y errores")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", required=True, help="URL de la API a través del proxy Vite")
    parser.add_argument("--swagger", required=True, help="Origen FastAPI")
    args = parser.parse_args()
    verificar(args.base, args.swagger, os.environ["TEST_ADMIN"], os.environ["TEST_CLAVE"])
