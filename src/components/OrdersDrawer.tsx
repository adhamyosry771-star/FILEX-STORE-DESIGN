import React, { useState, useEffect } from 'react';
import { 
  X, 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  CreditCard, 
  MessageCircle, 
  Download, 
  ExternalLink,
  Package,
  Layers
} from 'lucide-react';
import { AuthUser, getWhatsAppUrl } from '../types';
import { 
  OrderRecord, 
  OrderStatus, 
  ORDER_STATUS_MAP, 
  subscribeToUserOrders,
  markOrdersAsSeen,
  logStoreActivity 
} from '../lib/firebaseService';

interface OrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  user?: AuthUser | null;
  onOpenCart?: () => void;
  supportPhone?: string;
}

export const OrdersDrawer: React.FC<OrdersDrawerProps> = ({
  isOpen,
  onClose,
  lang,
  user,
  onOpenCart,
  supportPhone,
}) => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending_view' | 'pending_payment' | 'delivered' | 'rejected'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    logStoreActivity('orders_drawer_opened', { userAppId: user?.userAppId });

    // Subscribe to current user's / device's orders in real-time
    const unsubscribe = subscribeToUserOrders((liveOrders) => {
      setOrders(liveOrders);
      // Mark all orders as viewed when drawer is opened/active
      markOrdersAsSeen(liveOrders);
    }, user?.userAppId);

    return () => {
      unsubscribe();
    };
  }, [isOpen, user?.userAppId]);

  if (!isOpen) return null;

  // Format timestamp safely with English numbers
  const formatOrderDate = (dateVal: any): string => {
    if (!dateVal) return '';
    try {
      let d: Date;
      if (typeof dateVal === 'object' && dateVal.seconds) {
        d = new Date(dateVal.seconds * 1000);
      } else {
        d = new Date(dateVal);
      }
      // Always use en-US so digits and time (AM/PM) are formatted in English numbers
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  // Helper to resolve normalized status
  const getNormalizedStatus = (status: OrderStatus): 'pending_view' | 'pending_payment' | 'delivered' | 'rejected' => {
    if (status === 'pending' || status === 'pending_view') return 'pending_view';
    if (status === 'pending_payment') return 'pending_payment';
    if (status === 'completed' || status === 'delivered') return 'delivered';
    if (status === 'cancelled' || status === 'rejected') return 'rejected';
    return 'pending_view';
  };

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'all') return true;
    return getNormalizedStatus(order.status) === activeFilter;
  });

  const getStatusBadge = (status: OrderStatus) => {
    const norm = getNormalizedStatus(status);
    const details = ORDER_STATUS_MAP[norm] || ORDER_STATUS_MAP.pending_view;

    let Icon = Eye;
    if (norm === 'pending_payment') Icon = CreditCard;
    if (norm === 'delivered') Icon = CheckCircle2;
    if (norm === 'rejected') Icon = AlertCircle;

    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${details.badgeBg} ${details.badgeText} ${details.badgeBorder} shadow-xs`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{lang === 'ar' ? details.labelAr : details.labelEn}</span>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-black/25 backdrop-blur-[1px] transition-opacity duration-300"
      onClick={onClose}
    >
      {/* Drawer Container strictly anchored to the physical right edge with exact cart width and transparency */}
      <div 
        className="fixed inset-y-0 right-0 w-full max-w-md flex justify-end z-50 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full h-full bg-[#0b162d]/95 backdrop-blur-md border-l border-slate-700/60 text-slate-100 flex flex-col shadow-2xl shadow-black/90 animate-stretch-drawer">
          
          {/* Header */}
          <div className="p-4 sm:p-5 flex items-center justify-between bg-[#0e1d3b]/95 shrink-0 border-b border-slate-800/60">
            <div className="flex items-center gap-2.5">
              {/* Order History Icon in transparent orange */}
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shadow-xs">
                <ClipboardList className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    {lang === 'ar' ? 'سجل الطلبات' : 'Order History'}
                  </h2>
                  <span className="text-xs text-orange-400 font-mono px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 font-bold">
                    {orders.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {lang === 'ar' ? 'متابعة حالة طلباتك واستلام الملفات في الوقت الفعلي' : 'Track your order updates and download links in real time'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Status Buttons - Clear rounded rectangle tabs without harsh glow and without text truncation */}
          <div className="flex items-center gap-1.5 p-2 bg-[#091326]/70 border-b border-slate-800/50 shrink-0 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 min-w-fit py-1.5 px-2.5 rounded-lg text-center flex items-center justify-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 font-medium'
              }`}
            >
              <span className="text-xs font-bold leading-normal whitespace-nowrap">{lang === 'ar' ? 'الكل' : 'All'}</span>
              <span className={`text-[11px] font-mono shrink-0 font-semibold leading-normal ${activeFilter === 'all' ? 'text-amber-300/90' : 'text-slate-400'}`}>
                ({orders.length})
              </span>
            </button>
            <button
              onClick={() => setActiveFilter('pending_view')}
              className={`flex-1 min-w-fit py-1.5 px-2.5 rounded-lg text-center flex items-center justify-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                activeFilter === 'pending_view'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 font-medium'
              }`}
            >
              <span className="text-xs font-bold leading-normal whitespace-nowrap">{lang === 'ar' ? 'المشاهدة' : 'Review'}</span>
              <span className={`text-[11px] font-mono shrink-0 font-semibold leading-normal ${activeFilter === 'pending_view' ? 'text-amber-300/90' : 'text-slate-400'}`}>
                ({orders.filter(o => getNormalizedStatus(o.status) === 'pending_view').length})
              </span>
            </button>
            <button
              onClick={() => setActiveFilter('pending_payment')}
              className={`flex-1 min-w-fit py-1.5 px-2.5 rounded-lg text-center flex items-center justify-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                activeFilter === 'pending_payment'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 font-medium'
              }`}
            >
              <span className="text-xs font-bold leading-normal whitespace-nowrap">{lang === 'ar' ? 'الدفع' : 'Payment'}</span>
              <span className={`text-[11px] font-mono shrink-0 font-semibold leading-normal ${activeFilter === 'pending_payment' ? 'text-amber-300/90' : 'text-slate-400'}`}>
                ({orders.filter(o => getNormalizedStatus(o.status) === 'pending_payment').length})
              </span>
            </button>
            <button
              onClick={() => setActiveFilter('delivered')}
              className={`flex-1 min-w-fit py-1.5 px-2.5 rounded-lg text-center flex items-center justify-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                activeFilter === 'delivered'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 font-medium'
              }`}
            >
              <span className="text-xs font-bold leading-normal whitespace-nowrap">{lang === 'ar' ? 'التسليم' : 'Delivered'}</span>
              <span className={`text-[11px] font-mono shrink-0 font-semibold leading-normal ${activeFilter === 'delivered' ? 'text-amber-300/90' : 'text-slate-400'}`}>
                ({orders.filter(o => getNormalizedStatus(o.status) === 'delivered').length})
              </span>
            </button>
            <button
              onClick={() => setActiveFilter('rejected')}
              className={`flex-1 min-w-fit py-1.5 px-2.5 rounded-lg text-center flex items-center justify-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                activeFilter === 'rejected'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 font-medium'
              }`}
            >
              <span className="text-xs font-bold leading-normal whitespace-nowrap">{lang === 'ar' ? 'الرفض' : 'Rejected'}</span>
              <span className={`text-[11px] font-mono shrink-0 font-semibold leading-normal ${activeFilter === 'rejected' ? 'text-amber-300/90' : 'text-slate-400'}`}>
                ({orders.filter(o => getNormalizedStatus(o.status) === 'rejected').length})
              </span>
            </button>
          </div>

          {/* Orders Content List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div key={`orders-filter-${activeFilter}`} className="space-y-4 animate-page-transition">
              {filteredOrders.length === 0 ? (
                <div className="py-20 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20 shadow-xs">
                    <ClipboardList className="w-8 h-8 text-orange-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-200">
                      {lang === 'ar' ? 'لا توجد طلبات في هذا القسم' : 'No orders in this section'}
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                      {lang === 'ar'
                        ? 'عند إتمامك لأي طلب عبر سلة المشتريات والتواصل، سيظهر هنا فوراً لمتابعة حالته خطوة بخطوة واستلام الملفات.'
                        : 'When you submit an order, it will appear here in real-time so you can track its progress and download links.'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredOrders.map((order, idx) => {
                  const normStatus = getNormalizedStatus(order.status);
                const statusDetails = ORDER_STATUS_MAP[normStatus] || ORDER_STATUS_MAP.pending_view;
                const isExpanded = expandedOrderId === order.id;
                const shortId = (order.id || `ORD-${idx + 1}`).slice(-6).toUpperCase();

                return (
                  <div 
                    key={order.id || idx}
                    className="rounded-xl border border-slate-700/50 bg-[#0e1d3b]/85 transition-colors p-3 space-y-2.5 shadow-md shadow-black/40 backdrop-blur-xs"
                  >
                    {/* Top Row: Customer, Date & Status Badge */}
                    <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">
                            {order.customerName}
                          </span>
                          {(order.userAppId && order.userAppId !== 'غير محدد' ? order.userAppId : order.userId || user?.id) && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              (ID: {order.userAppId && order.userAppId !== 'غير محدد' ? order.userAppId : order.userId || user?.id})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono" dir="ltr">
                          {formatOrderDate(order.createdAt || order.clientDate)}
                        </div>
                      </div>

                      {/* Live Status Badge */}
                      <div className="shrink-0">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>

                    {/* Status Explanatory Note */}
                    <div className={`p-2 rounded-lg border text-[11px] leading-relaxed ${statusDetails.badgeBg} ${statusDetails.badgeBorder} ${statusDetails.badgeText}`}>
                      <p>{lang === 'ar' ? statusDetails.descAr : statusDetails.descEn}</p>
                    </div>

                    {/* Order Items Preview */}
                    <div className="space-y-1 bg-[#081224]/70 p-2.5 rounded-lg border border-white/5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-0.5">
                        <span className="flex items-center gap-1.5">
                          <Package className="w-3 h-3 text-amber-400" />
                          <span>{lang === 'ar' ? 'العناصر المطلوبة' : 'Ordered Items'} ({order.items?.length || 0})</span>
                        </span>
                        <span className="font-mono font-bold text-amber-400 text-xs">${(order.totalAmount || 0).toFixed(2)}</span>
                      </div>
                      
                      {order.items?.map((it, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] py-1 border-t border-white/5 first:border-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-white truncate">
                              {lang === 'ar' ? it.name : (it.nameEn || it.name)}
                            </span>
                            {it.code && (
                              <span className="font-mono text-amber-400 text-[10px] shrink-0 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                {it.code}
                              </span>
                            )}
                            <span className="text-slate-400 text-[10px]">x{it.quantity}</span>
                          </div>
                          <span className="text-slate-300 font-mono text-[11px] shrink-0">
                            ${(it.price * it.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* If status is Delivered: Show authentic download links */}
                    {normStatus === 'delivered' && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{lang === 'ar' ? 'روابط تحميل الملفات الأصلية جاهزة' : 'Authentic File Links Ready'}</span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-relaxed">
                          {lang === 'ar'
                            ? 'تم اعتماد طلبك وتسليمه بنجاح! يمكنك الانتقال إلى موقع التحميل وتحميل ملفات التصميم الأصلية مباشرة أدناه:'
                            : 'Your order has been approved! You can visit the download link to download original design files below:'}
                        </p>
                        <div className="space-y-1.5 pt-0.5">
                          {order.items?.map((it, i) => {
                            const downloadTarget = order.deliveryUrl || it.svgaUrl || '#';
                            return (
                              <a
                                key={i}
                                href={downloadTarget}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-xs text-emerald-200 font-bold transition-colors cursor-pointer group"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span className="truncate">{lang === 'ar' ? it.name : (it.nameEn || it.name)}</span>
                                </div>
                                <span className="text-[10px] bg-emerald-500/25 group-hover:bg-emerald-500/35 px-2.5 py-1 rounded text-emerald-100 shrink-0 font-bold border border-emerald-500/30 flex items-center gap-1">
                                  {lang === 'ar' ? 'تحميل مباشر' : 'Download'}
                                </span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quick WhatsApp Support Follow-Up Button: hidden when order is Delivered */}
                    {normStatus !== 'delivered' && (
                      <a
                        href={getWhatsAppUrl(
                          supportPhone,
                          (lang === 'ar'
                            ? `السلام عليكم متجر FILEX STORE، أود المتابعة بخصوص طلبي:\n`
                            : `Hello FILEX STORE, following up on my order:\n`) +
                          `• العميل: ${order.customerName}\n` +
                          `• الحالة الحالية: ${lang === 'ar' ? statusDetails.labelAr : statusDetails.labelEn}\n` +
                          `• الإجمالي: $${(order.totalAmount || 0).toFixed(2)}\n\n` +
                          (lang === 'ar' 
                            ? 'يرجى تزويدي بآخر تحديثات الطلب وتأكيد الدفع.' 
                            : 'Please provide the latest update on my order and payment confirmation.')
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-xs font-bold text-emerald-300 hover:text-emerald-200 transition-colors shadow-xs text-center cursor-pointer select-none"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{lang === 'ar' ? 'تواصل عبر واتساب بخصوص هذا الطلب' : 'WhatsApp Support for this Order'}</span>
                      </a>
                    )}
                  </div>
                );
              })
            )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
