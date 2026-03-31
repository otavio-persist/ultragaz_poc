
import { User, UserRole, Scenario, ScenarioType, ScenarioMood, Sector, Country, SimulationResult, Agent } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u-admin',
    name: 'Administrador Global',
    username: 'admin',
    password: 'admin',
    role: UserRole.GLOBAL_ADMIN,
    storeId: 'HQ-GLOBAL',
    storeName: 'Central Ultragaz',
    country: Country.BRAZIL,
    region: 'São Paulo',
    progress: 100,
    simulationCounts: {}
  },
  {
    id: 'u-itaim-mgr',
    name: 'Gerente Itaim',
    username: 'ultraitaim',
    password: '123',
    role: UserRole.ADMIN,
    storeId: 'ST-001',
    storeName: 'Ultragaz Itaim',
    country: Country.BRAZIL,
    region: 'São Paulo',
    progress: 95,
    simulationCounts: {}
  },
  {
    id: 'u-joao',
    name: 'João Silva',
    username: 'joao',
    password: '123',
    role: UserRole.EMPLOYEE,
    storeId: 'ST-001',
    storeName: 'Ultragaz Itaim',
    country: Country.BRAZIL,
    region: 'São Paulo',
    progress: 45,
    simulationCounts: { 'sc1': 1, 'sc2': 2 }
  },
  {
    id: 'u-ana',
    name: 'Ana Costa',
    username: 'ana',
    password: '123',
    role: UserRole.EMPLOYEE,
    storeId: 'ST-001',
    storeName: 'Ultragaz Itaim',
    country: Country.BRAZIL,
    region: 'São Paulo',
    progress: 88,
    simulationCounts: { 'sc1': 3 }
  },
  {
    id: 'u-proposta',
    name: 'Acesso Proposta (Demo)',
    username: 'proposta',
    password: 'proposta',
    role: UserRole.TRAINER,
    storeId: 'DEMO-PROPOSTA',
    storeName: 'Ultragaz / Proposta',
    country: Country.BRAZIL,
    region: 'São Paulo',
    progress: 0,
    simulationCounts: {}
  }
];

