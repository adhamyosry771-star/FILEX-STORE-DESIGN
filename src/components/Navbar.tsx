import React from 'react';
import { ShoppingBag, SlidersHorizontal, LogOut, User, Snowflake, ClipboardList } from 'lucide-react';
import { ProductCategory, AuthUser, canAccessAdmin, isMasterAdmin } from '../types';

interface NavbarProps {
  activeCategory: ProductCategory;
  onSelectCategory: (cat: ProductCategory) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenNotifications?: () => void;
  isSnowing?: boolean;
  onToggleSnow?: () => void;
  onOpenOrders?: () => void;
  ordersCount?: number;
  isAdminOpen: boolean;
  onToggleAdmin: () => void;
  lang: 'ar' | 'en';
  onToggleLang: () => void;
  user: AuthUser | null;
  onLogout: () => void;
  logoIconUrl?: string;
}

const getDisplayUserId = (u: { id?: string; email?: string; role?: string }) => {
  if (!u) return '10000';
  const lower = u.email?.toLowerCase() || '';
  if (
    u.role === 'admin' ||
    lower === 'tolex907@gmail.com' ||
    lower === 'admin@filex.store'
  ) {
    return '10000';
  }
  if (u.id && /^\d{5,}$/.test(u.id)) {
    return u.id;
  }
  if (lower.includes('alex')) return '10001';
  if (lower.includes('tolex666')) return '10002';
  return '10001';
};

const getDisplayName = (u?: { displayName?: string; email?: string; role?: string } | null) => {
  if (!u) return 'FILEX';
  const lower = u.email?.toLowerCase() || '';
  if (
    lower === 'tolex907@gmail.com' ||
    lower === 'admin@filex.store' ||
    u.role === 'admin' ||
    u.displayName?.includes('المدير')
  ) {
    return 'FILEX';
  }
  return u.displayName || 'FILEX';
};

