import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Chave do Gemini no browser: só existe no bundle se injetada no build.
 * Netlify costuma expor GEMINI_API_KEY (sem VITE_); o Vite não coloca isso em import.meta.env sozinho.
 */
function resolveGeminiKey(mode: string): string {
  const env = loadEnv(mode, process.cwd(), '');
  return (
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    env.VITE_GEMINI_API_KEY ||
    env.GEMINI_API_KEY ||
    ''
  ).trim();
}

export default defineConfig(({ mode }) => {
  const geminiKey = resolveGeminiKey(mode);

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      __GEMINI_API_KEY_BUILD__: JSON.stringify(geminiKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
