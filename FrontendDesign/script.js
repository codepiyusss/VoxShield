const tabButtons = document.querySelectorAll(".tab-btn");
const panels = {
  upload: document.getElementById("panel-upload"),
  record: document.getElementById("panel-record")
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
const recordBtn = document.getElementById("record-btn");
const recordStatus = document.getElementById("record-status");
const resultCard = document.getElementById("result-card");
const resultLabel = document.getElementById("result-label");
const resultSub = document.getElementById("result-sub");
const confidenceFill = document.getElementById("confidence-fill");
const resetBtn = document.getElementById("reset-btn");
let selectedAudioSource = null;

let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let audioStream = null;

const canvas = document.getElementById("waveform");
const ctx = canvas.getContext("2d");
const micButton = document.getElementById("start-microphone");
const micStatus = document.getElementById("mic-status");

let audioContext = null;
let analyser = null;
let dataArray = null;
let microphoneSource = null;
let animationId = null;

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {

    tabButtons.forEach((b) => {
      b.classList.remove("active");
    });

    btn.classList.add("active");

    const target = btn.dataset.tab;

    Object.keys(panels).forEach((key) => {
      panels[key].classList.toggle(
        "hidden",
        key !== target
      );
    });

    resetSelection();

    if (target === "record") {
      setTimeout(() => {
        resizeCanvas();
      }, 50);
    }
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

  dropzone.style.borderColor =
    "var(--color-border)";
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

function resizeCanvas() {
  if (!canvas) return;

  const width = canvas.clientWidth;

  if (width > 0) {
    canvas.width = width;
  }

  canvas.height = 220;
}

resizeCanvas();

window.addEventListener(
  "resize",
  resizeCanvas
);

async function startMicrophone() {
  try {

    if (!audioStream) {
      audioStream =
        await navigator.mediaDevices.getUserMedia({
          audio: true
        });
    }

    if (!audioContext) {
      audioContext =
        new (window.AudioContext ||
          window.webkitAudioContext)();
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    if (!analyser) {

      analyser =
        audioContext.createAnalyser();

      analyser.fftSize = 2048;

      dataArray =
        new Uint8Array(
          analyser.fftSize
        );

      microphoneSource =
        audioContext.createMediaStreamSource(
          audioStream
        );

      microphoneSource.connect(
        analyser
      );
    }

    resizeCanvas();

    micButton.textContent =
      "🎙 Microphone active";

    micStatus.textContent =
      "Microphone is active";

    if (!animationId) {
      drawWaveform();
    }

    return true;

  } catch (error) {

    console.error(error);

    micStatus.textContent =
      "Microphone permission is required.";

    alert(
      "Microphone permission is required."
    );

    return false;
  }
}

micButton.addEventListener(
  "click",
  async () => {
    await startMicrophone();
  }
);

recordBtn.addEventListener(
  "click",
  async () => {

    if (!isRecording) {

      try {

        const micReady =
          await startMicrophone();

        if (!micReady) {
          return;
        }

        mediaRecorder =
          new MediaRecorder(
            audioStream
          );

        recordedChunks = [];

        mediaRecorder.ondataavailable =
          (e) => {

            if (e.data.size > 0) {
              recordedChunks.push(e.data);
            }
          };

        mediaRecorder.onstop =
          () => {

            const blob =
              new Blob(
                recordedChunks,
                {
                  type: "audio/webm"
                }
              );

            selectedAudioSource = blob;

            analyzeBtn.disabled = false;

            recordStatus.textContent =
              "Recording captured, ready to analyze";
          };

        mediaRecorder.start();

        isRecording = true;

        recordBtn.classList.add(
          "recording"
        );

        recordStatus.textContent =
          "Recording... tap to stop";

      } catch (error) {

        console.error(error);

        recordStatus.textContent =
          "Microphone access denied or unavailable";
      }

    } else {

      if (
        mediaRecorder &&
        mediaRecorder.state !== "inactive"
      ) {
        mediaRecorder.stop();
      }

      isRecording = false;

      recordBtn.classList.remove(
        "recording"
      );
    }
  }
);

function drawWaveform() {

  animationId =
    requestAnimationFrame(
      drawWaveform
    );

  if (!analyser || !dataArray) {
    return;
  }

  analyser.getByteTimeDomainData(
    dataArray
  );

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#00e5ff";
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#00e5ff";

  ctx.beginPath();

  const sliceWidth =
    canvas.width /
    dataArray.length;

  let x = 0;

  for (
    let i = 0;
    i < dataArray.length;
    i++
  ) {

    const v =
      (dataArray[i] - 128) /
      128;

    const y =
      canvas.height / 2 +
      v * 75;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  ctx.stroke();
}

analyzeBtn.addEventListener(
  "click",
  async () => {

    if (!selectedAudioSource) {
      return;
    }

    analyzeBtn.disabled = true;

    analyzeBtn.textContent =
      "Analyzing...";

    const result =
      await analyzeAudio(
        selectedAudioSource
      );

    analyzeBtn.textContent =
      "Analyze voice";

    analyzeBtn.disabled = false;

    showResult(result);
  }
);

async function analyzeAudio(audioSource) {

  await new Promise(
    (resolve) =>
      setTimeout(resolve, 1200)
  );

  return {
    label: "UNKNOWN",
    confidence: 0
  };
}

function showResult(result) {

  resultCard.classList.remove(
    "hidden",
    "state-real",
    "state-fake"
  );

  if (result.label === "REAL") {

    resultCard.classList.add(
      "state-real"
    );

    resultLabel.textContent =
      "Likely a real human voice";

  } else if (result.label === "FAKE") {

    resultCard.classList.add(
      "state-fake"
    );

    resultLabel.textContent =
      "Likely an AI-generated voice";

  } else {

    resultLabel.textContent =
      "Result unavailable (backend not connected)";
  }

  resultSub.textContent =
    result.confidence
      ? `Confidence: ${result.confidence}%`
      : "Connect the backend to see a real confidence score";

  confidenceFill.style.width =
    `${result.confidence || 0}%`;

  resultCard.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

resetBtn.addEventListener(
  "click",
  () => {

    resetSelection();

    resultCard.classList.add(
      "hidden"
    );
  }
);

function resetSelection() {

  selectedAudioSource = null;

  fileInput.value = "";

  fileNameEl.textContent = "";

  analyzeBtn.disabled = true;

  recordStatus.textContent =
    "Tap to start recording";
}
=======
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
