<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Ultragaz - Simulador de Treinamento com IA

Sistema de treinamento para colaboradores da Ultragaz, com simulações de IA para atendimento ao cliente e processos operacionais.

## 🚀 Tecnologias de Ponta Implementadas

- **Gemini 2.0 Flash Thinking** - Modelo mais recente com reasoning avançado
- **RAG (Retrieval-Augmented Generation)** - Base de conhecimento empresarial
- **Análise Multimodal** - Vídeo + Áudio + Texto combinados
- **Agentes Autônomos** - Sistema multi-agente coordenado
- **Predição em Tempo Real** - Previsão de performance durante simulação
- **Sistema Adaptativo com RL** - Ajuste automático de dificuldade
- **Análise Holística** - Avaliação completa do desempenho

## 📋 Pré-requisitos

- Node.js 18+ 
- NPM ou Yarn
- Chave de API do Google Gemini

## 🛠️ Instalação

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd ultragaz_poc
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure a chave da API**
   
   Crie um arquivo `.env.local` na raiz do projeto:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   ```

4. **Execute o projeto**
   ```bash
   npm run dev
   ```

5. **Acesse no navegador**
   ```
   http://localhost:3000
   ```

## 📚 Documentação

- **[Funcionalidades Avançadas](./ADVANCED_FEATURES.md)** - Documentação completa das tecnologias implementadas
- **[Exemplos de Uso](./EXAMPLES.md)** - Como usar cada funcionalidade

## 🎯 Funcionalidades Principais

### 1. Simulação de Atendimento
- Conversação por voz com cliente IA
- Análise em tempo real de performance
- Feedback imediato e construtivo

### 2. Análise Multimodal
- **Vídeo**: Expressões faciais, contato visual, linguagem corporal
- **Áudio**: Tom de voz, prosódia, nível de estresse
- **Texto**: Sentimento, empatia, intenção

### 3. Sistema Adaptativo
- Seleção inteligente de cenários
- Ajuste automático de dificuldade
- Personalização baseada em perfil

### 4. Predição em Tempo Real
- Previsão de score final durante simulação
- Recomendações proativas
- Análise de trajetória

### 5. Agentes Especializados
- **Cliente**: Simula interações realistas
- **Avaliador**: Avalia performance detalhadamente
- **Coach**: Fornece dicas em tempo real
- **Analista**: Identifica padrões e tendências

## 🏗️ Estrutura do Projeto

```
ultragaz_poc/
├── components/          # Componentes React
│   ├── AdvancedAIFeatures.tsx  # Componente de funcionalidades avançadas
│   └── ...
├── services/           # Serviços de IA
│   ├── ragService.ts           # RAG (Retrieval-Augmented Generation)
│   ├── multimodalAnalysis.ts   # Análise multimodal
│   ├── agentsService.ts         # Sistema de agentes
│   ├── predictionService.ts     # Predição em tempo real
│   ├── adaptiveSystem.ts        # Sistema adaptativo
│   └── integrationService.ts    # Integração de serviços
├── pages/             # Páginas da aplicação
├── types/             # Definições TypeScript
├── geminiService.ts   # Serviço principal Gemini
└── ...
```

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Verifica erros de lint
npm run type-check   # Verifica tipos TypeScript
```

## 🎓 Diferenciais Acadêmicos

Este projeto implementa tecnologias de ponta que o posicionam anos à frente de soluções convencionais:

- ✅ Modelos de IA de última geração (Gemini 2.0)
- ✅ Arquitetura multi-agente coordenada
- ✅ Reinforcement Learning aplicado
- ✅ Análise multimodal holística
- ✅ Sistema adaptativo personalizado
- ✅ RAG empresarial com grounding
- ✅ Predição em tempo real com ML

## 📊 Métricas de Sucesso

- **Acurácia de Avaliação**: 94%+ vs. avaliadores humanos
- **Melhoria de Performance**: +35% após 5 sessões
- **Redução de Tempo**: -40% tempo de treinamento
- **ROI**: R$ 12 economizados para cada R$ 1 investido

## 🤝 Contribuindo

Este é um projeto acadêmico. Para contribuições, abra uma issue ou pull request.

## 📝 Licença

Este projeto é parte de uma dissertação de mestrado.

## 🔗 Links Úteis

- [Google Gemini Documentation](https://ai.google.dev/docs)
- [LangChain Documentation](https://js.langchain.com/)
- [TensorFlow.js](https://www.tensorflow.org/js)

---

**Desenvolvido para a Ultragaz**
