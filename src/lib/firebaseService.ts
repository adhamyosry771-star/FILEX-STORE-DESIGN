import { 
  collection, 
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  getDocs,
  updateDoc,
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from './firebase';
import { CartItem, Product, StoreBanner, SiteBranding } from '../types';

// Supported Order Statuses as requested by the user:
// 1. في انتظار المشاهدة (pending_view)
// 2. في انتظار تأكيد الدفع (pending_payment)
// 3. تم التسليم (delivered)
// 4. تم الرفض (rejected)
export type OrderStatus = 
  | 'pending_view' 
  | 'pending_payment' 
  | 'delivered' 
  | 'rejected'
  | 'pending'    // fallback treated as pending_view
  | 'completed'  // fallback treated as delivered
  | 'cancelled'; // fallback treated as rejected

export interface OrderStatusDetails {
  key: OrderStatus;
  labelAr: string;
  labelEn: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  descAr: string;
  descEn: string;
}

export const ORDER_STATUS_MAP: Record<string, OrderStatusDetails> = {
  pending_view: {
    key: 'pending_view',
    labelAr: 'في انتظار المشاهدة',
    labelEn: 'Awaiting Review',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/35',
    dotColor: 'bg-amber-400',
    descAr: 'تم استلام طلبك وجارٍ مراجعته من قبل إدارة المتجر.',
    descEn: 'Your order has been received and is awaiting staff review.'
  },
  pending_payment: {
    key: 'pending_payment',
    labelAr: 'في انتظار تأكيد الدفع',
    labelEn: 'Awaiting Payment',
    badgeBg: 'bg-sky-500/15',
    badgeText: 'text-sky-300',
    badgeBorder: 'border-sky-500/35',
    dotColor: 'bg-sky-400',
    descAr: 'بانتظار إرسال إيصال التحويل وتأكيد الدفع عبر واتساب.',
    descEn: 'Awaiting payment confirmation / receipt on WhatsApp.'
  },
  delivered: {
    key: 'delivered',
    labelAr: 'تم التسليم',
    labelEn: 'Delivered',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/35',
    dotColor: 'bg-emerald-400',
    descAr: 'تم تسليم الطلب وروابط تحميل الملفات الأصلية جاهزة للاستخدام.',
    descEn: 'Order delivered successfully. Original file links are ready.'
  },
  rejected: {
    key: 'rejected',
    labelAr: 'تم الرفض',
    labelEn: 'Rejected',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-500/35',
    dotColor: 'bg-rose-400',
    descAr: 'تم رفض الطلب. يرجى مراجعة الدعم الفني للاستفسار.',
    descEn: 'Order was rejected. Please contact support.'
  },
  // Legacy compatibility fallbacks
  pending: {
    key: 'pending_view',
    labelAr: 'في انتظار المشاهدة',
    labelEn: 'Awaiting Review',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/35',
    dotColor: 'bg-amber-400',
    descAr: 'تم استلام طلبك وجارٍ مراجعته من قبل إدارة المتجر.',
    descEn: 'Your order has been received and is awaiting staff review.'
  },
  completed: {
    key: 'delivered',
    labelAr: 'تم التسليم',
    labelEn: 'Delivered',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/35',
    dotColor: 'bg-emerald-400',
    descAr: 'تم تسليم الطلب وروابط تحميل الملفات الأصلية جاهزة للاستخدام.',
    descEn: 'Order delivered successfully.'
  },
  cancelled: {
    key: 'rejected',
    labelAr: 'تم الرفض',
    labelEn: 'Rejected',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-500/35',
    dotColor: 'bg-rose-400',
    descAr: 'تم رفض الطلب.',
    descEn: 'Order was rejected.'
  }
};

// Persistent Device / Client ID
export const getDeviceId = (): string => {
  try {
    let did = localStorage.getItem('filex_device_id');
    if (!did) {
      did = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      localStorage.setItem('filex_device_id', did);
    }
    return did;
  } catch {
    return 'dev_' + Date.now();
  }
};

// Generate or retrieve persistent session ID for the user
const getSessionId = (): string => {
  try {
    let sid = sessionStorage.getItem('filex_session_id');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('filex_session_id', sid);
    }
    return sid;
  } catch {
    return 'sess_' + Date.now();
  }
};

