"""
train_model.py  (IMPROVED VERSION)
=====================================
This script:
1. Loads your real and fake audio files
2. Balances the dataset (since you have 2277 real vs 437 fake)
3. Extracts MFCC features from each file
4. Trains TWO different classifiers and compares them
5. Uses cross-validation for a trustworthy accuracy number
6. Saves whichever model performs better

HOW TO RUN:
    pip install -r requirements.txt
    python train_model.py
"""

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
MAX_REAL_FILES = 1600
N_MFCC = 40
RANDOM_SEED = 42
def extract_features(file_path):
    try:
        audio, sample_rate = librosa.load(file_path, sr=16000)
        mfccs = librosa.feature.mfcc(y=audio, sr=sample_rate, n_mfcc=N_MFCC)
        mfccs_mean = np.mean(mfccs.T, axis=0)
        return mfccs_mean
    except Exception as e:
        print(f"  [!] Skipped {file_path}: {e}")
        return None

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

def run_cross_validation(model, X, y, model_name):
    scores = cross_val_score(model, X, y, cv=5)
    print(f"\n{model_name} 5-fold cross-validation scores: {scores}")
    print(f"{model_name} average CV accuracy: {scores.mean() * 100:.2f}% "
          f"(+/- {scores.std() * 100:.2f}%)")
    return scores.mean()

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