export const MOCK_SCENARIOS: Scenario[] = [
  {
    id: 'sc1',
    type: ScenarioType.ISSUE_RESOLUTION,
    sector: Sector.DRIVE_THRU,
    title: 'Entrega: Botijão não entregue no prazo',
    description: 'O cliente está irritado porque agendou a entrega e o botijão ainda não chegou. Ele precisa cozinhar e quer uma solução imediata. Seu objetivo é validar dados do pedido, explicar prazos com clareza e oferecer alternativas (reagendamento, prioridade, retirada, etc.).',
    mood: ScenarioMood.ANGRY,
    goal: 'Resolver com rapidez, cortesia e precisão técnica.',
    country: Country.BRAZIL,
    timeLimit: 120,
    agentIds: ['agt-1', 'agt-2', 'agt-3'],
    rubric: { empathy: 40, procedure: 20, verification: 10, communication: 10, solution: 20 }
  },
  {
    id: 'sc2',
    type: ScenarioType.CUSTOMIZATION,
    sector: Sector.COUNTER,
    title: 'Atendimento: Dúvida de segurança e manuseio',
    description: 'Um cliente calmo, mas preocupado, pergunta sobre segurança no uso do gás, armazenamento correto e o que fazer ao sentir cheiro de gás. Você deve demonstrar acolhimento, conhecimento das orientações e encaminhar procedimentos com clareza.',
    mood: ScenarioMood.CALM,
    goal: 'Orientar com segurança, reduzir ansiedade e garantir encaminhamento correto.',
    country: 'ALL',
    timeLimit: 180,
    agentIds: ['agt-1', 'agt-2', 'agt-5'],
    rubric: { empathy: 20, procedure: 40, verification: 20, communication: 10, solution: 10 }
  },
  {
    id: 'sc3',
    type: ScenarioType.NEW_PRODUCT,
    sector: Sector.COUNTER,
    title: 'Novo serviço: Assinatura/recorrência de entrega',
    description: 'Um cliente pergunta sobre um serviço de recorrência para não ficar sem gás. Ele quer saber como funciona, frequência, canais de atendimento e como alterar endereço ou data. Você deve explicar de forma simples e orientar o próximo passo.',
    mood: ScenarioMood.CALM,
    goal: 'Explicar o serviço com clareza e orientar a contratação sem atrito.',
    country: Country.COLOMBIA,
    timeLimit: 150,
    agentIds: ['agt-1', 'agt-2'],
    rubric: { empathy: 30, procedure: 25, verification: 15, communication: 20, solution: 10 }
  },
  {
    id: 'sc4',
    type: ScenarioType.NEW_PRODUCT,
    sector: Sector.COUNTER,
    title: 'Atendimento: Troca de botijão e compatibilidade',
    description: 'Um cliente quer trocar o botijão e tem dúvidas sobre compatibilidade com o regulador e cuidados na instalação. Ele está inseguro e quer confirmação do procedimento. Você deve orientar com segurança e reforçar boas práticas.',
    mood: ScenarioMood.CALM,
    goal: 'Orientar corretamente e aumentar confiança do cliente na solução.',
    country: 'ALL',
    timeLimit: 150,
    agentIds: ['agt-1', 'agt-2'],
    rubric: { empathy: 25, procedure: 30, verification: 15, communication: 20, solution: 10 }
  },
  {
    id: 'sc5',
    type: ScenarioType.ISSUE_RESOLUTION,
    sector: Sector.COUNTER,
    title: 'Desafio Pro: Múltiplos Agentes IA',
    description: 'Este é um cenário avançado que utiliza um motor de orquestração multiagente. Você enfrentará um cliente com personalidade variável, monitorado por um Avaliador e um Coach em tempo real. O objetivo é lidar com uma solicitação complexa (pedido, entrega, segurança e cobrança), onde cada detalhe do atendimento será analisado por diferentes IAs especializadas.',
    mood: ScenarioMood.NEUTRAL,
    goal: 'Demonstrar maestria operacional e atendimento de excelência sob análise de múltiplos agentes de IA.',
    country: 'ALL',
    timeLimit: 200,
    agentIds: ['agt-1', 'agt-2', 'agt-3', 'agt-4'],
    rubric: { empathy: 30, procedure: 25, verification: 15, communication: 20, solution: 10 }
  },
  {
    id: 'sc6',
    type: ScenarioType.ISSUE_RESOLUTION,
    sector: Sector.COUNTER,
    title: 'Inovação: Atendimento com Avatar 3D',
    description: 'Teste de tecnologia com avatar 3D humanoide. O cliente interage em tempo real com LipSync sincronizado ao áudio gerado pela IA. Use este cenário para validar a fluidez dos movimentos faciais e a naturalidade da conversa.',
    mood: ScenarioMood.NEUTRAL,
    goal: 'Validar a nova interface 3D e a sincronia labial.',
    country: 'ALL',
    timeLimit: 150,
    agentIds: ['agt-1', 'agt-2'],
    rubric: { empathy: 20, procedure: 20, verification: 20, communication: 20, solution: 20 }
  }
];

export const MOCK_RESULTS: SimulationResult[] = [
  {
    id: 'res-1',
    userId: 'u-joao',
    userName: 'João Silva',
    scenarioId: 'sc1',
    scenarioTitle: 'Drive-Thru: Item Faltando',
    storeId: 'ST-001',
    storeName: 'Ultragaz Itaim',
    country: Country.BRAZIL,
    region: 'São Paulo',
    score: 85,
    empathyScore: 90,
    procedureScore: 80,
    verificationScore: 70,
    communicationScore: 95,
    solutionScore: 90,
    feedback: "Excelente postura e clareza no atendimento, embora tenha esquecido de confirmar os dados do pedido antes de concluir.",
    missingFeedback: "Conferência manual do ticket com o cliente.",
    transcript: [],
    date: new Date('2024-03-10'),
    initialMood: ScenarioMood.ANGRY,
    finalMood: ScenarioMood.NEUTRAL,
    sentimentEvolution: "Conversão de Conflito Bem-sucedida",
    tokenUsage: { input: 1500, output: 400, costUsd: 0.0004 }
  }
];

export const SYSTEM_PROMPT_SIMULATOR = `
Você é um motor de simulação da Ultragaz.
OBJETIVO: Treinar colaboradores em atendimento ao cliente, segurança e padrão operacional.
Papeis:
1. CLIENTE: Atue conforme o cenário. Reaja ao funcionário.
2. AVALIADOR: Avalia conforme os 5 pilares: Empatia, Procedimento, Verificação, Comunicação e Solução.
`;

