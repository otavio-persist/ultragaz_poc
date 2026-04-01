
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MOCK_SCENARIOS, MOCK_RESULTS } from '../constants';
import { ScenarioCard } from '../components/ScenarioCard';
import { Scenario, User, UserRole } from '../types';
import { loadTrainingHistory, type SavedTrainingRecord } from '../services/trainingHistoryStorage';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, BarChart, Bar, Cell, Radar
} from 'recharts';
import { 
  Play, Target, Trophy, Users, TrendingUp, AlertCircle, Building2, ChevronRight,
  UserCheck, ArrowLeft, BellRing, History, Download, Send, Calendar, BarChart3,
  GraduationCap, Book, CheckCircle2, Lock, MessageSquare
} from 'lucide-react';

interface DashboardProps {
  onStartTraining: (scenario: Scenario) => void;
  showScenariosOnly?: boolean;
  user: User;
}

type SubView = 'main' | 'report' | 'notifications' | 'history';

export const Dashboard: React.FC<DashboardProps> = ({ onStartTraining, showScenariosOnly = false, user }) => {
  const [activeSubView, setActiveSubView] = useState<SubView>('main');
  const [savedHistory, setSavedHistory] = useState<SavedTrainingRecord[]>([]);
  const [savedHistoryExpanded, setSavedHistoryExpanded] = useState(false);
  const [expandedSavedId, setExpandedSavedId] = useState<string | null>(null);

  const refreshSavedHistory = useCallback(() => {
    setSavedHistory(loadTrainingHistory());
  }, []);

  useEffect(() => {
    refreshSavedHistory();
    const onSaved = () => refreshSavedHistory();
    window.addEventListener('ultragaz-training-saved', onSaved as EventListener);
    return () => window.removeEventListener('ultragaz-training-saved', onSaved as EventListener);
  }, [refreshSavedHistory]);

  const mySavedConversations = useMemo(() => {
    return savedHistory
      .filter((r) => r.userId === user.id)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }, [savedHistory, user.id]);

  const recentSaved = useMemo(
    () => (savedHistoryExpanded ? mySavedConversations : mySavedConversations.slice(0, 4)),
    [mySavedConversations, savedHistoryExpanded]
  );

  /** Agregados do histórico salvo (Salvar e Voltar) para cards e radar. */
  const dashboardMetricsFromSaved = useMemo(() => {
    const n = mySavedConversations.length;
    const avg =
      n > 0
        ? Math.round(
            mySavedConversations.reduce((acc, r) => acc + r.mediaGeralUltragaz, 0) / n
          )
        : 0;
    const byScenario = new Map<string, { count: number; best: number }>();
    for (const rec of mySavedConversations) {
      const x = byScenario.get(rec.scenarioId) || { count: 0, best: 0 };
      x.count += 1;
      x.best = Math.max(x.best, rec.mediaGeralUltragaz);
      byScenario.set(rec.scenarioId, x);
    }
    let completed = 0;
    for (const [, v] of byScenario) {
      if (v.count >= 3 || v.best >= 90) completed += 1;
    }
    return { total: n, avgPct: avg, completedScenarios: completed };
  }, [mySavedConversations]);

  const radarDataFromSaved = useMemo(() => {
    const order: { full: string; short: string }[] = [
      { full: 'Empatia', short: 'Empatia' },
      { full: 'Procedimento', short: 'Proced.' },
      { full: 'Verificação', short: 'Verif.' },
      { full: 'Comunicação', short: 'Comun.' },
      { full: 'Solução', short: 'Solução' },
    ];
    if (mySavedConversations.length === 0) {
      return order.map(({ short }) => ({ subject: short, A: 0 }));
    }
    const sums = new Map<string, { sum: number; n: number }>();
    for (const rec of mySavedConversations) {
      for (const row of rec.mapaCompetencias || []) {
        const prev = sums.get(row.subject) || { sum: 0, n: 0 };
        prev.sum += row.val;
        prev.n += 1;
        sums.set(row.subject, prev);
      }
    }
    return order.map(({ full, short }) => {
      const agg = sums.get(full);
      const A = agg && agg.n > 0 ? Math.round(agg.sum / agg.n) : 0;
      return { subject: short, A };
    });
  }, [mySavedConversations]);

  const savesByScenarioId = useMemo(() => {
    const m = new Map<string, SavedTrainingRecord[]>();
    for (const rec of mySavedConversations) {
      const arr = m.get(rec.scenarioId) || [];
      arr.push(rec);
      m.set(rec.scenarioId, arr);
    }
    return m;
  }, [mySavedConversations]);
  
  const isStoreAdmin = user.role === UserRole.ADMIN || user.role === UserRole.REGIONAL_ADMIN;
  const isGlobalAdmin = user.role === UserRole.GLOBAL_ADMIN;
  const storeResults = MOCK_RESULTS.filter(r => r.storeId === user.storeId);
  const myResults = MOCK_RESULTS.filter(r => r.userId === user.id);
  
  const avgStoreScore = storeResults.length > 0 
    ? Math.round(storeResults.reduce((acc, curr) => acc + curr.score, 0) / storeResults.length)
    : 0;

  if (showScenariosOnly) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
              <GraduationCap className="text-[#000fff]" /> Meus Treinamentos
            </h2>
            <p className="text-gray-500 font-medium mt-2">Cada cenário permite até 3 tentativas para atingir a excelência.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_SCENARIOS.map(scenario => {
            const savedForScenario = savesByScenarioId.get(scenario.id) || [];
            const saveCount = savedForScenario.length;
            const count = Math.max(user.simulationCounts?.[scenario.id] || 0, saveCount);
            const bestScore = Math.max(
              0,
              ...savedForScenario.map((s) => s.mediaGeralUltragaz),
              ...myResults.filter((r) => r.scenarioId === scenario.id).map((r) => r.score)
            );
            const isFinished = count >= 3 || bestScore >= 90;

            return (
              <div key={scenario.id} className="relative group">
                <ScenarioCard 
                  scenario={scenario} 
                  onStart={count < 3 ? onStartTraining : () => alert('Limite atingido!')}
                  attemptCount={count}
                />
                
                {/* Overlay de Concluído */}
                {isFinished && (
                  <div className="absolute top-4 right-4 pointer-events-none z-10">
                    <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-sm border border-green-200">
                      <CheckCircle2 size={12} /> Concluído
                    </span>
                  </div>
                )}

                {count >= 3 && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="bg-white p-6 rounded-[32px] shadow-2xl border border-gray-100 text-center scale-90 group-hover:scale-100 transition-transform">
                        <Lock className="mx-auto text-gray-400 mb-2" size={32} />
                        <p className="text-sm font-black text-gray-900">Limite de 3 Simulações Atingido</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Sua melhor nota: {bestScore}%</p>
                     </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Bem-vindo, {user.name}</h1>
          <p className="text-gray-500 font-medium">Unidade: {user.storeName} | LATAM Operational Portal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Minhas Simulações" 
          value={dashboardMetricsFromSaved.total} 
          trend="Treinos salvos (Salvar e Voltar)" 
          icon={<Play size={20} />}
          color="bg-[#000fff]/10 text-[#000fff]"
        />
        <MetricCard 
          title="Média Pessoal" 
          value={`${dashboardMetricsFromSaved.avgPct}%`} 
          trend={dashboardMetricsFromSaved.total > 0 ? 'Média geral nos salvamentos' : 'Hospitalidade'} 
          icon={<Target size={20} />}
          color="bg-[#00AEEF]/10 text-[#005BBB]"
        />
        <MetricCard 
          title="Treinamentos 100%" 
          value={Math.max(
            dashboardMetricsFromSaved.completedScenarios,
            (Object.values(user.simulationCounts || {}) as number[]).filter((v) => v >= 3).length
          )}
          subtitle="cenários concluídos" 
          icon={<CheckCircle2 size={20} />}
          color="bg-green-50 text-green-600"
        />
        <MetricCard 
          title="Certificações" 
          value="Master" 
          subtitle="Drive-Thru" 
          icon={<Trophy size={20} />}
          color="bg-blue-50 text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
           <h2 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
             <TrendingUp size={20} className="text-[#000fff]" /> Evolução de Competências
           </h2>
           <p className="text-xs font-medium text-gray-500 mb-6">
             {mySavedConversations.length > 0
               ? 'Média das competências nos treinos que você salvou.'
               : 'Complete treinos e use Salvar e Voltar para preencher este mapa.'}
           </p>
           <div className="h-[350px] w-full min-w-0">
             <ResponsiveContainer width="100%" height={350}>
               <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarDataFromSaved}>
                 <PolarGrid stroke="#f1f5f9" />
                 <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
                 <Radar name="Média (salvos)" dataKey="A" stroke="#000fff" fill="#000fff" fillOpacity={0.6} />
                 <Tooltip />
               </RadarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
           <h2 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
             <History size={20} className="text-[#00C48C]" /> Atividades Recentes
           </h2>
           <p className="text-xs font-medium text-gray-500 mb-6">
             Conversas salvas ao concluir um treino e usar <span className="font-black text-gray-700">Salvar e Voltar</span>.
           </p>
           <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {recentSaved.length === 0 ? (
                <div className="p-6 rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 text-center">
                  <MessageSquare className="mx-auto text-gray-300 mb-2" size={28} />
                  <p className="text-sm font-bold text-gray-700">Nenhuma conversa salva ainda</p>
                  <p className="text-xs text-gray-500 mt-1">Finalize um treino e toque em Salvar e Voltar para ver o histórico aqui.</p>
                </div>
              ) : (
                recentSaved.map((rec) => {
                  const msgCount = rec.dossieDialogo?.length ?? 0;
                  const isOpen = expandedSavedId === rec.id;
                  return (
                    <div
                      key={rec.id}
                      className="rounded-3xl border border-gray-100 bg-gray-50 overflow-hidden transition-all hover:border-[#00AEEF]"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedSavedId(isOpen ? null : rec.id)}
                        className="w-full p-4 flex items-center justify-between text-left cursor-pointer group hover:bg-white transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#000fff] font-black shrink-0 group-hover:bg-[#000fff] group-hover:text-white transition-colors">
                            {rec.mediaGeralUltragaz}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{rec.scenarioTitle}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter flex items-center gap-2 flex-wrap">
                              <span>{new Date(rec.savedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                              <span className="inline-flex items-center gap-1 text-[#000fff]">
                                <MessageSquare size={10} />
                                {msgCount} {msgCount === 1 ? 'msg' : 'msgs'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          size={18}
                          className={`text-gray-300 group-hover:text-[#000fff] shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                        />
                      </button>
                      {isOpen && msgCount > 0 && (
                        <div className="px-4 pb-4 border-t border-gray-100 bg-white/80">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 mt-3">Trecho da conversa</p>
                          <div className="space-y-2 max-h-[220px] overflow-y-auto rounded-2xl border border-gray-100 p-3 bg-gray-50/50">
                            {rec.dossieDialogo.map((m, idx) => (
                              <div
                                key={`${rec.id}-${idx}`}
                                className={`text-xs leading-snug rounded-xl px-3 py-2 ${
                                  m.role === 'user'
                                    ? 'bg-[#000fff]/10 text-gray-900 ml-4 font-bold'
                                    : 'bg-white border border-gray-100 text-gray-700 mr-4'
                                }`}
                              >
                                <span className="text-[9px] font-black uppercase text-gray-400 block mb-1">
                                  {m.role === 'user' ? 'Você' : 'Cliente / IA'}
                                </span>
                                {m.content}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              {mySavedConversations.length > 4 && (
                <button
                  type="button"
                  onClick={() => setSavedHistoryExpanded((v) => !v)}
                  className="w-full py-4 border-2 border-dashed border-gray-100 rounded-[32px] text-gray-500 font-black text-[10px] uppercase tracking-widest hover:border-[#000fff] hover:text-[#000fff] transition-all"
                >
                  {savedHistoryExpanded
                    ? 'Mostrar só as 4 mais recentes'
                    : `Ver todas (${mySavedConversations.length})`}
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, trend, subtitle, icon, color }: any) => (
  <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-start justify-between group hover:border-[#000fff] transition-all">
    <div>
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-3xl font-black text-gray-900 mb-1">{value}</h4>
      {trend && <p className="text-xs font-bold text-gray-500">{trend}</p>}
      {subtitle && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{subtitle}</p>}
    </div>
    <div className={`p-4 rounded-2xl ${color} transition-transform group-hover:scale-110 shadow-sm`}>
      {icon}
    </div>
  </div>
);
