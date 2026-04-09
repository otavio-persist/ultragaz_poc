/**
 * Texto exibido quando a análise facial na nuvem está desligada (sem jargão técnico).
 * Use também para substituir mensagens antigas salvas em histórico/localStorage.
 */
export const ATTENDANT_VISION_OFF_MESSAGE_PT =
  'Os percentuais acima são referências visuais de apoio. interprete principalmente o diálogo, o feedback geral e as oportunidades de melhoria.';

export function sanitizeAttendantAnalysisFeedback(
  feedback: string | undefined | null
): string | undefined {
  if (feedback == null || typeof feedback !== 'string') return feedback ?? undefined;
  const legacy =
    feedback.includes('ENABLE_ATTENDANT_VISION') ||
    feedback.includes('Análise de câmera desativada para economizar quota');
  if (legacy) return ATTENDANT_VISION_OFF_MESSAGE_PT;
  return feedback;
}