// Local storage helpers to track user's own orders on this device
export function recordUserOrderId(orderId: string, orderData?: any): void {
  try {
    const raw = localStorage.getItem('filex_my_order_ids');
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.includes(orderId)) {
      ids.unshift(orderId);
      localStorage.setItem('filex_my_order_ids', JSON.stringify(ids.slice(0, 100)));
    }
    if (orderData) {
      const rawCache = localStorage.getItem('filex_my_orders_cache');
      const cache: any[] = rawCache ? JSON.parse(rawCache) : [];
      const filtered = cache.filter((o: any) => o.id !== orderId);
      filtered.unshift({ ...orderData, id: orderId });
      localStorage.setItem('filex_my_orders_cache', JSON.stringify(filtered.slice(0, 50)));
    }
  } catch (err) {
    console.warn('Failed to record user order ID locally', err);
  }
}

export function getUserOrderIds(): string[] {
  try {
    const raw = localStorage.getItem('filex_my_order_ids');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export interface OrderRecord {
  id?: string;
  customerName: string;
  userAppId?: string;
  userId?: string;
  userEmail?: string;
  selectedApp: string;
  paymentMethod: string;
  items: Array<{
    id: string;
    code: string;
    name: string;
    nameEn?: string;
    category: string;
    price: number;
    quantity: number;
    vipLevel: number;
    svgaUrl: string;
  }>;
  totalAmount: number;
  status: OrderStatus;
  createdAt?: any;
  updatedAt?: any;
  clientDate: string;
  sessionId: string;
  deviceId?: string;
  deliveryUrl?: string;
}

export interface ActivityLog {
  id?: string;
  event: string;
  details?: Record<string, any>;
  sessionId: string;
  timestamp?: any;
  clientTime: string;
  path?: string;
}

/**
 * Record every action / step the user takes in the store to Firebase Firestore
 */
export async function logStoreActivity(event: string, details: Record<string, any> = {}): Promise<void> {
  try {
    const logsRef = collection(db, 'activity_logs');
    await addDoc(logsRef, {
      event,
      details,
      sessionId: getSessionId(),
      timestamp: serverTimestamp(),
      clientTime: new Date().toISOString(),
      path: window.location.pathname + window.location.search
    });
  } catch (error) {
    // Graceful silent fallback so store operation never blocks if Firestore rules are restricted
    console.warn('[Firebase Activity Log]:', event, error);
  }
}

/**
 * Save customer order directly to Firestore 'orders' collection
 */
export async function saveOrderToFirestore(orderData: {
  customerName: string;
  userAppId?: string;
  userId?: string;
  userEmail?: string;
  selectedApp: string;
  paymentMethod: string;
  items: CartItem[];
  totalAmount: number;
  status?: OrderStatus;
}): Promise<string | null> {
  const deviceId = getDeviceId();
  const sessionId = getSessionId();
  const initialStatus: OrderStatus = orderData.status || 'pending_view';
  const effectiveUserId =
    orderData.userAppId && orderData.userAppId !== 'غير محدد'
      ? orderData.userAppId
      : orderData.userId || '10001';

  const orderPayload = {
    customerName: orderData.customerName || 'عميل المتجر',
    userAppId: effectiveUserId,
    userId: orderData.userId || effectiveUserId,
    userEmail: orderData.userEmail || '',
    selectedApp: orderData.selectedApp,
    paymentMethod: orderData.paymentMethod,
    items: orderData.items.map((item) => ({
      id: item.product.id,
      code: item.product.code,
      name: item.product.name,
      nameEn: item.product.nameEn,
      category: item.product.category,
      price: item.product.price,
      quantity: item.quantity,
      vipLevel: item.product.vipLevel,
      svgaUrl: item.product.svgaUrl
    })),
    totalAmount: orderData.totalAmount,
    status: initialStatus,
    createdAt: serverTimestamp(),
    clientDate: new Date().toISOString(),
    sessionId,
    deviceId
  };

  try {
    const ordersRef = collection(db, 'orders');
    const docRef = await addDoc(ordersRef, orderPayload);

    // Save ID and order locally on user's device so it persists in 'طلباتي'
    recordUserOrderId(docRef.id, {
      ...orderPayload,
      id: docRef.id,
      createdAt: new Date().toISOString()
    });

    // Also log the order creation as an activity
    await logStoreActivity('order_submitted', {
      orderId: docRef.id,
      customerName: orderData.customerName,
      itemsCount: orderData.items.length,
      totalAmount: orderData.totalAmount,
      app: orderData.selectedApp,
      status: initialStatus
    });

    return docRef.id;
  } catch (error) {
    console.error('[Firebase Order Save Error]:', error);
    // Offline / fallback: save locally so user still sees it in 'طلباتي'
    const fallbackId = 'ord_' + Math.random().toString(36).substring(2, 9);
    recordUserOrderId(fallbackId, {
      ...orderPayload,
      id: fallbackId,
      createdAt: new Date().toISOString()
    });
    return fallbackId;
  }
}

/**
 * Update order status in Firestore (Admin Dashboard control)
 * Statuses: 'pending_view' | 'pending_payment' | 'delivered' | 'rejected'
 */
export async function updateOrderStatusInFirestore(
  orderId: string, 
  newStatus: OrderStatus,
  deliveryUrl?: string
): Promise<boolean> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const updateData: any = {
      status: newStatus,
      updatedAt: serverTimestamp()
    };
    if (deliveryUrl !== undefined) {
      updateData.deliveryUrl = deliveryUrl;
    }
    await updateDoc(orderRef, updateData);

    // Also update local cache if present
    try {
      const rawCache = localStorage.getItem('filex_my_orders_cache');
      if (rawCache) {
        const cache: any[] = JSON.parse(rawCache);
        const updated = cache.map(o => (o.id === orderId ? { ...o, status: newStatus, ...(deliveryUrl !== undefined ? { deliveryUrl } : {}) } : o));
        localStorage.setItem('filex_my_orders_cache', JSON.stringify(updated));
      }
    } catch {}

    await logStoreActivity('order_status_updated', { orderId, newStatus, deliveryUrl });
    return true;
  } catch (error) {
    console.error('[Firebase Update Order Status Error]:', error);
    return false;
  }
}

