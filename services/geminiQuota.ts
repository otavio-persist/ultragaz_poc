/**
 * Detecção de limite de quota (429) nas chamadas REST do Gemini e backoff sugerido pela API.
 */

let restQuotaExceededSession = false;

export function markGeminiRestQuotaExceeded(): void {
  restQuotaExceededSession = true;
}

export function isGeminiRestQuotaExceeded(): boolean {
  return restQuotaExceededSession;
}

export function resetGeminiRestQuotaSessionFlag(): void {
  restQuotaExceededSession = false;
}

export function isGeminiQuotaError(error: unknown): boolean {
  const e = error as Record<string, unknown> | null;
  if (!e) return false;
  const status =
    e.status ??
    e.code ??
    (typeof e.error === 'object' && e.error !== null
      ? (e.error as { code?: number }).code
      : undefined);
  if (status === 429) return true;
  const msg =
    (typeof e.message === 'string' ? e.message : '') +
    (typeof (e.error as { message?: string })?.message === 'string'
      ? (e.error as { message: string }).message
      : '');
  return msg.includes('429') || /quota|RESOURCE_EXHAUSTED|rate limit/i.test(msg);
}

/** Retorna milissegundos para esperar antes de retry, se a API enviar RetryInfo. */
export function parseGeminiRetryAfterMs(error: unknown): number | null {
  try {
    const raw = JSON.stringify(error);
    const m = raw.match(/"retryDelay"\s*:\s*"(\d+)s"/i);
    if (m) return Math.min(120_000, (parseInt(m[1], 10) + 1) * 1000);
  } catch {
    /* ignore */
  }
  return null;
}

export async function sleepMs(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}
