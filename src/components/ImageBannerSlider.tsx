import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { StoreBanner, DEFAULT_BANNERS } from '../types';

interface ImageBannerSliderProps {
  banners?: StoreBanner[];
  onSelectProductById?: (productId: string) => void;
  lang: 'ar' | 'en';
}

export const ImageBannerSlider: React.FC<ImageBannerSliderProps> = ({
  banners = [],
  onSelectProductById,
  lang,
}) => {
  // Only display banners explicitly added by the admin - no fake/mock banners
  if (!banners || banners.length === 0) {
    return null;
  }

  const activeBanners = banners;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Keep current slide within bounds
  useEffect(() => {
    if (currentSlide >= activeBanners.length) {
      setCurrentSlide(0);
    }
  }, [activeBanners.length, currentSlide]);

  const nextSlide = useCallback(() => {
    if (activeBanners.length <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
  }, [activeBanners.length]);

  const prevSlide = useCallback(() => {
    if (activeBanners.length <= 1) return;
    setCurrentSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length]);

  useEffect(() => {
    if (isPaused || activeBanners.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, activeBanners.length]);

  // Language-aware banner helpers
  const getBannerImage = (b: StoreBanner): string => {
    if (lang === 'en') {
      return (b.imageUrlEn && b.imageUrlEn.trim()) || (b.imageUrlAr && b.imageUrlAr.trim()) || b.imageUrl || '';
    }
    return (b.imageUrlAr && b.imageUrlAr.trim()) || b.imageUrl || (b.imageUrlEn && b.imageUrlEn.trim()) || '';
  };

  const getBannerTitle = (b: StoreBanner): string | undefined => {
    if (lang === 'en') {
      return (b.titleEn && b.titleEn.trim()) || (b.title && b.title.trim()) || (b.titleAr && b.titleAr.trim()) || undefined;
    }
    return (b.titleAr && b.titleAr.trim()) || (b.title && b.title.trim()) || (b.titleEn && b.titleEn.trim()) || undefined;
  };

  const getBannerDescription = (b: StoreBanner): string | undefined => {
    if (lang === 'en') {
      return (b.descriptionEn && b.descriptionEn.trim()) || (b.description && b.description.trim()) || (b.descriptionAr && b.descriptionAr.trim()) || undefined;
    }
    return (b.descriptionAr && b.descriptionAr.trim()) || (b.description && b.description.trim()) || (b.descriptionEn && b.descriptionEn.trim()) || undefined;
  };

  const active = activeBanners[currentSlide] || activeBanners[0];
  if (!active) return null;

  const activeTitle = getBannerTitle(active);
  const activeDescription = getBannerDescription(active);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      {/* Rectangular Banner Frame */}
      <div
        className="relative w-full h-[230px] sm:h-[290px] md:h-[340px] rounded-2xl sm:rounded-3xl overflow-hidden bg-black/40 border border-white/10 shadow-lg shadow-black/30 select-none no-download-shield"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onDragStart={(e) => {
          e.preventDefault();
          return false;
        }}
      >
        {/* Background Slide Images with Crossfade */}
        {activeBanners.map((slide, index) => {
          const slideImg = getBannerImage(slide);
          const slideTitle = getBannerTitle(slide);
          const slideDesc = getBannerDescription(slide);

          return (
            <div
              key={slide.id || index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              <img
                src={slideImg}
                alt={slideTitle || 'FILEX STORE Banner'}
                referrerPolicy="no-referrer"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="w-full h-full object-cover object-center pointer-events-none select-none no-download"
              />
              {/* Cinematic Vignette Overlay - only if title or description exists */}
              {(slideTitle || slideDesc) && (
                <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r rtl:sm:bg-gradient-to-l from-black/75 via-black/35 to-transparent pointer-events-none" />
              )}
            </div>
          );
        })}

        {/* Overall Subtle Black Film for Royal Luxury */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none z-10" />

        {/* Top Black Luxury Header Gradient Overlay */}
        <div className="absolute top-0 inset-x-0 h-16 sm:h-24 bg-gradient-to-b from-black/80 via-black/35 to-transparent pointer-events-none z-15" />

        {/* Slide Content Layer - only shown if title or description exists */}
        {(activeTitle || activeDescription) && (
          <div className="relative z-20 h-full w-full flex flex-col justify-center rtl:pr-16 sm:rtl:pr-24 md:rtl:pr-28 rtl:pl-6 ltr:pl-16 sm:ltr:pl-24 md:ltr:pl-28 ltr:pr-6 max-w-2xl text-right rtl:text-right ltr:text-left space-y-2 sm:space-y-2.5 pointer-events-none">
            {activeTitle && (
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                {activeTitle}
              </h2>
            )}

            {activeDescription && (
              <p className="text-xs sm:text-sm text-slate-100 line-clamp-2 max-w-lg leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] font-medium">
                {activeDescription}
              </p>
            )}
          </div>
        )}

        {/* Protective Invisible Shield Layer: Strictly prevents downloading, right-clicking, or dragging banner images */}
        <div
          className="absolute inset-0 z-25 bg-transparent select-none"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onDragStart={(e) => {
            e.preventDefault();
            return false;
          }}
          onClick={() => {
            if (active?.linkProductId && onSelectProductById) {
              onSelectProductById(active.linkProductId);
            }
          }}
        />

        {/* Navigation Arrows (Only if multiple banners) */}
        {activeBanners.length > 1 && (
          <>
            {/* Previous Navigation Arrow */}
            <button
              onClick={prevSlide}
              aria-label={lang === 'ar' ? 'البنر السابق' : 'Previous banner'}
              className="absolute z-30 top-1/2 -translate-y-1/2 right-3 sm:right-5 rtl:right-3 sm:rtl:right-5 rtl:left-auto ltr:left-3 sm:ltr:left-5 ltr:right-auto w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white hover:text-amber-300 border border-white/20 hover:border-amber-400/60 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-xl shadow-black/70 hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-5 h-5 rtl:rotate-0 ltr:rotate-180" />
            </button>

            {/* Next Navigation Arrow */}
            <button
              onClick={nextSlide}
              aria-label={lang === 'ar' ? 'البنر التالي' : 'Next banner'}
              className="absolute z-30 top-1/2 -translate-y-1/2 left-3 sm:left-5 rtl:left-3 sm:rtl:left-5 rtl:right-auto ltr:right-3 sm:ltr:right-5 ltr:left-auto w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white hover:text-amber-300 border border-white/20 hover:border-amber-400/60 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-xl shadow-black/70 hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 rtl:rotate-0 ltr:rotate-180" />
            </button>

            {/* Interactive Bottom Pagination Dots */}
            <div className="absolute z-30 bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Go to banner ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer shadow-md ${
                    idx === currentSlide
                      ? 'w-6 bg-amber-400 shadow-amber-400/50'
                      : 'w-2 bg-white/40 hover:bg-white/70 shadow-black/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}

      </div>
    </section>
  );
};
