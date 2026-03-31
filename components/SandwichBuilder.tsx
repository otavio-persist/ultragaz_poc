
import React, { useState } from 'react';
import { Ingredient, SandwichRecipe } from '../types/sandwich';
import { CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SandwichBuilderProps {
  recipe: SandwichRecipe;
  onComplete: () => void;
  onSkip?: () => void;
}

export const SandwichBuilder: React.FC<SandwichBuilderProps> = ({ recipe, onComplete, onSkip }) => {
  const { t, language } = useLanguage();
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>(() => {
    // Embaralhar ingredientes
    return [...recipe.ingredients].sort(() => Math.random() - 0.5);
  });
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
  const [draggedItem, setDraggedItem] = useState<Ingredient | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const translations = {
    pt: {
      title: `Como Montar o ${recipe.name}`,
      description: recipe.description || 'Arraste os ingredientes na ordem correta',
      check: 'Verificar',
      reset: 'Reiniciar',
      correct: 'Perfeito! Ordem correta!',
      incorrect: 'Ordem incorreta. Tente novamente.',
      start: 'Iniciar Simulação',
      skip: 'Pular',
    },
    es: {
      title: `Cómo Armar el ${recipe.name}`,
      description: recipe.description || 'Arrastra los ingredientes en el orden correcto',
      check: 'Verificar',
      reset: 'Reiniciar',
      correct: '¡Perfecto! Orden correcto!',
      incorrect: 'Orden incorrecto. Intenta de nuevo.',
      start: 'Iniciar Simulación',
      skip: 'Saltar',
    },
    en: {
      title: `How to Build the ${recipe.name}`,
      description: recipe.description || 'Drag the ingredients in the correct order',
      check: 'Check',
      reset: 'Reset',
      correct: 'Perfect! Correct order!',
      incorrect: 'Incorrect order. Try again.',
      start: 'Start Simulation',
      skip: 'Skip',
    },
  };

  const t_sandwich = translations[language] || translations.pt;

  const handleDragStart = (ingredient: Ingredient) => {
    setDraggedItem(ingredient);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex?: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (targetIndex !== undefined) {
      // Dropar em posição específica
      const newSelected = [...selectedIngredients];
      newSelected.splice(targetIndex, 0, draggedItem);
      setSelectedIngredients(newSelected);
      
      const newAvailable = availableIngredients.filter(ing => ing.id !== draggedItem.id);
      setAvailableIngredients(newAvailable);
    } else {
      // Dropar no final
      setSelectedIngredients([...selectedIngredients, draggedItem]);
      setAvailableIngredients(availableIngredients.filter(ing => ing.id !== draggedItem.id));
    }
    
    setDraggedItem(null);
    setIsCorrect(null);
  };

  const handleRemoveIngredient = (ingredient: Ingredient, index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
    setAvailableIngredients([...availableIngredients, ingredient]);
    setIsCorrect(null);
  };

  const handleReset = () => {
    setAvailableIngredients([...recipe.ingredients].sort(() => Math.random() - 0.5));
    setSelectedIngredients([]);
    setIsCorrect(null);
  };

  const handleCheck = () => {
    const isOrderCorrect = selectedIngredients.length === recipe.ingredients.length &&
      selectedIngredients.every((ing, index) => ing.id === recipe.ingredients[index].id);
    
    setIsCorrect(isOrderCorrect);
  };

  const canCheck = selectedIngredients.length === recipe.ingredients.length;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="w-full max-w-6xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white">
            {t_sandwich.title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t_sandwich.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lado Esquerdo: Ingredientes Disponíveis */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {language === 'pt' ? 'Ingredientes Disponíveis' : language === 'es' ? 'Ingredientes Disponibles' : 'Available Ingredients'}
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {availableIngredients.map((ingredient) => (
                <div
                  key={ingredient.id}
                  draggable
                  onDragStart={() => handleDragStart(ingredient)}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-move hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <span className="text-2xl">{ingredient.emoji}</span>
                  <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {ingredient.name}
                  </span>
                </div>
              ))}
              {availableIngredients.length === 0 && (
                <p className="text-center text-gray-400 dark:text-gray-500 py-8">
                  {language === 'pt' ? 'Todos os ingredientes foram usados!' : language === 'es' ? '¡Todos los ingredientes fueron usados!' : 'All ingredients used!'}
                </p>
              )}
            </div>
          </div>

          {/* Lado Direito: Área de Montagem */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {language === 'pt' ? 'Montagem do Lanche' : language === 'es' ? 'Armado del Sándwich' : 'Sandwich Assembly'}
            </h3>
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e)}
              className="min-h-[500px] space-y-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/50"
            >
              {selectedIngredients.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[450px] text-gray-400 dark:text-gray-500">
                  <p className="text-center">
                    {language === 'pt' ? 'Arraste os ingredientes aqui na ordem correta' : language === 'es' ? 'Arrastra los ingredientes aquí en el orden correcto' : 'Drag ingredients here in the correct order'}
                  </p>
                </div>
              ) : (
                selectedIngredients.map((ingredient, index) => (
                  <div
                    key={`${ingredient.id}-${index}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(e, index);
                    }}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-[#000fff]/40 transition-colors group"
                  >
                    <span className="text-2xl">{ingredient.emoji}</span>
                    <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {ingredient.name}
                    </span>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-400">
                      #{index + 1}
                    </span>
                    <button
                      onClick={() => handleRemoveIngredient(ingredient, index)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#000fff]/10 dark:hover:bg-[#000fff]/15 rounded transition-opacity"
                    >
                      <XCircle size={18} className="text-[#000fff]" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Feedback e Ações */}
        <div className="flex flex-col items-center gap-4">
          {isCorrect !== null && (
            <div className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold ${
              isCorrect 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                : 'bg-[#000fff]/10 dark:bg-[#000fff]/15 text-[#000fff] dark:text-[#00AEEF] border border-[#000fff]/20 dark:border-[#000fff]/30'
            }`}>
              {isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              {isCorrect ? t_sandwich.correct : t_sandwich.incorrect}
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <RotateCcw size={18} />
              {t_sandwich.reset}
            </button>
            
            <button
              onClick={handleCheck}
              disabled={!canCheck}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-gray-900 rounded-xl font-black hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t_sandwich.check}
            </button>

            {isCorrect && (
              <button
                onClick={onComplete}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#000fff] via-[#00AEEF] to-[#0f0] text-white rounded-xl font-black hover:shadow-lg transition-all"
              >
                {t_sandwich.start}
                <ArrowRight size={20} />
              </button>
            )}

            {onSkip && (
              <button
                onClick={onSkip}
                className="px-6 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-bold transition-colors"
              >
                {t_sandwich.skip}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};




