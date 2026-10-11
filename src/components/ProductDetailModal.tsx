import React, { useState, useRef, useEffect } from 'react';
import { X, ShoppingBag, CheckCircle, Check, Crown, CircleUser, Mic, MessageSquare, LayoutTemplate, Gift, Medal } from 'lucide-react';
import { Product, isVideoUrl } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  lang: 'ar' | 'en';
}

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'avatar_frames':
      return CircleUser;
    case 'entrance_effects':
      return Crown;
    case 'gifts':
      return Gift;
    case 'medals':
      return Medal;
    case 'mic_frames':
      return Mic;
    case 'chat_bubbles':
      return MessageSquare;
    case 'room_themes':
      return LayoutTemplate;
    default:
      return Gift;
  }
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  lang,
}) => {
  const [imgError, setImgError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsAdded(false);
  }, [product?.id]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // If browser strictly blocks unmuted autoplay without another gesture,
          // it keeps the unmuted status and awaits standard user play on controls.
          console.warn('Autoplay with sound handled:', err);
        });
      }
    }
  }, [product]);

  if (!product) return null;

  const IconComponent = getCategoryIcon(product.category);

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#050b18]/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-backdrop-fade">
      <div className="relative w-full max-w-3xl bg-[#091326]/85 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 rtl:left-4 rtl:right-auto ltr:right-4 ltr:left-auto z-20 p-2 text-slate-300 hover:text-white bg-[#060c1a]/80 hover:bg-[#0c162e] rounded-full transition-colors border border-white/10 cursor-pointer shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12">
          
          {/* Visual Showcase (Right half in Arabic RTL / Left in LTR) */}
          <div className="md:col-span-5 bg-[#060c1a]/70 p-6 flex flex-col items-center justify-center relative border-b md:border-b-0 rtl:md:border-l-0 rtl:md:border-r ltr:md:border-l border-white/10">
            <div className="relative w-full aspect-square max-w-[280px] flex items-center justify-center">
              {product.previewVideoUrl || (product.previewImage && isVideoUrl(product.previewImage)) ? (
                <div className="w-full h-full rounded-2xl overflow-hidden bg-black/90 shadow-xl flex items-center justify-center relative">
                  <video
                    ref={videoRef}
                    src={product.previewVideoUrl || product.previewImage}
                    poster={!isVideoUrl(product.previewImage) ? product.previewImage : undefined}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-contain rounded-2xl bg-black outline-none border-0"
                  />
                </div>
              ) : !imgError && product.previewImage ? (
                <div
                  className="relative w-full h-full flex items-center justify-center select-none no-download-shield"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDragStart={(e) => {
                    e.preventDefault();
                  }}
                >
                  <img
                    src={product.previewImage}
                    alt={product.name}
                    onError={() => setImgError(true)}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    className="relative z-10 w-full h-full object-contain select-none pointer-events-none no-download"
                  />
                  {/* Transparent protective shield */}
                  <div
                    className="absolute inset-0 z-20 bg-transparent select-none"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </div>
              ) : (
                <div className="w-full h-full rounded-2xl bg-[#060c1a]/90 border border-white/10 flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center shadow-lg mb-2">
                    <IconComponent className="w-10 h-10 text-amber-400" />
                  </div>
                  <span className="text-sm font-bold text-amber-300">
                    {lang === 'ar' ? product.name : (product.nameEn || product.name)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono mt-1">
                    {product.code} · {product.fileFormat || 'SVGA'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Details & Specs (Right/Bottom) */}
          <div className="md:col-span-7 p-6 flex flex-col justify-between space-y-4">
            
            <div className="space-y-3">
              {/* Top metadata */}
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-mono text-amber-400 font-bold bg-[#060c1a]/80 px-2.5 py-1 rounded-md border border-white/10">
                  {product.code}
                </span>
              </div>

              {/* Title */}
              <div>
                <h2 className="text-xl font-black text-white leading-snug">
                  {lang === 'ar' ? product.name : product.nameEn}
                </h2>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed">
                {product.description}
              </p>

              {/* Technical Specifications Grid */}
              <div className="pt-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {lang === 'ar' ? 'المواصفات الفنية المعتمدة' : 'Technical Specifications'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-[#060c1a]/70 p-2.5 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[10px]">{lang === 'ar' ? 'صيغة الملف' : 'Format'}</span>
                    <span className="font-bold text-white font-mono">{product.fileFormat || 'SVGA 2.0'}</span>
                  </div>
                  <div className="bg-[#060c1a]/70 p-2.5 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[10px]">{lang === 'ar' ? 'حجم الملف' : 'File Size'}</span>
                    <span className="font-bold text-white font-mono">{product.fileSize}</span>
                  </div>
                  <div className="bg-[#060c1a]/70 p-2.5 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[10px]">{lang === 'ar' ? 'حالة التوافق' : 'Compatibility'}</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تسليم فوري' : 'Instant Delivery'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Supported Platforms */}
              <div className="pt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'متوافق مع جميع التطبيقات' : 'Compatible with all voice chat apps'}</span>
                </span>
              </div>
            </div>

            {/* Price & Purchase Bar (Flat Buttons, No Glow) */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-slate-400 block">{lang === 'ar' ? 'السعر النهائي' : 'Price'}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-400 font-mono tabular-nums">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xs text-slate-500 line-through font-mono tabular-nums">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onAddToCart(product);
                    setIsAdded(true);
                    setTimeout(() => setIsAdded(false), 2200);
                  }}
                  className={`px-6 py-2.5 font-bold text-xs rounded-lg border transition-all flex items-center gap-2 cursor-pointer shadow-xs select-none ${
                    isAdded
                      ? 'bg-emerald-500/20 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/35'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                      <span className="text-emerald-300 font-bold">{lang === 'ar' ? 'تم الإضافة' : 'Added to Cart'}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-amber-400" />
                      <span>{lang === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
