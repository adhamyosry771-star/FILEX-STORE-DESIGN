import React from 'react';
import { MessageSquare } from 'lucide-react';

import { getWhatsAppUrl } from '../types';

interface FooterProps {
  lang: 'ar' | 'en';
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
  logoIconUrl?: string;
  supportPhone?: string;
}

export const Footer: React.FC<FooterProps> = ({ lang, logoIconUrl, supportPhone }) => {
  return (
    <footer className="border-none bg-transparent text-slate-400 text-xs mt-16">
      {/* Main Footer Links & Wordmark */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand Wordmark */}
        <div className="flex items-center gap-2.5">
          {logoIconUrl ? (
            <div className="logo-shimmer-container w-7 h-7 rounded shrink-0">
              <img
                src={logoIconUrl}
                alt="FILEX STORE"
                referrerPolicy="no-referrer"
                className="w-full h-full aspect-square object-contain rounded drop-shadow-md select-none"
              />
            </div>
          ) : (
            <div className="logo-shimmer-container w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-black text-xs shadow-xs shrink-0">
              <span className="text-xs font-black tracking-tighter text-amber-300 font-sans leading-none select-none">F</span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-black text-sm block whitespace-nowrap">FILEX STORE</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {lang === 'ar' ? 'متجر إطارات ودخوليات الغرف الصوتية 2026' : 'Voice Room SVGA Frames & Entrances 2026'}
            </span>
          </div>
        </div>

        {/* Quiet Clean Text Links */}
        <div className="flex items-center gap-6 text-xs text-slate-300">
          <a
            href={getWhatsAppUrl(supportPhone)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-white active:text-white focus:text-white transition-colors flex items-center gap-1.5 cursor-pointer select-none"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ar' ? 'خدمة العملاء والدعم الفني (واتساب)' : 'WhatsApp Support'}</span>
          </a>
        </div>

        {/* Quiet Copyright */}
        <div className="text-[11px] text-slate-500 font-mono">
          © 2026 FILEX STORE. All rights reserved.
        </div>

      </div>
    </footer>
  );
};
