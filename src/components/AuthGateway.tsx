import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus
} from 'lucide-react';
import { AuthUser, isVideoUrl, isYouTubeUrl, getYouTubeEmbedUrl, BanStatus, checkUserBanStatus } from '../types';
import { loginUser, registerUser, AccountBannedError, getAllRegisteredUsers } from '../lib/authService';
import { BanModal } from './BanModal';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, cleanPlainText } from '../lib/security';

interface AuthGatewayProps {
  onLoginSuccess: (user: AuthUser) => void;
  lang: 'ar' | 'en';
  logoIconUrl?: string;
  backgroundImageUrl?: string;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({ 
  onLoginSuccess, 
  lang,
  logoIconUrl,
  backgroundImageUrl,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [banModalStatus, setBanModalStatus] = useState<BanStatus | null>(null);

  // Preload users in background to keep data fresh
  useEffect(() => {
    getAllRegisteredUsers().catch(() => {});

    const handleUnbanEvent = () => {
      setBanModalStatus(null);
      setErrorMessage('');
    };
    window.addEventListener('filex_user_unbanned', handleUnbanEvent);
    return () => window.removeEventListener('filex_user_unbanned', handleUnbanEvent);
  }, []);

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Anti-Brute-Force & Rate Limiting Defense
    const rateCheck = checkRateLimit(`auth_${mode}`);
    if (!rateCheck.allowed) {
      setErrorMessage(
        lang === 'ar'
          ? `تم رصد محاولات متعددة غير مصرح بها. لحمايتك تم تقييد المحاولة مؤقتاً لمدة ${rateCheck.waitSeconds} ثانية.`
          : `Multiple failed attempts detected. Access temporarily restricted for ${rateCheck.waitSeconds}s.`
      );
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setErrorMessage(
          lang === 'ar' 
            ? 'كلمة المرور وتأكيد كلمة المرور غير متطابقتين، يرجى التأكد.' 
            : 'Passwords do not match, please verify.'
        );
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const user = await loginUser(email.trim(), password);
        resetRateLimit(`auth_${mode}`);
        onLoginSuccess(user);
      } else {
        const safeName = cleanPlainText(name);
        const user = await registerUser({
          name: safeName,
          email: email.trim(),
          password
        });
        resetRateLimit(`auth_${mode}`);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      recordFailedAttempt(`auth_${mode}`);
      if (err instanceof AccountBannedError || err?.banStatus) {
        setBanModalStatus(err.banStatus);
        setErrorMessage(
          lang === 'ar'
            ? 'لا يمكنك الدخول، تم تقييد هذا الحساب من قبل الإدارة.'
            : 'Access restricted, your account has been suspended.'
        );
      } else {
        setErrorMessage(err.message || 'حدث خطأ أثناء المحاولة، يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const bgSource = backgroundImageUrl || 'https://files.catbox.moe/i9b55z.jpg';
  const isVideo = isVideoUrl(bgSource);
  const isYouTube = isYouTubeUrl(bgSource);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative font-sans text-slate-100 overflow-hidden">
      {/* Background Layer: Animated YouTube, Video, or Static/GIF Image */}
      {isYouTube ? (
        <iframe
          key={bgSource}
          src={getYouTubeEmbedUrl(bgSource) || ''}
          title="Login Background Video"
          className="fixed top-1/2 left-1/2 w-[180vw] min-w-full h-[60vw] min-h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none border-0 opacity-80 z-0"
          allow="autoplay; encrypted-media"
        />
      ) : isVideo ? (
        <video
          key={bgSource}
          autoPlay
          loop
          muted
          playsInline
          className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none"
          src={bgSource}
          ref={(el) => {
            if (el) {
              el.muted = true;
              el.play().catch(() => {});
            }
          }}
        />
      ) : (
        <div
          className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0 pointer-events-none"
          style={{
            backgroundImage: `url('${bgSource}')`,
          }}
        />
      )}

      {/* Cinematic dark tint overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a1226]/75 via-[#0b162e]/85 to-[#091124]/95 z-0 pointer-events-none" />

      <div className="w-full max-w-[370px] relative z-10 space-y-4">
        
        {/* Brand Header */}
        <div className="text-center space-y-1.5 flex flex-col items-center">
          {logoIconUrl ? (
            <div className="logo-shimmer-container w-14 h-14 rounded-2xl mb-1 shrink-0">
              <img
                src={logoIconUrl}
                alt="FILEX STORE"
                referrerPolicy="no-referrer"
                className="w-full h-full aspect-square object-contain rounded-2xl drop-shadow-md select-none"
              />
            </div>
          ) : (
            <div className="logo-shimmer-container inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/25 to-amber-600/20 border border-amber-400/50 mb-1 shrink-0 shadow-lg shadow-amber-500/10">
              <span className="text-3xl font-black tracking-tighter text-amber-300 font-sans leading-none select-none">F</span>
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span className="whitespace-nowrap">FILEX STORE</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-300">
            {lang === 'ar'
              ? 'متجر إطارات ودخوليات الغرف الصوتية SVGA الفاخرة'
              : 'Premium Voice Room SVGA Effects Store'}
          </p>
        </div>

        {/* Auth Card - Pure transparent without blur or smoke with clean opacity */}
        <div className="rounded-2xl bg-[#091326]/65 border border-white/10 p-5 sm:p-6 shadow-2xl space-y-5">
          
          {/* Mode Switch Tabs - Transparent Amber when Active */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#060c1a]/55 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setConfirmPassword('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
                setConfirmPassword('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'register'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إنشاء حساب جديد' : 'Register'}</span>
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            
            {/* Name Field (Register Mode Only) */}
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold text-[11px]">
                  {lang === 'ar' ? 'الاسم أو اللقب:' : 'Full Name or Nickname:'}
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'ar' ? 'اكتب اسمك أو لقبك هنا' : 'Your name or handle'}
                    className="w-full bg-[#060c1a]/55 border border-white/10 rounded-xl py-2 px-8 text-xs text-white focus:outline-none focus:border-amber-400 shadow-xs placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold text-[11px]">
                {lang === 'ar' ? 'البريد الإلكتروني:' : 'Email Address:'}
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#060c1a]/55 border border-white/10 rounded-xl py-2 px-8 text-xs text-white focus:outline-none focus:border-amber-400 font-mono shadow-xs placeholder-slate-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold text-[11px]">
                {lang === 'ar' ? 'كلمة المرور:' : 'Password:'}
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#060c1a]/55 border border-white/10 rounded-xl py-2 px-8 text-xs text-white focus:outline-none focus:border-amber-400 font-mono shadow-xs placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 left-3 rtl:left-3 rtl:right-auto ltr:right-3 ltr:left-auto text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Register Mode Only) */}
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold text-[11px]">
                  {lang === 'ar' ? 'تأكيد كلمة المرور:' : 'Confirm Password:'}
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#060c1a]/55 border border-white/10 rounded-xl py-2 px-8 text-xs text-white focus:outline-none focus:border-amber-400 font-mono shadow-xs placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 -translate-y-1/2 left-3 rtl:left-3 rtl:right-auto ltr:right-3 ltr:left-auto text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button - Transparent Amber with soft border */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 mt-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 disabled:opacity-50 font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'دخول المتجر' : 'Enter Store'}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'إنشاء الحساب ودخول المتجر' : 'Create Account & Enter'}</span>
                </>
              )}
            </button>
          </form>

        </div>

      </div>

      {/* Ban Notification Modal */}
      <BanModal
        isOpen={!!banModalStatus}
        banStatus={banModalStatus}
        onClose={() => setBanModalStatus(null)}
        lang={lang}
      />
    </div>
  );
};

