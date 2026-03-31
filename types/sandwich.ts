
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
    id: 'bigmac',
    name: 'Big Mac',
    description: 'O clássico hambúrguer com dois hambúrgueres, alface, queijo, molho especial, cebola e picles em pão com gergelim.',
    ingredients: [
      { id: 'pao-gergelim-topo', name: 'Pão com Gergelim (Topo)', emoji: '🍞' },
      { id: 'alface', name: 'Alface', emoji: '🥬' },
      { id: 'queijo', name: 'Queijo', emoji: '🧀' },
      { id: 'hamburguer-1', name: 'Hambúrguer', emoji: '🍔' },
      { id: 'cebola', name: 'Cebola', emoji: '🧅' },
      { id: 'picles', name: 'Picles', emoji: '🥒' },
      { id: 'molho-especial', name: 'Molho Especial', emoji: '🥄' },
      { id: 'pao-meio', name: 'Pão do Meio', emoji: '🍞' },
      { id: 'hamburguer-2', name: 'Hambúrguer', emoji: '🍔' },
      { id: 'queijo-2', name: 'Queijo', emoji: '🧀' },
      { id: 'alface-2', name: 'Alface', emoji: '🥬' },
      { id: 'pao-gergelim-base', name: 'Pão com Gergelim (Base)', emoji: '🍞' },
    ]
  },
  {
    id: 'mcnuggets',
    name: 'McNuggets',
    description: 'Tiras de frango empanadas e crocantes.',
    ingredients: [
      { id: 'nugget-1', name: 'Nugget de Frango', emoji: '🍗' },
      { id: 'nugget-2', name: 'Nugget de Frango', emoji: '🍗' },
      { id: 'nugget-3', name: 'Nugget de Frango', emoji: '🍗' },
      { id: 'nugget-4', name: 'Nugget de Frango', emoji: '🍗' },
    ]
  }
];




