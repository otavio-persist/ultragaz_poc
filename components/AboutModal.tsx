
import React, { useState } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  Globe, 
  Video, 
  Mic, 
  BrainCircuit, 
  Layout as LayoutIcon 
} from 'lucide-react';

interface Slide {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: string[];
  color: string;
}

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slides: Slide[] = [
    {
      title: "Tecnologias de Ponta",
      subtitle: "O core do nosso sistema robusto",
      icon: <Cpu className="text-blue-500" size={48} />,
      color: "bg-blue-50",
      content: [
        "React 19 & TypeScript: Interface ultra-rápida e segura",
        "Google Gemini Multimodal: IA avançada para texto, voz e visão",
        "MediaPipe: Visão computacional de alta performance no navegador",
        "Vite: Build de próxima geração para carregamento instantâneo",
        "Tailwind CSS: Design moderno, responsivo e elegante"
      ]
    },
    {
      title: "Reconhecimento Facial IA",
      subtitle: "Análise comportamental em tempo real",
      icon: <Video className="text-[#000fff]" size={48} />,
      color: "bg-[#000fff]/10",
      content: [
        "Detecção de Sorriso: MediaPipe Face Mesh (Mouth Ratio Analysis)",
        "Contato Visual: MediaPipe Face Mesh (Eye Tension Tracking)",
        "Micro-expressões: MediaPipe (Temporal Landmark Analysis)",
        "Análise de Postura: MediaPipe Pose (Neural Network)",
        "Processamento Local: WASM (WebAssembly) para privacidade total"
      ]
    },
    {
      title: "Inteligência de Voz",
      subtitle: "Comunicação clara e empática",
      icon: <Mic className="text-yellow-500" size={48} />,
      color: "bg-yellow-50",
      content: [
        "Análise de Prosódia: FFT (Fast Fourier Transform) & Audio API",
        "Transcrição: Google Gemini 2.0 Flash Multimodal Live",
        "Detecção de Emoção: Redes Neurais via Google Gemini AI",
        "Sugestões de Excelência: RAG (Retrieval-Augmented Generation)",
        "Processamento: Stream Binário (PCM 16bit / 24kHz)"
      ]
    },
    {
      title: "Orquestrador de Agentes",
      subtitle: "Múltiplas IAs trabalhando para você",
      icon: <BrainCircuit className="text-orange-500" size={48} />,
      color: "bg-orange-50",
      content: [
        "Agente Cliente: Personalidade dinâmica e reativa (Gemini 2.5 Flash)",
        "Agente Evaluator: Auditoria técnica de cada frase em tempo real",
        "Agente Coach: Orientações imediatas baseadas em falhas detectadas",
        "Fila Serial: Processamento inteligente que evita conflitos de IA",
        "Memória de Curto Prazo: Agentes que lembram de todo o contexto"
      ]
    },
    {
      title: "Vantagens Estratégicas",
      subtitle: "Treinamento que gera resultados",
      icon: <Zap className="text-green-500" size={48} />,
      color: "bg-green-50",
      content: [
        "Coaching Adaptativo: Dicas que mudam conforme o humor do cliente",
        "Predição de Performance: Score previsto durante o atendimento",
        "Dossiê Completo: Relatório detalhado após cada sessão",
        "Redução de Turn-over: Funcionários mais confiantes e preparados",
        "Escalabilidade: Treine milhares simultaneamente em qualquer lugar"
      ]
    },
    {
      title: "Qualidade Ultragaz",
      subtitle: "Inovação para a Experiência do Cliente",
      icon: <BrainCircuit className="text-purple-500" size={48} />,
      color: "bg-purple-50",
      content: [
        "UX Premium: Interface Dark Mode moderna e intuitiva",
        "Gamificação: Engajamento real dos atendentes",
        "Dashboards de Gestão: Visão clara do progresso da equipe",
        "Segurança Total: Dados processados com as melhores práticas",
        "Foco no Cliente: O sistema que entende o que o cliente sente"
      ]
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] animate-in slide-in-from-bottom-8 duration-500">
        
        {/* Lado Esquerdo: Imagem/Ícone e Título */}
        <div className={`md:w-1/3 p-12 flex flex-col items-center justify-center text-center transition-colors duration-500 ${slides[currentSlide].color}`}>
          <div className="mb-6 animate-bounce">
            {slides[currentSlide].icon}
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-tight mb-4">
            {slides[currentSlide].title}
          </h2>
          <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">
            {slides[currentSlide].subtitle}
          </p>
          
          {/* Indicadores de Slide */}
          <div className="flex gap-2 mt-12">
            {slides.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-gray-900' : 'w-2 bg-gray-300'}`}
              />
            ))}
          </div>
        </div>

        {/* Lado Direito: Conteúdo e Navegação */}
        <div className="flex-1 p-12 flex flex-col relative bg-white">
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex-1 flex flex-col justify-center">
            <ul className="space-y-6">
              {slides[currentSlide].content.map((item, i) => (
                <li key={i} className="flex items-start gap-4 animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="mt-1 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                    <ChevronRight size={14} className="text-white" />
                  </div>
                  <span className="text-lg font-medium text-gray-700 leading-snug">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between mt-12">
            <button 
              onClick={prevSlide}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
            >
              <ChevronLeft size={20} /> Anterior
            </button>
            <button 
              onClick={nextSlide}
              className="flex items-center gap-2 px-8 py-4 bg-[#000fff] text-white font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-[#000fff]/90 transition-all shadow-xl shadow-[#000fff]/10 active:scale-95"
            >
              Próximo <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

