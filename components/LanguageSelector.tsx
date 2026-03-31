
import React, { useState } from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  direction?: 'up' | 'down';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ direction = 'down' }) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  const currentLang = languages.find(l => l.code === language);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
        title="Selecionar Idioma"
      >
        <Globe size={18} className="text-gray-500" />
        <span className="hidden md:inline">{currentLang?.flag} {currentLang?.name}</span>
        <span className="md:hidden">{currentLang?.flag}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            className={`absolute right-0 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-in fade-in ${
              direction === 'up' 
                ? 'bottom-full mb-2 slide-in-from-bottom-2' 
                : 'top-full mt-2 slide-in-from-top-2'
            }`}
          >
            <div className="p-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    language === lang.code
                      ? 'bg-[#000fff]/10 text-[#000fff]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                  {language === lang.code && (
                    <span className="ml-auto text-[#000fff]">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

