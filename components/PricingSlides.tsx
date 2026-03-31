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

/** Mesmo degradê da área de login/senha (Login.tsx) */
const LOGIN_PANEL_GRADIENT = 'linear-gradient(90deg, #0ff 60%, #0f0 100%)';

/** Fonte: https://bipbrasil.com.br/wp-content/uploads/2022/12/logo-bip-consulting-red.png */
const BIP_LOGO_SRC = '/bip-logo.png';

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
            'O time descreve o contexto — ex.: “Cliente preocupado com segurança no manuseio do botijão”',
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
            'Cenários dinâmicos: entrega, segurança, assinatura/recorrência, revendas (Academia), reclamações, etc.',
          ],
          highlight: 'Mais próximo da operação real → maior retenção',
        },
        {
          title: 'Feedback estruturado nos padrões Ultragaz',
          subtitle: 'Avaliação automática',
          bullets: [
            'Cada interação avaliada nos 5 pilares: Empatia, Procedimento, Verificação, Comunicação e Solução',
            'Alinhado com o que medimos na operação',
            'Conexão com a gestão: melhor atendimento → maior confiança do consumidor → mais fidelidade e resultado',
          ],
          highlight: 'Medimos o que importa na operação Ultragaz',
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
            'Maior satisfação do cliente, retenção e atendimentos resolvidos com padrão Ultragaz',
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
            'Mais canais (app, central de atendimento, revendas, etc.)',
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
            'El equipo describe el contexto — ej.: “Cliente preocupado por seguridad en el manejo del cilindro”',
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
            'Escenarios dinámicos: entrega, seguridad, suscripción/recurrencia, revendedores (Academia), reclamos, etc.',
          ],
          highlight: 'Más cerca de la operación real → mayor retención',
        },
        {
          title: 'Feedback estructurado en estándares Ultragaz',
          subtitle: 'Evaluación automática',
          bullets: [
            'Cada interacción evaluada en 5 pilares: Empatía, Procedimiento, Verificación, Comunicación y Solución',
            'Alineado con lo que medimos en operación',
            'Conexión con la gestión: mejor atención → mayor confianza del consumidor → más fidelidad y resultado',
          ],
          highlight: 'Medimos lo que importa en la operación Ultragaz',
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
            'Mayor satisfacción del cliente, retención y atenciones resueltas con estándar Ultragaz',
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
            'Más canales (app, central de atención, revendedores, etc.)',
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
            'Experience is a value driver — it shapes customer perception and business results',
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
            'Teams describe context — e.g. “Customer worried about safe handling of the cylinder”',
            'The platform generates: scenario context and customer profile (emotion, behavior)',
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
          title: 'Real-time simulation (like a real customer)',
          subtitle: 'Realistic experience',
          bullets: [
            'Live conversation (voice or text)',
            'Facial expressions and emotions',
            'Dynamic scenarios: delivery, safety, subscription/recurrence, resellers (Academy), complaints, etc.',
          ],
          highlight: 'Closer to real operations → stronger retention',
        },
        {
          title: 'Structured feedback on Ultragaz standards',
          subtitle: 'Automatic evaluation',
          bullets: [
            'Each interaction scored on 5 pillars: Empathy, Procedure, Verification, Communication, Solution',
            'Aligned with what we measure in operations',
            'Tie to management: better service → stronger customer trust → loyalty and commercial results',
          ],
          highlight: 'We measure what matters in Ultragaz operations',
        },
        {
          title: 'Faster learning',
          subtitle: 'Immediate feedback',
          bullets: [
            'After every simulation: overall score and improvement areas',
            'Behavior analysis',
            'Team member progress over time',
          ],
          highlight: 'Learn now — not weeks later',
        },
        {
          title: 'Direct impact on results',
          subtitle: 'Business',
          bullets: [
            'Better training → better execution → better results',
            'Better customer experience',
            'Higher satisfaction, retention, and issues resolved to Ultragaz standards',
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
            'More channels (app, contact center, resellers, etc.)',
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
    <div
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
      style={{ background: LOGIN_PANEL_GRADIENT }}
    >
      {/* Marca d'água NDA */}
      <div
        className="pointer-events-none fixed inset-0 z-[96] flex items-center justify-center overflow-hidden"
        aria-hidden
      >
        <p className="max-w-[95vw] text-center select-none text-[clamp(1.75rem,7vw,4.5rem)] font-black uppercase leading-none tracking-tighter text-white/[0.22] shadow-sm [text-shadow:0_1px_0_rgba(0,0,0,0.06)] rotate-[-14deg] px-4">
          NDA (Acordo de Não Divulgação)
        </p>
      </div>

      {/* BIP + Here to Dare — canto inferior esquerdo */}
      <div
        className="pointer-events-none fixed bottom-5 left-5 z-[108] flex max-w-[min(85vw,280px)] flex-col gap-2 md:bottom-8 md:left-8"
        aria-hidden
      >
        <img
          src={BIP_LOGO_SRC}
          alt="BIP"
          className="h-7 w-auto max-w-full object-contain object-left drop-shadow-md md:h-9"
        />
        <p className="text-base font-black italic tracking-tight text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)] md:text-xl">
          Here to Dare
        </p>
      </div>

      <div className="absolute top-6 right-6 z-[110]">
        <button
          type="button"
          onClick={onExit}
          className="rounded-full bg-white/90 p-2 shadow-md ring-1 ring-black/5 transition-colors hover:bg-white"
          aria-label="Sair"
          title="Sair"
        >
          <X size={20} className="text-gray-700" />
        </button>
      </div>

      <div className="relative z-[100] flex min-h-0 flex-1 flex-col overflow-hidden pb-24 pt-14 md:flex-row md:pb-20">
        <div className="flex-1 overflow-y-auto border-b border-white/25 p-6 md:border-b-0 md:border-r md:p-12 lg:p-16">
          <div className="max-w-xl rounded-[32px] border border-white/60 bg-white/95 p-6 shadow-xl shadow-black/10 backdrop-blur-md md:p-10">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-2 shadow-sm">
              <div className="h-2.5 w-2.5 rounded-full bg-[#000fff]" />
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">{deckLabel}</p>
            </div>

            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#005BBB]">
              {slide.subtitle}
            </p>

            <h2 className="mt-2 text-3xl font-black leading-tight tracking-tighter text-gray-900 md:text-4xl">
              {slide.title}
            </h2>

            <div className="mt-8 space-y-3">
              {slide.bullets.map((b, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#00C48C]" />
                  <p className="text-base leading-relaxed text-gray-700">{b}</p>
                </div>
              ))}
            </div>

            {slide.highlight && (
              <div className="mt-10 inline-flex max-w-full items-center gap-3 rounded-[32px] bg-[#000fff] px-6 py-4 text-white shadow-lg">
                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#00C48C]" />
                <p className="text-xs font-black uppercase leading-snug tracking-widest sm:text-sm">
                  {slide.highlight}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 w-full shrink-0 flex-col justify-between overflow-y-auto p-6 md:w-[420px] md:p-10">
          <div className="rounded-[28px] border border-white/60 bg-white/95 p-6 shadow-xl shadow-black/10 backdrop-blur-md md:p-8">
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
            <div className="rounded-2xl border border-gray-100 bg-gray-50/90 p-4">
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
                  className="h-24 w-full rounded-2xl border border-gray-100 bg-white object-cover"
                  loading="lazy"
                />
                <img
                  src="/ap-2.jpg"
                  alt=""
                  className="h-24 w-full rounded-2xl border border-gray-100 bg-white object-cover"
                  loading="lazy"
                />
                <img
                  src="/ap-3.jpg"
                  alt=""
                  className="h-24 w-full rounded-2xl border border-gray-100 bg-white object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="pt-6 flex items-center gap-4">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentSlide === 0}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 transition-all hover:bg-gray-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Voltar"
                title="Voltar"
              >
                <ChevronLeft className="text-gray-400" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-[#000fff] px-6 py-4 font-black text-white shadow-xl shadow-[#000fff]/10 transition-all hover:bg-[#000fff]/90 active:scale-95"
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
      </div>
    </div>
  );
};

export default PricingSlides;
