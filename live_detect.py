"""
live_detect.py
================
STEP 2 of the project. Run this AFTER train_model.py has created voice_model.pkl.

WHAT THIS DOES (in plain English):
1. Listens to your microphone.
2. Every few seconds, it grabs the last chunk of audio you spoke.
3. It converts that chunk into the same kind of "fingerprint" numbers
   used during training (MFCC features).
4. It asks the trained model: "does this sound REAL or FAKE?"
5. It prints the result with a confidence percentage.
6. It repeats forever until you press Ctrl+C.

This is what makes the demo feel "real-time" on stage - it's really just
running the same classifier repeatedly on short chunks, one after another.

HOW TO RUN:
    python live_detect.py
Then just talk normally into your mic. Press Ctrl+C to stop.
"""

import numpy as np
import sounddevice as sd
import librosa
import joblib
import time

MODEL_PATH = "voice_model.pkl"
SAMPLE_RATE = 16000       # must match what train_model.py used
CHUNK_SECONDS = 3         # how many seconds of audio to analyze at a time


def extract_features_from_array(audio):
    """
    Same feature extraction as train_model.py, but works directly on
    an in-memory audio array (from the mic) instead of a file.
    """
    mfccs = librosa.feature.mfcc(y=audio, sr=SAMPLE_RATE, n_mfcc=40)
    mfccs_mean = np.mean(mfccs.T, axis=0)
    return mfccs_mean.reshape(1, -1)   # reshape for a single prediction

<<<<<<< HEAD

=======
>>>>>>> a2a7213f7482999d6a7af6870a3404efcddc4033
def record_chunk():
    """Records CHUNK_SECONDS of audio from the default microphone."""
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
