import React from 'react';
import { ArrowLeft, ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import { Product, getWhatsAppUrl } from '../types';

interface HeroProps {
  flagshipProduct: Product;
  onExploreCatalog: () => void;
  onSelectProduct: (product: Product) => void;
  lang: 'ar' | 'en';
  supportPhone?: string;
}

export const Hero: React.FC<HeroProps> = ({
  flagshipProduct,
  onExploreCatalog,
  onSelectProduct,
  lang,
  supportPhone,
}) => {
  return (
    <section className="relative overflow-hidden border-b border-amber-500/15 py-10 lg:py-14 bg-black/40 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column (Right in RTL): Editorial Copy */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-5">
            
            {/* Top Label */}
            <div className="flex items-center gap-2.5 text-xs text-amber-400 font-bold tracking-wider">
              <span className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>SVGA 2.0 ANIMATIONS</span>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-300 font-mono text-[11px]">极品特效商城</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-emerald-400 font-medium">{lang === 'ar' ? 'تسليم فوري ومباشر' : 'Instant Delivery'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.2] tracking-tight text-balance">
              {lang === 'ar' ? (
                <>
                  المتجر المتخصص لأفخم{' '}
                  <span className="text-amber-400">
                    دخوليات وإطارات SVGA
                  </span>{' '}
                  للغرف الصوتية
                </>
              ) : (
                <>
                  The Ultimate{' '}
                  <span className="text-amber-400">
                    SVGA Effects & Frames
                  </span>{' '}
                  for Voice Rooms
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              {lang === 'ar'
                ? 'مؤثرات غرف يلا لودو، يوهو، وتوب توب مع أرقى تصاميم التنانين وسيارات السوبركار وتيجان الأفاتار المتحركة الأصلية بصيغة SVGA 2.0.'
                : 'Experience high quality vector animations for Yalla Ludo, YoHo, and TopTop voice rooms with genuine SVGA 2.0 animations and dynamic frames.'}
            </p>

            {/* Action Buttons (Flat, No Glow) */}
            <div className="flex flex-wrap items-center gap-3 pt-2 w-full sm:w-auto">
              <button
                onClick={onExploreCatalog}
                className="w-full sm:w-auto px-7 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm rounded-lg transition-colors flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>{lang === 'ar' ? 'استعراض الكتالوج' : 'Explore Catalog'}</span>
                {lang === 'ar' ? (
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                ) : (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                )}
              </button>

              <a
                href={getWhatsAppUrl(
                  supportPhone,
                  lang === 'ar'
                    ? 'السلام عليكم، أريد الاستفسار عن تصاميم الغرف الصوتية SVGA'
                    : 'Hello, I would like to inquire about SVGA voice room designs'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-sm border border-slate-700 hover:border-amber-500/50 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'ar' ? 'تواصل مع خدمة العملاء (واتساب)' : 'Chat on WhatsApp'}</span>
              </a>
            </div>

          </div>

          {/* Right Column: Featured Flagship Showcase Card */}
          <div className="lg:col-span-5">
            <div className="relative group rounded-2xl overflow-hidden bg-[#0c162d]/90 border border-blue-900/40 p-2 shadow-lg shadow-blue-950/20">
              
              {/* Product Visual Container */}
              <div
                className="relative aspect-video rounded-xl overflow-hidden flex items-center justify-center select-none no-download-shield"
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDragStart={(e) => {
                  e.preventDefault();
                }}
              >
                <img
                  src={flagshipProduct.previewImage}
                  alt={flagshipProduct.name}
                  referrerPolicy="no-referrer"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none pointer-events-none no-download"
                />
                {/* Transparent protective shield */}
                <div
                  className="absolute inset-0 z-10 bg-transparent select-none"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDragStart={(e) => e.preventDefault()}
                />

                {/* Floating Code Badge */}
                <div className="absolute top-3.5 right-3.5 bg-amber-500 text-black px-2.5 py-1 rounded text-xs font-black font-mono">
                  <span>{flagshipProduct.code}</span>
                </div>

                {/* Chinese Watermark Emblem */}
                <div className="absolute top-3.5 left-3.5 text-amber-400 font-mono text-xs font-extrabold bg-black/80 px-2 py-0.5 rounded border border-amber-500/30">
                  {flagshipProduct.nameZh || '极品进场'}
                </div>
              </div>

              {/* Product Card Details */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-amber-400 font-bold">{flagshipProduct.code}</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  {lang === 'ar' ? flagshipProduct.name : flagshipProduct.nameEn}
                </h3>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-lg font-black text-amber-400 font-mono">${flagshipProduct.price.toFixed(2)}</span>
                  <button
                    onClick={() => onSelectProduct(flagshipProduct)}
                    className="px-4 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {lang === 'ar' ? 'معاينة التفاصيل' : 'View Details'}
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
