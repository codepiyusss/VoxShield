import { useEffect, useRef, useState } from "react";
import { LiquidButton, SiteNav, WebGLShader } from "./PageVisuals.jsx";

function SiriWaveform({ active }) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!active) { setLevel(0); return undefined; }
    let context; let stream; let frameId;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        context = new AudioContext();
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        context.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const animate = () => {
          analyser.getByteTimeDomainData(data);
          const volume = data.reduce((sum, value) => sum + Math.abs(value - 128), 0) / data.length / 128;
          setLevel(Math.min(volume * 4, 1));
          frameId = requestAnimationFrame(animate);
        };
        animate();
      } catch { setLevel(0.08); }
    };
    start();
    return () => { cancelAnimationFrame(frameId); stream?.getTracks().forEach((track) => track.stop()); context?.close(); };
  }, [active]);

  return (
    <div className="relative flex h-48 w-full items-center justify-center overflow-hidden" aria-label="Siri-style audio waveform">
      <div className="absolute h-20 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
      <div className="absolute h-12 w-80 rounded-full bg-blue-400/25 blur-2xl" />
      <div className="flex w-full max-w-lg items-center justify-center gap-0.5">
        {Array.from({ length: 72 }, (_, index) => {
          const distance = Math.abs(index - 36) / 36;
          const wave = Math.sin(index * 0.75) * 0.18 + 0.82;
          const height = 3 + (1 - distance) * (active ? 12 + level * 90 : 9) * wave;
          return <span key={index} className="w-1 rounded-full bg-gradient-to-t from-blue-400 via-fuchsia-400 to-emerald-300 transition-[height] duration-75" style={{ height: `${height}px` }} />;
        })}
      </div>
    </div>
  );
}

// CONNECT BACKEND: points at your deployed Flask backend.
const BACKEND_URL = "https://voxshield-dnck.onrender.com/predict";

// Converts any recorded audio Blob into a plain WAV file, entirely in
// the browser. This matters because MediaRecorder saves recordings as
// webm/opus, which the backend's librosa cannot decode without ffmpeg
// (not available on the free hosting tier). Uploaded files already
// work because they're typically already wav/mp3. Converting to WAV
// here means the backend only ever receives a format it can always read.
async function convertBlobToWav(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const numChannels = 1; // mono is enough for voice analysis
  const sampleRate = audioBuffer.sampleRate;
  const samples = audioBuffer.getChannelData(0);

  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  audioContext.close();
  return new Blob([buffer], { type: "audio/wav" });
}

