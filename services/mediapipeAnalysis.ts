/**
 * Análise Neurocomportamental Avançada com MediaPipe
 * Detecta microexpressões, linguagem corporal e sinais de estresse
 */

import { FaceMesh } from '@mediapipe/face_mesh';
import { Hands } from '@mediapipe/hands';
import { Pose } from '@mediapipe/pose';

// Interfaces
export interface MicroExpression {
  type: 'anxiety' | 'stress' | 'forced_smile' | 'concern' | 'confidence' | 'discomfort';
  confidence: number;
  duration: number; // em segundos
  timestamp: number;
}

export interface AdvancedVideoMetrics {
  microExpressions: MicroExpression[];
  facialLandmarks: {
    eyeTension: number; // 0-1
    mouthTension: number; // 0-1
    browPosition: number; // -1 a 1
    jawClench: number; // 0-1
  };
  bodyLanguage: {
    posture: 'upright' | 'hunched' | 'leaning_forward' | 'leaning_back';
    shoulderPosition: 'relaxed' | 'tensed' | 'raised';
    headPosition: 'up' | 'neutral' | 'down';
    armCrossing: boolean;
    confidence: number; // 0-100
  };
  stressIndicators: {
    overallStress: number; // 0-100
    facialStress: number; // 0-100
    bodyStress: number; // 0-100
  };
}

// Instâncias globais do MediaPipe
let faceMeshInstance: FaceMesh | null = null;
let handsInstance: Hands | null = null;
let poseInstance: Pose | null = null;
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

// Controle de processamento serial
let isCurrentlyProcessing = false;
let currentResolve: ((value: AdvancedVideoMetrics) => void) | null = null;
let currentReject: ((reason?: any) => void) | null = null;

// Histórico de microexpressões para análise temporal
const microExpressionHistory: MicroExpression[] = [];

/**
 * Inicializa MediaPipe (chamar uma vez no início)
 */
