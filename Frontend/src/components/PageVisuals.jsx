import { useEffect, useRef } from "react";
import * as THREE from "three";

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function WebGLShader() {
  const canvasRef = useRef(null);
  const sceneRef = useRef({ scene: null, camera: null, renderer: null, mesh: null, uniforms: null, animationId: null });

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const refs = sceneRef.current;
    const vertexShader = `attribute vec3 position; void main() { gl_Position = vec4(position, 1.0); }`;
    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution; uniform float time; uniform float xScale;
      uniform float yScale; uniform float distortion;
      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
        float d = length(p) * distortion;
        float rx = p.x * (1.0 + d); float gx = p.x; float bx = p.x * (1.0 - d);
        float r = 0.05 / abs(p.y + sin((rx + time) * xScale) * yScale);
        float g = 0.05 / abs(p.y + sin((gx + time) * xScale) * yScale);
        float b = 0.05 / abs(p.y + sin((bx + time) * xScale) * yScale);
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `;
    refs.scene = new THREE.Scene();
    refs.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    refs.renderer.setClearColor(new THREE.Color(0x000000));
    refs.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1);
    refs.uniforms = {
      resolution: { value: [window.innerWidth, window.innerHeight] },
      time: { value: 0 }, xScale: { value: 1 }, yScale: { value: 0.5 }, distortion: { value: 0.05 },
    };
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
      -1, -1, 0, 1, -1, 0, -1, 1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0,
    ]), 3));
    refs.mesh = new THREE.Mesh(geometry, new THREE.RawShaderMaterial({ vertexShader, fragmentShader, uniforms: refs.uniforms, side: THREE.DoubleSide }));
    refs.scene.add(refs.mesh);
    const handleResize = () => {
      refs.renderer.setSize(window.innerWidth, window.innerHeight, false);
      refs.uniforms.resolution.value = [window.innerWidth, window.innerHeight];
    };
    const animate = () => {
      refs.uniforms.time.value += 0.01;
      refs.renderer.render(refs.scene, refs.camera);
      refs.animationId = requestAnimationFrame(animate);
    };
    handleResize();
    animate();
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(refs.animationId);
      window.removeEventListener("resize", handleResize);
      refs.scene.remove(refs.mesh);
      refs.mesh.geometry.dispose();
      refs.mesh.material.dispose();
      refs.renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 block h-full w-full" />;
}

export function LiquidButton({ className, children, ...props }) {
  return (
    <button className={cn(
      "relative inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/30 bg-white/10 px-10 text-sm font-medium text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),inset_0_-1px_1px_rgba(255,255,255,0.1),0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-transform duration-300 hover:scale-105 disabled:pointer-events-none disabled:opacity-50",
      className
    )} {...props}>
      <span className="pointer-events-none absolute inset-x-3 top-1 h-1/2 rounded-full bg-gradient-to-b from-white/40 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

export function WaveformMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <rect x="1" y="10" width="2.5" height="6" rx="1.25" fill="currentColor" />
      <rect x="6" y="5" width="2.5" height="16" rx="1.25" fill="currentColor" />
      <rect x="11" y="1" width="2.5" height="24" rx="1.25" fill="currentColor" />
      <rect x="16" y="7" width="2.5" height="12" rx="1.25" fill="currentColor" />
      <rect x="21" y="10" width="2.5" height="6" rx="1.25" fill="currentColor" />
    </svg>
  );
}

export function SiteNav({ onNavigate, onBack }) {
  return (
    <nav className="fixed left-0 right-0 top-0 z-30 flex items-center justify-between px-6 py-5 md:px-12">
      <button onClick={() => onNavigate("landing")} className="flex items-center gap-2 text-white">
        <WaveformMark />
        <span className="text-lg font-extrabold tracking-tight">VoxShield</span>
      </button>
      <div className="flex items-center gap-3 rounded-full border border-white/20 bg-black/35 px-4 py-2 text-xs text-white/70 shadow-lg backdrop-blur-xl md:gap-6 md:px-6 md:py-3 md:text-sm">
        <button onClick={() => onNavigate("test")} className="transition-colors hover:text-white">Test Now</button>
        <button onClick={() => onNavigate("how")} className="transition-colors hover:text-white">How it works</button>
        <a href="https://github.com/codepiyusss/VoxShield" className="hidden transition-colors hover:text-white sm:inline">GitHub</a>
      </div>
      {onBack && <button onClick={onBack} className="absolute right-4 top-20 text-xs text-white/50 hover:text-white md:right-12">Back</button>}
    </nav>
  );
}
