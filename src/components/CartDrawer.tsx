import React, { useState, useEffect } from 'react';
import { X, Trash2, ShoppingBag, Download, CheckCircle2, MessageCircle, ShieldCheck } from 'lucide-react';
import { CartItem, AuthUser, getWhatsAppUrl } from '../types';
import { saveOrderToFirestore, logStoreActivity } from '../lib/firebaseService';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  lang: 'ar' | 'en';
  user?: AuthUser | null;
  supportPhone?: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  lang,
  user,
  supportPhone,
}) => {
  if (!isOpen) return null;

  const [customerName, setCustomerName] = useState(() => user?.displayName || '');
  const [userAppId, setUserAppId] = useState(() => user?.userAppId || '');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  useEffect(() => {
    if (user) {
      if (!customerName && user.displayName) setCustomerName(user.displayName);
      if (!userAppId && user.userAppId) setUserAppId(user.userAppId);
    }
  }, [user]);

  useEffect(() => {
    logStoreActivity('cart_drawer_opened', {
      itemsCount: items.length,
      subtotal,
      itemCodes: items.map(i => i.product.code)
    });
  }, []);

  const persistOrder = async (): Promise<string | null> => {
    if (createdOrderId) return createdOrderId;
    try {
      const resolvedUserId = user?.id || user?.userAppId || userAppId.trim() || '10001';
      const orderId = await saveOrderToFirestore({
        customerName: customerName.trim() || user?.displayName || 'عميل المتجر',
        userAppId: resolvedUserId,
        userId: user?.id || resolvedUserId,
        userEmail: user?.email || '',
        selectedApp: 'عام',
        paymentMethod: 'whatsapp',
        items,
        totalAmount: subtotal,
        status: 'pending_view'
      });
      if (orderId) {
        setCreatedOrderId(orderId);
      }
      return orderId;
    } catch (err) {
      console.warn('Firebase order save handled:', err);
      return null;
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await persistOrder();
    } finally {
      setIsSubmitting(false);
    }
    setOrderSuccess(true);
  };

  const handleWhatsAppClick = async () => {
    // Ensure order is saved and recorded in customer orders & my orders
    await persistOrder();
    logStoreActivity('whatsapp_order_click', {
      orderId: createdOrderId,
      itemsCount: items.length,
      subtotal
    });
  };

  const handleClose = () => {
    if (orderSuccess) {
      setOrderSuccess(false);
      setCreatedOrderId(null);
      onClearCart();
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-black/25 backdrop-blur-[1px] transition-opacity duration-300"
      onClick={handleClose}
    >
      {/* Drawer Container strictly anchored to the physical right edge with zero padding/gap */}
      <div 
        className="fixed inset-y-0 right-0 w-full max-w-md flex justify-end z-50 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full h-full bg-[#0b162d]/95 backdrop-blur-md border-l border-slate-700/60 text-slate-100 flex flex-col shadow-2xl shadow-black/90 animate-stretch-drawer">
          
          {/* Header */}
          <div className="p-4 sm:p-5 flex items-center justify-between bg-[#0e1d3b]/95 shrink-0 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                {lang === 'ar' ? 'سلة المشتريات' : 'Shopping Cart'}
              </h2>
              <span className="text-xs text-amber-400 font-mono">({items.length})</span>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {orderSuccess ? (
              <div className="py-12 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {lang === 'ar' ? 'تم استلام طلبك بنجاح!' : 'Order Placed Successfully!'}
                </h3>
                <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                  {lang === 'ar'
                    ? 'سيتم تزويدك بروابط تحميل ملفات التصميم الأصلية وفيديو التثبيت عبر الواتساب فور مراجعة الدفع.'
                    : 'Your authentic file download links and install tutorial are sent to your support agent.'}
                </p>

                {/* WhatsApp Contact for Links Button */}
                <div className="w-full pt-4 space-y-2">
                  <span className="text-[11px] text-emerald-400 block font-bold">
                    {lang === 'ar' ? 'تواصل علي واتساب لاستلام روابط الملفات وتأكيد الدفع:' : 'Contact on WhatsApp to receive file links & confirm payment:'}
                  </span>
                  <a
                    href={getWhatsAppUrl(
                      supportPhone,
                      (lang === 'ar'
                        ? `السلام عليكم متجر FILEX STORE، لقد تم استلام طلبي بنجاح:\n\n`
                        : `Hello FILEX STORE, my order has been placed successfully:\n\n`) +
                      items
                        .map((it) => `• ${lang === 'ar' ? it.product.name : it.product.nameEn} (${it.product.code}) x${it.quantity} - $${(it.product.price * it.quantity).toFixed(2)}`)
                        .join('\n') +
                      `\n\n` +
                      (lang === 'ar'
                        ? `المجموع: $${subtotal.toFixed(2)}\nالاسم / اللقب: ${customerName || 'عميل المتجر'}\n\nيرجى تزويدي بروابط تحميل الملفات الأصلية وفيديو التثبيت وتأكيد الدفع.`
                        : `Total: $${subtotal.toFixed(2)}\nName: ${customerName || 'Customer'}\n\nPlease provide me with authentic file download links, tutorial and payment confirmation.`)
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleWhatsAppClick}
                    className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-xs font-bold text-emerald-300 hover:text-emerald-200 transition-colors shadow-xs text-center cursor-pointer select-none"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{lang === 'ar' ? 'تواصل عبر واتساب' : 'Contact via WhatsApp'}</span>
                  </a>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#0e1d3b] flex items-center justify-center text-slate-400 border border-blue-900/40 shadow-xs">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  {lang === 'ar' ? 'سلتك فارغة حالياً' : 'Your cart is empty'}
                </p>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  {lang === 'ar'
                    ? 'تصفح الكتالوج لاختيار أرقى إطارات ودخوليات الغرف الصوتية'
                    : 'Explore the catalog to find the finest voice room effects'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* List of items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 rounded-xl bg-[#081224]/90 border border-slate-700/50 flex items-center gap-3 shadow-xs hover:bg-[#081224] transition-colors"
                    >
                      {/* Thumbnail */}
                      <div
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDragStart={(e) => e.preventDefault()}
                        className="w-14 h-14 rounded-lg bg-[#070f1f] overflow-hidden flex items-center justify-center flex-shrink-0 border border-slate-700/40 relative select-none no-download-shield"
                      >
                        <img
                          src={item.product.previewImage}
                          alt={item.product.name}
                          draggable={false}
                          onContextMenu={(e) => e.preventDefault()}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling;
                            if (fallback) (fallback as HTMLElement).style.display = 'flex';
                          }}
                          className="w-full h-full object-contain pointer-events-none no-download"
                        />
                        <div style={{ display: 'none' }} className="w-full h-full items-center justify-center text-amber-400 bg-amber-500/10">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div
                          className="absolute inset-0 z-10 bg-transparent"
                          onContextMenu={(e) => e.preventDefault()}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {lang === 'ar' ? item.product.name : item.product.nameEn}
                        </h4>
                        <span className="text-[10px] text-amber-400 font-mono block">
                          {item.product.code}
                        </span>
                        <span className="text-xs font-black text-white font-mono tabular-nums">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        title={lang === 'ar' ? 'حذف' : 'Remove'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Checkout Details Form */}
                <form onSubmit={handleCheckout} className="pt-3 border-t border-slate-700/50 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200">
                    {lang === 'ar' ? 'بيانات الاستلام والتثبيت' : 'Delivery & Account Info'}
                  </h4>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      {lang === 'ar' ? 'الاسم أو اللقب:' : 'Name or Nickname:'}
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={lang === 'ar' ? 'اكتب هنا' : 'Write here...'}
                      className="w-full bg-[#081224]/90 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 shadow-xs placeholder-slate-400"
                    />
                  </div>

                  {/* Delivery & Confirmation Channel */}
                  <div className="pt-2">
                    <label className="block text-[11px] text-slate-300 mb-1.5">
                      {lang === 'ar' ? 'طريقة الاستلام والدفع:' : 'Checkout Channel:'}
                    </label>

                    {/* Single Rectangle Button: Confirm & Instant Download */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs border bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/35 select-none"
                    >
                      <Download className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{lang === 'ar' ? 'تأكيد والتحميل الفوري' : 'Confirm & Instant Download'}</span>
                      <span className="font-mono tabular-nums px-2 py-0.5 rounded-lg text-xs font-bold border bg-amber-500/20 text-amber-300 border-amber-500/30">
                        ${subtotal.toFixed(2)}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Footer Subtotal */}
          {!orderSuccess && items.length > 0 && (
            <div className="p-4 border-t border-slate-800/80 bg-[#081224]/95 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-300">{lang === 'ar' ? 'المجموع الكلي:' : 'Total:'}</span>
              <span className="text-lg font-black text-amber-400 font-mono tabular-nums">
                ${subtotal.toFixed(2)}
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
