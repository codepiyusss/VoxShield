"""
app.py
========
Same backend as before. Two small changes for cloud hosting (Render):

1. Reads the PORT from an environment variable, since Render assigns
   this automatically (it's not always 5000 in production).
2. The actual production server is gunicorn (set in Render's Start
   Command, not by running this file directly) - the __main__ block
   at the bottom is only used when you run this locally for testing.
"""

import os
import tempfile

import numpy as np
import librosa
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

MODEL_PATH = "voice_model.pkl"
N_MFCC = 40  # must match the value used in train_model.py

app = Flask(__name__)
CORS(app)  # allows your deployed frontend to call this backend


if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"'{MODEL_PATH}' not found. Make sure voice_model.pkl is committed "
        f"to the repo and sits in the same folder as app.py."
    )

print("Loading trained model...")
model = joblib.load(MODEL_PATH)
print("Model loaded. Server ready.")


def extract_features(file_path):
    """
    Must exactly match train_model.py's extract_features(), otherwise
    the model receives a differently-shaped input than it was trained
    on and predictions will be wrong or fail outright.
    """
    audio, sr = librosa.load(file_path, sr=16000)

    mfcc = np.mean(librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=N_MFCC).T, axis=0)

    mel = librosa.feature.melspectrogram(y=audio, sr=sr, n_mels=40)
    mel_db = librosa.power_to_db(mel)
    mel_mean = np.mean(mel_db.T, axis=0)

    centroid = np.mean(librosa.feature.spectral_centroid(y=audio, sr=sr))
    bandwidth = np.mean(librosa.feature.spectral_bandwidth(y=audio, sr=sr))
    rolloff = np.mean(librosa.feature.spectral_rolloff(y=audio, sr=sr))
    contrast = np.mean(librosa.feature.spectral_contrast(y=audio, sr=sr).T, axis=0)

    pitch_values = librosa.yin(audio, fmin=50, fmax=500, sr=sr)
    pitch_values = pitch_values[np.isfinite(pitch_values)]
    pitch_mean = np.mean(pitch_values) if len(pitch_values) > 0 else 0.0

    zcr = np.mean(librosa.feature.zero_crossing_rate(audio))

    chroma = np.mean(librosa.feature.chroma_stft(y=audio, sr=sr).T, axis=0)

    rms = np.mean(librosa.feature.rms(y=audio))

    feature_vector = np.concatenate([
        mfcc,
        mel_mean,
        [centroid, bandwidth, rolloff],
        contrast,
        [pitch_mean],
        [zcr],
        chroma,
        [rms],
    ])

    return feature_vector.reshape(1, -1)


@app.route("/predict", methods=["POST"])
def predict():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]

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
        os.remove(temp_path)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": True})


if __name__ == "__main__":
    # Only used for local testing. Render uses gunicorn instead,
    # configured via the Start Command in Render's dashboard.
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