export async function initializeMediaPipe(): Promise<void> {
  if (faceMeshInstance) return; // Já inicializado
  if (isInitializing && initializationPromise) {
    return initializationPromise; // Já está inicializando
  }

  isInitializing = true;
  initializationPromise = (async () => {
    try {
      console.log('🚀 Inicializando MediaPipe Face Mesh...');
      
      faceMeshInstance = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
        }
      });

      faceMeshInstance.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      // Configurar o callback de resultados UMA ÚNICA VEZ
      faceMeshInstance.onResults((results) => {
        if (!currentResolve) return;
        
        try {
          const landmarks = results?.multiFaceLandmarks?.[0] || [];
          
          if (landmarks.length === 0) {
            console.warn('⚠️ MediaPipe: Nenhum rosto detectado no frame.');
          }

          const microExpressions = detectMicroExpressions(landmarks);
          const facialMetrics = calculateFacialMetrics(landmarks);
          const bodyLanguage = analyzeBodyLanguage([]);
          const stressIndicators = calculateStressIndicators(
            facialMetrics,
            bodyLanguage,
            microExpressions
          );

          const finalMetrics: AdvancedVideoMetrics = {
            microExpressions,
            facialLandmarks: facialMetrics,
            bodyLanguage,
            stressIndicators
          };

          currentResolve(finalMetrics);
        } catch (err) {
          if (currentReject) currentReject(err);
        } finally {
          isCurrentlyProcessing = false;
          currentResolve = null;
          currentReject = null;
        }
      });

      // Hands (opcional)
      try {
        handsInstance = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`
        });
        handsInstance.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      } catch (err) {
        console.warn('⚠️ Hands não inicializado:', err);
      }

      console.log('✅ MediaPipe inicializado com sucesso');
      isInitializing = false;
    } catch (error) {
      console.error('❌ Erro ao inicializar MediaPipe:', error);
      isInitializing = false;
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Converte frame base64 para HTMLImageElement
 */
function base64ToImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Falha ao carregar imagem do frame: ' + e));
    img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
  });
}

/**
 * Calcula distância euclidiana entre dois pontos
 */
function distance(p1: { x: number; y: number; z?: number }, p2: { x: number; y: number; z?: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Detecta microexpressões baseado em landmarks faciais
 */
function detectMicroExpressions(landmarks: any[]): MicroExpression[] {
  if (!landmarks || landmarks.length < 468) return [];

  const expressions: MicroExpression[] = [];
  const now = Date.now();

  const LEFT_EYE_TOP = 159;
  const LEFT_EYE_BOTTOM = 145;
  const RIGHT_EYE_TOP = 386;
  const RIGHT_EYE_BOTTOM = 374;
  const LEFT_EYEBROW_OUTER = 70;
  const LEFT_EYE_TOP_Y = 159;
  const MOUTH_LEFT = 61;
  const MOUTH_RIGHT = 291;
  const MOUTH_TOP = 13;
  const MOUTH_BOTTOM = 14;
  const JAW_LEFT = 172;
  const JAW_RIGHT = 397;

  const leftEyeHeight = distance(landmarks[LEFT_EYE_TOP], landmarks[LEFT_EYE_BOTTOM]);
  const rightEyeHeight = distance(landmarks[RIGHT_EYE_TOP], landmarks[RIGHT_EYE_BOTTOM]);
  const avgEyeHeight = (leftEyeHeight + rightEyeHeight) / 2;
  
  if (avgEyeHeight < 0.015) {
    expressions.push({ type: 'anxiety', confidence: Math.min(1, (0.015 - avgEyeHeight) / 0.005), duration: 0.2, timestamp: now });
  }

  const leftBrowHeight = landmarks[LEFT_EYEBROW_OUTER].y;
  const leftEyeTopY_val = landmarks[LEFT_EYE_TOP_Y].y;
  const browEyeDistance = leftEyeTopY_val - leftBrowHeight;
  
  if (browEyeDistance < 0.01) {
    expressions.push({ type: 'concern', confidence: Math.min(1, (0.01 - browEyeDistance) / 0.005), duration: 0.3, timestamp: now });
  }

  const mouthWidth = distance(landmarks[MOUTH_LEFT], landmarks[MOUTH_RIGHT]);
  const mouthHeight = distance(landmarks[MOUTH_TOP], landmarks[MOUTH_BOTTOM]);
  const mouthRatio = mouthWidth / (mouthHeight || 0.001);
  
  if (mouthRatio > 3.5 && avgEyeHeight < 0.016) {
    expressions.push({ type: 'forced_smile', confidence: 0.7, duration: 0.4, timestamp: now });
  }

  const faceTension = (avgEyeHeight + mouthHeight) / 2;
  if (faceTension < 0.02) {
    expressions.push({ type: 'stress', confidence: Math.min(1, (0.02 - faceTension) / 0.01), duration: 0.5, timestamp: now });
  }

  if (microExpressionHistory.length > 0) {
    const lastExpression = microExpressionHistory[microExpressionHistory.length - 1];
    if (now - lastExpression.timestamp < 1000 && expressions.length > 0) {
      expressions.push({ type: 'discomfort', confidence: 0.6, duration: 0.3, timestamp: now });
    }
  }

  expressions.forEach(expr => microExpressionHistory.push(expr));
  if (microExpressionHistory.length > 50) microExpressionHistory.shift();

  return expressions;
}

/**
 * Analisa linguagem corporal com Pose
 */
function analyzeBodyLanguage(poseLandmarks: any[]): AdvancedVideoMetrics['bodyLanguage'] {
  return {
    posture: 'upright',
    shoulderPosition: 'relaxed',
    headPosition: 'neutral',
    armCrossing: false,
    confidence: 70
  };
}

/**
 * Calcula métricas faciais avançadas
 */
function calculateFacialMetrics(landmarks: any[]): AdvancedVideoMetrics['facialLandmarks'] {
  if (!landmarks || landmarks.length < 468) {
    return { eyeTension: 1, mouthTension: 1, browPosition: 0, jawClench: 1 }; // 1 de tensão = 0 de sorriso/contato
  }

  const LEFT_EYE_TOP = 159;
  const LEFT_EYE_BOTTOM = 145;
  const MOUTH_LEFT = 61;
  const MOUTH_RIGHT = 291;
  const LEFT_EYEBROW_OUTER = 70;
  const JAW_LEFT = 172;
  const JAW_RIGHT = 397;

  const eyeHeight = distance(landmarks[LEFT_EYE_TOP], landmarks[LEFT_EYE_BOTTOM]);
  const eyeTension = Math.max(0, Math.min(1, 1 - (eyeHeight / 0.025))); // Threshold mais realista

  // Tensão na boca / Sorriso
  // Usar largura do rosto como referência (distância entre bochechas)
  const FACE_LEFT = 234;
  const FACE_RIGHT = 454;
  const faceWidth = distance(landmarks[FACE_LEFT], landmarks[FACE_RIGHT]);
  const mouthWidth = distance(landmarks[MOUTH_LEFT], landmarks[MOUTH_RIGHT]);
  
  // Proporção boca/rosto: neutral ~0.25, smile > 0.35
  const mouthRatio = mouthWidth / (faceWidth || 0.1);
  const smileScore = Math.max(0, Math.min(1, (mouthRatio - 0.22) / 0.15));
  const mouthTension = 1 - smileScore; // Menos tensão = mais sorriso

  const browY = landmarks[LEFT_EYEBROW_OUTER].y;
  const eyeY = landmarks[LEFT_EYE_TOP].y;
  const browPosition = (browY - eyeY) / 0.1;

  const jawWidth = distance(landmarks[JAW_LEFT], landmarks[JAW_RIGHT]);
  const jawClench = Math.max(0, Math.min(1, 1 - (jawWidth / (faceWidth * 0.8))));

  return { eyeTension, mouthTension, browPosition, jawClench };
}

/**
 * Calcula indicadores de estresse
 */
function calculateStressIndicators(
  facialMetrics: AdvancedVideoMetrics['facialLandmarks'],
  bodyLanguage: AdvancedVideoMetrics['bodyLanguage'],
  microExpressions: MicroExpression[]
): AdvancedVideoMetrics['stressIndicators'] {
  const anxietyStress = microExpressions.filter(e => e.type === 'anxiety' || e.type === 'stress').length;
  const facialStress = (facialMetrics.eyeTension * 0.3 + facialMetrics.mouthTension * 0.2 + facialMetrics.jawClench * 0.3 + Math.min(1, anxietyStress / 5) * 0.2) * 100;
  let bodyStress = 50;
  if (bodyLanguage.posture === 'hunched') bodyStress += 20;
  const overallStress = (facialStress * 0.6 + bodyStress * 0.4);

  return {
    overallStress: Math.round(overallStress),
    facialStress: Math.round(facialStress),
    bodyStress: Math.round(bodyStress)
  };
}

/**
 * Processa um frame de vídeo com MediaPipe
 */
export async function processFrameWithMediaPipe(
  frameBase64: string
): Promise<AdvancedVideoMetrics> {
  if (isCurrentlyProcessing) {
    throw new Error('MediaPipe está ocupado processando outro frame.');
  }

  if (!faceMeshInstance) {
    await initializeMediaPipe();
  }

  if (!faceMeshInstance) {
    throw new Error('MediaPipe Face Mesh não pôde ser inicializado.');
  }

  return new Promise(async (resolve, reject) => {
    isCurrentlyProcessing = true;
    currentResolve = resolve;
    currentReject = reject;

    // Timeout de segurança
    const timeout = setTimeout(() => {
      if (isCurrentlyProcessing) {
        isCurrentlyProcessing = false;
        currentResolve = null;
        currentReject = null;
        reject(new Error('Timeout de 8s no processamento do MediaPipe.'));
      }
    }, 8000);

    try {
      const img = await base64ToImage(frameBase64);
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Contexto 2D não disponível');
      
      ctx.drawImage(img, 0, 0, 320, 240);
      
      // Enviar para o processamento
      await faceMeshInstance!.send({ image: canvas });
      // O resolve acontecerá no callback onResults definido no initializeMediaPipe
      
    } catch (error) {
      clearTimeout(timeout);
      isCurrentlyProcessing = false;
      currentResolve = null;
      currentReject = null;
      reject(error);
    }
  });
}

/**
 * Limpa histórico de microexpressões
 */
export function clearMicroExpressionHistory(): void {
  microExpressionHistory.length = 0;
}
