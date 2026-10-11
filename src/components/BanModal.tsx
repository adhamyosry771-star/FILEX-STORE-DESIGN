import React from 'react';
import { ShieldAlert, MessageCircle, X } from 'lucide-react';
import { BanStatus, getWhatsAppUrl } from '../types';

interface BanModalProps {
  isOpen: boolean;
  banStatus: BanStatus | null;
  onClose: () => void;
  lang?: 'ar' | 'en';
  supportPhone?: string;
}

export const BanModal: React.FC<BanModalProps> = ({
  isOpen,
  banStatus,
  onClose,
  lang = 'ar',
  supportPhone,
}) => {
  if (!isOpen || !banStatus) return null;

  const formatUntil = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}/${month}/${day} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  const handleContactWhatsApp = () => {
    const text = 'السلام عليكم إدارة FILEX STORE، أود الاستفسار عن سبب تقييد حسابي ومراجعة حالة التقييد.';
    window.open(getWhatsAppUrl(supportPhone, text), '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 backdrop-blur-xs flex items-center justify-center p-3.5 animate-backdrop-fade">
      {/* Balanced Medium Transparency Window - Clean & Elegant Glassmorphism with smooth pop entrance */}
      <div className="relative w-full max-w-[320px] sm:max-w-[340px] bg-[#091326]/75 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-4.5 shadow-2xl text-center space-y-3 animate-modal-pop">
        
        {/* Shield Icon - Red Color */}
        <div className="relative mx-auto w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-red-500" />
        </div>

        {/* Header Title */}
        <div className="space-y-0.5 relative z-10">
          <h2 className="text-base font-black text-white tracking-tight">
            {lang === 'ar' ? 'لا يمكنك الدخول، تم تقييد الحساب' : 'Access Restricted - Account Suspended'}
          </h2>
          <p className="text-[11px] text-slate-300 leading-snug">
            {lang === 'ar'
              ? 'تم تقييد وصول هذا الحساب إلى خدمات المتجر.'
              : 'Your account access has been restricted.'}
          </p>
        </div>

        {/* Ban Details Card (Medium Balanced Glass) */}
        <div className="p-2.5 rounded-xl bg-black/35 border border-white/10 text-right rtl:text-right ltr:text-left space-y-2 text-xs">
          
          {/* Duration Type - Transparent Red Box as requested */}
          <div className="flex items-center justify-between text-[11px] py-0.5">
            <span className="text-slate-300 font-medium">
              {lang === 'ar' ? 'نوع التقييد:' : 'Restriction Type:'}
            </span>
            <span className="font-bold font-mono px-2.5 py-1 rounded-lg bg-red-500/20 text-red-200 border border-red-500/40 shadow-xs">
              {banStatus.permanent
                ? (lang === 'ar' ? 'حظر دائم' : 'Permanent Ban')
                : (lang === 'ar' ? `حظر مؤقت (${banStatus.remainingDays} يوم)` : `Temporary (${banStatus.remainingDays}d)`)}
            </span>
          </div>

          {/* Remaining Days/Hours (if temporary) with PURE WHITE number */}
          {!banStatus.permanent && (
            <>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  {lang === 'ar' ? 'المدة المتبقية للتقييد:' : 'Remaining Time:'}
                </span>
                <span className="font-mono font-bold">
                  {banStatus.remainingDays && banStatus.remainingDays > 1 ? (
                    <>
                      <span className="text-white font-black text-sm">{banStatus.remainingDays}</span>
                      <span className="text-white font-semibold mr-1 rtl:mr-1 rtl:ml-0 ltr:ml-1 ltr:mr-0">
                        {lang === 'ar' ? 'يوم' : 'days'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-white font-black text-sm">{banStatus.remainingHours || 24}</span>
                      <span className="text-white font-semibold mr-1 rtl:mr-1 rtl:ml-0 ltr:ml-1 ltr:mr-0">
                        {lang === 'ar' ? 'ساعة' : 'hours'}
                      </span>
                    </>
                  )}
                </span>
              </div>

              {banStatus.untilDate && (
                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                  <span className="text-slate-400">
                    {lang === 'ar' ? 'تاريخ انتهاء التقييد:' : 'Restriction Ends:'}
                  </span>
                  <span className="font-mono text-slate-200">
                    {formatUntil(banStatus.untilDate)}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Reason */}
          {banStatus.reason && (
            <div className="pt-1.5 border-t border-white/5 space-y-0.5">
              <span className="text-slate-400 block text-[10px]">
                {lang === 'ar' ? 'السبب الموضح:' : 'Reason:'}
              </span>
              <p className="text-slate-200 text-[10px] leading-relaxed bg-white/[0.03] p-1.5 rounded-lg border border-white/5">
                {banStatus.reason}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons (Transparent Glass) */}
        <div className="space-y-1.5 pt-0.5 relative z-10">
          <button
            type="button"
            onClick={handleContactWhatsApp}
            className="w-full py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ar' ? 'التواصل مع الإدارة (واتساب)' : 'Contact Support'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-slate-300 hover:text-white font-semibold text-xs transition-all cursor-pointer"
          >
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
