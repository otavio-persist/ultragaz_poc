/**
 * Remove artefatos comuns da transcrição em tempo real (ex.: tokens de controle do modelo).
 */

export function sanitizeLiveTranscriptionText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<ctrl\d+>/gi, '')
    .replace(/<\/ctrl\d+>/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function sanitizeChatMessages<T extends { content: string; suggestedResponse?: string }>(
  messages: T[]
): T[] {
  return messages.map((m) => {
    const content = sanitizeLiveTranscriptionText(m.content);
    const sug = m.suggestedResponse !== undefined ? sanitizeLiveTranscriptionText(m.suggestedResponse || '') : undefined;
    return {
      ...m,
      content,
      ...(m.suggestedResponse !== undefined ? { suggestedResponse: sug || undefined } : {}),
    };
  });
}
