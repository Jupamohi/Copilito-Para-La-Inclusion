from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

Texto = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=4096)]
Unidad = Annotated[float, Field(ge=0, le=1, allow_inf_nan=False)]
Vector = Annotated[list[Annotated[float, Field(allow_inf_nan=False)]], Field(min_length=126, max_length=126)]


class Datos(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ParticipanteCreado(Datos):
    id_participante: str


class Revocacion(Datos):
    constancia: str
    muestras_eliminadas: int


class SesionCreada(Datos):
    session_id: UUID
    inicio: datetime


class Cierre(Datos):
    duracion_ms: int


class Identificador(Datos):
    id: str


class Acceso(Datos):
    token: str


class Puntaje(Datos):
    puntaje: float


class Sena(Datos):
    id: str
    glosa: str
    descripcion: str
    animacion: str | None


class Conocida(Datos):
    palabra: str
    fuera_de_vocabulario: Literal[False]
    glosa: str
    animacion: str | None


class Desconocida(Datos):
    palabra: str
    fuera_de_vocabulario: Literal[True]


class ResultadoPrediccion(Datos):
    seña: str
    confianza: Unidad
    aceptada: bool


class Transcripcion(Datos):
    texto: str


class Consentimiento(Datos):
    alcance: Texto
    version_formato: Annotated[str, StringConstraints(min_length=1, max_length=20)]


class Participacion(Datos):
    id_participante: Texto


class Credenciales(Datos):
    usuario: Annotated[str, StringConstraints(min_length=1, max_length=50)]
    contraseña: Annotated[str, StringConstraints(min_length=1, max_length=512)]


class Frase(Datos):
    texto: Texto


class Prediccion(Datos):
    session_id: UUID
    vector: Vector


class Muestra(Datos):
    id_sena: int = Field(gt=0)
    id_participante: Texto
    vector: Vector


class Intervencion(Frase):
    clave_envio: UUID | None = None
    interlocutor: Literal["sordo", "oyente"]
    tipo: Literal["seña", "voz"]
    confianza: Unidad | None
    confirmada: bool
    latencia_ms: int = Field(ge=0, le=2147483647)

    @model_validator(mode="after")
    def coherente(self):
        if (self.tipo == "seña") != (self.interlocutor == "sordo") or (self.tipo == "voz" and self.confianza is not None):
            raise ValueError("Turno incoherente")
        return self


class SUS(Datos):
    session_id: UUID
    respuestas: list[Annotated[int, Field(strict=True, ge=1, le=5)]] = Field(min_length=10, max_length=10)


class Matriz(Datos):
    etiquetas: list[Texto] = Field(max_length=256)
    valores: list[list[Annotated[float, Field(ge=0, allow_inf_nan=False)]]] = Field(max_length=256)

    @model_validator(mode="after")
    def cuadrada(self):
        n = len(self.etiquetas)
        if len(set(self.etiquetas)) != n or len(self.valores) != n or any(len(fila) != n for fila in self.valores):
            raise ValueError("La matriz debe ser cuadrada y tener etiquetas únicas")
        return self


class Modelo(Datos):
    version: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)]
    exactitud: Unidad
    precision: Unidad
    sensibilidad: Unidad
    f1: Unidad
    umbral: Unidad
    matriz_confusion: Matriz
