# VoxShield

AI-Powered Real-Time Detection of Voice Cloning Impersonation Attacks

![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python&logoColor=white)
![scikit--learn](https://img.shields.io/badge/scikit--learn-ML%20Model-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Backend-000000?style=flat-square&logo=flask&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-Frontend-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-Styling-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Interactivity-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=flat-square)

## Overview

VoxShield is a machine learning based system that listens to short chunks of live audio and classifies the voice as REAL (human) or FAKE (AI-generated / cloned), along with a confidence score. It is built to address the growing threat of voice cloning being used for scams, fraud, and impersonation, with a specific focus on Indian-accented voices, a group underrepresented in most existing deepfake detection datasets.

## Problem Statement

AI voice cloning tools have advanced to the point where synthetic speech can convincingly imitate a real person's tone, pitch, and speaking style. This is increasingly exploited for financial fraud, impersonation scams, and misinformation. Most existing detection research and datasets are trained primarily on Western-accented English speech, leaving a significant gap for Indian speakers and Indian-accented voices, which are common targets for scam calls in the Indian context.

## What This Project Does

Given a short audio clip (live microphone input or uploaded file), VoxShield:

1. Converts the raw audio into a numerical representation through MFCC features
2. Feeds those features into a trained classifier
3. Outputs a REAL or FAKE prediction with a confidence score

## Pipeline

```
Voice (live mic or uploaded file)
        |
        v
Digital audio (raw waveform, numbers)
        |
        v
MFCC feature extraction
        |
        v
Trained classifier (Random Forest)
        |
        v
Output: REAL or FAKE, with confidence score
```

## Tech Stack

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![librosa](https://img.shields.io/badge/librosa-audio%20processing-4B8BBE?style=for-the-badge)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![Flask](https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)

|Component              | Purpose                                   |
|-----------------------|-------------------------------------------|
| librosa               | Audio processing, MFCC feature extraction |
| scikit-learn          | Classifier training and evaluation        |
| sounddevice           | Live microphone input                     |
| joblib                | Model saving and loading                  |
| Flask                 | Backend API connecting model to frontend  |
| HTML, CSS, JavaScript | Frontend interface                        |

## Dataset

The model is trained on a combination of:

- Real voice samples: sourced from the IndieFake Dataset, and few of found by team
- Fake voice samples: synthetically generated using Microsoft Edge text-to-speech, using Indian-accented English and Hindi voices, to ensure the fake class reflects realistic Indian-context synthetic speech

Dataset was balanced across both classes before training to avoid classifier bias toward the majority class.

## Project Structure

```
VoxShield/
  dataset/
    real/                         # Real voice audio files
    fake/                         # Synthetic voice audio files
  data_prep_scripts/
    flatten_bonafides.py          # Organizes real audio from source dataset
    generate_fake_audio.py        # Generates synthetic audio samples
  train_model.py                  # Extracts features and trains the classifier
  live_detect.py                  # Runs live microphone detection
  voice_model.pkl                 # Saved trained model (generated after training)
  FrontendDesign/
    index.html
    style.css
    script.js
  requirements.txt
  README.md
```

## How It Works

### 1. Feature Extraction

Each audio file is converted into MFCC (Mel-Frequency Cepstral Coefficients), a compact numerical representation of the voice's frequency characteristics, tuned to how human hearing perceives sound. This turns raw audio into a fixed-size input suitable for a classifier.

### 2. Model Training

A Random Forest classifier is trained on the extracted MFCC features, learning to distinguish real from synthetic voice patterns. The dataset is split into training and test sets to evaluate performance on unseen data.

### 3. Live Detection

Once trained, the model can process short audio chunks captured from a live microphone, running the same feature extraction and prediction pipeline in near real time.

## Setup and Installation

```
pip install -r requirements.txt
```

### Train the model

```
python train_model.py
```

This expects data organized as `dataset/real/` and `dataset/fake/`, and produces a saved model file, `voice_model.pkl`.

### Run live detection

```
python live_detect.py
```

Speak into the microphone. The script will print REAL or FAKE with a confidence score every few seconds.

## Current Scope

This project currently focuses on detection only. The following are identified as future work and are not part of the current build:

- Real-time integration with actual phone/VoIP call streams (current version analyzes live microphone input, used to simulate call audio during demos)
- Automated prevention actions such as call blocking or alerts
- Subscription or paid feature tiers

## Related Work

This project is informed by and builds on findings from recent academic research in deepfake voice detection, including:

## Team

- [Piyush Tiwari](https://github.com/codepiyusss) (Leader)
- [Siddhatha Kumar](https://github.com/DevSid740)
- [Abhihek Dwivedi](https://github.com/abhishekdwivedi3686-max)
- [Anjali Kumari](https://github.com/anjalikumari469)
- [Lucky Kumari](https://github.com/lucky-mehta)
- [Aman Dubey](https://github.com/amandubey0605)

## License

MIT License
