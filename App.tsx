
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { TrainingSession } from './pages/TrainingSession';
import { AdminPanel } from './pages/AdminPanel';
import { Login } from './components/Login';
import { Walkthrough } from './components/Walkthrough';
import PricingSlides from './components/PricingSlides';
import { Scenario, User, UserRole, SimulationResult, Agent } from './types';
import { MOCK_SCENARIOS, MOCK_USERS, MOCK_RESULTS, MOCK_AGENTS } from './constants';
import { isGeminiConfigured } from './geminiEnv';
import { TrainingUnavailable } from './components/TrainingUnavailable';
import { appendTrainingRecord, buildTrainingRecordFromResult } from './services/trainingHistoryStorage';

const SESSION_USER_ID_KEY = 'ultragaz_session_user_id';

function loadPersistedUser(): User | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const id = localStorage.getItem(SESSION_USER_ID_KEY);
    if (!id) return null;
    const user = MOCK_USERS.find((u) => u.id === id);
    if (!user) {
      localStorage.removeItem(SESSION_USER_ID_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

function persistSessionUserId(userId: string) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SESSION_USER_ID_KEY, userId);
}

function clearSessionUserId() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(SESSION_USER_ID_KEY);
}

const WALKTHROUGH_DONE_KEY = (userId: string) => `ultragaz_walkthrough_done_${userId}`;

function shouldShowWalkthroughForUser(user: User | null): boolean {
  if (!user || user.role !== UserRole.EMPLOYEE) return false;
  try {
    return localStorage.getItem(WALKTHROUGH_DONE_KEY(user.id)) !== '1';
  } catch {
    return true;
  }
}

/** Uma leitura na carga do módulo para sessão + walkthrough alinhados ao F5 */
const initialSessionUser = loadPersistedUser();

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(initialSessionUser);
  const [showWalkthrough, setShowWalkthrough] = useState(() =>
    shouldShowWalkthroughForUser(initialSessionUser)
  );
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'training' | 'admin' | 'pricing'>('dashboard');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>(MOCK_SCENARIOS);
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [results, setResults] = useState<SimulationResult[]>(MOCK_RESULTS);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    persistSessionUserId(user.id);

    // Acesso demo da proposta: abre a apresentação diretamente (sem walkthrough).
    if (user.username === 'proposta') {
      setShowWalkthrough(false);
      setCurrentPage('pricing');
      setSelectedScenario(null);
      return;
    }

    if (user.role === UserRole.EMPLOYEE) {
      setShowWalkthrough(shouldShowWalkthroughForUser(user));
    } else {
      setShowWalkthrough(false);
    }
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    clearSessionUserId();
    setCurrentUser(null);
    setCurrentPage('dashboard');
    setSelectedScenario(null);
    setShowWalkthrough(false);
  };

  const handleStartTraining = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setCurrentPage('training');
  };

  const handleFinishTraining = (result: SimulationResult | null) => {
    if (result && currentUser) {
      const enrichedResult: SimulationResult = {
        ...result,
        userId: currentUser.id,
        userName: currentUser.name,
        scenarioId: selectedScenario?.id || 'unknown',
        scenarioTitle: selectedScenario?.title || 'Simulação',
        storeId: currentUser.storeId,
        storeName: currentUser.storeName,
        country: currentUser.country,
        region: currentUser.region,
        date: new Date()
      };
      setResults(prev => [...prev, enrichedResult]);
      try {
        appendTrainingRecord(buildTrainingRecordFromResult(enrichedResult, selectedScenario));
      } catch {
        /* ignore storage errors */
      }
    }
    setCurrentPage('dashboard');
    setSelectedScenario(null);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentPage === 'pricing') {
    return <PricingSlides onExit={handleLogout} />;
  }

  if (showWalkthrough) {
    return (
      <Walkthrough
        onComplete={() => {
          if (currentUser?.role === UserRole.EMPLOYEE) {
            try {
              localStorage.setItem(WALKTHROUGH_DONE_KEY(currentUser.id), '1');
            } catch {
              /* ignore */
            }
          }
          setShowWalkthrough(false);
        }}
      />
    );
  }

  // Se estiver em treinamento com um cenário selecionado, renderiza sem o Layout (Fullscreen)
  if (currentPage === 'training' && selectedScenario) {
    if (!isGeminiConfigured()) {
      return (
        <TrainingUnavailable
          scenarioTitle={selectedScenario.title}
          onBack={() => {
            setSelectedScenario(null);
            setCurrentPage('dashboard');
          }}
        />
      );
    }
    return (
      <TrainingSession 
        scenario={selectedScenario} 
        onFinish={handleFinishTraining} 
        agents={agents}
      />
    );
  }

  return (
    <Layout 
      user={currentUser} 
      onNavigate={setCurrentPage} 
      activePage={currentPage}
      onLogout={handleLogout}
    >
      {currentPage === 'dashboard' && (
        <Dashboard 
          onStartTraining={handleStartTraining} 
          user={currentUser}
        />
      )}

      {currentPage === 'training' && !selectedScenario && (
        <Dashboard 
          onStartTraining={handleStartTraining} 
          showScenariosOnly={true}
          user={currentUser}
        />
      )}

      {currentPage === 'admin' && (
        <AdminPanel 
          scenarios={scenarios} 
          setScenarios={setScenarios}
          agents={agents}
          setAgents={setAgents}
          users={users}
          setUsers={setUsers}
          results={results}
          currentUser={currentUser}
        />
      )}
    </Layout>
  );
};

export default App;
