
import React, { useState } from 'react';
import { MOCK_SCENARIOS, MOCK_RESULTS } from '../constants';
import { ScenarioCard } from '../components/ScenarioCard';
import { Scenario, User, UserRole, SimulationResult } from '../types';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, BarChart, Bar, Cell, Radar
} from 'recharts';
import { 
  Play, Target, Trophy, Users, TrendingUp, AlertCircle, Building2, ChevronRight,
  UserCheck, ArrowLeft, BellRing, History, Download, Send, Calendar, BarChart3,
  GraduationCap, Book, CheckCircle2, Lock
} from 'lucide-react';

interface DashboardProps {
  onStartTraining: (scenario: Scenario) => void;
  showScenariosOnly?: boolean;
  user: User;
}

type SubView = 'main' | 'report' | 'notifications' | 'history';

export const Dashboard: React.FC<DashboardProps> = ({ onStartTraining, showScenariosOnly = false, user }) => {
  const [activeSubView, setActiveSubView] = useState<SubView>('main');
  
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
            const count = user.simulationCounts?.[scenario.id] || 0;
            const bestScore = Math.max(0, ...myResults.filter(r => r.scenarioId === scenario.id).map(r => r.score));
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
          value={myResults.length} 
          trend="Total Geral" 
          icon={<Play size={20} />}
          color="bg-[#000fff]/10 text-[#000fff]"
        />
        <MetricCard 
          title="Média Pessoal" 
          value={`${myResults.length > 0 ? Math.round(myResults.reduce((acc, r) => acc + r.score, 0) / myResults.length) : 0}%`} 
          trend="Hospitalidade" 
          icon={<Target size={20} />}
          color="bg-[#00AEEF]/10 text-[#005BBB]"
        />
        <MetricCard 
          title="Treinamentos 100%" 
          // Fix: Explicitly cast values to number[] to resolve the 'unknown' operator error
          value={(Object.values(user.simulationCounts || {}) as number[]).filter(v => v >= 3).length} 
          subtitle="concluídos" 
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
           <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-2">
             <TrendingUp size={20} className="text-[#000fff]" /> Evolução de Competências
           </h2>
           <div className="h-[350px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                 { subject: 'Empatia', A: 85, B: 70 },
                 { subject: 'Proced.', A: 92, B: 85 },
                 { subject: 'Verif.', A: 78, B: 90 },
                 { subject: 'Comun.', A: 95, B: 80 },
                 { subject: 'Solução', A: 88, B: 75 },
               ]}>
                 <PolarGrid stroke="#f1f5f9" />
                 <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
                 <Radar name="Minha Média" dataKey="A" stroke="#000fff" fill="#000fff" fillOpacity={0.6} />
                 <Tooltip />
               </RadarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
           <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-2">
             <History size={20} className="text-[#00C48C]" /> Atividades Recentes
           </h2>
           <div className="space-y-4">
              {myResults.slice(-4).map(res => (
                <div key={res.id} className="p-4 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between hover:bg-white hover:border-[#00AEEF] transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#000fff] font-black group-hover:bg-[#000fff] group-hover:text-white transition-colors">
                        {res.score}
                     </div>
                     <div>
                        <p className="text-sm font-bold text-gray-900">{res.scenarioTitle}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{new Date(res.date).toLocaleDateString()}</p>
                     </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-[#000fff]" />
                </div>
              ))}
              <button className="w-full py-4 mt-4 border-2 border-dashed border-gray-100 rounded-[32px] text-gray-400 font-black text-[10px] uppercase tracking-widest hover:border-[#000fff] hover:text-[#000fff] transition-all">
                Ver Histórico Completo
              </button>
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
