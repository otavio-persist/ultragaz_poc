/**
 * Histórico de treinos salvos ao clicar em "Salvar e Voltar" (localStorage).
 */

import { Scenario, SimulationResult, ScenarioMood, ChatMessage } from '../types';

const STORAGE_KEY = 'ultragaz_training_history_v1';
const MAX_RECORDS = 150;

export interface SavedTrainingRecord {
  id: string;
  savedAt: string;
  userId: string;
  userName: string;
  storeId: string;
  storeName: string;
  scenarioId: string;
  scenarioTitle: string;
  scenarioDescription: string;
  /** Média Geral Ultragaz */
  mediaGeralUltragaz: number;
  /** Mapa de Competências (radar) */
  mapaCompetencias: { subject: string; val: number }[];
  /** Análise de Sentimento (humor inicial/final + evolução) */
  analiseSentimento: {
    initialMood: ScenarioMood;
    finalMood: ScenarioMood;
    sentimentEvolution: string;
  };
  feedbackGerenteVirtual: string;
  oportunidadesMelhoria: string;
  mapaSentimentoAtendente: SimulationResult['attendantAnalysis'] | null;
  dossieDialogo: Array<{
    role: string;
    content: string;
    suggestedResponse?: string;
    timestamp: string;
  }>;
  realTimePrediction?: SimulationResult['realTimePrediction'];
}

function tsFromMessage(m: ChatMessage): string {
  const t = m.timestamp as unknown as Date | string;
  if (t instanceof Date) return t.toISOString();
  if (typeof t === 'string') return t;
  try {
    return new Date(t as never).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function buildTrainingRecordFromResult(
  result: SimulationResult,
  scenario: Scenario | null
): SavedTrainingRecord {
  const id = `snap-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const dossieDialogo = (result.transcript || []).map((m) => ({
    role: m.role,
    content: m.content,
    suggestedResponse: m.suggestedResponse,
    timestamp: tsFromMessage(m),
  }));

  return {
    id,
    savedAt: new Date().toISOString(),
    userId: result.userId,
    userName: result.userName || '—',
    storeId: result.storeId,
    storeName: result.storeName,
    scenarioId: result.scenarioId,
    scenarioTitle: scenario?.title ?? result.scenarioTitle ?? '—',
    scenarioDescription: scenario?.description ?? '',
    mediaGeralUltragaz: result.score,
    mapaCompetencias: [
      { subject: 'Empatia', val: result.empathyScore ?? 0 },
      { subject: 'Procedimento', val: result.procedureScore ?? 0 },
      { subject: 'Verificação', val: result.verificationScore ?? 0 },
      { subject: 'Comunicação', val: result.communicationScore ?? 0 },
      { subject: 'Solução', val: result.solutionScore ?? 0 },
    ],
    analiseSentimento: {
      initialMood: result.initialMood,
      finalMood: result.finalMood,
      sentimentEvolution: result.sentimentEvolution || '',
    },
    feedbackGerenteVirtual: result.feedback || '',
    oportunidadesMelhoria: result.missingFeedback || '',
    mapaSentimentoAtendente: result.attendantAnalysis ?? null,
    dossieDialogo,
    realTimePrediction: result.realTimePrediction,
  };
}

export function appendTrainingRecord(record: SavedTrainingRecord): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const prev = loadTrainingHistory();
    const next = [record, ...prev].slice(0, MAX_RECORDS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('ultragaz-training-saved'));
  } catch (e) {
    console.warn('trainingHistoryStorage: não foi possível salvar', e);
  }
}

export function loadTrainingHistory(): SavedTrainingRecord[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedTrainingRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