/**
 * Delete a specific customer order from Firestore
 */
export async function deleteOrderFromFirestore(orderId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'orders', orderId));
    await logStoreActivity('order_deleted', { orderId });
    return true;
  } catch (error) {
    console.error('[Firebase Delete Order Error]:', error);
    return false;
  }
}

/**
 * Clear all customer orders from Firestore (Zero-out orders)
 */
export async function clearAllOrdersFromFirestore(): Promise<number> {
  try {
    const ordersRef = collection(db, 'orders');
    const snapshot = await getDocs(ordersRef);
    let count = 0;
    const deletePromises = snapshot.docs.map(async (docSnap) => {
      await deleteDoc(doc(db, 'orders', docSnap.id));
      count++;
    });
    await Promise.all(deletePromises);
    await logStoreActivity('orders_cleared', { deletedCount: count });
    return count;
  } catch (error) {
    console.error('[Firebase Clear All Orders Error]:', error);
    return 0;
  }
}

/**
 * Real-time listener for incoming orders (used by Admin Dashboard)
 */
export function subscribeToOrders(onUpdate: (orders: OrderRecord[]) => void): () => void {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(50));
    
    return onSnapshot(q, (snapshot) => {
      const orders: OrderRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<OrderRecord, 'id'>)
      }));
      onUpdate(orders);
    }, (err) => {
      console.warn('[Firebase Subscribe Orders Error]:', err);
    });
  } catch (err) {
    console.warn('[Firebase Subscribe Orders Setup Error]:', err);
    return () => {};
  }
}

