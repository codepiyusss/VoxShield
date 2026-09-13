import os
import tempfile

import numpy as np
import librosa
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

MODEL_PATH = "voice_model.pkl"
N_MFCC = 40  # must match the value used in train_model.py

app = Flask(_name_)
CORS(app)  # allows your frontend (opened as a local HTML file or
           # served separately) to make requests to this server

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"'{MODEL_PATH}' not found. Run train_model.py first to create it."
    )

print("Loading trained model...")
model = joblib.load(MODEL_PATH)
print("Model loaded. Server ready.")


def extract_features(file_path):
    audio, sample_rate = librosa.load(file_path, sr=16000)
    mfccs = librosa.feature.mfcc(y=audio, sr=sample_rate, n_mfcc=N_MFCC)
    mfccs_mean = np.mean(mfccs.T, axis=0)
    return mfccs_mean.reshape(1, -1)  # reshape for a single prediction


@app.route("/predict", methods=["POST"])
def predict():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]

    # Save the uploaded file temporarily so librosa can read it
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        audio_file.save(tmp.name)
        temp_path = tmp.name

    try:
        features = extract_features(temp_path)
        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]
        confidence = round(max(probabilities) * 100, 1)

        label = "FAKE" if prediction == 1 else "REAL"

        return jsonify({
            "result": label,
            "confidence": confidence
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        os.remove(temp_path)  # clean up the temporary file

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": True})


if _name_ == "_main_":
    app.run(debug=True, port=5000)
