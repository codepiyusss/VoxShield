const tabButtons = document.querySelectorAll(".tab-btn");
const panels = {
  upload: document.getElementById("panel-upload"),
  record: document.getElementById("panel-record"),
};

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const fileNameEl = document.getElementById("file-name");
const analyzeBtn = document.getElementById("analyze-btn");

const recordBtn = document.getElementById("record-btn");
const recordStatus = document.getElementById("record-status");

const resultCard = document.getElementById("result-card");
const resultLabel = document.getElementById("result-label");
const resultSub = document.getElementById("result-sub");
const confidenceFill = document.getElementById("confidence-fill");
const resetBtn = document.getElementById("reset-btn");

let selectedAudioSource = null; // holds either an uploaded File or recorded

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const target = btn.dataset.tab;
    Object.keys(panels).forEach((key) => {
      panels[key].classList.toggle("hidden", key !== target);
    });

    resetSelection();
  });
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    setSelectedFile(fileInput.files[0]);
  }
});

dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.style.borderColor = "var(--color-accent)";
});

dropzone.addEventListener("dragleave", () => {
  dropzone.style.borderColor = "var(--color-border)";
});

dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.style.borderColor = "var(--color-border)";
  if (e.dataTransfer.files.length > 0) {
    setSelectedFile(e.dataTransfer.files[0]);
  }
});

function setSelectedFile(file) {
  selectedAudioSource = file;
  fileNameEl.textContent = file.name;
  analyzeBtn.disabled = false;
}

let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

recordBtn.addEventListener("click", async () => {
  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      recordedChunks = [];

      mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "audio/webm" });
        selectedAudioSource = blob;
        analyzeBtn.disabled = false;
        recordStatus.textContent = "Recording captured, ready to analyze";
      };

      mediaRecorder.start();
      isRecording = true;
      recordBtn.classList.add("recording");
      recordStatus.textContent = "Recording... tap to stop";
    } catch (err) {
      recordStatus.textContent = "Microphone access denied or unavailable";
    }
  } else {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    isRecording = false;
    recordBtn.classList.remove("recording");
  }
});

analyzeBtn.addEventListener("click", async () => {
  if (!selectedAudioSource) return;

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "Analyzing...";

  const result = await analyzeAudio(selectedAudioSource);

  analyzeBtn.textContent = "Analyze voice";
  analyzeBtn.disabled = false;

  showResult(result);
});

async function analyzeAudio(audioSource) {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  return {
    label: "UNKNOWN",
    confidence: 0,
  };
}
function showResult(result) {
  resultCard.classList.remove("hidden", "state-real", "state-fake");

  if (result.label === "REAL") {
    resultCard.classList.add("state-real");
    resultLabel.textContent = "Likely a real human voice";
  } else if (result.label === "FAKE") {
    resultCard.classList.add("state-fake");
    resultLabel.textContent = "Likely an AI-generated voice";
  } else {
    resultLabel.textContent = "Result unavailable (backend not connected)";
  }

  resultSub.textContent = result.confidence
    ? `Confidence: ${result.confidence}%`
    : "Connect the backend to see a real confidence score";

  confidenceFill.style.width = `${result.confidence || 0}%`;

  resultCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

resetBtn.addEventListener("click", () => {
  resetSelection();
  resultCard.classList.add("hidden");
});

function resetSelection() {
  selectedAudioSource = null;
  fileInput.value = "";
  fileNameEl.textContent = "";
  analyzeBtn.disabled = true;
  recordStatus.textContent = "Tap to start recording";
}
