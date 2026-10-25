"""API opcional de Flask para guardar resultados de Funnel Master.
La versión principal del juego funciona sin este servidor; esta API es una ampliación.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
import json
from datetime import datetime, timezone

app = Flask(__name__, static_folder="../", static_url_path="")
CORS(app)
DATA_FILE = Path(__file__).with_name("results.json")

def load_results():
    if not DATA_FILE.exists():
        return []
    try:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []

@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "Funnel Master API"})

@app.get("/api/results")
def get_results():
    """Devuelve los últimos 100 resultados guardados."""
    return jsonify(load_results()[-100:])

@app.post("/api/results")
def save_result():
    """Guarda un resultado validado; no almacena contraseñas ni datos sensibles."""
    payload = request.get_json(silent=True) or {}
    mode = str(payload.get("mode", ""))[:40]
    score = payload.get("score")
    correct = payload.get("correct")
    answered = payload.get("answered")
    if not mode or not all(isinstance(v, int) and 0 <= v <= 1000000 for v in (score, correct, answered)):
        return jsonify({"error": "Envía mode y valores enteros no negativos para score, correct y answered."}), 400
    if correct > answered:
        return jsonify({"error": "correct no puede ser mayor que answered."}), 400
    rows = load_results()
    row = {"mode": mode, "score": score, "correct": correct, "answered": answered,
           "created_at": datetime.now(timezone.utc).isoformat()}
    rows.append(row)
    DATA_FILE.write_text(json.dumps(rows[-1000:], ensure_ascii=False, indent=2), encoding="utf-8")
    return jsonify({"saved": True, "result": row}), 201

if __name__ == "__main__":
    app.run(debug=True, port=5000)