export default function TestNowPage({ onBack, onNavigate }) {
  const [recording, setRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null); // { label: "REAL" | "FAKE", confidence: number }
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordedBlobRef = useRef(null);

  const toggleRecording = async () => {
    setError("");
    setResult(null);
    if (recording) { recorderRef.current?.stop(); setRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        recordedBlobRef.current = blob;
        setRecordedAudio(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start(); recorderRef.current = recorder; setRecording(true);
    } catch { setError("Microphone access is needed to record your voice."); }
  };

  useEffect(() => () => { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); if (recordedAudio) URL.revokeObjectURL(recordedAudio); }, [recordedAudio]);

  const handleUpload = (event) => {
    setResult(null);
    setUploadedFile(event.target.files?.[0] || null);
  };

  const analyze = async () => {
    const isRecording = !uploadedFile && recordedBlobRef.current;
    if (!uploadedFile && !recordedBlobRef.current) return;

    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      let audioSource;
      let filename;

      if (isRecording) {
        // Convert the webm recording to WAV so the backend can read it
        audioSource = await convertBlobToWav(recordedBlobRef.current);
        filename = "recording.wav";
      } else {
        audioSource = uploadedFile;
        filename = uploadedFile.name;
      }

      const formData = new FormData();
      formData.append("audio", audioSource, filename);

      const response = await fetch(BACKEND_URL, { method: "POST", body: formData });

      if (!response.ok) {
        throw new Error("Backend returned an error");
      }

      const data = await response.json();
      setResult({ label: data.result, confidence: data.confidence });
    } catch {
      setError("Could not reach the VoxShield backend. Make sure it's running and reachable.");
    } finally {
      setAnalyzing(false);
    }
  };

  const isFake = result?.label === "FAKE";
  const isReal = result?.label === "REAL";

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black">
      <SiteNav onNavigate={onNavigate} onBack={onBack} />
      <WebGLShader />
      <main className="relative z-10 flex w-full max-w-3xl flex-1 items-center justify-center px-6 py-28">
        <div className="w-full rounded-[1.75rem] border border-white/15 bg-black/25 p-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <section className="rounded-[1.25rem] border border-white/15 bg-white/[0.03] px-6 py-10 md:px-12">
            <p className="mb-4 text-center text-xs uppercase tracking-[0.3em] text-green-400">Voice security check</p>
            <h1 className="font-display text-center text-5xl text-white md:text-7xl">Test your audio</h1>
            <p className="mx-auto mt-5 max-w-xl text-center text-sm text-white/60 md:text-base">Speak naturally or upload a sample to prepare it for Voxshield&apos;s AI voice analysis.</p>
            <div className="mt-8 rounded-[1.25rem] border border-white/10 bg-black/30 px-4 py-2">
              <SiriWaveform active={recording} />
              <p className="text-center text-sm text-white/50">{recording ? "Listening... speak naturally" : "Press record and speak for a few seconds"}</p>
              <div className="mt-6 flex justify-center"><LiquidButton onClick={toggleRecording} className={recording ? "border-red-300/50 bg-red-400/10" : ""}><span className={`h-2.5 w-2.5 rounded-full ${recording ? "bg-red-400" : "bg-white"}`} />{recording ? "Stop recording" : "Start recording"}</LiquidButton></div>
              {recordedAudio && !recording && <audio className="mx-auto mt-6 w-full max-w-sm" controls src={recordedAudio}>Your browser does not support audio playback.</audio>}
              {error && <p className="mt-4 text-center text-sm text-red-300">{error}</p>}
            </div>
            <div className="my-7 flex items-center gap-4 text-xs text-white/35"><span className="h-px flex-1 bg-white/10" />OR<span className="h-px flex-1 bg-white/10" /></div>
            <label className="flex cursor-pointer items-center justify-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-6 py-4 text-sm text-white/75 transition-colors hover:border-white/35 hover:bg-white/[0.08]">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {uploadedFile ? uploadedFile.name : "Upload audio file instead"}
              <input type="file" accept="audio/*" className="hidden" onChange={handleUpload} />
            </label>
            <p className="mt-3 text-center text-xs text-white/35">MP3, WAV, M4A or WEBM · up to 25 MB</p>
            <div className="mt-8 flex justify-center">
              <LiquidButton
                onClick={analyze}
                disabled={(!recordedAudio && !uploadedFile) || analyzing}
                className="border-green-300/40 bg-green-400/10"
              >
                {analyzing ? "Analyzing..." : "Analyze"}
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true"><path fill="currentColor" d="M12.943 3.463A.748.748 0 0012.25 3h-5.5a.75.75 0 000 1.5h3.69l-7.22 7.22a.75.75 0 101.06 1.06l7.22-7.22v3.69a.75.75 0 001.5 0v-5.5a.747.747 0 00-.057-.287z" /></svg>
              </LiquidButton>
            </div>

            {result && (
              <div className={`mt-8 rounded-2xl border p-5 text-center ${isFake ? "border-red-300/25 bg-red-400/10" : "border-emerald-300/25 bg-emerald-400/10"}`}>
                <p className={`text-xs uppercase tracking-[0.25em] ${isFake ? "text-red-300" : "text-emerald-300"}`}>
                  {isReal ? "Likely a real human voice" : isFake ? "Likely an AI-generated voice" : "Result unavailable"}
                </p>
                <p className="mt-3 font-display text-5xl text-white">{result.confidence}%</p>
                <p className={`mt-1 text-sm ${isFake ? "text-red-200" : "text-emerald-200"}`}>Confidence</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
