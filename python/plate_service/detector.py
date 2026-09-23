import base64
import re

import cv2
import numpy as np

from european_plates import extrair_candidatos, formatar_placa, validar_placa

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

        texto_bruto = result.ocr.text.upper()
        conf = _ocr_confidence(result.ocr.confidence)

        if conf < 0.4:
            continue

        for cand in extrair_candidatos(texto_bruto):
            placas.add(cand)

        texto = re.sub(r"[^A-Z0-9]", "", texto_bruto)
        if len(texto) >= 5 and validar_placa(texto[:8]):
            placas.add(formatar_placa(texto[: len(texto) if len(texto) <= 8 else 8]))

    return list(placas)


def detect_plates_from_base64(image_b64: str) -> list[str]:
    frame = decode_image(image_b64)
    return detect_plates_from_frame(frame)
