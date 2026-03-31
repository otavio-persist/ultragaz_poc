
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

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'training' | 'admin' | 'pricing'>('dashboard');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>(MOCK_SCENARIOS);
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [results, setResults] = useState<SimulationResult[]>(MOCK_RESULTS);

  const handleLogin = (user: User) => {
    setCurrentUser(user);

    // Acesso demo da proposta: abre a apresentação diretamente (sem walkthrough).
    if (user.username === 'proposta') {
      setShowWalkthrough(false);
      setCurrentPage('pricing');
      setSelectedScenario(null);
      return;
    }

    if (user.role === UserRole.EMPLOYEE) {
      setShowWalkthrough(true);
    } else {
      setShowWalkthrough(false);
    }
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
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
    return <Walkthrough onComplete={() => setShowWalkthrough(false)} />;
  }

  // Se estiver em treinamento com um cenário selecionado, renderiza sem o Layout (Fullscreen)
  if (currentPage === 'training' && selectedScenario) {
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