export const Navbar: React.FC<NavbarProps> = ({
  activeCategory,
  onSelectCategory,
  cartCount,
  onOpenCart,
  onOpenNotifications,
  isSnowing = false,
  onToggleSnow,
  onOpenOrders,
  ordersCount = 0,
  isAdminOpen,
  onToggleAdmin,
  lang,
  onToggleLang,
  user,
  onLogout,
  logoIconUrl,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-transparent">
      {/* Strict 3-zone contract with widened container to allow extra room */}
      <div className="max-w-[1440px] w-full mx-auto px-3 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-2.5 lg:gap-4">
        
        {/* Zone 1: Single text element wordmark shifted right to expand category room */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 rtl:-mr-1 ltr:-ml-1">
          <button
            onClick={() => onSelectCategory('all')}
            className="flex items-center gap-2 sm:gap-2.5 text-left focus:outline-none cursor-pointer shrink-0"
          >
            {logoIconUrl ? (
              <div className="logo-shimmer-container w-8 h-8 rounded-lg shrink-0">
                <img
                  src={logoIconUrl}
                  alt="FILEX STORE"
                  referrerPolicy="no-referrer"
                  className="w-full h-full aspect-square object-contain rounded-lg drop-shadow-md select-none transition-transform hover:scale-105"
                />
              </div>
            ) : (
              /* Glass Brand Box with crystalline reflection and letter F */
              <div className="logo-shimmer-container w-8 h-8 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 hover:border-amber-300/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-xs flex items-center justify-center text-amber-300 font-black transition-all shrink-0">
                <span className="text-base font-black tracking-tighter text-amber-300 font-sans leading-none select-none">F</span>
              </div>
            )}
            <div className="flex items-center shrink-0">
              <span className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-white select-none whitespace-nowrap">
                FILEX STORE
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: clean text navigation links (visible on xl and wide screens to ensure all action buttons fit without clipping) */}
        <nav className="hidden xl:flex items-center gap-2 xl:gap-3.5 2xl:gap-5 text-xs xl:text-sm font-medium text-slate-300 shrink-0">
          <button
            onClick={() => {
              if (isAdminOpen) onToggleAdmin();
              onSelectCategory('all');
            }}
            className={`transition-colors hover:text-white cursor-pointer whitespace-nowrap shrink-0 ${
              activeCategory === 'all' && !isAdminOpen ? 'text-white font-bold border-b-2 border-amber-400 pb-1 -mb-1' : ''
            }`}
          >
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </button>
          <button
            onClick={() => {
              if (isAdminOpen) onToggleAdmin();
              onSelectCategory('avatar_frames');
            }}
            className={`transition-colors hover:text-white cursor-pointer whitespace-nowrap shrink-0 ${
              activeCategory === 'avatar_frames' && !isAdminOpen ? 'text-white font-bold border-b-2 border-amber-400 pb-1 -mb-1' : ''
            }`}
          >
            {lang === 'ar' ? 'اطارات' : 'Frames'}
          </button>
          <button
            onClick={() => {
              if (isAdminOpen) onToggleAdmin();
              onSelectCategory('entrance_effects');
            }}
            className={`transition-colors hover:text-white cursor-pointer whitespace-nowrap shrink-0 ${
              activeCategory === 'entrance_effects' && !isAdminOpen ? 'text-white font-bold border-b-2 border-amber-400 pb-1 -mb-1' : ''
            }`}
          >
            {lang === 'ar' ? 'دخوليات' : 'Entrances'}
          </button>
          <button
            onClick={() => {
              if (isAdminOpen) onToggleAdmin();
              onSelectCategory('gifts');
            }}
            className={`transition-colors hover:text-white cursor-pointer whitespace-nowrap shrink-0 ${
              activeCategory === 'gifts' && !isAdminOpen ? 'text-white font-bold border-b-2 border-amber-400 pb-1 -mb-1' : ''
            }`}
          >
            {lang === 'ar' ? 'هدايا' : 'Gifts'}
          </button>
          <button
            onClick={() => {
              if (isAdminOpen) onToggleAdmin();
              onSelectCategory('medals');
            }}
            className={`transition-colors hover:text-white cursor-pointer whitespace-nowrap shrink-0 ${
              activeCategory === 'medals' && !isAdminOpen ? 'text-white font-bold border-b-2 border-amber-400 pb-1 -mb-1' : ''
            }`}
          >
            {lang === 'ar' ? 'ميداليات' : 'Medals'}
          </button>
          <button
            onClick={() => {
              if (isAdminOpen) onToggleAdmin();
              onSelectCategory('mic_frames');
            }}
            className={`transition-colors hover:text-white cursor-pointer whitespace-nowrap shrink-0 ${
              activeCategory === 'mic_frames' && !isAdminOpen ? 'text-white font-bold border-b-2 border-amber-400 pb-1 -mb-1' : ''
            }`}
          >
            {lang === 'ar' ? 'مؤثرات مايك' : 'Mic Waves'}
          </button>
          <button
            onClick={() => {
              if (isAdminOpen) onToggleAdmin();
              onSelectCategory('chat_bubbles');
            }}
            className={`transition-colors hover:text-white cursor-pointer whitespace-nowrap shrink-0 ${
              activeCategory === 'chat_bubbles' && !isAdminOpen ? 'text-white font-bold border-b-2 border-amber-400 pb-1 -mb-1' : ''
            }`}
          >
            {lang === 'ar' ? 'فقاعات الدردشه' : 'Chat Bubbles'}
          </button>
          <button
            onClick={() => {
              if (isAdminOpen) onToggleAdmin();
              onSelectCategory('room_themes');
            }}
            className={`transition-colors hover:text-white cursor-pointer whitespace-nowrap shrink-0 ${
              activeCategory === 'room_themes' && !isAdminOpen ? 'text-white font-bold border-b-2 border-amber-400 pb-1 -mb-1' : ''
            }`}
          >
            {lang === 'ar' ? 'ثيمات الغرفه' : 'Room Themes'}
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Admin -> Language -> User Profile -> Cart) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Admin Dashboard Toggle - Strictly visible to Admin or Authorized Moderator */}
          {canAccessAdmin(user) && (
            <button
              onClick={onToggleAdmin}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-200 cursor-pointer backdrop-blur-xs shrink-0 ${
                isAdminOpen
                  ? 'bg-amber-500/20 text-amber-300 font-bold border-amber-400'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/50 hover:border-amber-400'
              }`}
            >
              <span className="p-1 rounded-lg flex items-center justify-center transition-colors bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </span>
              <span className="hidden sm:inline whitespace-nowrap font-medium">
                {isAdminOpen
                  ? (lang === 'ar' ? 'العودة للمتجر' : 'Back to Store')
                  : (lang === 'ar' ? 'لوحة التحكم' : 'Admin Panel')}
              </span>
            </button>
          )}

          {/* Language Switch */}
          <button
            onClick={onToggleLang}
            className="flex items-center justify-center px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-100 hover:text-white bg-white/[0.09] hover:bg-white/[0.18] border border-white/20 hover:border-white/40 rounded-xl transition-all duration-200 cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-xs focus:outline-hidden shrink-0"
            title={lang === 'ar' ? 'EN' : 'AR'}
            aria-label={lang === 'ar' ? 'Switch to English' : 'Switch to Arabic'}
          >
            <span className="font-mono tracking-wider font-extrabold">{lang === 'ar' ? 'EN' : 'AR'}</span>
          </button>

          {/* User Profile Badge & Logout (Displayed directly before Cart button) */}
          {user && (
            <div className="flex items-center gap-1.5 p-1 px-2 rounded-xl bg-white/[0.08] border border-white/15 text-xs">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">
                {getDisplayName(user).charAt(0)?.toUpperCase() || 'F'}
              </div>
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="font-bold text-white max-w-[70px] sm:max-w-[100px] truncate">
                  {getDisplayName(user)}
                </span>
                <span className="text-[10px] text-slate-300 font-mono font-bold">
                  ID: {getDisplayUserId(user)}
                </span>
              </div>
              {isMasterAdmin(user) ? (
                <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-mono font-black hidden md:inline">
                  ADMIN
                </span>
              ) : (user.role === 'moderator' || user.isModerator) ? (
                <span className="text-[9px] bg-cyan-400 text-black px-1.5 py-0.2 rounded font-mono font-black hidden md:inline">
                  مشرف
                </span>
              ) : null}
              <button
                onClick={onLogout}
                title={lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                className="p-1 hover:text-red-400 text-slate-400 transition-colors ml-1 rtl:mr-1 rtl:ml-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Snow Effect Falling Toggle Button (Transparent Glass Tile with 360 Spin) */}
          <button
            onClick={onToggleSnow || onOpenNotifications}
            className="relative p-2.5 text-slate-100 hover:text-white bg-white/[0.09] hover:bg-white/[0.18] border border-white/20 hover:border-white/40 rounded-xl transition-all duration-200 cursor-pointer backdrop-blur-xs flex items-center justify-center shrink-0 focus:outline-hidden shadow-none"
            aria-label={lang === 'ar' ? (isSnowing ? 'إيقاف تساقط الثلج' : 'تشغيل تساقط الثلج') : (isSnowing ? 'Stop Snow' : 'Let it Snow')}
            title={lang === 'ar' ? (isSnowing ? 'إيقاف تساقط الثلج ❄️' : 'تشغيل تساقط الثلج ❄️') : (isSnowing ? 'Stop Snow ❄️' : 'Let it Snow ❄️')}
          >
            <Snowflake className={`w-4 h-4 text-slate-100 ${isSnowing ? 'animate-[spin_3.5s_linear_infinite]' : 'transition-transform duration-500'}`} />
          </button>

          {/* My Orders / Order History Button (Glass Tile - identical transparency to Cart and Notifications) */}
          <button
            onClick={onOpenOrders}
            className="relative p-2.5 text-slate-100 hover:text-white bg-white/[0.09] hover:bg-white/[0.18] border border-white/20 hover:border-white/40 rounded-xl transition-all duration-200 cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-xs flex items-center justify-center shrink-0 focus:outline-hidden"
            aria-label={lang === 'ar' ? 'سجل الطلبات' : 'Order History'}
            title={lang === 'ar' ? 'سجل الطلبات' : 'Order History'}
          >
            <ClipboardList className="w-4 h-4 text-slate-100 hover:text-white" />
            {ordersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 px-1 bg-amber-500 text-black font-black text-[10px] rounded-full flex items-center justify-center shadow-md animate-scale-in">
                {ordersCount}
              </span>
            )}
          </button>

          {/* Cart Button (Glass Tile - transparent neutral with counter badge) */}
          <button
            onClick={onOpenCart}
            className="relative p-2.5 text-slate-100 hover:text-white bg-white/[0.09] hover:bg-white/[0.18] border border-white/20 hover:border-white/40 rounded-xl transition-all duration-200 cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-xs flex items-center justify-center shrink-0 focus:outline-hidden"
            aria-label="Shopping Cart"
            title={lang === 'ar' ? 'سلة المشتريات' : 'Shopping Cart'}
          >
            <ShoppingBag className="w-4 h-4 text-slate-100" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 px-1 bg-amber-500 text-black font-black text-[10px] rounded-full flex items-center justify-center shadow-md animate-scale-in">
                {cartCount}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* Mobile Category Bar (Glass pills directly on background) */}
      <div className="md:hidden bg-transparent px-3 py-2.5 overflow-x-auto flex items-center gap-2 text-xs scrollbar-none">
        <button
          onClick={() => {
            if (isAdminOpen) onToggleAdmin();
            onSelectCategory('all');
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-all ${
            activeCategory === 'all' && !isAdminOpen
              ? 'bg-amber-500/15 text-white font-bold border border-amber-500/35 shadow-xs backdrop-blur-xs'
              : 'bg-white/[0.08] text-slate-200 hover:text-white hover:bg-white/[0.15] border border-white/15'
          }`}
        >
          {lang === 'ar' ? 'الكل' : 'All'}
        </button>
        <button
          onClick={() => {
            if (isAdminOpen) onToggleAdmin();
            onSelectCategory('avatar_frames');
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-all ${
            activeCategory === 'avatar_frames' && !isAdminOpen
              ? 'bg-amber-500/15 text-white font-bold border border-amber-500/35 shadow-xs backdrop-blur-xs'
              : 'bg-white/[0.08] text-slate-200 hover:text-white hover:bg-white/[0.15] border border-white/15'
          }`}
        >
          {lang === 'ar' ? 'اطارات' : 'Frames'}
        </button>
        <button
          onClick={() => {
            if (isAdminOpen) onToggleAdmin();
            onSelectCategory('entrance_effects');
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-all ${
            activeCategory === 'entrance_effects' && !isAdminOpen
              ? 'bg-amber-500/15 text-white font-bold border border-amber-500/35 shadow-xs backdrop-blur-xs'
              : 'bg-white/[0.08] text-slate-200 hover:text-white hover:bg-white/[0.15] border border-white/15'
          }`}
        >
          {lang === 'ar' ? 'دخوليات' : 'Entrances'}
        </button>
        <button
          onClick={() => {
            if (isAdminOpen) onToggleAdmin();
            onSelectCategory('gifts');
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-all ${
            activeCategory === 'gifts' && !isAdminOpen
              ? 'bg-amber-500/15 text-white font-bold border border-amber-500/35 shadow-xs backdrop-blur-xs'
              : 'bg-white/[0.08] text-slate-200 hover:text-white hover:bg-white/[0.15] border border-white/15'
          }`}
        >
          {lang === 'ar' ? 'هدايا' : 'Gifts'}
        </button>
        <button
          onClick={() => {
            if (isAdminOpen) onToggleAdmin();
            onSelectCategory('medals');
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-all ${
            activeCategory === 'medals' && !isAdminOpen
              ? 'bg-amber-500/15 text-white font-bold border border-amber-500/35 shadow-xs backdrop-blur-xs'
              : 'bg-white/[0.08] text-slate-200 hover:text-white hover:bg-white/[0.15] border border-white/15'
          }`}
        >
          {lang === 'ar' ? 'ميداليات' : 'Medals'}
        </button>
        <button
          onClick={() => {
            if (isAdminOpen) onToggleAdmin();
            onSelectCategory('mic_frames');
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-all ${
            activeCategory === 'mic_frames' && !isAdminOpen
              ? 'bg-amber-500/15 text-white font-bold border border-amber-500/35 shadow-xs backdrop-blur-xs'
              : 'bg-white/[0.08] text-slate-200 hover:text-white hover:bg-white/[0.15] border border-white/15'
          }`}
        >
          {lang === 'ar' ? 'مؤثرات مايك' : 'Mic Waves'}
        </button>
        <button
          onClick={() => {
            if (isAdminOpen) onToggleAdmin();
            onSelectCategory('chat_bubbles');
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-all ${
            activeCategory === 'chat_bubbles' && !isAdminOpen
              ? 'bg-amber-500/15 text-white font-bold border border-amber-500/35 shadow-xs backdrop-blur-xs'
              : 'bg-white/[0.08] text-slate-200 hover:text-white hover:bg-white/[0.15] border border-white/15'
          }`}
        >
          {lang === 'ar' ? 'فقاعات الدردشه' : 'Chat Bubbles'}
        </button>
        <button
          onClick={() => {
            if (isAdminOpen) onToggleAdmin();
            onSelectCategory('room_themes');
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-all ${
            activeCategory === 'room_themes' && !isAdminOpen
              ? 'bg-amber-500/15 text-white font-bold border border-amber-500/35 shadow-xs backdrop-blur-xs'
              : 'bg-white/[0.08] text-slate-200 hover:text-white hover:bg-white/[0.15] border border-white/15'
          }`}
        >
          {lang === 'ar' ? 'ثيمات الغرفه' : 'Room Themes'}
        </button>
      </div>
    </header>
  );
};
