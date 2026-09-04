// ================================
// CLONE-CATCH
// Voice Security Frontend
// ================================

const audioFile = document.getElementById("audioFile");
const fileName = document.getElementById("fileName");
const analyzeBtn = document.getElementById("analyzeBtn");
const loading = document.getElementById("loading");

const score = document.getElementById("score");
const risk = document.getElementById("risk");
const riskDot = document.getElementById("riskDot");
const resultMessage = document.getElementById("resultMessage");

const uploadBox = document.getElementById("uploadBox");
const scoreCircle = document.querySelector(".score-circle");


// ================================
// FILE SELECTION
// ================================

audioFile.addEventListener("change", function () {

    if (audioFile.files.length > 0) {

        const file = audioFile.files[0];

        fileName.textContent = "✓ " + file.name;

        uploadBox.style.borderColor = "#32d9ff";

    } else {

        fileName.textContent = "No file selected";

    }

});


// ================================
// DRAG & DROP
// ================================

uploadBox.addEventListener("dragover", function (event) {

    event.preventDefault();

    uploadBox.style.borderColor = "#32d9ff";

});

uploadBox.addEventListener("dragleave", function () {

    uploadBox.style.borderColor = "rgba(50,217,255,0.25)";

});

uploadBox.addEventListener("drop", function (event) {

    event.preventDefault();

    const files = event.dataTransfer.files;

    if (files.length > 0) {

        audioFile.files = files;

        fileName.textContent = "✓ " + files[0].name;

        uploadBox.style.borderColor = "#32d9ff";

    }

});


// ================================
// ANALYZE VOICE
// ================================

analyzeBtn.addEventListener("click", function () {

    if (audioFile.files.length === 0) {

        alert("Please upload an audio file first.");

        return;

    }

    // Hide previous result
    score.textContent = "--";

    risk.textContent = "ANALYZING";

    resultMessage.textContent =
        "AI engine is analyzing the voice fingerprint...";

    // Show loading
    loading.style.display = "flex";

    analyzeBtn.disabled = true;

    analyzeBtn.style.opacity = "0.5";


    // Simulated AI processing
    setTimeout(function () {

        loading.style.display = "none";

        analyzeBtn.disabled = false;

        analyzeBtn.style.opacity = "1";

        // Demo result
        const authenticityScore = Math.floor(
            Math.random() * (97 - 82 + 1) + 82
        );

        showResult(authenticityScore);

    }, 2500);

});


// ================================
// SHOW RESULT
// ================================

function showResult(authenticityScore) {

    score.textContent = authenticityScore;


    // Convert percentage to circle angle
    const angle = authenticityScore * 3.6;

    scoreCircle.style.background = `
        conic-gradient(
            #32d9ff ${angle}deg,
            #536fff ${angle}deg,
            #172333 ${angle}deg
        )
    `;


    if (authenticityScore >= 85) {

        // HUMAN VOICE
        risk.textContent = "LOW";

        risk.style.color = "#32ff9c";

        riskDot.style.background = "#32ff9c";

        riskDot.style.boxShadow =
            "0 0 15px #32ff9c";

        resultMessage.textContent =
            "✓ Likely Human Voice — No significant synthetic indicators detected.";

    }

    else if (authenticityScore >= 60) {

        // SUSPICIOUS
        risk.textContent = "MEDIUM";

        risk.style.color = "#ffd166";

        riskDot.style.background = "#ffd166";

        riskDot.style.boxShadow =
            "0 0 15px #ffd166";

        resultMessage.textContent =
            "⚠ Suspicious Voice — Some synthetic voice characteristics detected.";

    }

    else {

        // AI / DEEPFAKE
        risk.textContent = "HIGH";

        risk.style.color = "#ff4d6d";

        riskDot.style.background = "#ff4d6d";

        riskDot.style.boxShadow =
            "0 0 15px #ff4d6d";

        resultMessage.textContent =
            "🚨 Potential AI-generated voice detected.";

    }

}


// ================================
// NAVIGATION
// ================================

function scrollToAnalysis() {

    document
        .getElementById("analysis")
        .scrollIntoView({
            behavior: "smooth"
        });

}

function scrollToHow() {

    document
        .getElementById("how")
        .scrollIntoView({
            behavior: "smooth"
        });

}


// ================================
// SIMPLE LIVE WAVE EFFECT
// ================================

const scanner = document.querySelector(".scanner");

setInterval(function () {

    scanner.style.transform =
        "scale(" + (1 + Math.random() * 0.015) + ")";

}, 700);


// ================================
// SYSTEM STATUS
// ================================

console.log(
    "%c CLONE-CATCH SECURITY ENGINE ",
    "color:#32d9ff;font-size:18px;font-weight:bold;"
);

console.log(
    "Voice Security Interface Initialized."
);