export const MOCK_AGENTS: Agent[] = [
  {
    id: 'agt-1',
    name: 'Cliente Realista',
    type: 'customer',
    description: 'Simula um cliente padrão com humor variável conforme o atendimento.',
    personality: 'Equilibrada, reage bem à educação e mal à falta de atenção.',
    model: 'gemini-2.5-flash',
    temperature: 0.8,
    systemPrompt: `Você é um CLIENTE da Ultragaz com as seguintes características:
- Humor inicial: {mood}
- Personalidade: realista
- Cenário: {scenario}

INSTRUÇÕES:
1. Reaja naturalmente como um cliente real
2. Se o funcionário for empático e resolver seu problema, fique mais calmo
3. Se o funcionário não ajudar, fique mais frustrado
4. Seja autêntico e não exagerado
5. Use linguagem natural de cliente`,
    isActive: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Molly'
  },
  {
    id: 'agt-2',
    name: 'Avaliador Operacional',
    type: 'evaluator',
    description: 'Auditoria técnica focada nos 5 pilares de atendimento Ultragaz.',
    personality: 'Rigorosa, técnica e focada em processos operacionais.',
    model: 'gemini-2.5-pro',
    temperature: 0.2,
    systemPrompt: `Você é um AVALIADOR EXPERIENTE de atendimento ao cliente da Ultragaz.

RUBRICA DE AVALIAÇÃO:
- Empatia (40%): Demonstra compreensão e cuidado?
- Procedimento (20%): Segue protocolos corretos?
- Verificação (10%): Confirma informações?
- Comunicação (10%): Claro e profissional?
- Solução (20%): Resolve o problema?

Avalie cada dimensão de 0-100 e forneça feedback construtivo.`,
    isActive: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=George'
  },
  {
    id: 'agt-3',
    name: 'Coach de Hospitalidade',
    type: 'coach',
    description: 'Fornece dicas em tempo real para melhorar a conexão emocional.',
    personality: 'Incentivadora, empática e focada em comunicação positiva.',
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    systemPrompt: `Você é um COACH de atendimento ao cliente.

Forneça uma dica CONSTRUTIVA e BREVE (1-2 frases) para melhorar o atendimento.
Foque em:
- Empatia
- Procedimentos corretos
- Comunicação clara
- Resolução de problemas`,
    isActive: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lilly'
  },
  {
    id: 'agt-4',
    name: 'Analista de Tendências',
    type: 'analyst',
    description: 'Processa o histórico de sessões para identificar gaps de treinamento.',
    personality: 'Analítica, baseada em dados e visão de longo prazo.',
    model: 'gemini-3-pro-preview',
    temperature: 0.1,
    systemPrompt: `Você é um ANALISTA de dados de treinamento.

Identifique:
1. Padrões comuns de erro
2. Áreas que precisam mais treinamento
3. Tendências de melhoria
4. Recomendações estratégicas`,
    isActive: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha'
  },
  {
    id: 'agt-5',
    name: 'Especialista em Produtos & Segurança',
    type: 'specialist',
    description: 'Especialista em produtos, segurança e orientação ao cliente.',
    personality: 'Informativa, precisa e prestativa.',
    model: 'gemini-2.5-flash',
    temperature: 0.3,
    systemPrompt: `Você é um ESPECIALISTA em produtos e segurança da Ultragaz.

Conhecimento:
- Tipos de botijão e orientações de uso
- Segurança: cheiro de gás, ventilação, armazenamento e quando acionar suporte
- Procedimentos de entrega/troca e verificações básicas
- Orientações gerais ao cliente (sem substituir assistência técnica)`,
    isActive: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver'
  },
  {
    id: 'agt-6',
    name: 'Gestor de Conflitos',
    type: 'crisis',
    description: 'Especializado em desescalar situações críticas e clientes agressivos.',
    personality: 'Calma, resiliente e focada em resolução diplomática.',
    model: 'gemini-2.5-pro',
    temperature: 0.5,
    systemPrompt: `Você é um ESPECIALISTA em gestão de crise e desescalada.

Seu foco é analisar:
1. Controle emocional do atendente
2. Uso de frases de apaziguamento
3. Velocidade em oferecer soluções alternativas
4. Manutenção do padrão de hospitalidade sob pressão`,
    isActive: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Willow'
  }
];
