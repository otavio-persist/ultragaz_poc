
import React from 'react';
import { User, UserRole } from '../types';
import { 
  Info,
  LayoutDashboard, 
  GraduationCap, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Bot
} from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { AboutModal } from './AboutModal';
import { useLanguage } from '../contexts/LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  activePage: 'dashboard' | 'training' | 'admin' | 'pricing';
  onNavigate: (page: 'dashboard' | 'training' | 'admin' | 'pricing') => void;
  onLogout: () => void;
}

const LOGO_URL = '/favicon.png';
const BRAND_NAME = 'Ultragaz';

export const Layout: React.FC<LayoutProps> = ({ children, user, activePage, onNavigate, onLogout }) => {
  const { t } = useLanguage();
  const [isAboutOpen, setIsAboutOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const handleNav = (page: 'dashboard' | 'training' | 'admin') => {
    onNavigate(page);
    closeMobileMenu();
  };
  
  // Verifica se o usuário tem qualquer nível de privilégio administrativo
  const isAdmin = [
    UserRole.GLOBAL_ADMIN, 
    UserRole.COUNTRY_ADMIN, 
    UserRole.REGIONAL_ADMIN, 
    UserRole.ADMIN
  ].includes(user.role);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className="w-64 border-r border-[#000fff]/15 hidden md:flex flex-col"
        style={{ background: 'linear-gradient(180deg, #0ff 60%, #0f0 100%)' }}
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="relative">
              <img 
                src={LOGO_URL} 
                alt={`Logo ${BRAND_NAME}`} 
                className="w-10 h-10 object-contain border-0 shadow-none p-0 m-0"
              />
              <span className="absolute -top-0.5 -right-0.5 bg-[#000fff]/90 text-white text-[7px] font-bold px-1 py-0.5 rounded-sm backdrop-blur-sm">
                POC
              </span>
            </div>
            <span className="text-xl font-bold text-[#000fff] tracking-tight">{BRAND_NAME}</span>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => onNavigate('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activePage === 'dashboard' ? 'bg-white/60 text-[#000fff]' : 'text-[#000fff] hover:bg-white/35'
              }`}
            >
              <LayoutDashboard size={20} />
              {t('nav.dashboard')}
            </button>
            <button 
              onClick={() => onNavigate('training')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activePage === 'training' ? 'bg-white/60 text-[#000fff]' : 'text-[#000fff] hover:bg-white/35'
              }`}
            >
              <GraduationCap size={20} />
              {t('nav.training')}
            </button>
            {isAdmin && (
              <button 
                onClick={() => onNavigate('admin')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activePage === 'admin' ? 'bg-white/60 text-[#000fff]' : 'text-[#000fff] hover:bg-white/35'
                }`}
              >
                <Settings size={20} />
                {t('nav.admin')}
              </button>
            )}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-[#000fff]/15 space-y-3">
          {/* Botão Sobre */}
          <div className="px-2">
            <button 
              onClick={() => setIsAboutOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#000fff] hover:bg-white/35 transition-colors"
            >
              <Info size={18} className="text-[#000fff]" />
              Sobre o Sistema
            </button>
          </div>

          {/* Seletor de Idioma */}
          <div className="px-2">
            <LanguageSelector direction="up" />
          </div>

          <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

          
          {/* Perfil do Usuário */}
          <div className="flex items-center gap-3 p-2 bg-white/60 rounded-xl border border-[#000fff]/10">
            <div className="w-10 h-10 rounded-full bg-[#000fff] flex items-center justify-center text-white font-bold">
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{t('common.store')}: {user.storeId}</p>
            </div>
            <button onClick={onLogout} title={t('nav.logout')}>
              <LogOut size={18} className="text-gray-400 hover:text-[#000fff] cursor-pointer transition-colors" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 md:hidden">
           <div className="flex items-center gap-2">
            <div className="relative">
              <img 
                src={LOGO_URL} 
                alt={`Logo ${BRAND_NAME}`} 
                className="w-8 h-8 object-contain"
              />
              <span className="absolute -top-0.5 -right-0.5 bg-[#000fff]/90 text-white text-[7px] font-bold px-1 py-0.5 rounded-sm backdrop-blur-sm">
                POC
              </span>
            </div>
            <span className="font-bold text-[#000fff]">{BRAND_NAME}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Abrir menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* Overlay do menu mobile */}
        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />
            <aside
              className="fixed top-0 left-0 w-72 max-w-[85vw] h-full border-r border-[#000fff]/15 z-50 flex flex-col shadow-xl md:hidden animate-in slide-in-from-left duration-200"
              style={{ background: 'linear-gradient(180deg, #0ff 60%, #0f0 100%)' }}
            >
              <div className="p-6 flex items-center justify-between border-b border-[#000fff]/15">
                <div className="flex items-center gap-2">
                  <img src={LOGO_URL} alt="Logo" className="w-8 h-8 object-contain" />
                  <span className="font-bold text-[#000fff]">{BRAND_NAME}</span>
                </div>
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="p-2 rounded-lg text-[#000fff] hover:bg-white/35"
                  aria-label="Fechar menu"
                >
                  <X size={24} />
                </button>
              </div>
              <nav className="p-4 space-y-1 flex-1">
                <button
                  onClick={() => handleNav('dashboard')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activePage === 'dashboard' ? 'bg-white/60 text-[#000fff]' : 'text-[#000fff] hover:bg-white/35'
                  }`}
                >
                  <LayoutDashboard size={20} />
                  {t('nav.dashboard')}
                </button>
                <button
                  onClick={() => handleNav('training')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activePage === 'training' ? 'bg-white/60 text-[#000fff]' : 'text-[#000fff] hover:bg-white/35'
                  }`}
                >
                  <GraduationCap size={20} />
                  {t('nav.training')}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleNav('admin')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activePage === 'admin' ? 'bg-white/60 text-[#000fff]' : 'text-[#000fff] hover:bg-white/35'
                    }`}
                  >
                    <Settings size={20} />
                    {t('nav.admin')}
                  </button>
                )}
              </nav>
              <div className="p-4 border-t border-[#000fff]/15 space-y-2">
                <button
                  onClick={() => { setIsAboutOpen(true); closeMobileMenu(); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#000fff] hover:bg-white/35"
                >
                  <Info size={18} />
                  Sobre o Sistema
                </button>
                <div className="px-2">
                  <LanguageSelector direction="up" />
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-[#000fff]/10">
                  <div className="w-9 h-9 rounded-full bg-[#000fff] flex items-center justify-center text-white font-bold text-sm">
                    {user.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.storeName}</p>
                  </div>
                </div>
                <button
                  onClick={() => { onLogout(); closeMobileMenu(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#000fff] hover:bg-white/35 transition-colors"
                >
                  <LogOut size={20} />
                  Sair
                </button>
              </div>
            </aside>
          </>
        )}

        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
