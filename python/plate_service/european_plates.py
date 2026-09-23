"""Validação de matrículas europeias (exclui Mercosul)."""

import re
from typing import Callable

# (regex, formatter)
_PATTERNS: list[tuple[re.Pattern[str], Callable[[str], str]]] = [
    (re.compile(r"^[A-Z]{2}[0-9]{2}[A-Z]{2}$"), lambda s: f"{s[:2]} {s[2:4]} {s[4:6]}"),
    (re.compile(r"^[0-9]{2}[A-Z]{2}[0-9]{2}$"), lambda s: f"{s[:2]} {s[2:4]} {s[4:6]}"),
    (re.compile(r"^[A-Z]{2}[0-9]{3}[A-Z]{2}$"), lambda s: f"{s[:2]} {s[2:5]} {s[5:7]}"),
    (re.compile(r"^[0-9]{4}[A-Z]{3}$"), lambda s: f"{s[:4]} {s[4:7]}"),
    (re.compile(r"^[A-Z]{2}[0-9]{2}[A-Z]{3}$"), lambda s: f"{s[:2]} {s[2:4]} {s[4:7]}"),
    (re.compile(r"^[A-Z]{2}[0-9]{4}$"), lambda s: f"{s[:2]} {s[2:6]}"),
    (re.compile(r"^[A-Z]{2}[0-9]{5}$"), lambda s: f"{s[:2]} {s[2:7]}"),
    (re.compile(r"^[0-9]{2}[A-Z]{3}[0-9]$"), lambda s: f"{s[:2]} {s[2:5]} {s[5:6]}"),
    (re.compile(r"^[A-Z]{2}[0-9]{3}[A-Z]$"), lambda s: f"{s[:2]} {s[2:5]} {s[5:6]}"),
    (re.compile(r"^[0-9]{3}[A-Z]{3}$"), lambda s: f"{s[:3]} {s[3:6]}"),
    (re.compile(r"^[A-Z][0-9]{6}$"), lambda s: f"{s[0]} {s[1:4]} {s[4:7]}"),
    (re.compile(r"^[A-Z]{3}[0-9]{4}$"), lambda s: f"{s[:3]} {s[3:7]}"),
    (re.compile(r"^[A-Z]{2}[0-9]{4}$"), lambda s: f"{s[:2]} {s[2:6]}"),
    (re.compile(r"^[A-Z]{3}[0-9]{3}$"), lambda s: f"{s[:3]} {s[3:6]}"),
    (re.compile(r"^[A-Z]{2}[0-9]{3}[A-Z]{2}$"), lambda s: f"{s[:2]} {s[2:5]} {s[5:7]}"),
]

_MERCOSUL = re.compile(r"^[A-Z]{3}[0-9][A-Z][0-9]{2}$")


def _is_mercosul(texto: str) -> bool:
    return len(texto) == 7 and bool(_MERCOSUL.match(texto))


def _is_generic_european(texto: str) -> bool:
    if len(texto) < 5 or len(texto) > 8:
        return False
    if _is_mercosul(texto):
        return False
    letters = sum(c.isalpha() for c in texto)
    digits = sum(c.isdigit() for c in texto)
    if letters < 2 or digits < 2:
        return False
    if not texto.isalnum():
        return False
    return letters < len(texto) and digits < len(texto)


def validar_placa(texto: str) -> bool:
    if _is_mercosul(texto):
        return False
    for pattern, _ in _PATTERNS:
        if pattern.match(texto):
            return True
    return _is_generic_european(texto)


def formatar_placa(texto: str) -> str:
    for pattern, fmt in _PATTERNS:
        if pattern.match(texto):
            return fmt(texto)
    if _is_generic_european(texto):
        if len(texto) <= 6:
            return f"{texto[:2]} {texto[2:]}"
        return f"{texto[:2]} {texto[2:5]} {texto[5:]}"
    return texto


def extrair_candidatos(texto: str) -> list[str]:
    """Janelas 5–8 caracteres sobre texto OCR limpo."""
    limpo = re.sub(r"[^A-Z0-9]", "", texto.upper())
    found: set[str] = set()
    for length in range(8, 4, -1):
        for i in range(0, len(limpo) - length + 1):
            cand = limpo[i : i + length]
            if validar_placa(cand):
                found.add(formatar_placa(cand))
    if validar_placa(limpo):
        found.add(formatar_placa(limpo))
    return list(found)
