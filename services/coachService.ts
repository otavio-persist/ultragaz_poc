/**
 * CoachService: dicas contextualizadas (regras) baseadas no cenário + conversa + humor do cliente.
 * Objetivo: dicas "reais" e acionáveis, sem depender de chamadas de API.
 */

import { ChatMessage, Scenario, ScenarioMood, ScenarioType, Sector } from "../types";

export type CoachLanguage = 'pt' | 'es' | 'en';

function normalize(text: string) {
  return (text || '').toLowerCase();
}

function lastMessageByRole(transcript: ChatMessage[], role: 'user' | 'assistant') {
  for (let i = transcript.length - 1; i >= 0; i--) {
    if (transcript[i].role === role) return transcript[i];
  }
  return null;
}

function containsAny(text: string, needles: string[]) {
  const t = normalize(text);
  return needles.some(n => t.includes(n));
}

function t(lang: CoachLanguage, pt: string, es: string, en: string) {
  if (lang === 'es') return es;
  if (lang === 'en') return en;
  return pt;
}

export function getCoachTip(params: {
  scenario: Scenario;
  transcript: ChatMessage[];
  customerMood: ScenarioMood;
  language: CoachLanguage;
}): { tip: string; reasonKey: string } | null {
  const { scenario, transcript, customerMood, language } = params;

  const lastCustomer = lastMessageByRole(transcript, 'assistant')?.content || '';
  const lastEmployee = lastMessageByRole(transcript, 'user')?.content || '';

  const customerIsUpset = customerMood === ScenarioMood.ANGRY || customerMood === ScenarioMood.FRUSTRATED;
  const customerMentionsManager = containsAny(lastCustomer, ['gerente', 'manager', 'supervisor']);
  const customerMentionsWait = containsAny(lastCustomer, ['esper', 'demor', 'minuto', 'fila', 'meia hora', '20 minuto', '30 minuto']);
  const customerMentionsWrongOrder = containsAny(lastCustomer, ['errado', 'pedido errado', 'veio errado', 'troca', 'faltou', 'não veio', 'missing']);
  const customerMentionsRefund = containsAny(lastCustomer, ['reembolso', 'devolver', 'devolução', 'money back', 'refund']);
  const employeeDidApologize = containsAny(lastEmployee, ['desculp', 'peço desculpas', 'sinto muito', 'lamento']);
  const employeeDidVerify = containsAny(lastEmployee, ['confirm', 'verific', 'confer', 'checar', 'ticket', 'nota', 'comanda']);
  const employeeOfferedConcreteAction = containsAny(lastEmployee, ['vou', 'vamos', 'já', 'agora', 'refazer', 'preparar', 'trocar', 'substituir', 'resolver']);

  // 1) Escalada / ameaça de chamar gerente
  if (customerMentionsManager || customerMentionsRefund) {
    return {
      reasonKey: 'escalation',
      tip: t(
        language,
        'Mantenha a calma e assuma a resolução: peça desculpas, explique o próximo passo e, se necessário, chame o gerente para acelerar a solução.',
        'Mantén la calma y asume la resolución: pide disculpas, explica el siguiente paso y, si es necesario, llama al gerente para acelerar la solución.',
        'Stay calm and take ownership: apologize, explain the next step, and if needed call the manager to speed up the resolution.'
      ),
    };
  }

  // 2) Cliente bravo/frustrado: priorizar desescalar + validar
  if (customerIsUpset && !employeeDidApologize) {
    return {
      reasonKey: 'deescalate-apology',
      tip: t(
        language,
        'Primeiro desescale: peça desculpas e valide o sentimento do cliente (ex.: “Entendo sua frustração”). Só depois explique o que você vai fazer.',
        'Primero desescala: pide disculpas y valida el sentimiento del cliente (p. ej., “Entiendo tu frustración”). Luego explica qué harás.',
        'De-escalate first: apologize and validate their feeling (“I understand your frustration”), then explain what you’ll do.'
      ),
    };
  }

  // 3) Espera/demora: reconhecer + dar prazo
  if (customerMentionsWait && (!employeeOfferedConcreteAction || !containsAny(lastEmployee, ['tempo', 'minuto', 'instante', 'prazo']))) {
    return {
      reasonKey: 'time-estimate',
      tip: t(
        language,
        'Reconheça a demora e dê um prazo claro: “Vou verificar agora e te retorno em 1 minuto com a solução”.',
        'Reconoce la demora y da un plazo claro: “Voy a verificar ahora y vuelvo en 1 minuto con la solución”.',
        'Acknowledge the wait and give a clear ETA: “I’ll check now and come back in 1 minute with a solution”.'
      ),
    };
  }

  // 4) Itens faltando / pedido errado: verificar ticket + corrigir
  if (customerMentionsWrongOrder && !employeeDidVerify) {
    return {
      reasonKey: 'verify-ticket',
      tip: t(
        language,
        'Siga o procedimento: confirme o ticket/nota com o cliente e repita o item correto. Em seguida, refaça/substitua com prioridade.',
        'Sigue el procedimiento: confirma el ticket con el cliente y repite el ítem correcto. Luego reemplaza con prioridad.',
        'Follow the procedure: confirm the receipt with the customer, repeat the correct item, then replace it with priority.'
      ),
    };
  }

  // 5) Cenários específicos
  if (scenario.type === ScenarioType.CUSTOMIZATION && containsAny(scenario.title + ' ' + scenario.description, ['alerg', 'glúten', 'gluten'])) {
    return {
      reasonKey: 'allergy-protocol',
      tip: t(
        language,
        'Em alergia, seja técnico e seguro: confirme o alergênico, explique risco de contaminação cruzada e acione gerente/cozinha antes de prometer “100% seguro”.',
        'En alergias, sé técnico y seguro: confirma el alérgeno, explica el riesgo de contaminación cruzada y llama a gerente/cocina antes de prometer “100% seguro”.',
        'For allergies, be precise: confirm the allergen, explain cross-contamination risk, and involve manager/kitchen before promising “100% safe”.'
      ),
    };
  }

  if (scenario.type === ScenarioType.NEW_PRODUCT) {
    return {
      reasonKey: 'new-product',
      tip: t(
        language,
        'Venda com confiança: descreva 2 ingredientes-chave, compare com um item conhecido e faça uma pergunta de preferência (“prefere mais picante ou suave?”).',
        'Vende con confianza: describe 2 ingredientes clave, compáralo con un producto conocido y haz una pregunta de preferencia.',
        'Sell with confidence: describe 2 key ingredients, compare to a known item, and ask a preference question.'
      ),
    };
  }

  // 6) Default (quando já está indo bem)
  if (employeeDidApologize && employeeDidVerify && employeeOfferedConcreteAction) {
    return {
      reasonKey: 'good-next-step',
      tip: t(
        language,
        'Ótimo: mantenha o controle do próximo passo e confirme no final (“Posso confirmar se ficou tudo certo agora?”).',
        'Bien: mantén el control del siguiente paso y confirma al final (“¿Puedo confirmar que quedó todo correcto?”).',
        'Good: own the next step and confirm at the end (“Can I confirm everything is correct now?”).'
      ),
    };
  }

  return {
    reasonKey: 'default',
    tip: t(
      language,
      'Seja direto e gentil: peça desculpas, confirme o problema em uma frase e diga exatamente o que você vai fazer agora.',
      'Sé directo y amable: pide disculpas, confirma el problema en una frase y di exactamente qué harás ahora.',
      'Be direct and kind: apologize, confirm the issue in one sentence, and say exactly what you’ll do now.'
    ),
  };
}




