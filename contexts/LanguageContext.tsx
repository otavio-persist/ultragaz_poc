
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'pt' | 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Carregar do localStorage ou usar português como padrão
    const saved = localStorage.getItem('app_language');
    return (saved as Language) || 'pt';
  });

  useEffect(() => {
    // Salvar no localStorage quando mudar
    localStorage.setItem('app_language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Traduções
  const translations: Record<Language, Record<string, string>> = {
    pt: {
      // Navegação
      'nav.dashboard': 'Dashboard',
      'nav.training': 'Treinamento',
      'nav.admin': 'Administração',
      'nav.logout': 'Sair',
      
      // Dashboard
      'dashboard.welcome': 'Bem-vindo',
      'dashboard.training': 'Treinamento',
      'dashboard.reports': 'Relatórios',
      'dashboard.notifications': 'Notificações',
      'dashboard.history': 'Histórico',
      'dashboard.attempts': 'Tentativas',
      'dashboard.completed': 'Concluído',
      'dashboard.start': 'Começar',
      
      // Login
      'login.title': 'Portal de Treinamento',
      'login.titlePart1': 'Portal de',
      'login.titlePart2': 'Treinamento',
      'login.subtitle': 'Bem-vindo ao simulador de excelência operacional da Ultragaz.',
      'login.username': 'Nome de Usuário',
      'login.password': 'Senha de Acesso',
      'login.forgot': 'Esqueci minha senha',
      'login.submit': 'Entrar no Sistema',
      'login.recover': 'Recuperar Acesso',
      'login.recoverEmail': 'Email de Recuperação',
      'login.sendInstructions': 'Enviar Instruções',
      'login.emailSent': 'Email Enviado!',
      'login.emailNotFound': 'Email não encontrado',
      'login.emailNotFoundMessage': 'O email não consta em nossa base de dados Ultragaz.',
      'login.recoverInstructions': 'Insira seu email corporativo Ultragaz para receber as instruções.',
      'login.emailSentMessage': 'As instruções de recuperação foram enviadas para',
      'login.checkInbox': 'Verifique sua caixa de entrada e spam.',
      'login.backToLogin': 'Voltar para o Login',
      'login.tryAnotherEmail': 'Tentar outro email',
      'login.processing': 'Processando',
      
      // Geral
      'common.store': 'Loja',
      'common.language': 'Idioma',
      'common.selectLanguage': 'Selecionar Idioma',
    },
    es: {
      // Navegación
      'nav.dashboard': 'Panel',
      'nav.training': 'Entrenamiento',
      'nav.admin': 'Administración',
      'nav.logout': 'Salir',
      
      // Dashboard
      'dashboard.welcome': 'Bienvenido',
      'dashboard.training': 'Entrenamiento',
      'dashboard.reports': 'Reportes',
      'dashboard.notifications': 'Notificaciones',
      'dashboard.history': 'Historial',
      'dashboard.attempts': 'Intentos',
      'dashboard.completed': 'Completado',
      'dashboard.start': 'Comenzar',
      
      // Login
      'login.title': 'Portal de Entrenamiento',
      'login.titlePart1': 'Portal de',
      'login.titlePart2': 'Entrenamiento',
      'login.subtitle': 'Bienvenido al simulador de excelencia operacional de Ultragaz.',
      'login.username': 'Nombre de Usuario',
      'login.password': 'Contraseña',
      'login.forgot': 'Olvidé mi contraseña',
      'login.submit': 'Ingresar al Sistema',
      'login.recover': 'Recuperar Acceso',
      'login.recoverEmail': 'Email de Recuperación',
      'login.sendInstructions': 'Enviar Instrucciones',
      'login.emailSent': '¡Email Enviado!',
      'login.emailNotFound': 'Email no encontrado',
      'login.emailNotFoundMessage': 'El email no consta en nuestra base de datos Ultragaz.',
      'login.recoverInstructions': 'Ingresa tu email corporativo Ultragaz para recibir las instrucciones.',
      'login.emailSentMessage': 'Las instrucciones de recuperación fueron enviadas a',
      'login.checkInbox': 'Verifica tu bandeja de entrada y spam.',
      'login.backToLogin': 'Volver al Login',
      'login.tryAnotherEmail': 'Intentar otro email',
      'login.processing': 'Procesando',
      
      // General
      'common.store': 'Tienda',
      'common.language': 'Idioma',
      'common.selectLanguage': 'Seleccionar Idioma',
    },
    en: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.training': 'Training',
      'nav.admin': 'Administration',
      'nav.logout': 'Logout',
      
      // Dashboard
      'dashboard.welcome': 'Welcome',
      'dashboard.training': 'Training',
      'dashboard.reports': 'Reports',
      'dashboard.notifications': 'Notifications',
      'dashboard.history': 'History',
      'dashboard.attempts': 'Attempts',
      'dashboard.completed': 'Completed',
      'dashboard.start': 'Start',
      
      // Login
      'login.title': 'Training Portal',
      'login.titlePart1': 'Training',
      'login.titlePart2': 'Portal',
      'login.subtitle': 'Welcome to Ultragaz operational excellence simulator.',
      'login.username': 'Username',
      'login.password': 'Password',
      'login.forgot': 'Forgot my password',
      'login.submit': 'Enter System',
      'login.recover': 'Recover Access',
      'login.recoverEmail': 'Recovery Email',
      'login.sendInstructions': 'Send Instructions',
      'login.emailSent': 'Email Sent!',
      'login.emailNotFound': 'Email not found',
      'login.emailNotFoundMessage': 'The email is not in our Ultragaz database.',
      'login.recoverInstructions': 'Enter your Ultragaz corporate email to receive instructions.',
      'login.emailSentMessage': 'Recovery instructions have been sent to',
      'login.checkInbox': 'Check your inbox and spam folder.',
      'login.backToLogin': 'Back to Login',
      'login.tryAnotherEmail': 'Try another email',
      'login.processing': 'Processing',
      
      // General
      'common.store': 'Store',
      'common.language': 'Language',
      'common.selectLanguage': 'Select Language',
    },
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

