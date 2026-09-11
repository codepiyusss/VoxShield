import numpy as np
import sounddevice as sd
import librosa
import joblib
import time

MODEL_PATH = "voice_model.pkl"
SAMPLE_RATE = 16000       # must match what train_model.py used
CHUNK_SECONDS = 3         # how many seconds of audio to analyze at a time


def extract_features_from_array(audio):
    mfccs = librosa.feature.mfcc(y=audio, sr=SAMPLE_RATE, n_mfcc=40)
    mfccs_mean = np.mean(mfccs.T, axis=0)
    return mfccs_mean.reshape(1, -1)   # reshape for a single prediction
   
def record_chunk():
    print(f"\n[Listening for {CHUNK_SECONDS} seconds... speak now]")
    audio = sd.rec(int(CHUNK_SECONDS * SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=1)
    sd.wait()  # blocks until recording finishes
    return audio.flatten()


def main():
    print("Loading model...")
    model = joblib.load(MODEL_PATH)
    print("Model loaded. Starting live detection.")
    print("Press Ctrl+C to stop.\n")

    try:
        while True:
            audio = record_chunk()

            # Skip near-silent chunks (avoids false predictions on silence)
            if np.abs(audio).mean() < 0.001:
                print("[Too quiet - skipping this chunk]")
                continue

            features = extract_features_from_array(audio)
            prediction = model.predict(features)[0]
            probabilities = model.predict_proba(features)[0]
            confidence = max(probabilities) * 100

            label = "FAKE (synthetic voice)" if prediction == 1 else "REAL (human voice)"
            print(f">>> Result: {label}  |  Confidence: {confidence:.1f}%")

            time.sleep(0.3)  # tiny pause before next chunk

    except KeyboardInterrupt:
        print("\n\nStopped by user. Goodbye!")

if __name__ == "__main__":
    main()
