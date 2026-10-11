import React, { useState } from 'react';
import { ShoppingBag, Check, Crown, CircleUser, Mic, MessageSquare, LayoutTemplate, Gift, Medal } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isAdded?: boolean;
  lang: 'ar' | 'en';
}

const getCategoryIcon = (category: string) => {
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

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
  isAdded = false,
  lang,
}) => {
  const [imgError, setImgError] = useState(false);
  const IconComponent = getCategoryIcon(product.category);

  return (
    <div className="group relative flex flex-col rounded-2xl bg-[#0c162d]/90 hover:bg-[#0f1b36] border border-blue-900/40 hover:border-amber-400/60 transition-all duration-300 shadow-md shadow-blue-950/20 overflow-hidden">
      
      {/* Visual Container in matching unified background with subtle bottom border line */}
      <div
        onClick={() => onSelect(product)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onDragStart={(e) => {
          e.preventDefault();
          return false;
        }}
        className="relative aspect-square w-full overflow-hidden flex items-center justify-center p-1.5 sm:p-2 cursor-pointer bg-transparent border-b border-blue-900/40 select-none no-download-shield"
      >
        {!imgError && product.previewImage ? (
          <>
            <img
              src={product.previewImage}
              alt={product.name}
              onError={() => setImgError(true)}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className="relative z-10 w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 select-none pointer-events-none no-download"
            />
            {/* Transparent protective shield overlay: completely prevents downloading, saving, or right-clicking */}
            <div
              className="absolute inset-0 z-20 bg-transparent select-none"
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragStart={(e) => e.preventDefault()}
            />
          </>
        ) : (
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-amber-500/10 via-blue-900/20 to-blue-950/40 border border-amber-500/20 flex flex-col items-center justify-center p-2 text-center relative overflow-hidden group-hover:border-amber-400/40 transition-colors">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shadow-inner mb-1.5 group-hover:scale-110 transition-transform">
              <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-300/90 line-clamp-1 px-1">
              {lang === 'ar' ? product.name : (product.nameEn || product.name)}
            </span>
            <span className="text-[9px] text-slate-400 font-mono mt-0.5">
              {product.fileFormat || 'SVGA'}
            </span>
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 pt-1 space-y-2 bg-transparent">
        
        {/* Code & Format Meta */}
        <div className="flex items-center justify-between text-[11px] text-slate-300">
          <span className="font-mono text-amber-400 font-bold">{product.code}</span>
        </div>

        {/* Product Title */}
        <h3
          onClick={() => onSelect(product)}
          className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1 cursor-pointer"
        >
          {lang === 'ar' ? product.name : product.nameEn}
        </h3>

        {/* Price & Action Row - unified with entire card */}
        <div className="pt-2 mt-auto flex items-center justify-between gap-1 w-full min-w-0">
          <div className="flex items-baseline gap-1 shrink-0 min-w-0">
            <span className="text-base sm:text-lg font-black text-amber-400 font-mono tabular-nums leading-none">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] sm:text-[11px] text-slate-500 line-through font-mono tabular-nums leading-none">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={() => onAddToCart(product)}
            className={`px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold inline-flex items-center justify-center gap-1 whitespace-nowrap shrink-0 cursor-pointer shadow-xs border select-none transition-all ${
              isAdded
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10'
                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/35 hover:border-amber-400/60'
            }`}
          >
            {isAdded ? (
              <span className="inline-flex items-center gap-1 whitespace-nowrap leading-none">
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5] shrink-0" />
                <span className="whitespace-nowrap leading-none">{lang === 'ar' ? 'تم الطلب' : 'Ordered'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 whitespace-nowrap leading-none">
                <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="whitespace-nowrap leading-none">{lang === 'ar' ? 'طلب' : 'Buy'}</span>
              </span>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
