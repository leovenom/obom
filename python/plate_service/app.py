import os
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS

from detector import ENGINE, detect_plates_from_base64

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get("PLATE_AI_PORT", "5050"))


@app.route("/health")
def health():
    try:
        from detector import _get_alpr

        _get_alpr()
        return jsonify({"ok": True, "engine": ENGINE, "model": True})
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc), "engine": ENGINE, "model": False}), 503


@app.route("/detect", methods=["POST"])
def detect():
    try:
        payload = request.get_json(silent=True) or {}
        image = payload.get("image")
        if not image:
            return jsonify({"error": "Campo image obrigatório"}), 400

        placas = detect_plates_from_base64(image)
        return jsonify(
            {
                "plates": placas,
                "source": "ai",
                "engine": ENGINE,
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        )
    except Exception as exc:
        return jsonify({"error": str(exc), "plates": [], "engine": ENGINE}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=False)
