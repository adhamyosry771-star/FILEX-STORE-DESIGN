import React, { useState, useEffect } from 'react';
import { Megaphone, ChevronRight, ChevronLeft } from 'lucide-react';

interface NewsItem {
  id: string;
  tag: string;
  tagZh: string;
  tagColor: string;
  title: string;
  date: string;
}

const NEWS_ITEMS: NewsItem[] = [
  {
    id: 'n1',
    tag: 'تحديث ملكي',
    tagZh: '最新公告',
    tagColor: 'bg-amber-500 text-black',
    title: 'وصول دفعة دخوليات التنين الذهبي والسوبر كار المتوافقة كلياً مع تحديث يلا لودو ويوهو 2026',
    date: 'اليوم',
  },
  {
    id: 'n2',
    tag: 'مبيعات حية',
    tagZh: '实时交付',
    tagColor: 'bg-emerald-500 text-black',
    title: 'تم تسليم دخولية التنين الملكي وملف SVGA الأصلي للمستخدم (ID: 8841***) بنجاح فوري',
    date: 'منذ 4 دقائق',
  },
  {
    id: 'n3',
    tag: 'عرض خاص',
    tagZh: '特惠活动',
    tagColor: 'bg-red-600 text-white',
    title: 'خصم خاص 20% عند شراء باقة (دخولية فاخرة + إطار أفاتار متحرك) عبر وكيل واتساب',
    date: 'عرض ساري',
  },
  {
    id: 'n4',
    tag: 'ضمان التوافق',
    tagZh: '官方认证',
    tagColor: 'bg-purple-600 text-white',
    title: 'كافة مؤثرات المايك وفقاعات الشات خضعت للاختبار بمعدل 60 إطار بالثانية بدون أي بطء',
    date: 'أمس',
  },
  {
    id: 'n5',
    tag: 'حصري فاخر',
    tagZh: '极品独家',
    tagColor: 'bg-amber-400 text-black',
    title: 'إطلاق ثيمات الغرفة الصوتية الصينية (القصر الإمبراطوري) بصيغة SVGA فائقة الجودة',
    date: 'جديد',
  },
];

interface ChineseNewsBannerProps {
  lang: 'ar' | 'en';
}

export const ChineseNewsBanner: React.FC<ChineseNewsBannerProps> = ({ lang }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % NEWS_ITEMS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const currentItem = NEWS_ITEMS[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % NEWS_ITEMS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + NEWS_ITEMS.length) % NEWS_ITEMS.length);
  };

  return (
    <div className="bg-[#0b0e17] border-b border-amber-500/20 py-2 px-3 sm:px-6 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        
        {/* News Badge with STATIC Horn Icon (No animation) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500 text-black font-black">
            <Megaphone className="w-3.5 h-3.5 text-black" />
            <span className="tracking-tight text-[11px] font-sans">
              {lang === 'ar' ? 'إعلانات المتجر' : 'NEWS'}
            </span>
            <span className="text-[10px] font-mono opacity-80 hidden sm:inline">
              公告
            </span>
          </div>
        </div>

        {/* Dynamic News Text Ticker */}
        <div
          className="flex-1 min-w-0 flex items-center gap-2.5 overflow-hidden cursor-pointer"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Tag without glow */}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${currentItem.tagColor} flex-shrink-0`}
          >
            {currentItem.tag}
          </span>

          {/* Headline */}
          <p className="text-slate-200 truncate font-medium text-xs hover:text-amber-300 transition-colors">
            {currentItem.title}
          </p>

          {/* Time indicator */}
          <span className="text-[10px] text-slate-500 hidden md:inline flex-shrink-0 font-mono">
            {currentItem.date}
          </span>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handlePrev}
            className="p-1 text-slate-400 hover:text-white bg-slate-800/80 rounded transition-colors"
            title="السابق"
          >
            <ChevronRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          </button>
          <span className="text-[10px] font-mono text-slate-400 px-1">
            {currentIndex + 1}/{NEWS_ITEMS.length}
          </span>
          <button
            onClick={handleNext}
            className="p-1 text-slate-400 hover:text-white bg-slate-800/80 rounded transition-colors"
            title="التالي"
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>

      </div>
    </div>
  );
};
