import React from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

interface TrainingUnavailableProps {
  onBack: () => void;
  scenarioTitle?: string;
}

/**
 * Exibido quando não há chave Gemini ou configuração inválida — sem avatar/vídeo de simulação.
 */
export const TrainingUnavailable: React.FC<TrainingUnavailableProps> = ({ onBack, scenarioTitle }) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-6 py-12">
      <div className="w-full max-w-lg rounded-[40px] border border-gray-200 bg-white p-10 shadow-xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#000fff]/10 text-[#000fff]">
          <ShieldAlert className="h-9 w-9" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
          Simulador indisponível
        </h1>
        {scenarioTitle && (
          <p className="text-sm font-bold text-gray-500 mb-4">
            Cenário: <span className="text-gray-800">{scenarioTitle}</span>
          </p>
        )}
        <p className="text-gray-600 font-medium leading-relaxed mb-2">
          Não foi possível carregar o treinamento com IA. A configuração da API pode estar ausente,
          inválida ou o serviço foi bloqueado.
        </p>
        <p className="text-gray-900 font-bold text-sm mb-8">
          Entre em contato com os administradores da Ultragaz para liberar ou corrigir o acesso.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#000fff] text-white font-black text-sm uppercase tracking-widest hover:bg-[#000fff]/90 transition-all shadow-lg shadow-[#000fff]/20"
        >
          <ArrowLeft size={20} />
          Voltar ao painel
        </button>
      </div>
    </div>
  );
};
