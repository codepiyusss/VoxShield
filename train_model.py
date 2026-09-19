import os
import random
import time
import numpy as np
import librosa
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib


DATASET_DIR = "dataset"
MODEL_OUTPUT_PATH = "voice_model.pkl"
MAX_REAL_FILES = None 
N_MFCC = 40             # number of MFCC coefficients per file
RANDOM_SEED = 42        # keeps results reproducible every run


# ----------------------------------------------------------------------
# STEP 1: Feature extraction (turns one audio file into one row of numbers)
# ----------------------------------------------------------------------
def extract_features(file_path):
    try:
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

        return feature_vector
    except Exception as e:
        print(f"  [!] Skipped {file_path}: {e}")
        return None


# ----------------------------------------------------------------------
# STEP 2: Load and balance the dataset
# ----------------------------------------------------------------------
def load_dataset():
    features = []
    labels = []

    for label_name, label_value, cap in [
        ("real", 0, MAX_REAL_FILES),
        ("fake", 1, None),  # use all fake files
    ]:
        folder = os.path.join(DATASET_DIR, label_name)
        if not os.path.isdir(folder):
            print(f"[!] Folder not found: {folder}")
            continue

        files = [f for f in os.listdir(folder) if f.lower().endswith((".wav", ".mp3", ".flac"))]
        random.seed(RANDOM_SEED)
        random.shuffle(files)

        if cap is not None:
            files = files[:cap]

        print(f"Using {len(files)} files from {folder}")

        for i, filename in enumerate(files):
            file_path = os.path.join(folder, filename)
            feats = extract_features(file_path)
            if feats is not None:
                features.append(feats)
                labels.append(label_value)
            if (i + 1) % 100 == 0:
                print(f"  processed {i + 1}/{len(files)} from {label_name}")

    return np.array(features), np.array(labels)


# ----------------------------------------------------------------------
# STEP 3: Train and compare two models
# ----------------------------------------------------------------------
def train_and_compare(X_train, X_test, y_train, y_test):
    results = {}

    print("\n--- Training Random Forest ---")
    rf_model = RandomForestClassifier(
        n_estimators=200,
        class_weight="balanced",
        random_state=RANDOM_SEED,
    )
    rf_model.fit(X_train, y_train)
    rf_preds = rf_model.predict(X_test)
    rf_accuracy = accuracy_score(y_test, rf_preds)
    print(f"Random Forest test accuracy: {rf_accuracy * 100:.2f}%")
    results["Random Forest"] = (rf_model, rf_accuracy, rf_preds)

    print("\n--- Training Gradient Boosting ---")
    gb_model = GradientBoostingClassifier(random_state=RANDOM_SEED)
    gb_model.fit(X_train, y_train)
    gb_preds = gb_model.predict(X_test)
    gb_accuracy = accuracy_score(y_test, gb_preds)
    print(f"Gradient Boosting test accuracy: {gb_accuracy * 100:.2f}%")
    results["Gradient Boosting"] = (gb_model, gb_accuracy, gb_preds)

    return results


# STEP 4: Cross-validation (a more trustworthy accuracy check)

def run_cross_validation(model, X, y, model_name):
    scores = cross_val_score(model, X, y, cv=5)
    print(f"\n{model_name} 5-fold cross-validation scores: {scores}")
    print(f"{model_name} average CV accuracy: {scores.mean() * 100:.2f}% "
          f"(+/- {scores.std() * 100:.2f}%)")
    return scores.mean()



# MAIN
def main():
    start_time = time.time()

    print("=" * 60)
    print("STEP 1: Loading and balancing dataset...")
    print("=" * 60)
    X, y = load_dataset()

    if len(X) == 0:
        print("\n[!] No data loaded. Check your dataset/real and dataset/fake folders.")
        return

    print(f"\nTotal samples: {len(X)}  (real: {sum(y == 0)}, fake: {sum(y == 1)})")

    print("\n" + "=" * 60)
    print("STEP 2: Splitting into train/test sets...")
    print("=" * 60)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )
    print(f"Training on {len(X_train)} samples, testing on {len(X_test)} samples")

    print("\n" + "=" * 60)
    print("STEP 3: Training and comparing models...")
    print("=" * 60)
    results = train_and_compare(X_train, X_test, y_train, y_test)

    print("\n" + "=" * 60)
    print("STEP 4: Cross-validation for a trustworthy accuracy number...")
    print("=" * 60)
    for model_name, (model, accuracy, preds) in results.items():
        run_cross_validation(model, X, y, model_name)

    print("\n" + "=" * 60)
    print("STEP 5: Choosing the best model...")
    print("=" * 60)
    best_model_name = max(results, key=lambda name: results[name][1])
    best_model, best_accuracy, best_preds = results[best_model_name]
    print(f"Best model: {best_model_name} with {best_accuracy * 100:.2f}% test accuracy")

    print("\nDetailed report for the best model:")
    print(classification_report(y_test, best_preds, target_names=["Real", "Fake"]))
    print("Confusion matrix (rows=actual, columns=predicted):")
    print(confusion_matrix(y_test, best_preds))

    print("\n" + "=" * 60)
    print("STEP 6: Saving the best model...")
    print("=" * 60)
    joblib.dump(best_model, MODEL_OUTPUT_PATH)
    print(f"Saved to: {MODEL_OUTPUT_PATH}")

    elapsed = time.time() - start_time
    print(f"\nTotal time taken: {elapsed:.1f} seconds")
    print("\nDone! You can now run live_detect.py to test it live.")


if __name__ == "__main__":
    main()
