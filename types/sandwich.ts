
export interface Ingredient {
  id: string;
  name: string;
  image?: string;
  emoji?: string;
}

export interface SandwichRecipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  description?: string;
}

export const SANDWICH_RECIPES: SandwichRecipe[] = [
  {
    id: 'kit-instalacao-p13',
    name: 'Kit de Instalação P13',
    description: 'Monte os itens essenciais para uma instalação segura (treinamento Ultragaz).',
    ingredients: [
      { id: 'botijao-p13', name: 'Botijão P13', emoji: '🛢️' },
      { id: 'registro', name: 'Registro', emoji: '🔩' },
      { id: 'mangueira', name: 'Mangueira', emoji: '🧵' },
      { id: 'abracadeira', name: 'Abraçadeira', emoji: '🗜️' },
      { id: 'teste-vedacao', name: 'Teste de Vedação (espuma)', emoji: '🫧' },
    ]
  },
  {
    id: 'checklist-seguranca',
    name: 'Checklist de Segurança',
    description: 'Organize as etapas básicas de segurança antes de finalizar um atendimento.',
    ingredients: [
      { id: 'confirmar-endereco', name: 'Confirmar endereço', emoji: '📍' },
      { id: 'confirmar-tipo', name: 'Confirmar tipo de botijão', emoji: '🏷️' },
      { id: 'orientar-ventilacao', name: 'Orientar ventilação (se houver cheiro de gás)', emoji: '🌬️' },
      { id: 'nao-acionar-interruptor', name: 'Não acionar interruptores', emoji: '⛔' },
    ]
  }
];




