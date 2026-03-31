type ImportMetaEnvLike = Record<string, string | boolean | undefined>;

function readViteEnv(): ImportMetaEnvLike | undefined {
  try {
    return (import.meta as any)?.env as ImportMetaEnvLike | undefined;
  } catch {
    return undefined;
  }
}

function readNodeEnv(): Record<string, string | undefined> | undefined {
  try {
    return (globalThis as any)?.process?.env as Record<string, string | undefined> | undefined;
  } catch {
    return undefined;
  }
}

export function getGeminiApiKey(): string | undefined {
  const viteEnv = readViteEnv();
  const nodeEnv = readNodeEnv();

  return (
    (viteEnv?.VITE_GEMINI_API_KEY as string | undefined) ||
    (viteEnv?.VITE_API_KEY as string | undefined) ||
    nodeEnv?.VITE_GEMINI_API_KEY ||
    nodeEnv?.VITE_API_KEY ||
    nodeEnv?.GEMINI_API_KEY ||
    nodeEnv?.API_KEY
  );
}