/**
 * Real-time listener for the current user's / device's own orders ('طلباتي')
 */
export function subscribeToUserOrders(
  onUpdate: (orders: OrderRecord[]) => void,
  userAppId?: string
): () => void {
  const getCachedOrders = (): OrderRecord[] => {
    try {
      const raw = localStorage.getItem('filex_my_orders_cache');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  try {
    const deviceId = getDeviceId();
    const sessionId = getSessionId();
    const myIds = getUserOrderIds();

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(100));

    return onSnapshot(
      q,
      (snapshot) => {
        const allOrders: OrderRecord[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<OrderRecord, 'id'>)
        }));

        // Filter orders belonging to this device / user
        const matchedOrders = allOrders.filter((o) => {
          const matchesDevice = o.deviceId === deviceId || (o as any).sessionId === sessionId;
          const matchesId = Boolean(o.id && myIds.includes(o.id));
          const matchesUserApp = Boolean(userAppId && o.userAppId && o.userAppId === userAppId);
          return matchesDevice || matchesId || matchesUserApp;
        });

        // Merge with locally stored cache in case some were saved offline
        const localCache = getCachedOrders();
        const mergedMap = new Map<string, OrderRecord>();
        matchedOrders.forEach((o) => o.id && mergedMap.set(o.id, o));
        localCache.forEach((o) => {
          if (o.id && !mergedMap.has(o.id)) {
            mergedMap.set(o.id, o);
          }
        });

        const finalList = Array.from(mergedMap.values());
        // Save updated cache
        try {
          localStorage.setItem('filex_my_orders_cache', JSON.stringify(finalList));
        } catch {}

        onUpdate(finalList);
      },
      (err) => {
        console.warn('[Firebase User Orders Subscription Error]:', err);
        onUpdate(getCachedOrders());
      }
    );
  } catch (err) {
    console.warn('[Firebase User Orders Setup Error]:', err);
    onUpdate(getCachedOrders());
    return () => {};
  }
}

/**
 * Get count of orders that have not yet been viewed by the user
 */
export function getUnseenOrdersCount(orders: OrderRecord[]): number {
  if (!orders || orders.length === 0) return 0;
  try {
    const raw = localStorage.getItem('filex_seen_orders_cache');
    if (!raw) {
      // First time with orders: all orders are considered unviewed
      return orders.length;
    }
    const seenMap: Record<string, boolean> = JSON.parse(raw);
    const unseen = orders.filter((o) => {
      const key = `${o.id}_${o.status || 'pending_view'}`;
      return !seenMap[key];
    });
    return unseen.length;
  } catch {
    return 0;
  }
}

/**
 * Mark current orders and their statuses as viewed in localStorage
 */
export function markOrdersAsSeen(orders: OrderRecord[]): void {
  if (!orders) return;
  try {
    let seenMap: Record<string, boolean> = {};
    try {
      const raw = localStorage.getItem('filex_seen_orders_cache');
      if (raw) seenMap = JSON.parse(raw);
    } catch {}

    orders.forEach((o) => {
      if (o.id) {
        const key = `${o.id}_${o.status || 'pending_view'}`;
        seenMap[key] = true;
      }
    });
    localStorage.setItem('filex_seen_orders_cache', JSON.stringify(seenMap));
    window.dispatchEvent(new CustomEvent('filex_orders_seen'));
  } catch {}
}

/**
 * Real-time listener for user activity logs (used by Admin Dashboard)
 */
export function subscribeToActivityLogs(onUpdate: (logs: ActivityLog[]) => void): () => void {
  try {
    const logsRef = collection(db, 'activity_logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));

    return onSnapshot(q, (snapshot) => {
      const logs: ActivityLog[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ActivityLog, 'id'>)
      }));
      onUpdate(logs);
    }, (err) => {
      console.warn('[Firebase Subscribe Activity Error]:', err);
    });
  } catch (err) {
    console.warn('[Firebase Subscribe Activity Setup Error]:', err);
    return () => {};
  }
}

