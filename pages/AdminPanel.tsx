
import React, { useState, useMemo, useEffect } from 'react';

/** Defina `true` para exibir novamente a aba "Custos" no menu (admin global). */
const SHOW_ADMIN_COSTS_TAB = false;
import { 
  Scenario, User, UserRole, SimulationResult, Country, Agent 
} from '../types';
import { MOCK_AGENTS } from '../constants';
import { 
  Users, Globe, BarChart3, TrendingUp,
  ChevronRight, ArrowLeft, Building2,
  DollarSign, Zap, MessageSquare, Target, Activity, ShieldCheck, Trophy, Search,
  Bot, Plus, Save, Trash2, Edit2, X as CloseIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis,
} from 'recharts';

interface AdminPanelProps {
  scenarios: Scenario[];
  setScenarios: React.Dispatch<React.SetStateAction<Scenario[]>>;
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  results: SimulationResult[];
  currentUser: User;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ scenarios, setScenarios, agents, setAgents, users, results, currentUser }) => {
  const [tab, setTab] = useState<'analytics' | 'finance' | 'users' | 'ranking' | 'agents' | 'trainings'>('analytics');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [isEditingScenario, setIsEditingScenario] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'user' | 'store', id: string } | null>(null);
  const [selectedResult, setSelectedResult] = useState<SimulationResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!SHOW_ADMIN_COSTS_TAB && tab === 'finance') {
      setTab('analytics');
    }
  }, [tab]);

  const isGlobalAdmin = currentUser.role === UserRole.GLOBAL_ADMIN;
  const isStoreAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.REGIONAL_ADMIN;

  // Filtro de dados baseado no escopo do usuário
  const filteredResults = useMemo(() => {
    if (isGlobalAdmin) return results;
    return results.filter(r => r.storeId === currentUser.storeId);
  }, [results, currentUser, isGlobalAdmin]);

  const filteredUsers = useMemo(() => {
    if (isGlobalAdmin) return users;
    return users.filter(u => u.storeId === currentUser.storeId && u.role === UserRole.EMPLOYEE);
  }, [users, currentUser, isGlobalAdmin]);

  // Ranking de Funcionários (Específico da Unidade ou Global)
  const ranking = useMemo(() => {
    return filteredUsers.map(u => {
      const userRes = filteredResults.filter(r => r.userId === u.id);
      const avgScore = userRes.length > 0 
        ? Math.round(userRes.reduce((acc, r) => acc + r.score, 0) / userRes.length)
        : 0;
      return { ...u, avgScore, totalSessions: userRes.length };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [filteredUsers, filteredResults]);

  // Métricas Financeiras (Apenas para Global) — custo claro e separado por país
  const financeData = useMemo(() => {
    const totalEvaluation = filteredResults.reduce((acc, r) => acc + (r.tokenUsage?.costUsd || 0), 0);
    const totalEstimated = filteredResults.reduce((acc, r) => {
      const ev = r.tokenUsage?.costUsd ?? 0;
      const br = r.costBreakdown;
      const live = br?.liveEstimateUsd ?? 0.03;
      const sug = br?.suggestionsEstimateUsd ?? 0.002;
      return acc + ev + live + sug;
    }, 0);
    // Por país: nome do país, quantidade de treinos, custo avaliação, custo estimado total
    const byCountry: Record<string, { count: number; evaluationUsd: number; estimatedUsd: number }> = {};
    filteredResults.forEach((r) => {
      const key = isGlobalAdmin ? (r.country || 'Outros') : (r.userName || 'N/A');
      if (!byCountry[key]) byCountry[key] = { count: 0, evaluationUsd: 0, estimatedUsd: 0 };
      byCountry[key].count += 1;
      byCountry[key].evaluationUsd += r.tokenUsage?.costUsd ?? 0;
      const ev = r.tokenUsage?.costUsd ?? 0;
      const live = r.costBreakdown?.liveEstimateUsd ?? 0.03;
      const sug = r.costBreakdown?.suggestionsEstimateUsd ?? 0.002;
      byCountry[key].estimatedUsd += ev + live + sug;
    });
    const chartData = Object.entries(byCountry).map(([name, data]) => ({
      name,
      count: data.count,
      evaluationUsd: data.evaluationUsd,
      estimatedUsd: data.estimatedUsd,
      cost: data.estimatedUsd // barra usa custo estimado total
    }));
    const avgPerTraining = filteredResults.length > 0 ? totalEstimated / filteredResults.length : 0.04;
    const trainingsPerDollar = avgPerTraining > 0 ? 1 / avgPerTraining : 25;
    return { totalEvaluation, totalEstimated, byCountry, chartData, avgPerTraining, trainingsPerDollar };
  }, [filteredResults, isGlobalAdmin]);

  const performanceData = useMemo(() => {
    const avgScore = filteredResults.length > 0 
      ? Math.round(filteredResults.reduce((acc, r) => acc + r.score, 0) / filteredResults.length)
      : 0;
    
    // Simulação de dados regionais para o "Mapa" ou lista de lojas
    const regionalStats = isGlobalAdmin ? [
      { name: 'Brasil', score: 88, status: 'Excelente', sessions: 1240 },
      { name: 'Argentina', score: 82, status: 'Bom', sessions: 850 },
      { name: 'Colômbia', score: 79, status: 'Atenção', sessions: 620 },
      { name: 'Chile', score: 85, status: 'Bom', sessions: 430 },
    ] : [
      { name: 'Balcão', score: 92, status: 'Excelente', sessions: 45 },
      { name: 'Drive-Thru', score: 78, status: 'Atenção', sessions: 62 },
      { name: 'Cozinha', score: 85, status: 'Bom', sessions: 30 },
    ];

    return { avgScore, regionalStats };
  }, [filteredResults, isGlobalAdmin]);

  // FIX: Added missing drillDownStats memo to resolve 'Cannot find name drillDownStats' error
  const drillDownStats = useMemo(() => {
    if (!selectedEntity) return null;
    if (selectedEntity.type === 'user') {
      const history = filteredResults.filter(r => r.userId === selectedEntity.id);
      return { history };
    }
    return { history: [] };
  }, [selectedEntity, filteredResults]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header Dinâmico */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
             {isGlobalAdmin ? <Globe className="text-[#000fff]" /> : <Building2 className="text-[#000fff]" />}
             {isGlobalAdmin ? "Adm" : `Unidade: ${currentUser.storeName}`}
          </h1>
          <p className="text-gray-500 font-medium italic">
            {isGlobalAdmin ? "Portal Regional LATAM" : "Painel de Performance da Unidade"}
          </p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-3xl w-full md:w-auto shadow-inner overflow-x-auto scrollbar-hide">
          <button onClick={() => setTab('analytics')} className={`whitespace-nowrap px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'analytics' ? 'bg-white shadow-md text-[#000fff]' : 'text-gray-400 hover:text-gray-600'}`}>
            {isGlobalAdmin ? "Global" : "Performance"}
          </button>
          <button onClick={() => setTab('ranking')} className={`whitespace-nowrap px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'ranking' ? 'bg-white shadow-md text-[#000fff]' : 'text-gray-400 hover:text-gray-600'}`}>
            Ranking
          </button>
          <button onClick={() => setTab('users')} className={`whitespace-nowrap px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'users' ? 'bg-white shadow-md text-[#000fff]' : 'text-gray-400 hover:text-gray-600'}`}>
            Auditoria
          </button>
          <button onClick={() => setTab('agents')} className={`whitespace-nowrap px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'agents' ? 'bg-white shadow-md text-[#000fff]' : 'text-gray-400 hover:text-gray-600'}`}>
            Agentes
          </button>
          <button onClick={() => setTab('trainings')} className={`whitespace-nowrap px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'trainings' ? 'bg-white shadow-md text-[#000fff]' : 'text-gray-400 hover:text-gray-600'}`}>
            Treinos
          </button>
          {isGlobalAdmin && SHOW_ADMIN_COSTS_TAB && (
            <button onClick={() => setTab('finance')} className={`whitespace-nowrap px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'finance' ? 'bg-white shadow-md text-[#000fff]' : 'text-gray-400 hover:text-gray-600'}`}>
              Custos
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <div className="min-h-[600px]">
        {tab === 'analytics' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard 
                title={isGlobalAdmin ? "Score Médio LATAM" : "Média da Unidade"} 
                value={`${performanceData.avgScore}%`} 
                trend={isGlobalAdmin ? "+2.4% este mês" : "Meta: 85%"} 
                icon={<Activity size={20} />} 
                color="bg-[#000fff]/10 text-[#000fff]" 
              />
              <MetricCard 
                title="Sessões Realizadas" 
                value={filteredResults.length.toString()} 
                subtitle="Acumulado operacional" 
                icon={<Users size={20} />} 
                color="bg-yellow-50 text-yellow-700" 
              />
              <MetricCard 
                title="Aproveitamento" 
                value="92%" 
                trend="Hospitalidade" 
                icon={<ShieldCheck size={20} />} 
                color="bg-green-50 text-green-700" 
              />
              <MetricCard 
                title="Destaque do Mês" 
                value={ranking[0]?.name || "N/A"} 
                subtitle="Top Performer" 
                icon={<Trophy size={20} />} 
                color="bg-blue-50 text-blue-700" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <h2 className="text-2xl font-black text-gray-900 mb-10 flex items-center gap-3">
                   {isGlobalAdmin ? <Globe className="text-[#000fff]" /> : <Building2 className="text-[#000fff]" />}
                   {isGlobalAdmin ? "Operação por Região" : "Performance por Setor"}
                </h2>
                <div className="space-y-6">
                  {performanceData.regionalStats.map((item) => (
                    <div key={item.name} className="p-5 bg-gray-50 rounded-[32px] border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-[#000fff]">
                              {item.name[0]}
                           </div>
                           <div>
                              <h4 className="font-black text-gray-900">{item.name}</h4>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">{item.sessions} sessões</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <span className="text-xl font-black text-gray-900">{item.score}%</span>
                           <p className={`text-[10px] font-black uppercase ${item.status === 'Excelente' ? 'text-green-600' : 'text-yellow-600'}`}>{item.status}</p>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#000fff]" style={{ width: `${item.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                 <h2 className="text-2xl font-black text-gray-900 mb-8">Gaps de Unidade</h2>
                 <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                          { subject: 'Empatia', val: 82 },
                          { subject: 'Proced.', val: 65 },
                          { subject: 'Verif.', val: 78 },
                          { subject: 'Comun.', val: 90 },
                          { subject: 'Solução', val: 72 },
                       ]}>
                          <PolarGrid stroke="#f1f5f9" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                          <Radar name="Meta" dataKey="val" stroke="#000fff" fill="#000fff" fillOpacity={0.5} />
                       </RadarChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="mt-6 p-6 bg-[#000fff]/10 rounded-[32px] border border-[#000fff]/20">
                    <p className="text-[10px] font-black text-[#000fff] uppercase mb-2">Alerta Preventivo</p>
                    <p className="text-xs font-bold text-gray-900">
                       Abaixo da meta de Procedimentos. Focar treinamentos na montagem do Drive-Thru.
                    </p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'ranking' && (
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
                   <Trophy className="text-[#00C48C]" /> Ranking da Unidade
                </h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ranking.map((u, i) => (
                  <div key={u.id} className="relative p-8 bg-gray-50 rounded-[40px] border border-gray-100 flex flex-col items-center text-center group hover:bg-white hover:border-[#000fff] transition-all">
                     <div className="absolute top-6 right-6 w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center font-black text-gray-400">
                        #{i + 1}
                     </div>
                     <div className="w-20 h-20 rounded-[32px] bg-[#000fff] text-white flex items-center justify-center text-3xl font-black mb-4">
                        {u.name[0]}
                     </div>
                     <h4 className="text-xl font-black text-gray-900 mb-1">{u.name}</h4>
                     <p className="text-[10px] font-black text-gray-400 uppercase mb-6">{u.totalSessions} Sessões Realizadas</p>
                     
                     <div className="w-full bg-white p-4 rounded-3xl border border-gray-100">
                        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Score Médio</p>
                        <p className="text-3xl font-black text-[#000fff]">{u.avgScore}%</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {!selectedEntity ? (
              <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                 <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <div className="relative w-full max-w-sm">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                       <input 
                          type="text" 
                          placeholder="Buscar colaborador..." 
                          className="w-full pl-12 pr-6 py-3 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#00AEEF] transition-all font-bold text-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                       />
                    </div>
                 </div>
                 <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Colaborador</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Simulações</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                        <tr key={u.id} className="hover:bg-[#000fff]/5 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-[#000fff] group-hover:bg-[#000fff] group-hover:text-white transition-colors uppercase">{u.name[0]}</div>
                              <div>
                                <p className="font-black text-gray-900">{u.name}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">{u.storeName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase">
                               {filteredResults.filter(r => r.userId === u.id).length} Realizadas
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button onClick={() => setSelectedEntity({ type: 'user', id: u.id })} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-black text-gray-900 uppercase tracking-widest hover:border-[#000fff] hover:text-[#000fff] transition-all">
                               Ver Dossiê
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-4 duration-500">
                 <button onClick={() => { setSelectedEntity(null); setSelectedResult(null); }} className="flex items-center gap-2 text-gray-500 font-bold hover:text-[#000fff] mb-8 transition-colors">
                    <ArrowLeft size={18} /> Voltar para Lista
                 </button>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-4">
                       <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Histórico Auditado</h3>
                       {drillDownStats?.history?.length ? drillDownStats.history.map((res) => (
                          <div key={res.id} onClick={() => setSelectedResult(res)} className={`p-6 rounded-[32px] border cursor-pointer transition-all ${selectedResult?.id === res.id ? 'bg-[#000fff] text-white shadow-xl translate-x-2' : 'bg-white border-gray-100 hover:border-[#00AEEF]/40'}`}>
                             <p className={`text-[9px] font-black uppercase mb-1 ${selectedResult?.id === res.id ? 'text-white/80' : 'text-gray-400'}`}>{new Date(res.date).toLocaleDateString()}</p>
                             <h4 className="font-black text-lg mb-4">{res.scenarioTitle}</h4>
                             <div className="flex items-center justify-between">
                                <span className="text-2xl font-black">{res.score}</span>
                                <ChevronRight size={18} />
                             </div>
                          </div>
                       )) : (
                         <div className="p-10 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                           <p className="text-gray-400 font-bold italic">Nenhuma simulação auditável.</p>
                         </div>
                       )}
                    </div>

                    <div className="lg:col-span-8">
                       {selectedResult ? (
                          <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden animate-in fade-in duration-500 h-full flex flex-col">
                             <div className="p-10 bg-[#F8F9FA] border-b border-gray-100 shrink-0">
                                <div className="flex justify-between items-center mb-8">
                                   <div>
                                      <h2 className="text-3xl font-black text-gray-900">{selectedResult.scenarioTitle}</h2>
                                      <p className="text-gray-500 font-medium">Relatório Detalhado de Performance</p>
                                   </div>
                                   <div className="w-20 h-20 rounded-[28px] bg-[#00C48C] flex items-center justify-center text-3xl font-black text-[#000fff] shadow-lg">
                                      {selectedResult.score}
                                   </div>
                                </div>
                             </div>
                             <div className="p-10 space-y-8 flex-1 overflow-y-auto max-h-[600px] scrollbar-hide">
                                <section>
                                   <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Feedback Estruturado</h3>
                                   <div className="bg-gray-900 text-white p-8 rounded-[32px]">
                                      <p className="text-xl italic font-medium leading-relaxed whitespace-pre-wrap">"{selectedResult.feedback}"</p>
                                   </div>
                                </section>
                                <section>
                                   <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Análise de Diálogo</h3>
                                   <div className="bg-gray-50 rounded-[32px] p-8 space-y-4 border border-gray-100">
                                      {selectedResult.transcript.map((m, i) => (
                                         <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`p-4 rounded-[20px] text-xs font-bold shadow-sm ${m.role === 'user' ? 'bg-[#000fff]/10 text-gray-900' : 'bg-white text-gray-700'}`}>
                                               {m.content}
                                            </div>
                                         </div>
                                      ))}
                                   </div>
                                </section>
                             </div>
                          </div>
                       ) : (
                          <div className="h-full bg-gray-50 rounded-[40px] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center p-10 text-gray-300">
                             <MessageSquare size={80} className="mb-4 opacity-50" />
                             <p className="font-black text-xl">Selecione uma sessão auditada</p>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}

        {tab === 'finance' && isGlobalAdmin && SHOW_ADMIN_COSTS_TAB && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             {/* Legenda: o que compõe o custo */}
             <div className="bg-amber-50 border border-amber-200 p-6 rounded-[24px]">
                <p className="text-amber-800 text-[10px] font-black uppercase tracking-widest mb-2">Como são calculados os custos</p>
                <ul className="text-sm text-amber-900 space-y-1 font-medium">
                   <li><strong>Avaliação (Gemini):</strong> custo real da chamada de avaliação pós-treino (após cada sessão).</li>
                   <li><strong>Live API (estimativa):</strong> conversa em áudio em tempo real durante o treinamento (~US$ 0,01–0,06 por sessão).</li>
                   <li><strong>Sugestões de excelência (estimativa):</strong> geração de respostas ideais por mensagem do operador (~US$ 0,0005 por mensagem).</li>
                </ul>
                <p className="text-amber-700 text-xs mt-2">O valor <strong>total estimado</strong> por treinamento considera esses três componentes. O custo exibido na API é apenas o da avaliação.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                   <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Custo total estimado (LATAM)</p>
                   <h3 className="text-5xl font-black mb-2">${financeData.totalEstimated.toFixed(4)}</h3>
                   <p className="text-gray-400 text-xs">Avaliação + Live API + Sugestões</p>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-center">
                   <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Custo só avaliação (API)</p>
                   <h3 className="text-4xl font-black text-gray-900">${financeData.totalEvaluation.toFixed(4)}</h3>
                   <p className="text-xs text-gray-400 mt-1">Soma do que a API cobra (avaliação)</p>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-center">
                   <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Treinamentos</p>
                   <h3 className="text-4xl font-black text-gray-900">{filteredResults.length}</h3>
                   <p className="text-xs text-gray-400 mt-1">Média ~${financeData.avgPerTraining.toFixed(4)} / treinamento</p>
                   <p className="text-xs font-bold text-[#000fff] mt-2">~{Math.round(financeData.trainingsPerDollar)} treinamentos para gastar US$ 1</p>
                </div>
             </div>

             {/* Tabela por país */}
             <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                <h2 className="text-2xl font-black text-gray-900 mb-6">Custos por país</h2>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b-2 border-gray-100">
                            <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">País</th>
                            <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Treinamentos</th>
                            <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Avaliação (USD)</th>
                            <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Total estimado (USD)</th>
                         </tr>
                      </thead>
                      <tbody>
                         {financeData.chartData.map((row) => (
                            <tr key={row.name} className="border-b border-gray-50">
                               <td className="py-4 font-bold text-gray-900">{row.name}</td>
                               <td className="py-4 text-right font-bold text-gray-700">{row.count}</td>
                               <td className="py-4 text-right font-mono text-gray-600">${row.evaluationUsd.toFixed(4)}</td>
                               <td className="py-4 text-right font-mono font-bold text-[#000fff]">${row.estimatedUsd.toFixed(4)}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>

             <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                <h2 className="text-2xl font-black text-gray-900 mb-10">Alocação por país (total estimado)</h2>
                <div className="h-[400px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={financeData.chartData}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                         <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                         <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value: number) => `$${Number(value).toFixed(4)} USD`} />
                         <Bar dataKey="cost" name="Total estimado (USD)" radius={[15, 15, 0, 0]} barSize={60}>
                            {financeData.chartData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? '#000fff' : '#00C48C'} />)}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>
        )}

        {tab === 'agents' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {!isEditingAgent ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tighter">
                    <Bot className="text-[#000fff]" /> Gerenciamento de Agentes
                  </h2>
                  <button 
                    onClick={() => {
                      setSelectedAgent({
                        id: `agt-${Date.now()}`,
                        name: '',
                        type: 'customer',
                        description: '',
                        personality: '',
                        model: 'gemini-2.5-flash',
                        temperature: 0.7,
                        systemPrompt: '',
                        isActive: true
                      });
                      setIsEditingAgent(true);
                    }}
                    className="flex items-center gap-2 bg-[#000fff] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#000fff]/90 transition-all shadow-lg shadow-[#000fff]/10"
                  >
                    <Plus size={18} /> Criar Agente
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {agents.map((agent) => (
                    <div 
                      key={agent.id} 
                      onClick={() => {
                        setSelectedAgent(agent);
                        setIsEditingAgent(true);
                      }}
                      className="group relative bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:border-[#000fff] hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 group-hover:scale-110 transition-transform">
                          {agent.avatar ? (
                            <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                          ) : (
                            <Bot size={32} className="text-gray-400" />
                          )}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          agent.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {agent.isActive ? 'Ativo' : 'Inativo'}
                        </div>
                      </div>

                      <h3 className="text-xl font-black text-gray-900 mb-2">{agent.name}</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase mb-4 tracking-widest">{agent.type}</p>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-6 leading-relaxed">
                        {agent.description}
                      </p>

                      <div className="flex items-center gap-4 pt-6 border-t border-gray-50">
                        <div className="flex-1">
                          <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Modelo</p>
                          <p className="text-[10px] font-bold text-gray-700">{agent.model}</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-[#000fff] hover:bg-[#000fff]/10 transition-all">
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden animate-in slide-in-from-right-4 duration-500">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsEditingAgent(false)}
                      className="p-2 rounded-full hover:bg-white text-gray-400 transition-all"
                    >
                      <ArrowLeft size={24} />
                    </button>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tighter">
                        {selectedAgent?.name ? 'Editar Agente' : 'Novo Agente IA'}
                      </h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Configuração de Redes Neurais</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsEditingAgent(false)}
                      className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-white transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => {
                        if (selectedAgent) {
                          const exists = agents.find(a => a.id === selectedAgent.id);
                          if (exists) {
                            setAgents(agents.map(a => a.id === selectedAgent.id ? selectedAgent : a));
                          } else {
                            setAgents([...agents, selectedAgent]);
                          }
                          setIsEditingAgent(false);
                        }
                      }}
                      className="flex items-center gap-2 bg-[#000fff] text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#000fff]/90 transition-all shadow-lg shadow-[#000fff]/10"
                    >
                      <Save size={18} /> Salvar Agente
                    </button>
                  </div>
                </div>

                <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identidade do Agente</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-700 uppercase ml-1">Nome</label>
                          <input 
                            type="text" 
                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#00AEEF] font-bold text-sm"
                            value={selectedAgent?.name}
                            onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, name: e.target.value } : null)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-700 uppercase ml-1">Tipo de Agente</label>
                          <select 
                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#00AEEF] font-bold text-sm"
                            value={selectedAgent?.type}
                            onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, type: e.target.value as any } : null)}
                          >
                            <option value="customer">Cliente (Customer)</option>
                            <option value="evaluator">Avaliador (Evaluator)</option>
                            <option value="coach">Coach (Real-time)</option>
                            <option value="analyst">Analista (History)</option>
                            <option value="specialist">Especialista (Menu)</option>
                            <option value="crisis">Gestor de Crise</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-700 uppercase ml-1">Descrição Breve</label>
                        <input 
                          type="text" 
                          className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#00AEEF] font-bold text-sm"
                          value={selectedAgent?.description}
                          onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, description: e.target.value } : null)}
                        />
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Personalidade e Comportamento</h4>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-700 uppercase ml-1">Prompt de Sistema (System Instructions)</label>
                        <textarea 
                          rows={6}
                          className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#00AEEF] font-bold text-sm resize-none"
                          value={selectedAgent?.systemPrompt}
                          onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, systemPrompt: e.target.value } : null)}
                        />
                      </div>
                    </section>
                  </div>

                  <div className="space-y-8">
                    <section className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Configurações de Modelo</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-700 uppercase ml-1">Modelo de IA</label>
                          <select 
                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#00AEEF] font-bold text-sm"
                            value={selectedAgent?.model}
                            onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, model: e.target.value } : null)}
                          >
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Rápido)</option>
                            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Inteligente)</option>
                            <option value="gemini-3-flash-preview">Gemini 3 Flash (Next-gen)</option>
                            <option value="gemini-3-pro-preview">Gemini 3 Pro (Especialista)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center ml-1">
                            <label className="text-xs font-black text-gray-700 uppercase">Temperatura</label>
                            <span className="text-[10px] font-black text-[#000fff] bg-[#000fff]/10 px-2 py-0.5 rounded-md">{selectedAgent?.temperature}</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.1"
                            className="w-full accent-[#000fff]"
                            value={selectedAgent?.temperature}
                            onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, temperature: parseFloat(e.target.value) } : null)}
                          />
                          <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase">
                            <span>Determinístico</span>
                            <span>Criativo</span>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ações do Sistema</h4>
                      <div className="p-6 bg-[#000fff]/10 rounded-[32px] border border-[#000fff]/15 flex items-center justify-between">
                        <div>
                          <p className="font-black text-gray-900 text-sm">Status do Agente</p>
                          <p className="text-[10px] text-gray-600 font-bold uppercase">Define se o agente está ativo em produção</p>
                        </div>
                        <button 
                          onClick={() => setSelectedAgent(prev => prev ? { ...prev, isActive: !prev.isActive } : null)}
                          className={`w-14 h-8 rounded-full transition-all relative ${selectedAgent?.isActive ? 'bg-[#000fff]' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${selectedAgent?.isActive ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>

                      <button 
                        onClick={() => {
                          if (selectedAgent) {
                            setAgents(agents.filter(a => a.id !== selectedAgent.id));
                            setIsEditingAgent(false);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 p-5 bg-white border-2 border-dashed border-gray-200 text-gray-400 hover:text-[#000fff] hover:border-[#000fff]/30 hover:bg-[#000fff]/5 rounded-[32px] font-black text-xs uppercase tracking-widest transition-all"
                      >
                        <Trash2 size={18} /> Excluir Agente Permanentemente
                      </button>
                    </section>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'trainings' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {!isEditingScenario ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tighter">
                    <Target className="text-[#000fff]" /> Gestão de Cenários
                  </h2>
                  <button 
                    onClick={() => {
                      setSelectedScenario({
                        id: `sc-${Date.now()}`,
                        type: 'ISSUE_RESOLUTION' as any,
                        sector: 'Balcão' as any,
                        title: '',
                        description: '',
                        mood: 'NEUTRAL' as any,
                        goal: '',
                        country: 'ALL',
                        timeLimit: 120,
                        agentIds: [],
                        rubric: { empathy: 20, procedure: 20, verification: 20, communication: 20, solution: 20 }
                      });
                      setIsEditingScenario(true);
                    }}
                    className="flex items-center gap-2 bg-[#000fff] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#000fff]/90 transition-all shadow-lg shadow-[#000fff]/10"
                  >
                    <Plus size={18} /> Novo Treinamento
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {scenarios.map((scenario) => (
                    <div 
                      key={scenario.id} 
                      onClick={() => {
                        setSelectedScenario(scenario);
                        setIsEditingScenario(true);
                      }}
                      className="group bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:border-[#000fff] hover:shadow-xl transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#000fff]/10 flex items-center justify-center text-[#000fff]">
                            <Target size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-gray-900">{scenario.title}</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{scenario.sector} • {scenario.type}</p>
                          </div>
                        </div>
                        <div className="flex -space-x-2">
                          {scenario.agentIds?.map(agentId => {
                            const agent = agents.find(a => a.id === agentId);
                            return agent ? (
                              <div key={agentId} className="relative group/avatar">
                                <img 
                                  src={agent.avatar} 
                                  alt={agent.name} 
                                  className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 shadow-sm transition-transform group-hover/avatar:scale-110 group-hover/avatar:z-10" 
                                />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[8px] font-black uppercase rounded opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                  {agent.name}
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-6 leading-relaxed">
                        {scenario.description}
                      </p>
                      <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                        <div className="flex gap-4">
                           <div>
                              <p className="text-[8px] font-black text-gray-400 uppercase">Tempo</p>
                              <p className="text-[10px] font-bold text-gray-700">{scenario.timeLimit}s</p>
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-gray-400 uppercase">Humor</p>
                              <p className="text-[10px] font-bold text-gray-700">{scenario.mood}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <button 
                              onClick={(e) => {
                                 e.stopPropagation();
                                 if (confirm('Deseja excluir este treinamento permanentemente?')) {
                                    setScenarios(scenarios.filter(s => s.id !== scenario.id));
                                 }
                              }}
                              className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-[#000fff] hover:bg-[#000fff]/10 transition-all opacity-0 group-hover:opacity-100"
                           >
                              <Trash2 size={16} />
                           </button>
                           <ChevronRight className="text-gray-300 group-hover:text-[#000fff] transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden animate-in slide-in-from-right-4 duration-500">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsEditingScenario(false)}
                      className="p-2 rounded-full hover:bg-white text-gray-400 transition-all"
                    >
                      <ArrowLeft size={24} />
                    </button>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tighter">
                        Configurar Treinamento
                      </h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Roteiro e Orquestração de Agentes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        if (selectedScenario) {
                          const exists = scenarios.find(s => s.id === selectedScenario.id);
                          if (exists) {
                            setScenarios(scenarios.map(s => s.id === selectedScenario.id ? selectedScenario : s));
                          } else {
                            setScenarios([...scenarios, selectedScenario]);
                          }
                          setIsEditingScenario(false);
                        }
                      }}
                      className="flex items-center gap-2 bg-[#000fff] text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#000fff]/90 transition-all shadow-lg shadow-[#000fff]/10"
                    >
                      <Save size={18} /> Salvar Cenário
                    </button>
                  </div>
                </div>

                <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <div className="space-y-8">
                      <section className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Detalhes do Cenário</h4>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-700 uppercase ml-1">Título do Treinamento</label>
                          <input 
                            type="text" 
                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#00AEEF] font-bold text-sm"
                            value={selectedScenario?.title}
                            onChange={(e) => setSelectedScenario(prev => prev ? { ...prev, title: e.target.value } : null)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-700 uppercase ml-1">Descrição (Contexto para a IA)</label>
                          <textarea 
                            rows={4}
                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#00AEEF] font-bold text-sm resize-none"
                            value={selectedScenario?.description}
                            onChange={(e) => setSelectedScenario(prev => prev ? { ...prev, description: e.target.value } : null)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-xs font-black text-gray-700 uppercase ml-1">Setor</label>
                              <select 
                                 className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#00AEEF] font-bold text-sm"
                                 value={selectedScenario?.sector}
                                 onChange={(e) => setSelectedScenario(prev => prev ? { ...prev, sector: e.target.value as any } : null)}
                              >
                                 <option value="Balcão">Balcão</option>
                                 <option value="Drive-Thru">Drive-Thru</option>
                                 <option value="Cozinha">Cozinha</option>
                                 <option value="Gestão">Gestão</option>
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-xs font-black text-gray-700 uppercase ml-1">Humor Inicial</label>
                              <select 
                                 className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#00AEEF] font-bold text-sm"
                                 value={selectedScenario?.mood}
                                 onChange={(e) => setSelectedScenario(prev => prev ? { ...prev, mood: e.target.value as any } : null)}
                              >
                                 <option value="CALM">Calmo</option>
                                 <option value="NEUTRAL">Neutro</option>
                                 <option value="ANGRY">Irritado</option>
                                 <option value="FRUSTRATED">Frustrado</option>
                              </select>
                           </div>
                        </div>
                      </section>

                      <section className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Agentes Ativos neste Treinamento</h4>
                        <div className="flex flex-wrap gap-2">
                           {selectedScenario?.agentIds && selectedScenario.agentIds.length > 0 ? (
                              selectedScenario.agentIds.map(agentId => {
                                 const agent = agents.find(a => a.id === agentId);
                                 return agent ? (
                                    <div key={agentId} className="flex items-center gap-2 px-3 py-2 bg-[#000fff]/10 text-[#000fff] rounded-xl border border-[#000fff]/20 animate-in zoom-in-95 duration-200">
                                       <img src={agent.avatar} alt="" className="w-6 h-6 rounded-lg bg-white" />
                                       <span className="text-[10px] font-black uppercase tracking-tight">{agent.name}</span>
                                       <button 
                                          onClick={() => {
                                             const newIds = selectedScenario.agentIds?.filter(id => id !== agentId);
                                             setSelectedScenario({ ...selectedScenario, agentIds: newIds });
                                          }}
                                          className="ml-1 p-0.5 hover:bg-[#000fff]/10 rounded-md transition-colors"
                                       >
                                          <CloseIcon size={12} />
                                       </button>
                                    </div>
                                 ) : null;
                              })
                           ) : (
                              <p className="text-xs text-gray-400 italic ml-1">Nenhum agente vinculado ainda.</p>
                           )}
                        </div>
                      </section>
                   </div>

                   <div className="space-y-8">
                      <section className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Orquestração de Agentes (Vincular IA)</h4>
                        <p className="text-xs text-gray-500 font-medium ml-1 mb-4">Selecione quais agentes atuarão neste cenário específico:</p>
                        <div className="grid grid-cols-1 gap-3">
                           {agents.map(agent => (
                              <div 
                                 key={agent.id}
                                 onClick={() => {
                                    if (selectedScenario) {
                                       const currentIds = selectedScenario.agentIds || [];
                                       const newIds = currentIds.includes(agent.id)
                                          ? currentIds.filter(id => id !== agent.id)
                                          : [...currentIds, agent.id];
                                       setSelectedScenario({ ...selectedScenario, agentIds: newIds });
                                    }
                                 }}
                                 className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                                    selectedScenario?.agentIds?.includes(agent.id) 
                                       ? 'border-[#000fff] bg-[#000fff]/10' 
                                       : 'border-gray-100 hover:border-[#00AEEF]/40'
                                 }`}
                              >
                                 <div className="flex items-center gap-3">
                                    <img src={agent.avatar} alt="" className="w-10 h-10 rounded-xl bg-white shadow-sm" />
                                    <div>
                                       <p className="text-sm font-black text-gray-900">{agent.name}</p>
                                       <p className="text-[10px] font-bold text-gray-400 uppercase">{agent.type}</p>
                                    </div>
                                 </div>
                                 {selectedScenario?.agentIds?.includes(agent.id) && (
                                    <div className="w-6 h-6 rounded-full bg-[#000fff] flex items-center justify-center text-white">
                                       <Zap size={14} />
                                    </div>
                                 )}
                              </div>
                           ))}
                        </div>
                      </section>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, trend, subtitle, icon, color }: any) => (
  <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-start justify-between group hover:border-[#000fff] transition-all">
    <div className="flex-1 min-w-0">
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1 truncate">{title}</p>
      <h4 className="text-3xl font-black text-gray-900 mb-1">{value}</h4>
      {trend && <p className="text-[10px] font-black text-green-600 uppercase tracking-tighter">{trend}</p>}
      {subtitle && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{subtitle}</p>}
    </div>
    <div className={`p-4 rounded-2xl ${color} shadow-sm shrink-0 transition-transform group-hover:scale-110`}>
      {icon}
    </div>
  </div>
);
