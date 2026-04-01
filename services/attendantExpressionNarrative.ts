import type { SimulationResult } from '../types';

export type ExpressionDist = NonNullable<SimulationResult['attendantAnalysis']>['expressions'];

/** Rótulos alinhados ao relatório (Feliz, Neutro, Sério, Preocupado). */
const CAT: { key: keyof ExpressionDist; label: string }[] = [
  { key: 'happy', label: 'feliz' },
  { key: 'neutral', label: 'neutro' },
  { key: 'serious', label: 'sério' },
  { key: 'concerned', label: 'preocupado' },
];

/**
 * “Média” ponderada de valência (0–100% cada categoria → score ~[-1,1]).
 * Feliz pesa positivo; neutro levemente positivo; sério e preocupado puxam para negativo.
 */
export function inferOverallMoodFromExpressions(e: ExpressionDist): 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' {
  const v =
    (e.happy * 1 + e.neutral * 0.06 + e.serious * -0.48 + e.concerned * -0.95) / 100;
  if (v >= 0.17) return 'POSITIVE';
  if (v <= -0.17) return 'NEGATIVE';
  return 'NEUTRAL';
}

export function moodToPt(m: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'): string {
  if (m === 'POSITIVE') return 'Positivo';
  if (m === 'NEGATIVE') return 'Negativo';
  return 'Neutro';
}

export function describeExpressionDistributionPt(e: ExpressionDist): string {
  const h = Math.round(e.happy);
  const n = Math.round(e.neutral);
  const s = Math.round(e.serious);
  const c = Math.round(e.concerned);
  const mood = inferOverallMoodFromExpressions(e);

  const intro = `Na distribuição de expressões, as parcelas são: feliz ${h}%, neutro ${n}%, sério ${s}% e preocupado ${c}%. `;

  const ordered = CAT.map(({ key, label }) => ({ label, pct: Math.round(e[key]) })).sort((a, b) => b.pct - a.pct);
  const [d0, d1] = ordered;

  const middle =
    d0.pct === d1.pct
      ? `Há equilíbrio entre os sinais mais fortes (${d0.label} e ${d1.label}, ${d0.pct}% cada). `
      : `Predominam sinais ${d0.label} (${d0.pct}%), com contribuição relevante de ${d1.label} (${d1.pct}%). `;

  const closing =
    mood === 'POSITIVE'
      ? 'Esse conjunto coerente aponta humor geral mais positivo: tendência de cordialidade e abertura no contato com o cliente.'
      : mood === 'NEGATIVE'
      ? 'Esse conjunto coerente aponta humor geral mais contido ou tenso; reforçar escuta ativa e segurança na condução tende a equilibrar a percepção.'
      : 'Esse conjunto coerente aponta humor geral neutro: mistura de proximidade e sobriedade, típica de um atendimento profissional equilibrado.';

  return intro + middle + closing;
}

export function attendantNarrativeFromExpressions(
  e: ExpressionDist | undefined | null
): Pick<NonNullable<SimulationResult['attendantAnalysis']>, 'overallMood' | 'feedback'> | null {
  if (!e || typeof e.happy !== 'number') return null;
  return {
    overallMood: inferOverallMoodFromExpressions(e),
    feedback: describeExpressionDistributionPt(e),
  };
}
