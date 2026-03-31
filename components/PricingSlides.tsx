import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

type PricingSlidesProps = {
  onExit: () => void;
};

type SlideContent = {
  title: string;
  subtitle?: string;
  bullets: string[];
  highlight?: string;
};

const PricingSlides: React.FC<PricingSlidesProps> = ({ onExit }) => {
  const { language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slidesByLang: Record<string, SlideContent[]> = useMemo(
    () => ({
      pt: [
        {
          title: 'Por que precisamos evoluir a forma de treinar?',
          subtitle: 'Problema',
          bullets: [
            'Hoje, a criação de treinamentos é lenta e dependente de múltiplos times',
            'Difícil de padronizar entre mercados',
            'Pouco escalável: cada novo cenário exige esforço manual',
            'Limitada em personalização e simulação real',
          ],
          highlight:
            'Experiência é driver de valor — impacta percepção do cliente e resultados',
        },
        {
          title: 'Plataforma de Treinamento com IA',
          subtitle: 'Solução',
          bullets: [
            'Criar, executar e escalar treinamentos de forma automatizada com IA',
            'Simulações realistas de atendimento',
            'Feedback instantâneo',
            'Criação de conteúdo via prompt',
            'Alinhamento com o guidebook da marca',
          ],
          highlight: 'Do treinamento estático ao dinâmico e adaptativo',
        },
        {
          title: 'Criação de treinamentos com um simples prompt',
          subtitle: 'Feature principal',
          bullets: [
            'O time descreve o contexto — ex.: “Cliente irritado no drive-thru por item faltando”',
            'A plataforma gera: contexto do cenário e perfil do cliente (emoção, comportamento)',
            'Jornada de interação e critérios de avaliação',
          ],
          highlight: 'Reduz tempo de criação e aumenta escala',
        },
        {
          title: 'Treinamentos alinhados ao guidebook e diretrizes Ultragaz',
          subtitle: 'Diferencial crítico',
          bullets: [
            'Carregar materiais oficiais (guides, playbooks, SOPs) diretamente na IA',
            'Consistência e aderência aos padrões Ultragaz',
            'Atualização rápida de diretrizes e procedimentos',
            'Menor dependência de treinamento manual',
          ],
          highlight: 'IA alinhada ao padrão Ultragaz',
        },
        {
          title: 'Simulação em tempo real (como um cliente real)',
          subtitle: 'Experiência realista',
          bullets: [
            'Conversa ao vivo (voz ou texto)',
            'Expressões faciais e emoções',
            'Cenários dinâmicos: erro de pedido, alergia, reclamação, etc.',
          ],
          highlight: 'Mais próximo da operação real → maior retenção',
        },
        {
          title: 'Feedback estruturado nos padrões Ultragaz',
          subtitle: 'Avaliação automática',
          bullets: [
            'Cada interação avaliada nos 5 pilares: Empatia, Procedimento, Verificação, Comunicação e Solução',
            'Alinhado com o que medimos na operação',
            'Conexão com RGM: melhor experiência → maior percepção de valor → mais visitas e vendas',
          ],
          highlight: 'Medimos o que importa na loja',
        },
        {
          title: 'Aprendizado acelerado',
          subtitle: 'Feedback imediato',
          bullets: [
            'Após cada simulação: nota geral e pontos de melhoria',
            'Análise de comportamento',
            'Evolução do atendente ao longo do tempo',
          ],
          highlight: 'Aprende na hora, não semanas depois',
        },
        {
          title: 'Impacto direto em resultados',
          subtitle: 'Negócio',
          bullets: [
            'Treinamento melhor → execução melhor → resultado melhor',
            'Melhora na experiência do cliente',
            'Aumento de Guest Count (GC) e ticket médio',
            'Redução de erros operacionais',
          ],
          highlight: 'Experiência como driver de valor no sistema Ultragaz',
        },
        {
          title: 'Escala e padronização regional',
          subtitle: 'LATAM',
          bullets: [
            'Criação centralizada de cenários',
            'Adaptação por país: idioma, cultura e operação',
            'Rollout rápido em todos os mercados',
          ],
          highlight: 'Mesma qualidade de treinamento em toda a LATAM',
        },
        {
          title: 'Modelo acessível e previsível',
          subtitle: 'Precificação',
          bullets: [
            'Estrutura simples de custo',
            'Exemplo: 5 treinamentos = US$ 1 (US$ 0,20 por treinamento de ~2 min)',
            'Escalável por volume — planejamento mensal fácil',
            'Referência comercial: ~US$ 240/mês → ~1200 treinamentos/mês',
          ],
          highlight: 'Custo previsível por volume',
        },
        {
          title: 'Momento ideal para evoluir treinamento',
          subtitle: 'Por que agora?',
          bullets: [
            'Aumento da complexidade operacional',
            'Mais canais (MOP, Delivery, etc.)',
            'Maior exigência de experiência',
          ],
          highlight: 'Treinamento tradicional não acompanha essa evolução',
        },
        {
          title: 'Treinamento como alavanca estratégica',
          subtitle: 'Conclusão',
          bullets: [
            'A plataforma transforma treinamento em processo mais rápido',
            'Mais consistente entre mercados',
            'Mais mensurável e orientado a resultado',
          ],
          highlight: 'Próximo passo: piloto com metas claras',
        },
      ],
      es: [
        {
          title: '¿Por qué debemos evolucionar la forma de entrenar?',
          subtitle: 'Problema',
          bullets: [
            'Hoy, crear entrenamientos es lento y depende de múltiples equipos',
            'Difícil de estandarizar entre mercados',
            'Poco escalable: cada nuevo escenario requiere esfuerzo manual',
            'Limitado en personalización y simulación real',
          ],
          highlight:
            'La experiencia es un driver de valor — impacta percepción del cliente y resultados',
        },
        {
          title: 'Plataforma de Entrenamiento con IA',
          subtitle: 'Solución',
          bullets: [
            'Crear, ejecutar y escalar entrenamientos de forma automatizada con IA',
            'Simulaciones realistas de servicio',
            'Feedback instantáneo',
            'Creación de contenido mediante prompt',
            'Alineación con el guidebook de la marca',
          ],
          highlight: 'Del entrenamiento estático al dinámico y adaptativo',
        },
        {
          title: 'Creación de entrenamientos con un simple prompt',
          subtitle: 'Feature principal',
          bullets: [
            'El equipo describe el contexto — ej.: “Cliente molesto en drive-thru por item faltante”',
            'La plataforma genera: contexto del escenario y perfil del cliente (emoción, comportamiento)',
            'Journey de interacción y criterios de evaluación',
          ],
          highlight: 'Menos tiempo de creación y más escala',
        },
        {
          title: 'Entrenamientos alineados al guidebook y directrices Ultragaz',
          subtitle: 'Diferencial crítico',
          bullets: [
            'Cargar materiales oficiales (guides, playbooks, SOPs) en la IA',
            'Consistencia y adherencia a estándares Ultragaz',
            'Actualización rápida de directrices y procedimientos',
            'Menor dependencia del entrenamiento manual',
          ],
          highlight: 'IA alineada al estándar Ultragaz',
        },
        {
          title: 'Simulación en tiempo real (como un cliente real)',
          subtitle: 'Experiencia realista',
          bullets: [
            'Conversación en vivo (voz o texto)',
            'Expresiones faciales y emociones',
            'Escenarios dinámicos: error de pedido, alergia, reclamación, etc.',
          ],
          highlight: 'Más cerca de la operación real → mayor retención',
        },
        {
          title: 'Feedback estructurado en estándares Ultragaz',
          subtitle: 'Evaluación automática',
          bullets: [
            'Cada interacción evaluada en 5 pilares: Empatía, Procedimiento, Verificación, Comunicación y Solución',
            'Alineado con lo que medimos en operación',
            'Conexión con RGM: mejor experiencia → mayor percepción de valor → más visitas y ventas',
          ],
          highlight: 'Medimos lo que importa en tienda',
        },
        {
          title: 'Aprendizaje acelerado',
          subtitle: 'Feedback inmediato',
          bullets: [
            'Tras cada simulación: nota general y puntos de mejora',
            'Análisis de comportamiento',
            'Evolución del colaborador en el tiempo',
          ],
          highlight: 'Aprende al instante, no semanas después',
        },
        {
          title: 'Impacto directo en resultados',
          subtitle: 'Negocio',
          bullets: [
            'Mejor entrenamiento → mejor ejecución → mejor resultado',
            'Mejora en la experiencia del cliente',
            'Aumento de Guest Count (GC) y ticket medio',
            'Reducción de errores operativos',
          ],
          highlight: 'La experiencia como driver de valor en Ultragaz',
        },
        {
          title: 'Escala y estandarización regional',
          subtitle: 'LATAM',
          bullets: [
            'Creación centralizada de escenarios',
            'Adaptación por país: idioma, cultura y operación',
            'Rollout rápido en todos los mercados',
          ],
          highlight: 'La misma calidad de entrenamiento en toda LATAM',
        },
        {
          title: 'Modelo accesible y predecible',
          subtitle: 'Precios',
          bullets: [
            'Estructura simple de costo',
            'Ejemplo: 5 entrenamientos = US$ 1 (US$ 0,20 por entrenamiento ~2 min)',
            'Escalable por volumen — planificación mensual fácil',
            'Referencia comercial: ~US$ 240/mes → ~1200 entrenamientos/mes',
          ],
          highlight: 'Costo predecible por volumen',
        },
        {
          title: 'Momento ideal para evolucionar el entrenamiento',
          subtitle: '¿Por qué ahora?',
          bullets: [
            'Mayor complejidad operativa',
            'Más canales (MOP, Delivery, etc.)',
            'Mayor exigencia de experiencia',
          ],
          highlight: 'El entrenamiento tradicional no sigue este ritmo',
        },
        {
          title: 'El entrenamiento como palanca estratégica',
          subtitle: 'Conclusión',
          bullets: [
            'La plataforma hace el entrenamiento más rápido',
            'Más consistente entre mercados',
            'Más medible y orientado a resultados',
          ],
          highlight: 'Siguiente paso: piloto con metas claras',
        },
      ],
      en: [
        {
          title: 'Why do we need to evolve how we train?',
          subtitle: 'Problem',
          bullets: [
            'Creating training today is slow and depends on many teams',
            'Hard to standardize across markets',
            'Low scalability: every new scenario needs manual effort',
            'Limited personalization and real simulation',
          ],
          highlight:
            'Experience is a value driver — it shapes guest perception and results',
        },
        {
          title: 'AI-Powered Training Platform',
          subtitle: 'Solution',
          bullets: [
            'Create, run, and scale training automatically with AI',
            'Realistic service simulations',
            'Instant feedback',
            'Content creation via prompt',
            'Aligned with the brand guidebook',
          ],
          highlight: 'From static training to dynamic, adaptive training',
        },
        {
          title: 'Training creation with a simple prompt',
          subtitle: 'Main feature',
          bullets: [
            'Teams describe context — e.g. “Angry drive-thru guest, missing item”',
            'The platform generates: scenario context and guest profile (emotion, behavior)',
            'Interaction journey and evaluation criteria',
          ],
          highlight: 'Less build time, more scale',
        },
        {
          title: 'Training grounded in Ultragaz guidebook and guidelines',
          subtitle: 'Critical differentiator',
          bullets: [
            'Load official materials (guides, playbooks, SOPs) into the AI',
            'Consistency and Ultragaz standards',
            'Faster guideline and procedure updates',
            'Less reliance on manual training',
          ],
          highlight: 'AI aligned with Ultragaz way of operating',
        },
        {
          title: 'Real-time simulation (like a real guest)',
          subtitle: 'Realistic experience',
          bullets: [
            'Live conversation (voice or text)',
            'Facial expressions and emotions',
            'Dynamic scenarios: wrong order, allergy, complaint, etc.',
          ],
          highlight: 'Closer to real operations → stronger retention',
        },
        {
          title: 'Structured feedback on Ultragaz standards',
          subtitle: 'Automatic evaluation',
          bullets: [
            'Each interaction scored on 5 pillars: Empathy, Procedure, Verification, Communication, Solution',
            'Aligned with what we measure in operations',
            'Tie to RGM: better experience → stronger perceived value → more visits and sales',
          ],
          highlight: 'We measure what matters in the restaurant',
        },
        {
          title: 'Faster learning',
          subtitle: 'Immediate feedback',
          bullets: [
            'After every simulation: overall score and improvement areas',
            'Behavior analysis',
            'Crew evolution over time',
          ],
          highlight: 'Learn now — not weeks later',
        },
        {
          title: 'Direct impact on results',
          subtitle: 'Business',
          bullets: [
            'Better training → better execution → better results',
            'Better guest experience',
            'Higher Guest Count (GC) and average check',
            'Fewer operational errors',
          ],
          highlight: 'Experience as a value driver in the Ultragaz system',
        },
        {
          title: 'Regional scale and standardization',
          subtitle: 'LATAM',
          bullets: [
            'Centralized scenario creation',
            'Country-specific adaptation: language, culture, operations',
            'Fast rollout across markets',
          ],
          highlight: 'Same training quality across LATAM',
        },
        {
          title: 'Accessible, predictable model',
          subtitle: 'Pricing',
          bullets: [
            'Simple cost structure',
            'Example: 5 trainings = US$ 1 (US$ 0.20 per ~2-min training)',
            'Volume-based scaling — easy monthly planning',
            'Commercial reference: ~US$ 240/month → ~1200 trainings/month',
          ],
          highlight: 'Predictable cost by volume',
        },
        {
          title: 'The right time to upgrade training',
          subtitle: 'Why now?',
          bullets: [
            'Rising operational complexity',
            'More channels (MOP, Delivery, etc.)',
            'Higher experience expectations',
          ],
          highlight: 'Traditional training can’t keep up',
        },
        {
          title: 'Training as a strategic lever',
          subtitle: 'Conclusion',
          bullets: [
            'The platform makes training faster',
            'More consistent across markets',
            'More measurable and outcome-driven',
          ],
          highlight: 'Next step: pilot with clear goals',
        },
      ],
    }),
    []
  );

  const slides = slidesByLang[language] || slidesByLang.pt;
  const slide = slides[currentSlide];
  const totalSlides = slides.length;

  const goNext = () => {
    if (currentSlide < totalSlides - 1) setCurrentSlide((v) => v + 1);
    else onExit();
  };

  const goPrev = () => {
    if (currentSlide > 0) setCurrentSlide((v) => v - 1);
  };

  const deckLabel =
    language === 'pt'
      ? 'Proposta Ultragaz'
      : language === 'es'
        ? 'Propuesta Ultragaz'
        : 'Ultragaz Proposal';

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden">
      <div className="absolute top-6 right-6 z-[110]">
        <button
          type="button"
          onClick={onExit}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Sair"
          title="Sair"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        <div className="flex-1 bg-gray-50 p-8 md:p-16 border-b md:border-b-0 md:border-r border-gray-100 overflow-y-auto">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-[#000fff]" />
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">{deckLabel}</p>
            </div>

            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#005BBB]">
              {slide.subtitle}
            </p>

            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-tight mt-2">
              {slide.title}
            </h2>

            <div className="mt-8 space-y-3">
              {slide.bullets.map((b, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-2 w-2 h-2 rounded-full bg-[#00C48C] shrink-0" />
                  <p className="text-base text-gray-700 leading-relaxed">{b}</p>
                </div>
              ))}
            </div>

            {slide.highlight && (
              <div className="mt-10 inline-flex items-center gap-3 px-6 py-4 rounded-[32px] bg-[#000fff] text-white shadow-lg max-w-full">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00C48C] shrink-0" />
                <p className="text-xs sm:text-sm font-black uppercase tracking-widest leading-snug">
                  {slide.highlight}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-[420px] bg-white p-8 md:p-10 flex flex-col justify-between shrink-0 min-h-0 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                {language === 'pt' ? 'Progresso' : language === 'es' ? 'Progreso' : 'Progress'}
              </p>
              <p className="text-xs font-bold text-gray-500">
                {currentSlide + 1}/{totalSlides}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentSlide ? 'w-6 bg-[#000fff]' : 'w-2 bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="rounded-[32px] border border-gray-100 bg-gray-50 p-6">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                {language === 'pt'
                  ? 'Fotos do sistema'
                  : language === 'es'
                    ? 'Fotos del sistema'
                    : 'System photos'}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <img
                  src="/ap-1.jpg"
                  alt=""
                  className="w-full h-24 object-cover rounded-2xl border border-gray-100 bg-white"
                  loading="lazy"
                />
                <img
                  src="/ap-2.jpg"
                  alt=""
                  className="w-full h-24 object-cover rounded-2xl border border-gray-100 bg-white"
                  loading="lazy"
                />
                <img
                  src="/ap-3.jpg"
                  alt=""
                  className="w-full h-24 object-cover rounded-2xl border border-gray-100 bg-white"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex items-center gap-4">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentSlide === 0}
              className="flex items-center justify-center w-14 h-14 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Voltar"
              title="Voltar"
            >
              <ChevronLeft className="text-gray-400" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex-1 flex items-center justify-center gap-3 bg-[#000fff] text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-[#000fff]/10 hover:bg-[#000fff]/90 transition-all active:scale-95"
            >
              <span>
                {currentSlide === totalSlides - 1
                  ? language === 'pt'
                    ? 'Encerrar'
                    : language === 'es'
                      ? 'Finalizar'
                      : 'Finish'
                  : language === 'pt'
                    ? 'Próximo'
                    : language === 'es'
                      ? 'Siguiente'
                      : 'Next'}
              </span>
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingSlides;