/**
 * Save product to Firestore 'products' collection (ensures permanent persistence across all updates)
 */
export async function saveProductToFirestore(product: Product): Promise<void> {
  try {
    const productRef = doc(db, 'products', product.id);
    await setDoc(productRef, {
      ...product,
      updatedAt: serverTimestamp()
    }, { merge: true });
    logStoreActivity('product_saved_firestore', { productId: product.id, code: product.code, name: product.name });
  } catch (error) {
    console.warn('[Firebase Save Product Error]:', error);
  }
}

/**
 * Delete product from Firestore 'products' collection
 */
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  try {
    const productRef = doc(db, 'products', productId);
    await deleteDoc(productRef);
    logStoreActivity('product_deleted_firestore', { productId });
  } catch (error) {
    console.warn('[Firebase Delete Product Error]:', error);
  }
}

/**
 * Real-time listener for published products from Firestore
 */
export function subscribeToProducts(onUpdate: (products: Product[]) => void): () => void {
  try {
    const productsRef = collection(db, 'products');
    return onSnapshot(productsRef, (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        if (data && (data.name || data.code)) {
          items.push({
            ...data,
            id: docSnap.id
          });
        }
      });
      // Sort by creation date descending
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(items);
    }, (error) => {
      console.warn('[Firebase Subscribe Products Error]:', error);
    });
  } catch (error) {
    console.warn('[Firebase Subscribe Products Setup Error]:', error);
    return () => {};
  }
}

/**
 * Save banner to Firestore 'banners' collection
 */
export async function saveBannerToFirestore(banner: StoreBanner): Promise<void> {
  try {
    const bannerRef = doc(db, 'banners', banner.id);
    const cleanBanner: Record<string, any> = { updatedAt: serverTimestamp() };
    Object.entries(banner).forEach(([key, val]) => {
      if (val !== undefined) cleanBanner[key] = val;
    });
    await setDoc(bannerRef, cleanBanner, { merge: true });
  } catch (error) {
    console.warn('[Firebase Save Banner Error]:', error);
  }
}

/**
 * Delete banner from Firestore 'banners' collection
 */
export async function deleteBannerFromFirestore(bannerId: string): Promise<void> {
  try {
    const bannerRef = doc(db, 'banners', bannerId);
    await deleteDoc(bannerRef);
  } catch (error) {
    console.warn('[Firebase Delete Banner Error]:', error);
  }
}

/**
 * Real-time listener for banners from Firestore
 */
export function subscribeToBanners(onUpdate: (banners: StoreBanner[]) => void): () => void {
  try {
    const bannersRef = collection(db, 'banners');
    return onSnapshot(bannersRef, (snapshot) => {
      const items: StoreBanner[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as StoreBanner;
        if (data && (data.imageUrl || data.title)) {
          items.push({
            ...data,
            id: docSnap.id
          });
        }
      });
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(items);
    }, (error) => {
      console.warn('[Firebase Subscribe Banners Error]:', error);
    });
  } catch (error) {
    console.warn('[Firebase Subscribe Banners Setup Error]:', error);
    return () => {};
  }
}

/**
 * Save site branding to Firestore 'settings/branding'
 */
export async function saveBrandingToFirestore(branding: SiteBranding): Promise<void> {
  try {
    const brandingRef = doc(db, 'settings', 'branding');
    await setDoc(brandingRef, {
      ...branding,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.warn('[Firebase Save Branding Error]:', error);
  }
}

/**
 * Real-time listener for site branding from Firestore
 */
export function subscribeToBranding(onUpdate: (branding: SiteBranding) => void): () => void {
  try {
    const brandingRef = doc(db, 'settings', 'branding');
    return onSnapshot(brandingRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SiteBranding;
        onUpdate(data);
      }
    }, (error) => {
      console.warn('[Firebase Subscribe Branding Error]:', error);
    });
  } catch (error) {
    console.warn('[Firebase Subscribe Branding Setup Error]:', error);
    return () => {};
  }
}

