import base64
import re

import cv2
import numpy as np

ENGINE = "fast-alpr"

_alpr = None


def _get_alpr():
    global _alpr
    if _alpr is None:
        from fast_alpr import ALPR

        _alpr = ALPR(
            detector_model="yolo-v9-t-384-license-plate-end2end",
            ocr_model="cct-xs-v2-global-model",
            detector_conf_thresh=0.45,
            ocr_device="cpu",
        )
    return _alpr


def validar_placa(texto: str) -> bool:
    if len(texto) < 5 or len(texto) > 8:
        return False

    padrao_novo = re.compile(r"^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$")
    padrao_antigo = re.compile(r"^[A-Z]{3}[0-9]{4}$")
    padrao_europeu = re.compile(r"^[A-Z]{2}[0-9]{2}[A-Z]{2}$")
    if padrao_novo.match(texto) or padrao_antigo.match(texto) or padrao_europeu.match(texto):
        return True

    letters = sum(c.isalpha() for c in texto)
    digits = sum(c.isdigit() for c in texto)
    return letters >= 2 and digits >= 2 and texto.isalnum()


def formatar_placa(texto: str) -> str:
    if re.match(r"^[A-Z]{3}[0-9]{4}$", texto):
        return f"{texto[:3]}-{texto[3:]}"
    if re.match(r"^[A-Z]{2}[0-9]{2}[A-Z]{2}$", texto):
        return f"{texto[:2]} {texto[2:4]} {texto[4:]}"
    return texto


def _ocr_confidence(confidence: float | list[float]) -> float:
    if isinstance(confidence, list):
        values = [c for c in confidence if c > 0]
        return sum(values) / len(values) if values else 0.0
    return float(confidence)


def decode_image(image_b64: str) -> np.ndarray:
    if "," in image_b64:
        image_b64 = image_b64.split(",", 1)[1]
    raw = base64.b64decode(image_b64)
    arr = np.frombuffer(raw, dtype=np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Imagem inválida")
    return frame


def detect_plates_from_frame(frame: np.ndarray) -> list[str]:
    alpr = _get_alpr()
    results = alpr.predict(frame)
    placas: set[str] = set()

    for result in results:
        if result.ocr is None or not result.ocr.text:
            continue

        texto = re.sub(r"[^A-Z0-9]", "", result.ocr.text.upper())
        conf = _ocr_confidence(result.ocr.confidence)

        if conf < 0.4 or len(texto) < 5:
            continue

        for length in range(min(8, len(texto)), 4, -1):
            candidato = texto[:length]
            if validar_placa(candidato):
                placas.add(formatar_placa(candidato))
                break

    return list(placas)


def detect_plates_from_base64(image_b64: str) -> list[str]:
    frame = decode_image(image_b64)
    return detect_plates_from_frame(frame)

