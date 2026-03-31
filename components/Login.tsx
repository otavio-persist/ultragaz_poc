
import React, { useState } from 'react';
import { MOCK_USERS } from '../constants';
import { User } from '../types';
import { X, Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import ultragazLogo from '@/components/ultragaz_logo.jpg';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';

const LOGO_URL = ultragazLogo;
const LOGIN_IMAGE_URL = "/ap-2.jpg";
const BRAND_NAME = 'Ultragaz';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t, language } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Estados para o modal de recuperação
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = MOCK_USERS.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Credenciais inválidas. Tente ultraitaim/123 ou joao/123');
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryStatus('loading');
    
    // Simulação de delay de rede
    setTimeout(() => {
      if (recoveryEmail.toLowerCase() === 'joao@ultragaz.com.br') {
        setRecoveryStatus('success');
      } else {
        setRecoveryStatus('error');
      }
    }, 1500);
  };

  const closeRecoveryModal = () => {
    setShowRecoveryModal(false);
    setRecoveryEmail('');
    setRecoveryStatus('idle');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden relative">
      {/* Seletor de Idioma - Canto superior direito */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>
      
      {/* Lado Esquerdo: Formulário */}
      <div
        className="flex-1 flex flex-col items-center justify-center py-12 px-8 md:px-16 lg:px-24 animate-in fade-in slide-in-from-left-4 duration-700 relative"
        style={{ background: 'linear-gradient(90deg, #0ff 60%, #0f0 100%)' }}
      >
        <div className="relative w-full max-w-sm space-y-10 bg-white/95 backdrop-blur-md rounded-[40px] shadow-2xl shadow-black/5 border border-white/60 p-8 md:p-10">
          <div className="flex flex-col items-start space-y-4">
            <div className="relative w-full">
              <img 
                src={LOGO_URL} 
                alt={`Logo ${BRAND_NAME}`} 
                className="w-full h-auto max-h-16 object-contain border-0 shadow-none outline-none ring-0 p-0 m-0"
              />
              <span className="absolute -top-1 -right-1 bg-[#000fff]/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm backdrop-blur-sm">
                POC
              </span>
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-tight">
                {t('login.titlePart1')} <br />
                <span className="text-gray-900">{t('login.titlePart2')}</span>
              </h1>
              <p className="text-gray-500 font-medium mt-2">
                {t('login.subtitle')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                {t('login.username')}
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#00AEEF] focus:bg-white focus:border-transparent outline-none text-gray-900 font-semibold transition-all placeholder:text-gray-300"
                placeholder="Ex: ultraitaim"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  {t('login.password')}
                </label>
                <button 
                  type="button"
                  className="text-[10px] font-bold text-[#005BBB] hover:underline uppercase tracking-wider"
                  onClick={() => setShowRecoveryModal(true)}
                >
                  {t('login.forgot')}
                </button>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#00AEEF] focus:bg-white focus:border-transparent outline-none text-gray-900 font-semibold transition-all placeholder:text-gray-300"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-[#000fff]/10 border border-[#000fff]/15 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-1 h-6 bg-[#000fff] rounded-full" />
                <p className="text-[#000fff] text-xs font-bold">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-5 bg-[#000fff] text-white font-black rounded-2xl text-lg hover:bg-[#000fff]/90 hover:shadow-xl hover:shadow-[#000fff]/10 transition-all active:scale-[0.98] shadow-lg shadow-[#000fff]/10"
            >
              {t('login.submit')}
            </button>

            
          </form>

          <div className="pt-8 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium text-center">
              © 2026 {BRAND_NAME}. Reservado para uso interno.
            </p>
          </div>
        </div>
      </div>

      {/* Lado Direito: Imagem Institucional */}
      <div className="hidden md:block flex-1 relative bg-gray-100">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent z-10" />
        <img 
          src={LOGIN_IMAGE_URL} 
          alt={`${BRAND_NAME} — imagem institucional`} 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Overlay com Frase de Efeito */}
        <div className="absolute bottom-16 left-16 right-16 z-20">
          <div className="bg-black/20 backdrop-blur-md p-8 rounded-[32px] border border-white/20 inline-block max-w-lg">
            <h2 className="text-3xl font-black text-white leading-tight mb-2">
              Energia para o dia a dia, com segurança e confiança.
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-[#00C48C] rounded-full" />
              <p className="text-white/80 font-bold uppercase text-[10px] tracking-widest">Energia & Sustentabilidade</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Recuperação de Senha */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-4 duration-500">
            <div className="relative p-8 md:p-10">
              <button 
                onClick={closeRecoveryModal}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-8 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-[#000fff]/10 rounded-3xl flex items-center justify-center text-[#000fff] shadow-sm">
                  <Mail size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">{t('login.recover')}</h3>
                  <p className="text-gray-500 text-sm font-medium mt-1">
                    {t('login.recoverInstructions')}
                  </p>
                </div>
              </div>

              {recoveryStatus === 'idle' || recoveryStatus === 'loading' ? (
                <form onSubmit={handleRecoverySubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      {t('login.recoverEmail')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input 
                        type="email" 
                        required
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#00AEEF] focus:bg-white outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300"
                        placeholder="exemplo@ultragaz.com.br"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={recoveryStatus === 'loading'}
                    className="w-full py-5 bg-[#000fff] text-white font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-[#000fff]/90 transition-all shadow-xl shadow-[#000fff]/10 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {recoveryStatus === 'loading' ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        {t('login.processing')}...
                      </>
                    ) : (
                      <>
                        {t('login.sendInstructions')}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              ) : recoveryStatus === 'success' ? (
                <div className="text-center space-y-6 py-4 animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto shadow-inner border border-green-100">
                    <CheckCircle2 size={40} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-gray-900">{t('login.emailSent')}</h4>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">
                      {t('login.emailSentMessage')} <span className="text-gray-900 font-bold">{recoveryEmail}</span>. 
                      {t('login.checkInbox')}
                    </p>
                  </div>
                  <button 
                    onClick={closeRecoveryModal}
                    className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-black transition-all"
                  >
                    {t('login.backToLogin')}
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-6 py-4 animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-[#000fff]/10 rounded-full flex items-center justify-center text-[#000fff] mx-auto shadow-inner border border-[#000fff]/15">
                    <AlertCircle size={40} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-gray-900">{t('login.emailNotFound')}</h4>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">
                      {t('login.emailNotFoundMessage')}
                    </p>
                  </div>
                  <button 
                    onClick={() => setRecoveryStatus('idle')}
                    className="w-full py-4 bg-[#000fff] text-white font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-[#000fff]/90 transition-all"
                  >
                    {t('login.tryAnotherEmail')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
