
import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Mic, Star, Target } from 'lucide-react';

interface WalkthroughProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: "Bem-vindo ao Simulador de Excelência",
    description: "Prepare-se para elevar o padrão Ultragaz através de simulações interativas de última geração.",
    image: "/ap-1.jpg",
    icon: <Star className="text-yellow-400" size={32} />
  },
  {
    title: "Treinamento Nativo com IA",
    description: "Você conversará por voz com clientes simulados. Nossa IA avalia sua entonação, empatia e clareza em tempo real.",
    image: "/ap-2.jpg",
    icon: <Mic className="text-[#000fff]" size={32} />
  },
  {
    title: "Aprimore suas Competências",
    description: "Focaremos em 5 pilares: Empatia, Procedimento Operacional, Verificação de Pedido, Comunicação e Resolução de Problemas.",
    image: "/ap-3.jpg",
    icon: <Target className="text-blue-500" size={32} />
  }
];

export const Walkthrough: React.FC<WalkthroughProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col md:flex-row animate-in fade-in duration-500 overflow-hidden">
      {/* Lado da Imagem */}
      <div className="flex-1 relative overflow-hidden">
        <img 
          key={step.image}
          src={step.image} 
          alt="Treinamento" 
          className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out scale-105 animate-in fade-in zoom-in-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-white" />
      </div>

      {/* Lado do Conteúdo */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-20 bg-white relative z-10">
        <div className="max-w-md mx-auto w-full space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl shadow-sm">
              {step.icon}
            </div>
            <div className="h-1 w-12 bg-[#00C48C] rounded-full" />
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-tight">
              {step.title}
            </h2>
            <p className="text-xl text-gray-500 font-medium leading-relaxed">
              {step.description}
            </p>
          </div>

          <div className="pt-10 flex items-center justify-between">
            {/* Progress Dots */}
            <div className="flex gap-2">
              {STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-[#000fff]' : 'w-2 bg-gray-200'}`} 
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button 
                  onClick={prev}
                  className="flex items-center justify-center w-14 h-14 bg-gray-100 text-gray-400 rounded-2xl hover:bg-gray-200 hover:text-gray-600 transition-all active:scale-95 group"
                  title="Voltar"
                >
                  <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                </button>
              )}
              
              <button 
                onClick={next}
                className="flex items-center gap-3 bg-[#000fff] text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-[#000fff]/10 hover:bg-[#000fff]/90 transition-all active:scale-95 group"
              >
                {currentStep === STEPS.length - 1 ? "Começar Agora" : "Próximo"}
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
