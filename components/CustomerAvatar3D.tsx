import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ScenarioMood } from '../types';

interface CustomerAvatar3DProps {
  mood: ScenarioMood;
  isSpeaking: boolean;
  avatarUrl?: string;
}

export const CustomerAvatar3D: React.FC<CustomerAvatar3DProps> = ({ 
  mood, 
  isSpeaking, 
  avatarUrl 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<THREE.Mesh | null>(null);
  const ringsRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);

  const isSpeakingRef = useRef(isSpeaking);
  const moodRef = useRef(mood);
  const pulseRef = useRef(0);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
    moodRef.current = mood;
  }, [isSpeaking, mood]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Prevenir múltiplas inicializações
    if (isInitializedRef.current) {
      console.warn('⚠️ CustomerAvatar3D já foi inicializado, pulando...');
      return;
    }

    // Limpar qualquer canvas existente antes de criar novo
    const existingCanvas = containerRef.current.querySelector('canvas');
    if (existingCanvas) {
      containerRef.current.removeChild(existingCanvas);
    }

    // 1. Setup da Cena
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const width = containerRef.current.clientWidth || 400;
    const height = containerRef.current.clientHeight || 400;
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    
    // Garantir que não há canvas duplicado
    if (!containerRef.current.querySelector('canvas')) {
      containerRef.current.appendChild(renderer.domElement);
    }
    
    isInitializedRef.current = true;

    // 2. Interatividade (OrbitControls)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    // 3. Objeto Futurístico (Núcleo de IA)
    const group = new THREE.Group();
    
    // Núcleo Central (Esfera de Energia)
    const coreGeo = new THREE.IcosahedronGeometry(1, 15);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0xDA291C,
      emissive: 0xDA291C,
      emissiveIntensity: 0.5,
      shininess: 100,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    coreRef.current = core;
    group.add(core);

    // Esfera interna sólida
    const innerGeo = new THREE.SphereGeometry(0.7, 32, 32);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xFFC72C,
      emissive: 0xFFC72C,
      emissiveIntensity: 0.2,
      metalness: 0.9,
      roughness: 0.1
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerCore);

    // Anéis Orbitais
    const rings = new THREE.Group();
    const createRing = (radius: number, color: number, rotation: [number, number, number]) => {
      const ringGeo = new THREE.TorusGeometry(radius, 0.02, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.set(...rotation);
      return ring;
    };

    rings.add(createRing(1.4, 0xDA291C, [Math.PI/2, 0, 0]));
    rings.add(createRing(1.6, 0xFFC72C, [0, Math.PI/4, 0]));
    rings.add(createRing(1.8, 0xFFFFFF, [Math.PI/4, Math.PI/4, 0]));
    ringsRef.current = rings;
    group.add(rings);

    // Partículas (Digital Aura)
    const partCount = 500;
    const partGeo = new THREE.BufferGeometry();
    const partPos = new Float32Array(partCount * 3);
    for(let i=0; i<partCount*3; i++) partPos[i] = (Math.random() - 0.5) * 5;
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    const partMat = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.02, transparent: true, opacity: 0.5 });
    const particles = new THREE.Points(partGeo, partMat);
    particlesRef.current = particles;
    group.add(particles);

    scene.add(group);

    // Luzes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xDA291C, 2, 10);
    pointLight.position.set(2, 2, 2);
    scene.add(pointLight);

    setIsLoading(false);

    // 4. Loop de Animação
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      
      animationFrameRef.current = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      // Reação ao Áudio (Vibração Futurística)
      const targetPulse = isSpeakingRef.current ? 0.3 + Math.random() * 0.4 : 0;
      pulseRef.current += (targetPulse - pulseRef.current) * 0.15;

      if (coreRef.current) {
        // Escala pulsa com a fala
        const s = 1 + pulseRef.current;
        coreRef.current.scale.set(s, s, s);
        coreRef.current.rotation.y += 0.01 + pulseRef.current * 0.1;
        
        // Cor muda conforme humor
        if (moodRef.current === ScenarioMood.ANGRY) {
          (coreRef.current.material as THREE.MeshPhongMaterial).color.setHex(0xFF0000);
        } else if (moodRef.current === ScenarioMood.CALM) {
          (coreRef.current.material as THREE.MeshPhongMaterial).color.setHex(0x00FF00);
        } else {
          (coreRef.current.material as THREE.MeshPhongMaterial).color.setHex(0xDA291C);
        }
      }

      if (ringsRef.current) {
        ringsRef.current.children.forEach((ring, i) => {
          ring.rotation.x += 0.01 * (i + 1);
          ring.rotation.z += 0.005 * (i + 1);
          // Anéis vibram com a fala
          ring.scale.setScalar(1 + pulseRef.current * 0.05);
        });
      }

      if (particlesRef.current) {
        particlesRef.current.rotation.y -= 0.001;
        // Partículas "saltam" com a fala
        particlesRef.current.scale.setScalar(1 + pulseRef.current * 0.1);
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    animate();

    // Resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      // Limpeza completa
      isInitializedRef.current = false;
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      window.removeEventListener('resize', handleResize);
      
      // Limpar controls
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      
      // Remover canvas do DOM
      if (containerRef.current) {
        const canvas = containerRef.current.querySelector('canvas');
        if (canvas) {
          containerRef.current.removeChild(canvas);
        }
      }
      
      // Dispose do renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      
      // Limpar referências
      sceneRef.current = null;
      cameraRef.current = null;
      coreRef.current = null;
      ringsRef.current = null;
      particlesRef.current = null;
    };
  }, []); // Sem dependências - inicializa apenas uma vez

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] flex items-center justify-center relative bg-gray-950 overflow-hidden cursor-grab active:cursor-grabbing">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${isSpeaking ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]' : 'bg-[#00C48C]'}`} />
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">IA Core Neural Interface</span>
        </div>
      </div>
      
      {isLoading && (
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="w-12 h-12 border-4 border-[#000fff] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#000fff] font-black text-xs uppercase tracking-widest">Iniciando Core...</p>
        </div>
      )}

      {/* Instrução de Interação */}
      <div className="absolute bottom-6 right-6 text-white/20 text-[8px] font-black uppercase tracking-widest pointer-events-none">
        Arraste para rotacionar • Scroll para Zoom
      </div>
    </div>
  );
};
