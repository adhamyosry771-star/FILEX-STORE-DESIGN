import React, { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  Search,
  Download,
  RotateCcw,
  Palette,
  CheckCircle,
  XCircle,
  Package,
  X,
  Save,
  Check,
  Activity,
  ShoppingBag,
  Database,
  ExternalLink,
  Clock,
  User,
  Users,
  Smartphone,
  CheckCircle2,
  Paintbrush,
  Image as ImageIcon,
  Sparkles,
  LogIn,
  Video,
  Eye,
  EyeOff,
  Key,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Shield,
  UserX,
  UserCheck,
  UserPlus,
  Lock,
  Unlock,
  Upload,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  CreditCard,
  MessageCircle,
  Phone,
} from 'lucide-react';
import {
  Product,
  ProductCategory,
  ProductTag,
  AuthUser,
  SiteBranding,
  DEFAULT_BRANDING,
  DEFAULT_SUPPORT_PHONE,
  getWhatsAppUrl,
  formatWhatsAppPhone,
  StoreBanner,
  DEFAULT_BANNERS,
  isVideoUrl,
  isYouTubeUrl,
  getYouTubeEmbedUrl,
  checkUserBanStatus,
  ModeratorPermissionKey,
  ALL_MODERATOR_PERMISSIONS,
  isMasterAdmin,
  canAccessAdmin,
} from '../types';
import { compressAndEncodeImage } from '../lib/imageUtils';
import { 
  subscribeToOrders, 
  subscribeToActivityLogs, 
  clearAllOrdersFromFirestore,
  deleteOrderFromFirestore,
  updateOrderStatusInFirestore,
  OrderRecord, 
  OrderStatus,
  ORDER_STATUS_MAP,
  ActivityLog 
} from '../lib/firebaseService';
import {
  getAllRegisteredUsers,
  ADMIN_CREDENTIALS,
  banUser,
  unbanUser,
  createModeratorAccount,
  updateModeratorAccount,
  deleteModeratorAccount,
} from '../lib/authService';
import { firebaseConfig } from '../lib/firebase';

interface AdminDashboardProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onResetDefaults: () => void;
  onClose: () => void;
  lang: 'ar' | 'en';
  branding: SiteBranding;
  onUpdateBranding: (branding: SiteBranding) => void;
  banners: StoreBanner[];
  onAddBanner: (banner: StoreBanner) => void;
  onDeleteBanner: (bannerId: string) => void;
  onResetBanners?: () => void;
  currentUser?: AuthUser | null;
}

// Helpers to ensure all dates and numbers strictly display in English Latin digits (1234567890)
const formatEnglishDate = (dateVal?: any): string => {
  if (!dateVal) return '—';
  try {
    const d = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
    if (isNaN(d.getTime())) return '—';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  } catch {
    return '—';
  }
};

const formatEnglishDateTime = (dateVal?: any): string => {
  if (!dateVal) return '—';
  try {
    const d = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
    if (isNaN(d.getTime())) return '—';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  } catch {
    return '—';
  }
};

const PublishedBannerCard: React.FC<{
  banner: StoreBanner;
  index: number;
  onDelete: (id: string) => void;
  lang: 'ar' | 'en';
}> = ({ banner, index, onDelete, lang }) => {
  const [activeLang, setActiveLang] = useState<'ar' | 'en'>('ar');

  const hasAr = Boolean((banner.imageUrlAr && banner.imageUrlAr.trim()) || (banner.imageUrl && banner.imageUrl.trim()));
  const hasEn = Boolean(banner.imageUrlEn && banner.imageUrlEn.trim());

  const currentImg =
    activeLang === 'en'
      ? (banner.imageUrlEn?.trim() || banner.imageUrlAr?.trim() || banner.imageUrl)
      : (banner.imageUrlAr?.trim() || banner.imageUrl || banner.imageUrlEn?.trim());

  const currentTitle =
    activeLang === 'en'
      ? (banner.titleEn?.trim() || banner.title?.trim() || banner.titleAr?.trim())
      : (banner.titleAr?.trim() || banner.title?.trim() || banner.titleEn?.trim());

  const currentDesc =
    activeLang === 'en'
      ? (banner.descriptionEn?.trim() || banner.description?.trim() || banner.descriptionAr?.trim())
      : (banner.descriptionAr?.trim() || banner.description?.trim() || banner.descriptionEn?.trim());

  return (
    <div className="group relative rounded-xl overflow-hidden border border-blue-800/40 bg-[#081224] p-3.5 flex flex-col justify-between space-y-3 shadow-md">
      {/* Card Header with Badges & Language switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold shrink-0">
            #{index + 1}
          </span>
          <span className="text-[11px] font-bold text-white truncate max-w-[150px]">
            {banner.titleAr || banner.titleEn || banner.title || (lang === 'ar' ? 'بنر بدون عنوان' : 'Untitled Banner')}
          </span>
        </div>

        {/* Language Preview Switcher on Card */}
        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveLang('ar')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeLang === 'ar'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🇸🇦</span>
            <span>عربي</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLang('en')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeLang === 'en'
                ? 'bg-blue-500/25 text-blue-300 border border-blue-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🇬🇧</span>
            <span>EN</span>
          </button>
        </div>
      </div>

      {/* Banner Image Preview */}
      <div
        className="relative w-full h-36 rounded-lg overflow-hidden bg-black/60 border border-white/5 flex items-center justify-center select-none no-download-shield"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragStart={(e) => {
          e.preventDefault();
        }}
      >
        {currentImg ? (
          <>
            <img
              src={currentImg}
              alt={currentTitle || `Banner ${index + 1}`}
              referrerPolicy="no-referrer"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className="w-full h-full object-cover object-center pointer-events-none select-none no-download"
            />
            {/* Transparent protection shield */}
            <div
              className="absolute inset-0 z-10 bg-transparent select-none"
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragStart={(e) => e.preventDefault()}
            />
          </>
        ) : (
          <div className="text-slate-500 text-xs text-center p-2">
            <span>{lang === 'ar' ? 'لا توجد صورة' : 'No image'}</span>
          </div>
        )}

        {(currentTitle || currentDesc) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none z-15" />
        )}
        {(currentTitle || currentDesc) && (
          <div className="absolute bottom-2 inset-x-2 p-1.5 text-right rtl:text-right ltr:text-left">
            {currentTitle && (
              <h4 className="text-xs font-bold text-white truncate drop-shadow-sm">
                {currentTitle}
              </h4>
            )}
            {currentDesc && (
              <p className="text-[10px] text-slate-300 line-clamp-1 drop-shadow-sm">
                {currentDesc}
              </p>
            )}
          </div>
        )}

        <span className="absolute top-2 left-2 rtl:left-2 rtl:right-auto ltr:right-2 ltr:left-auto px-1.5 py-0.5 rounded bg-black/75 border border-white/10 text-[10px] font-bold text-white">
          {activeLang === 'ar' ? '🇸🇦 النسخة العربية' : (hasEn ? '🇬🇧 النسخة الإنجليزية' : '🇬🇧 (يستخدم العربي كبديل)')}
        </span>
      </div>

      {/* Status Badges & Delete Button */}
      <div className="flex items-center justify-between pt-1 gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
            hasAr
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : 'bg-slate-700/20 text-slate-400 border-slate-700/30'
          }`}>
            🇸🇦 {hasAr ? (lang === 'ar' ? 'عربي: متوفر' : 'AR: Available') : (lang === 'ar' ? 'عربي: فارغ' : 'AR: None')}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
            hasEn
              ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
              : 'bg-amber-500/10 text-amber-300/80 border-amber-500/20'
          }`}>
            🇬🇧 {hasEn ? (lang === 'ar' ? 'إنجليزي: متوفر' : 'EN: Available') : (lang === 'ar' ? 'إنجليزي: كبديل' : 'EN: Fallback')}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onDelete(banner.id)}
          className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-red-400 hover:text-red-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          title={lang === 'ar' ? 'حذف هذا البنر' : 'Delete this banner'}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{lang === 'ar' ? 'حذف' : 'Delete'}</span>
        </button>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onResetDefaults,
  onClose,
  lang,
  branding,
  onUpdateBranding,
  banners,
  onAddBanner,
  onDeleteBanner,
  onResetBanners,
  currentUser,
}) => {
  const isMaster = isMasterAdmin(currentUser);
  const isMod = !isMaster && (currentUser?.role === 'moderator' || currentUser?.isModerator);
  const isRevoked = isMod && !!currentUser?.isModeratorRevoked;
  const modPermissions: ModeratorPermissionKey[] = currentUser?.moderatorPermissions || [];

  const canViewCatalog = isMaster || modPermissions.includes('catalog');
  const canAddProduct = isMaster || modPermissions.includes('add_product');
  const canViewOrders = isMaster || modPermissions.includes('orders');
  const canViewUsers = isMaster || modPermissions.includes('users');
  const canViewBanners = isMaster || modPermissions.includes('banners');
  const canViewDesign = isMaster || modPermissions.includes('design');
  const canViewContact = isMaster || modPermissions.includes('contact');
  const canViewModerators = isMaster;

  const [activeTab, setActiveTab] = useState<'catalog' | 'orders' | 'users' | 'banners' | 'design' | 'contact' | 'moderators'>(() => {
    if (canViewUsers) return 'users';
    if (canViewCatalog) return 'catalog';
    if (canViewOrders) return 'orders';
    if (canViewBanners) return 'banners';
    if (canViewDesign) return 'design';
    if (canViewContact) return 'contact';
    if (canViewModerators) return 'moderators';
    return 'orders';
  });

  // Keep activeTab aligned with permitted tabs
  useEffect(() => {
    const allowedTabs: ('catalog' | 'orders' | 'users' | 'banners' | 'design' | 'contact' | 'moderators')[] = [];
    if (canViewUsers) allowedTabs.push('users');
    if (canViewCatalog) allowedTabs.push('catalog');
    if (canViewOrders) allowedTabs.push('orders');
    if (canViewBanners) allowedTabs.push('banners');
    if (canViewDesign) allowedTabs.push('design');
    if (canViewContact) allowedTabs.push('contact');
    if (canViewModerators) allowedTabs.push('moderators');

    if (allowedTabs.length > 0 && !allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0]);
    }
  }, [canViewUsers, canViewCatalog, canViewOrders, canViewBanners, canViewDesign, canViewContact, canViewModerators, activeTab]);

  const [registeredUsers, setRegisteredUsers] = useState<AuthUser[]>([]);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [firebaseOrders, setFirebaseOrders] = useState<OrderRecord[]>([]);
  const [firebaseLogs, setFirebaseLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Orders Management state
  const [isClearingOrders, setIsClearingOrders] = useState(false);
  const [showClearOrdersConfirm, setShowClearOrdersConfirm] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending_view' | 'pending_payment' | 'delivered' | 'rejected'>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const handleClearAllOrders = async () => {
    setIsClearingOrders(true);
    try {
      await clearAllOrdersFromFirestore();
      setFirebaseOrders([]);
      setShowClearOrdersConfirm(false);
    } catch (e) {
      console.error('Error clearing orders:', e);
    } finally {
      setIsClearingOrders(false);
    }
  };

  const handleDeleteSingleOrder = async (orderId: string) => {
    try {
      await deleteOrderFromFirestore(orderId);
      setFirebaseOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (e) {
      console.error('Error deleting order:', e);
    }
  };

  // Delivery URL modal state when order is delivered
  const [deliveringOrder, setDeliveringOrder] = useState<OrderRecord | null>(null);
  const [deliveryUrlInput, setDeliveryUrlInput] = useState<string>('');
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus, customDeliveryUrl?: string) => {
    // If selecting delivered and no custom url provided, prompt with delivery link modal
    if (newStatus === 'delivered' && customDeliveryUrl === undefined) {
      const targetOrder = firebaseOrders.find((o) => o.id === orderId);
      if (targetOrder) {
        setDeliveringOrder(targetOrder);
        setDeliveryUrlInput(targetOrder.deliveryUrl || targetOrder.items?.[0]?.svgaUrl || '');
        return;
      }
    }

    setUpdatingOrderId(orderId);
    // Optimistic update
    setFirebaseOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, ...(customDeliveryUrl !== undefined ? { deliveryUrl: customDeliveryUrl } : {}) } : o))
    );
    try {
      await updateOrderStatusInFirestore(orderId, newStatus, customDeliveryUrl);
    } catch (e) {
      console.error('Error updating order status:', e);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!deliveringOrder?.id) return;
    setIsSavingDelivery(true);
    const orderId = deliveringOrder.id;
    const url = deliveryUrlInput.trim();

    setFirebaseOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'delivered', deliveryUrl: url } : o))
    );

    try {
      await updateOrderStatusInFirestore(orderId, 'delivered', url);
      setDeliveringOrder(null);
    } catch (e) {
      console.error('Error saving delivery url:', e);
    } finally {
      setIsSavingDelivery(false);
    }
  };

  // User Ban Management state
  const [banTargetUser, setBanTargetUser] = useState<AuthUser | null>(null);
  const [selectedBanDuration, setSelectedBanDuration] = useState<'1_day' | '1_week' | '1_month' | '1_year' | 'permanent'>('1_day');
  const [banReasonInput, setBanReasonInput] = useState('');
  const [userActionToast, setUserActionToast] = useState('');
  const [activeBanPopoverId, setActiveBanPopoverId] = useState<string | null>(null);

  const handleQuickBan = async (u: AuthUser, duration: '1_day' | '1_week' | '1_month' | '1_year' | 'permanent') => {
    setActiveBanPopoverId(null);

    const now = Date.now();
    let bannedUntil: string | null = null;
    if (duration === '1_day') bannedUntil = new Date(now + 24 * 60 * 60 * 1000).toISOString();
    else if (duration === '1_week') bannedUntil = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
    else if (duration === '1_month') bannedUntil = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
    else if (duration === '1_year') bannedUntil = new Date(now + 365 * 24 * 60 * 60 * 1000).toISOString();
    else bannedUntil = null;

    // Optimistically update registeredUsers immediately so "نشط" turns into "محظور" in 0ms
    setRegisteredUsers((prev) =>
      prev.map((usr) =>
        usr.id === u.id || usr.email.toLowerCase() === u.email.toLowerCase()
          ? {
              ...usr,
              isBanned: true,
              banDurationType: duration,
              bannedUntil,
              banReason: 'تقييد الحساب من قبل الإدارة',
              bannedAt: new Date().toISOString()
            }
          : usr
      )
    );

    const durationLabel = 
      duration === '1_day' ? 'يوم واحد' :
      duration === '1_week' ? 'أسبوع كامل' :
      duration === '1_month' ? 'شهر كامل' :
      duration === '1_year' ? 'سنة كاملة' : 'حظر دائم';

    setUserActionToast(lang === 'ar' ? `تم حظر ${u.displayName} لمدة (${durationLabel}) بنجاح!` : `User banned for (${durationLabel}) successfully!`);
    setTimeout(() => setUserActionToast(''), 3500);

    try {
      await banUser(u.id, u.email, duration, 'تقييد الحساب من قبل الإدارة');
      const updated = await getAllRegisteredUsers();
      setRegisteredUsers(updated);
    } catch (e: any) {
      console.warn('Quick ban error:', e);
    }
  };

  const handleConfirmBan = async () => {
    if (!banTargetUser) return;
    try {
      await banUser(banTargetUser.id, banTargetUser.email, selectedBanDuration, banReasonInput);
      const updated = await getAllRegisteredUsers();
      setRegisteredUsers(updated);
      setUserActionToast(lang === 'ar' ? `تم حظر المستخدم ${banTargetUser.displayName} وطرده من المتجر بنجاح!` : `User banned and kicked out successfully!`);
      setTimeout(() => setUserActionToast(''), 3500);
    } catch (e: any) {
      console.warn('Ban error:', e);
    } finally {
      setBanTargetUser(null);
      setBanReasonInput('');
    }
  };

  const handleUnban = async (u: AuthUser) => {
    if (!confirm(lang === 'ar' ? `هل أنت متأكد من فك الحظر عن ${u.displayName}؟` : `Unban ${u.displayName}?`)) return;

    // Optimistic unban update
    setRegisteredUsers((prev) =>
      prev.map((usr) =>
        usr.id === u.id || usr.email.toLowerCase() === u.email.toLowerCase()
          ? {
              ...usr,
              isBanned: false,
              bannedUntil: undefined,
              banDurationType: undefined,
              banReason: undefined,
              bannedAt: undefined
            }
          : usr
      )
    );

    setUserActionToast(lang === 'ar' ? `تم فك الحظر عن ${u.displayName} بنجاح!` : `User unbanned successfully!`);
    setTimeout(() => setUserActionToast(''), 3500);

    try {
      await unbanUser(u.id, u.email);
      const updated = await getAllRegisteredUsers();
      setRegisteredUsers(
        updated.map((usr) =>
          usr.id === u.id || usr.email.toLowerCase() === u.email.toLowerCase()
            ? {
                ...usr,
                isBanned: false,
                bannedUntil: undefined,
                banDurationType: undefined,
                banReason: undefined,
                bannedAt: undefined
              }
            : usr
        )
      );
    } catch (e: any) {
      console.warn('Unban error:', e);
    }
  };

  // Moderators Management state
  const [isAddModOpen, setIsAddModOpen] = useState(false);
  const [modFormEmail, setModFormEmail] = useState('');
  const [modFormPassword, setModFormPassword] = useState('');
  const [modFormName, setModFormName] = useState('');
  const [modFormPermissions, setModFormPermissions] = useState<ModeratorPermissionKey[]>([
    'catalog',
    'orders',
  ]);
  const [modFormShowPassword, setModFormShowPassword] = useState(true);
  const [isCreatingMod, setIsCreatingMod] = useState(false);
  const [createdModSuccess, setCreatedModSuccess] = useState<{
    email: string;
    password: string;
    displayName: string;
    permissions: ModeratorPermissionKey[];
  } | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [modSearchTerm, setModSearchTerm] = useState('');

  // Edit Permissions Modal
  const [editingModPermissionsUser, setEditingModPermissionsUser] = useState<AuthUser | null>(null);
  const [tempPermissionsSelection, setTempPermissionsSelection] = useState<ModeratorPermissionKey[]>([]);
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  // Edit Password Modal
  const [editingModPasswordUser, setEditingModPasswordUser] = useState<AuthUser | null>(null);
  const [newModPasswordInput, setNewModPasswordInput] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Action loading states
  const [revokingEmail, setRevokingEmail] = useState<string | null>(null);
  const [deletingModUser, setDeletingModUser] = useState<AuthUser | null>(null);
  const [isDeletingMod, setIsDeletingMod] = useState(false);

  const moderatorsList = registeredUsers.filter(
    (u) => (u.role === 'moderator' || u.isModerator) && !isMasterAdmin(u)
  );

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$!';
    let res = '';
    for (let i = 0; i < 9; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setModFormPassword(res);
  };

  const handleCreateModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modFormEmail.trim() || !modFormPassword.trim()) return;
    setIsCreatingMod(true);
    try {
      const created = await createModeratorAccount({
        email: modFormEmail.trim(),
        password: modFormPassword.trim(),
        displayName: modFormName.trim() || modFormEmail.trim().split('@')[0],
        permissions: modFormPermissions,
      });

      // Update registered users immediately
      setRegisteredUsers((prev) => {
        const filtered = prev.filter((u) => u.email.toLowerCase() !== created.email.toLowerCase());
        return [created, ...filtered];
      });

      setCreatedModSuccess({
        email: created.email,
        password: modFormPassword.trim(),
        displayName: created.displayName,
        permissions: modFormPermissions,
      });

      // Reset form
      setModFormEmail('');
      setModFormPassword('');
      setModFormName('');
      setModFormPermissions(['catalog', 'orders']);
      setIsAddModOpen(false);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء إنشاء حساب المشرف');
    } finally {
      setIsCreatingMod(false);
    }
  };

  const handleToggleRevokeModerator = async (mod: AuthUser) => {
    const nextRevoked = !mod.isModeratorRevoked;
    setRevokingEmail(mod.email);
    try {
      await updateModeratorAccount({
        email: mod.email,
        isModeratorRevoked: nextRevoked,
      });
      setRegisteredUsers((prev) =>
        prev.map((u) =>
          u.email.toLowerCase() === mod.email.toLowerCase()
            ? { ...u, isModeratorRevoked: nextRevoked }
            : u
        )
      );
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء تحديث حالة المشرف');
    } finally {
      setRevokingEmail(null);
    }
  };

  const handleOpenEditPermissions = (mod: AuthUser) => {
    setEditingModPermissionsUser(mod);
    setTempPermissionsSelection(mod.moderatorPermissions || []);
  };

  const handleSaveModeratorPermissions = async () => {
    if (!editingModPermissionsUser) return;
    setIsSavingPerms(true);
    try {
      await updateModeratorAccount({
        email: editingModPermissionsUser.email,
        permissions: tempPermissionsSelection,
      });
      setRegisteredUsers((prev) =>
        prev.map((u) =>
          u.email.toLowerCase() === editingModPermissionsUser.email.toLowerCase()
            ? { ...u, moderatorPermissions: tempPermissionsSelection }
            : u
        )
      );
      setEditingModPermissionsUser(null);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حفظ الصلاحيات');
    } finally {
      setIsSavingPerms(false);
    }
  };

  const handleOpenEditPassword = (mod: AuthUser) => {
    setEditingModPasswordUser(mod);
    setNewModPasswordInput(mod.plainPassword || '');
  };

  const handleSaveModeratorPassword = async () => {
    if (!editingModPasswordUser || !newModPasswordInput.trim()) return;
    setIsSavingPassword(true);
    try {
      await updateModeratorAccount({
        email: editingModPasswordUser.email,
        newPassword: newModPasswordInput.trim(),
      });
      setRegisteredUsers((prev) =>
        prev.map((u) =>
          u.email.toLowerCase() === editingModPasswordUser.email.toLowerCase()
            ? { ...u, plainPassword: newModPasswordInput.trim() }
            : u
        )
      );
      setEditingModPasswordUser(null);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteModerator = async () => {
    if (!deletingModUser) return;
    setIsDeletingMod(true);
    try {
      await deleteModeratorAccount(deletingModUser.email, false);
      setRegisteredUsers((prev) =>
        prev.map((u) =>
          u.email.toLowerCase() === deletingModUser.email.toLowerCase()
            ? { ...u, role: 'user', isModerator: false, moderatorPermissions: [], isModeratorRevoked: true }
            : u
        )
      );
      setDeletingModUser(null);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حذف المشرف');
    } finally {
      setIsDeletingMod(false);
    }
  };

  const handleCopyModeratorCredentials = (creds: {
    email: string;
    password?: string;
    displayName?: string;
    permissions?: ModeratorPermissionKey[];
  }) => {
    const permNames = (creds.permissions || [])
      .map((p) => ALL_MODERATOR_PERMISSIONS.find((def) => def.id === p)?.labelAr || p)
      .join('، ');

    const text = `بيانات الدخول إلى لوحة التحكم - متجر فيلكس (FILEX STORE)
البريد الإلكتروني: ${creds.email}
كلمة المرور: ${creds.password || '••••••••'}
الأزرار والصلاحيات المفعلة: ${permNames || 'الافتراضية'}
رابط الدخول للمتجر: ${window.location.origin}`;

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  // Banners tab state (Bilingual: Arabic & English)
  const [bannerImageUrlAr, setBannerImageUrlAr] = useState('');
  const [bannerImageUrlEn, setBannerImageUrlEn] = useState('');
  const [bannerTitleAr, setBannerTitleAr] = useState('');
  const [bannerTitleEn, setBannerTitleEn] = useState('');
  const [bannerDescriptionAr, setBannerDescriptionAr] = useState('');
  const [bannerDescriptionEn, setBannerDescriptionEn] = useState('');
  const [bannerToast, setBannerToast] = useState('');
  const [bannerPreviewTab, setBannerPreviewTab] = useState<'ar' | 'en'>('ar');

  const handleCreateBanner = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAr = bannerImageUrlAr.trim();
    const cleanEn = bannerImageUrlEn.trim();

    if (!cleanAr && !cleanEn) return;

    const baseImg = cleanAr || cleanEn;

    const newBanner: StoreBanner = {
      id: `banner-${Date.now()}`,
      imageUrl: baseImg,
      imageUrlAr: cleanAr || undefined,
      imageUrlEn: cleanEn || undefined,
      title: bannerTitleAr.trim() || bannerTitleEn.trim() || undefined,
      titleAr: bannerTitleAr.trim() || undefined,
      titleEn: bannerTitleEn.trim() || undefined,
      description: bannerDescriptionAr.trim() || bannerDescriptionEn.trim() || undefined,
      descriptionAr: bannerDescriptionAr.trim() || undefined,
      descriptionEn: bannerDescriptionEn.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddBanner(newBanner);
    setBannerImageUrlAr('');
    setBannerImageUrlEn('');
    setBannerTitleAr('');
    setBannerTitleEn('');
    setBannerDescriptionAr('');
    setBannerDescriptionEn('');
    setBannerToast(
      lang === 'ar'
        ? 'تم نشر البنر بالنسختين (العربية والإنجليزية) بنجاح في المتجر!'
        : 'Banner published in both languages successfully!'
    );
    setTimeout(() => setBannerToast(''), 3000);
  };

  // Site Branding & Contact State inside Admin Dashboard
  const [bgInput, setBgInput] = useState(branding.backgroundImageUrl || DEFAULT_BRANDING.backgroundImageUrl);
  const [loginBgInput, setLoginBgInput] = useState(branding.loginBackgroundImageUrl || branding.backgroundImageUrl || DEFAULT_BRANDING.backgroundImageUrl);
  const [logoInput, setLogoInput] = useState(branding.logoIconUrl || '');
  const [phoneInput, setPhoneInput] = useState(branding.supportPhone || DEFAULT_SUPPORT_PHONE);
  const [brandingSavedToast, setBrandingSavedToast] = useState(false);
  const [phoneSavedToast, setPhoneSavedToast] = useState(false);

  useEffect(() => {
    setBgInput(branding.backgroundImageUrl || DEFAULT_BRANDING.backgroundImageUrl);
    setLoginBgInput(branding.loginBackgroundImageUrl || branding.backgroundImageUrl || DEFAULT_BRANDING.backgroundImageUrl);
    setLogoInput(branding.logoIconUrl || '');
    setPhoneInput(branding.supportPhone || DEFAULT_SUPPORT_PHONE);
  }, [branding]);

  const handleSaveBranding = (
    optionsOrBg?: string | { bg?: string; logo?: string; loginBg?: string; phone?: string },
    newLogo?: string,
    newLoginBg?: string,
    newPhone?: string
  ) => {
    let nextBg = bgInput;
    let nextLoginBg = loginBgInput;
    let nextLogo = logoInput;
    let nextPhone = phoneInput;

    if (typeof optionsOrBg === 'object' && optionsOrBg !== null) {
      if (optionsOrBg.bg !== undefined) nextBg = optionsOrBg.bg;
      if (optionsOrBg.loginBg !== undefined) nextLoginBg = optionsOrBg.loginBg;
      if (optionsOrBg.logo !== undefined) nextLogo = optionsOrBg.logo;
      if (optionsOrBg.phone !== undefined) nextPhone = optionsOrBg.phone;
    } else {
      if (optionsOrBg !== undefined) nextBg = optionsOrBg;
      if (newLogo !== undefined) nextLogo = newLogo;
      if (newLoginBg !== undefined) nextLoginBg = newLoginBg;
      if (newPhone !== undefined) nextPhone = newPhone;
    }

    const updated: SiteBranding = {
      backgroundImageUrl: nextBg.trim() || DEFAULT_BRANDING.backgroundImageUrl,
      loginBackgroundImageUrl: nextLoginBg.trim() || DEFAULT_BRANDING.backgroundImageUrl,
      logoIconUrl: nextLogo.trim(),
      supportPhone: nextPhone.trim() || DEFAULT_SUPPORT_PHONE,
    };
    onUpdateBranding(updated);
    if (typeof optionsOrBg === 'object' && optionsOrBg !== null && optionsOrBg.phone !== undefined) {
      setPhoneSavedToast(true);
      setTimeout(() => setPhoneSavedToast(false), 3000);
    } else {
      setBrandingSavedToast(true);
      setTimeout(() => setBrandingSavedToast(false), 2500);
    }
  };

  // Subscribe to real-time Firebase orders & activity logs & registered users
  useEffect(() => {
    const unsubOrders = subscribeToOrders((orders) => {
      setFirebaseOrders(orders);
    });
    const unsubLogs = subscribeToActivityLogs((logs) => {
      setFirebaseLogs(logs);
    });

    // Load registered users
    getAllRegisteredUsers().then(setRegisteredUsers).catch(console.warn);

    return () => {
      unsubOrders();
      unsubLogs();
    };
  }, []);

  // Helper to resolve clean User ID for customer orders instead of "غير محدد"
  const getOrderUserId = (o: OrderRecord): string => {
    if (o.userId && o.userId !== 'غير محدد') return o.userId;
    if (o.userAppId && o.userAppId !== 'غير محدد') return o.userAppId;

    // Match by customer name or email in registered users
    const foundUser = registeredUsers.find(
      (u) =>
        (o.userId && u.id === o.userId) ||
        (o.userEmail && u.email?.toLowerCase() === o.userEmail.toLowerCase()) ||
        (u.displayName && u.displayName.trim() === o.customerName?.trim()) ||
        (currentUser && currentUser.displayName?.trim() === o.customerName?.trim() && currentUser.id)
    );
    if (foundUser?.id) return foundUser.id;
    if (currentUser?.displayName === o.customerName && currentUser?.id) return currentUser.id;

    // Fallback: pick user from registered users or default sequential format
    const normalUser = registeredUsers.find((u) => u.role !== 'admin');
    if (normalUser?.id) return normalUser.id;
    if (registeredUsers[0]?.id) return registeredUsers[0].id;

    return '10001';
  };

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formNameZh, setFormNameZh] = useState('');
  const [formCategory, setFormCategory] = useState<Exclude<ProductCategory, 'all'>>('avatar_frames');
  const [formPrice, setFormPrice] = useState<number>(29.99);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number>(45.00);
  const [formVipLevel, setFormVipLevel] = useState<number>(7);
  const [formTag, setFormTag] = useState<ProductTag>('HOT');
  const [formFileFormat, setFormFileFormat] = useState('SVGA');
  const [formPreviewImage, setFormPreviewImage] = useState('');
  const [formPreviewVideoUrl, setFormPreviewVideoUrl] = useState('');
  const [formSvgaUrl, setFormSvgaUrl] = useState('');
  const [formFileSize, setFormFileSize] = useState('2.1 MB');
  const [formDuration, setFormDuration] = useState('6.0s');
  const [formDescription, setFormDescription] = useState('');
  const [formAccentColor, setFormAccentColor] = useState('#f59e0b');

  // Image Upload States & File Input Refs
  const [isUploadingProductImg, setIsUploadingProductImg] = useState(false);
  const [isUploadingBannerImgAr, setIsUploadingBannerImgAr] = useState(false);
  const [isUploadingBannerImgEn, setIsUploadingBannerImgEn] = useState(false);
  const [isUploadingBgImg, setIsUploadingBgImg] = useState(false);
  const [isUploadingLoginBgImg, setIsUploadingLoginBgImg] = useState(false);
  const [isUploadingLogoImg, setIsUploadingLogoImg] = useState(false);
  const [replacingProductId, setReplacingProductId] = useState<string | null>(null);

  const productFileInputRef = React.useRef<HTMLInputElement>(null);
  const bannerFileInputRefAr = React.useRef<HTMLInputElement>(null);
  const bannerFileInputRefEn = React.useRef<HTMLInputElement>(null);
  const tableFileInputRef = React.useRef<HTMLInputElement>(null);
  const bgFileInputRef = React.useRef<HTMLInputElement>(null);
  const loginBgFileInputRef = React.useRef<HTMLInputElement>(null);
  const logoFileInputRef = React.useRef<HTMLInputElement>(null);

  // Handle uploading product image directly from device
  const handleProductImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingProductImg(true);
      const encoded = await compressAndEncodeImage(file, 800, 800, 0.85);
      setFormPreviewImage(encoded);
    } catch (err) {
      console.error('Failed to compress product image:', err);
    } finally {
      setIsUploadingProductImg(false);
      if (productFileInputRef.current) productFileInputRef.current.value = '';
    }
  };

  // Handle quick image replacement directly from catalog table
  const handleTriggerReplaceImage = (productId: string) => {
    setReplacingProductId(productId);
    tableFileInputRef.current?.click();
  };

  const handleTableFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingProductId) return;
    try {
      const encoded = await compressAndEncodeImage(file, 800, 800, 0.85);
      const prod = products.find((p) => p.id === replacingProductId);
      if (prod) {
        onUpdateProduct({
          ...prod,
          previewImage: encoded,
        });
      }
    } catch (err) {
      console.error('Failed to replace image:', err);
    } finally {
      setReplacingProductId(null);
      if (tableFileInputRef.current) tableFileInputRef.current.value = '';
    }
  };

  // Handle uploading Arabic banner image directly from device
  const handleBannerImageFileAr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingBannerImgAr(true);
      const encoded = await compressAndEncodeImage(file, 1400, 600, 0.82);
      setBannerImageUrlAr(encoded);
    } catch (err) {
      console.error('Failed to compress Arabic banner image:', err);
    } finally {
      setIsUploadingBannerImgAr(false);
      if (bannerFileInputRefAr.current) bannerFileInputRefAr.current.value = '';
    }
  };

  // Handle uploading English banner image directly from device
  const handleBannerImageFileEn = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingBannerImgEn(true);
      const encoded = await compressAndEncodeImage(file, 1400, 600, 0.82);
      setBannerImageUrlEn(encoded);
    } catch (err) {
      console.error('Failed to compress English banner image:', err);
    } finally {
      setIsUploadingBannerImgEn(false);
      if (bannerFileInputRefEn.current) bannerFileInputRefEn.current.value = '';
    }
  };

  // Handle uploading site background from device
  const handleBgFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingBgImg(true);
      const encoded = await compressAndEncodeImage(file, 1920, 1080, 0.82);
      setBgInput(encoded);
      handleSaveBranding({ bg: encoded });
    } catch (err) {
      console.error('Failed to upload background:', err);
    } finally {
      setIsUploadingBgImg(false);
      if (bgFileInputRef.current) bgFileInputRef.current.value = '';
    }
  };

  // Handle uploading login background from device
  const handleLoginBgFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingLoginBgImg(true);
      const encoded = await compressAndEncodeImage(file, 1920, 1080, 0.82);
      setLoginBgInput(encoded);
      handleSaveBranding({ loginBg: encoded });
    } catch (err) {
      console.error('Failed to upload login background:', err);
    } finally {
      setIsUploadingLoginBgImg(false);
      if (loginBgFileInputRef.current) loginBgFileInputRef.current.value = '';
    }
  };

  // Handle uploading logo icon from device
  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingLogoImg(true);
      const encoded = await compressAndEncodeImage(file, 300, 300, 0.90);
      setLogoInput(encoded);
      handleSaveBranding({ logo: encoded });
    } catch (err) {
      console.error('Failed to upload logo:', err);
    } finally {
      setIsUploadingLogoImg(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  };

  // Open Form for New Product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormCode(`FX-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormName('');
    setFormNameEn('');
    setFormNameZh('');
    setFormCategory('avatar_frames');
    setFormPrice(25.00);
    setFormOriginalPrice(35.00);
    setFormVipLevel(6);
    setFormTag('NEW');
    setFormFileFormat('SVGA');
    setFormPreviewImage('');
    setFormPreviewVideoUrl('');
    setFormSvgaUrl('');
    setFormFileSize('2.0 MB');
    setFormDuration('6.0s');
    setFormDescription('');
    setFormAccentColor('#f59e0b');
    setIsFormOpen(true);
  };

  // Open Form for Editing Existing Product
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormCode(p.code);
    setFormName(p.name);
    setFormNameEn(p.nameEn);
    setFormNameZh(p.nameZh || '');
    setFormCategory(p.category);
    setFormPrice(p.price);
    setFormOriginalPrice(p.originalPrice || p.price);
    setFormVipLevel(p.vipLevel);
    setFormTag(p.tag || 'HOT');
    setFormFileFormat(p.fileFormat || 'SVGA');
    setFormPreviewImage(p.previewImage);
    setFormPreviewVideoUrl(p.previewVideoUrl || '');
    setFormSvgaUrl(p.svgaUrl);
    setFormFileSize(p.fileSize);
    setFormDuration(p.duration);
    setFormDescription(p.description);
    setFormAccentColor(p.accentColor || '#f59e0b');
    setIsFormOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    const compatList = ['جميع تطبيقات الدردشة الصوتية'];
    const finalCode = formCode.trim() || `FX-${Math.floor(1000 + Math.random() * 9000)}`;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        code: finalCode,
        name: formName,
        nameEn: formNameEn,
        nameZh: formNameZh,
        category: formCategory,
        price: Number(formPrice),
        originalPrice: Number(formOriginalPrice) || undefined,
        vipLevel: Number(formVipLevel),
        tag: formTag,
        fileFormat: formFileFormat.trim() || 'SVGA',
        previewImage: formPreviewImage,
        previewVideoUrl: formPreviewVideoUrl.trim() || undefined,
        svgaUrl: formSvgaUrl,
        fileSize: formFileSize,
        duration: formDuration,
        description: formDescription,
        compatibility: compatList,
        accentColor: formAccentColor,
      });
    } else {
      onAddProduct({
        code: finalCode,
        name: formName,
        nameEn: formNameEn || formName,
        nameZh: formNameZh || '极品动效',
        category: formCategory,
        price: Number(formPrice),
        originalPrice: Number(formOriginalPrice) || undefined,
        currency: 'USD',
        vipLevel: Number(formVipLevel),
        tag: formTag,
        fileFormat: formFileFormat.trim() || 'SVGA',
        previewImage: formPreviewImage,
        previewVideoUrl: formPreviewVideoUrl.trim() || undefined,
        animationType: 'dragon',
        svgaUrl: formSvgaUrl,
        fileSize: formFileSize,
        duration: formDuration,
        compatibility: compatList,
        downloadsCount: 0,
        description: formDescription,
        inStock: true,
        accentColor: formAccentColor,
        createdAt: new Date().toISOString().split('T')[0],
      });
    }

    setIsFormOpen(false);
  };

  const handleDuplicate = (p: Product) => {
    const code = `FX-COPY-${Math.floor(1000 + Math.random() * 9000)}`;
    onAddProduct({
      ...p,
      code,
      name: `${p.name} (نسخة جديدة)`,
      nameEn: `${p.nameEn} (Copy)`,
      downloadsCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    });
  };

  const handleToggleStock = (p: Product) => {
    onUpdateProduct({
      ...p,
      inStock: !p.inStock,
    });
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vipsvga_catalog_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalCatalogValue = products.reduce((acc, p) => acc + p.price, 0);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Package className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white">
              {lang === 'ar' ? 'لوحة تحكم إدارة المنتجات والتصاميم' : 'SVGA Product Management Console'}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'ar'
              ? 'إضافة وتعديل وحذف ملفات SVGA، أسعار الدخوليات والإطارات، والتحكم بالكتالوج.'
              : 'Add, edit, delete SVGA assets, configure prices, and manage catalog data.'}
          </p>
        </div>

        {/* Action Button: New Item (Clean Transparent Amber without Halo) */}
        {canAddProduct && !isRevoked && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-none backdrop-blur-sm"
            >
              <Plus className="w-4 h-4 text-amber-400 stroke-[2.5]" />
              <span>{lang === 'ar' ? 'إضافة تصاميم جديده' : 'New SVGA Item'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Revoked Access Banner if moderator permissions were revoked */}
      {isRevoked && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/35 text-red-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {lang === 'ar' ? 'تم سحب الصلاحيات من هذا الحساب' : 'Access Permissions Revoked'}
              </h3>
              <p className="text-xs text-red-300/90">
                {lang === 'ar' ? 'قام مدير النظام بسحب أو تجميد صلاحيات لوحة التحكم لهذا الحساب. يرجى التواصل مع الإدارة.' : 'The administrator has revoked your control panel access.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            {lang === 'ar' ? 'العودة للمتجر' : 'Back to Store'}
          </button>
        </div>
      )}

      {/* Navigation Tabs & Real-time Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#081224]/80 border border-blue-900/40">
        <div className="flex items-center gap-1.5 p-1 bg-[#0b162d] rounded-xl border border-blue-950 overflow-x-auto w-full sm:w-auto">
          {canViewUsers && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs backdrop-blur-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${activeTab === 'users' ? 'text-amber-400' : ''}`} />
              <span>
                {lang === 'ar' ? `(المستخدمين ${registeredUsers.length})` : `(Users ${registeredUsers.length})`}
              </span>
            </button>
          )}

          {canViewCatalog && (
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'catalog'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs backdrop-blur-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Package className={`w-3.5 h-3.5 ${activeTab === 'catalog' ? 'text-amber-400' : ''}`} />
              <span>
                {lang === 'ar' ? `كتالوج المنتجات (${products.length})` : `Products (${products.length})`}
              </span>
            </button>
          )}

          {canViewOrders && (
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs backdrop-blur-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <ShoppingBag className={`w-3.5 h-3.5 ${activeTab === 'orders' ? 'text-amber-400' : ''}`} />
              <span>
                {lang === 'ar' ? `طلبات العملاء (${firebaseOrders.length})` : `Orders (${firebaseOrders.length})`}
              </span>
            </button>
          )}

          {canViewBanners && (
            <button
              onClick={() => setActiveTab('banners')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'banners'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs backdrop-blur-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <ImageIcon className={`w-3.5 h-3.5 ${activeTab === 'banners' ? 'text-amber-400' : ''}`} />
              <span>
                {lang === 'ar' ? `البنرات (${banners.length})` : `Banners (${banners.length})`}
              </span>
            </button>
          )}

          {canViewDesign && (
            <button
              onClick={() => setActiveTab('design')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'design'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs backdrop-blur-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Paintbrush className={`w-3.5 h-3.5 ${activeTab === 'design' ? 'text-amber-400' : ''}`} />
              <span>
                {lang === 'ar' ? 'التصميم' : 'Appearance'}
              </span>
            </button>
          )}

          {canViewContact && (
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'contact'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs backdrop-blur-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Phone className={`w-3.5 h-3.5 ${activeTab === 'contact' ? 'text-amber-400' : ''}`} />
              <span>
                {lang === 'ar' ? 'التواصل' : 'Contact'}
              </span>
            </button>
          )}

          {canViewModerators && (
            <button
              onClick={() => setActiveTab('moderators')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'moderators'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs backdrop-blur-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${activeTab === 'moderators' ? 'text-amber-400' : ''}`} />
              <span>
                {lang === 'ar' ? `المشرفين (${moderatorsList.length})` : `Moderators (${moderatorsList.length})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* TAB CONTENT: CATALOG */}
      {activeTab === 'catalog' && (
        <div key="tab-catalog" className="space-y-6 animate-page-transition">
          {/* KPI Metric Cards (100% Real Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#0c162e]/90 border border-blue-900/40 space-y-1 shadow-md shadow-blue-950/20">
          <span className="text-[11px] text-slate-300 block font-medium">
            {lang === 'ar' ? 'إجمالي المنتجات في المتجر' : 'Total Items'}
          </span>
          <div className="text-2xl font-black text-white font-mono tabular-nums">
            {products.length}
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>{products.filter((p) => p.inStock).length} منتج نشط للبيع</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c162e]/90 border border-blue-900/40 space-y-1 shadow-md shadow-blue-950/20">
          <span className="text-[11px] text-slate-300 block font-medium">
            {lang === 'ar' ? 'إجمالي قيمة الكتالوج' : 'Catalog Value'}
          </span>
          <div className="text-2xl font-black text-amber-400 font-mono tabular-nums">
            ${totalCatalogValue.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400">متوسط سعر القطعة: ${(totalCatalogValue / (products.length || 1)).toFixed(2)}</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c162e]/90 border border-blue-900/40 space-y-1 shadow-md shadow-blue-950/20">
          <span className="text-[11px] text-slate-300 block font-medium">
            {lang === 'ar' ? 'الطلبات المسجلة' : 'Recorded Orders'}
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
            {firebaseOrders.length}
          </div>
          <span className="text-[10px] text-slate-400">
            إجمالي المبيعات الفعلية: ${firebaseOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0c162e]/90 border border-blue-900/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md shadow-blue-950/20">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'ar' ? 'البحث بالاسم أو كود التصميم...' : 'Search by code or title...'}
            className="w-full bg-[#081224] border border-blue-800/40 rounded-xl py-2 px-9 text-xs text-white focus:outline-none focus:border-amber-400 placeholder-slate-400 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#081224] border border-blue-800/40 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer shadow-xs"
          >
            <option value="all">{lang === 'ar' ? 'جميع الأقسام' : 'All Categories'}</option>
            <option value="avatar_frames">{lang === 'ar' ? 'اطارات' : 'Frames'}</option>
            <option value="entrance_effects">{lang === 'ar' ? 'دخوليات' : 'Entrances'}</option>
            <option value="gifts">{lang === 'ar' ? 'هدايا' : 'Gifts'}</option>
            <option value="medals">{lang === 'ar' ? 'ميداليات' : 'Medals'}</option>
            <option value="mic_frames">{lang === 'ar' ? 'مؤثرات مايك' : 'Mic Waves'}</option>
            <option value="chat_bubbles">{lang === 'ar' ? 'فقاعات الدردشه' : 'Chat Bubbles'}</option>
            <option value="room_themes">{lang === 'ar' ? 'ثيمات الغرفه' : 'Room Themes'}</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-blue-900/40 bg-[#0c162e]/90 overflow-hidden shadow-lg shadow-blue-950/25">
        <input
          type="file"
          ref={tableFileInputRef}
          onChange={handleTableFileChange}
          accept="image/*"
          className="hidden"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
            <thead className="bg-[#091326] border-b border-blue-900/40 text-slate-300 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">{lang === 'ar' ? 'التصميم' : 'Asset'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'الكود' : 'Code'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'القسم' : 'Category'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'السعر' : 'Price'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="py-3 px-4 text-center">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    {lang === 'ar' ? 'لم يتم العثور على أي منتجات مطابقة للبحث' : 'No matching products found'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    
                    {/* Visual & Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-black/60 overflow-hidden flex-shrink-0 border border-slate-800 p-0.5 relative">
                          <img
                            src={p.previewImage}
                            alt={p.name}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const next = e.currentTarget.nextElementSibling;
                              if (next) (next as HTMLElement).style.display = 'flex';
                            }}
                            className="w-full h-full object-contain"
                          />
                          <div
                            style={{ display: 'none' }}
                            className="w-full h-full flex flex-col items-center justify-center bg-red-950/40 text-amber-400 text-[8px] font-bold text-center"
                          >
                            <AlertCircle className="w-4 h-4 text-amber-400 mb-0.5" />
                            <span>{lang === 'ar' ? 'تالفة' : 'Broken'}</span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-white block truncate max-w-[220px]">
                            {lang === 'ar' ? p.name : p.nameEn}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {p.fileFormat ? `${p.fileFormat} · ` : ''}{p.fileSize}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleTriggerReplaceImage(p.id)}
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
                              title={lang === 'ar' ? 'رفع صورة جديدة من جهازك لهذا التصميم' : 'Upload new image for this item'}
                            >
                              <Upload className="w-2.5 h-2.5" />
                              <span>{lang === 'ar' ? 'استبدال الصورة' : 'Change Image'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="py-3 px-4 font-mono text-amber-400 font-semibold whitespace-nowrap">
                      {p.code}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[11px] text-slate-400">
                        {p.category === 'avatar_frames'
                          ? 'اطارات'
                          : p.category === 'entrance_effects'
                          ? 'دخوليات'
                          : p.category === 'gifts'
                          ? 'هدايا'
                          : p.category === 'medals'
                          ? 'ميداليات'
                          : p.category === 'mic_frames'
                          ? 'مؤثرات مايك'
                          : p.category === 'chat_bubbles'
                          ? 'فقاعات الدردشه'
                          : 'ثيمات الغرفه'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-black text-white font-mono tabular-nums text-sm">
                        ${p.price.toFixed(2)}
                      </span>
                      {p.originalPrice && (
                        <span className="block text-[10px] text-slate-500 line-through font-mono">
                          ${p.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </td>

                    {/* Stock Status Toggle */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStock(p)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                          p.inStock
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}
                      >
                        {p.inStock ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>متوفر</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>غير متوفر</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          title="تعديل المنتج"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف المنتج: ${p.name}؟`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          title="حذف المنتج"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      )}

      {/* TAB CONTENT: ORDERS (100% REAL FROM FIRESTORE) */}
      {activeTab === 'orders' && (
        <div key="tab-orders" className="space-y-4 animate-page-transition">
          <div className="p-4 rounded-2xl bg-[#0c162e]/90 border border-blue-900/40 flex flex-col gap-3 shadow-md shadow-blue-950/20">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto text-slate-400" />
                <input
                  type="text"
                  value={orderSearchTerm}
                  onChange={(e) => setOrderSearchTerm(e.target.value)}
                  placeholder={lang === 'ar' ? 'البحث في الطلبات باسم العميل أو الكود...' : 'Search orders by customer or code...'}
                  className="w-full bg-[#081224] border border-blue-800/40 rounded-xl py-2 px-9 text-xs text-white focus:outline-none focus:border-amber-400 placeholder-slate-400 shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                  {firebaseOrders.length} {lang === 'ar' ? 'طلب مسجل' : 'Orders'} · ${firebaseOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toFixed(2)}
                </span>
                {firebaseOrders.length > 0 && (
                  <button
                    onClick={() => setShowClearOrdersConfirm(true)}
                    disabled={isClearingOrders}
                    className="px-3 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/35 font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title={lang === 'ar' ? 'تصفير وحذف جميع الطلبات' : 'Clear all orders'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isClearingOrders ? (lang === 'ar' ? 'جارٍ التصفير...' : 'Clearing...') : (lang === 'ar' ? 'تصفير الطلبات' : 'Clear All Orders')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 border-t border-white/5 text-xs">
              <span className="text-[11px] text-slate-400 font-bold shrink-0">
                {lang === 'ar' ? 'تصفية الحالة:' : 'Status:'}
              </span>
              <button
                onClick={() => setOrderStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  orderStatusFilter === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {lang === 'ar' ? 'الكل' : 'All'} ({firebaseOrders.length})
              </button>
              <button
                onClick={() => setOrderStatusFilter('pending_view')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  orderStatusFilter === 'pending_view'
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {lang === 'ar' ? 'في انتظار المشاهدة' : 'In Review'} ({firebaseOrders.filter(o => o.status === 'pending_view' || o.status === 'pending' || !o.status).length})
              </button>
              <button
                onClick={() => setOrderStatusFilter('pending_payment')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  orderStatusFilter === 'pending_payment'
                    ? 'bg-sky-500/25 text-sky-300 border border-sky-500/50'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {lang === 'ar' ? 'في انتظار تأكيد الدفع' : 'Payment'} ({firebaseOrders.filter(o => o.status === 'pending_payment').length})
              </button>
              <button
                onClick={() => setOrderStatusFilter('delivered')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  orderStatusFilter === 'delivered'
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {lang === 'ar' ? 'تم التسليم' : 'Delivered'} ({firebaseOrders.filter(o => o.status === 'delivered' || o.status === 'completed').length})
              </button>
              <button
                onClick={() => setOrderStatusFilter('rejected')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  orderStatusFilter === 'rejected'
                    ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {lang === 'ar' ? 'تم الرفض' : 'Rejected'} ({firebaseOrders.filter(o => o.status === 'rejected' || o.status === 'cancelled').length})
              </button>
            </div>
          </div>

          {/* Confirmation Modal to Clear All Orders - Medium transparent with no red border and transparent red button */}
          {showClearOrdersConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="w-full max-w-sm rounded-2xl bg-[#0c162e]/75 backdrop-blur-md border border-slate-700/60 p-5 shadow-2xl text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-400 mx-auto flex items-center justify-center border border-slate-700/50">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  {lang === 'ar' ? 'هل أنت متأكد من تصفير وحذف كافة الطلبات؟' : 'Are you sure you want to clear all orders?'}
                </h4>
                <p className="text-xs text-slate-300">
                  {lang === 'ar' ? 'سيتم مسح جميع سجلات الطلبات نهائياً من قاعدة بيانات فايربيس.' : 'All customer order records will be permanently removed from Firebase.'}
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setShowClearOrdersConfirm(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 font-bold transition-colors cursor-pointer"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleClearAllOrders}
                    disabled={isClearingOrders}
                    className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 border border-red-500/40 text-xs font-bold transition-colors cursor-pointer shadow-md shadow-red-950/20"
                  >
                    {isClearingOrders ? (lang === 'ar' ? 'جارٍ الحذف...' : 'Deleting...') : (lang === 'ar' ? 'تأكيد التصفير' : 'Confirm Clear')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal to Set Download Site Link when Order is Delivered */}
          {deliveringOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-[#0c162e]/80 backdrop-blur-md border border-slate-700/60 p-5 shadow-2xl space-y-4 text-right rtl:text-right ltr:text-left">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {lang === 'ar' ? 'اعتماد تسليم الطلب وإدخال رابط التحميل' : 'Confirm Order Delivery & Download Link'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {deliveringOrder.customerName} <span className="font-mono text-amber-400 font-semibold">(ID: {getOrderUserId(deliveringOrder)})</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeliveringOrder(null)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-200 block">
                    {lang === 'ar' ? 'رابط الموقع / التحميل المباشر للمستخدم:' : 'Download / Delivery Site URL:'}
                  </label>
                  <input
                    type="url"
                    value={deliveryUrlInput}
                    onChange={(e) => setDeliveryUrlInput(e.target.value)}
                    placeholder="https://example.com/download-files..."
                    dir="ltr"
                    className="w-full bg-[#081224] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
                  />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {lang === 'ar'
                      ? 'عندما يضغط العميل على كلمة "تحميل مباشر" في سجل الطلبات، سيتم توجيهه مباشرة إلى هذا الرابط لتحميل الملفات.'
                      : 'When the customer clicks "Direct Download" in their order history, they will be redirected to this link to download their files.'}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setDeliveringOrder(null)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 font-bold transition-colors cursor-pointer"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleConfirmDelivery}
                    disabled={isSavingDelivery}
                    className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSavingDelivery ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ واعتماد التسليم' : 'Save & Deliver')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-blue-900/40 bg-[#0c162e]/90 overflow-hidden shadow-lg shadow-blue-950/25">
            <div className="overflow-x-auto">
              <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
                <thead className="bg-[#091326] border-b border-blue-900/40 text-slate-300 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">{lang === 'ar' ? 'العميل' : 'Customer'}</th>
                    <th className="py-3 px-4">{lang === 'ar' ? 'العناصر المطلوبة' : 'Items'}</th>
                    <th className="py-3 px-4">{lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
                    <th className="py-3 px-4">{lang === 'ar' ? 'طريقة الاستلام' : 'Method'}</th>
                    <th className="py-3 px-4">{lang === 'ar' ? 'التاريخ والوقت' : 'Date'}</th>
                    <th className="py-3 px-4">{lang === 'ar' ? 'التحكم في حالة الطلب' : 'Status Control'}</th>
                    <th className="py-3 px-4 text-center">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {firebaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                        <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="font-bold text-sm text-slate-300">
                          {lang === 'ar' ? 'لا توجد طلبات مسجلة حتى الآن' : 'No recorded orders yet'}
                        </p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          {lang === 'ar'
                            ? 'جميع الطلبات التي ينفذها العملاء عبر سلة المشتريات ستُحفظ في فايربيس وتظهر هنا مباشرة بشكل حقيقي وفوري.'
                            : 'Orders placed by customers will be saved to Firebase and appear here in real time.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    firebaseOrders
                      .filter((o) => {
                        const t = orderSearchTerm.toLowerCase();
                        const matchesSearch =
                          !orderSearchTerm ||
                          o.customerName.toLowerCase().includes(t) ||
                          getOrderUserId(o).toLowerCase().includes(t) ||
                          o.items?.some((it) => it.name.toLowerCase().includes(t) || it.code.toLowerCase().includes(t));

                        if (!matchesSearch) return false;
                        if (orderStatusFilter === 'all') return true;

                        const norm =
                          o.status === 'pending' || o.status === 'pending_view' || !o.status
                            ? 'pending_view'
                            : o.status === 'pending_payment'
                            ? 'pending_payment'
                            : o.status === 'completed' || o.status === 'delivered'
                            ? 'delivered'
                            : o.status === 'cancelled' || o.status === 'rejected'
                            ? 'rejected'
                            : 'pending_view';

                        return norm === orderStatusFilter;
                      })
                      .map((o, idx) => {
                        const rawStatus = o.status || 'pending_view';
                        const currentStatusValue: OrderStatus =
                          rawStatus === 'pending' ? 'pending_view' : rawStatus === 'completed' ? 'delivered' : rawStatus === 'cancelled' ? 'rejected' : rawStatus;

                        return (
                          <tr key={o.id || idx} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-bold text-white block">{o.customerName}</span>
                              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                <span>App ID:</span>
                                <span className="text-amber-400 font-bold">{getOrderUserId(o)}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                {o.items?.map((it, i) => (
                                  <div key={i} className="text-[11px] flex items-center gap-1.5">
                                    <span className="text-slate-300 font-medium">{it.name}</span>
                                    {it.code && (
                                      <span className="font-mono text-amber-400 font-bold text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                        {it.code}
                                      </span>
                                    )}
                                    <span className="text-slate-500 text-[10px]">x{it.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono font-black text-amber-400 text-sm">
                              ${(o.totalAmount || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-200 border border-slate-700">
                                {o.paymentMethod === 'whatsapp' ? 'واتساب' : 'تحميل مباشر'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                              {formatEnglishDateTime(o.createdAt || o.clientDate)}
                            </td>
                            <td className="py-3 px-4">
                              {/* Interactive Status Selector controlled by Admin */}
                              <div className="relative inline-block">
                                <select
                                  value={currentStatusValue}
                                  onChange={(e) => o.id && handleUpdateOrderStatus(o.id, e.target.value as OrderStatus)}
                                  disabled={updatingOrderId === o.id}
                                  className={`text-xs font-bold py-1.5 px-3 rounded-xl border appearance-none pr-7 rtl:pr-3 rtl:pl-7 cursor-pointer focus:outline-none transition-all shadow-xs ${
                                    currentStatusValue === 'pending_view'
                                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/35 hover:bg-amber-500/25'
                                      : currentStatusValue === 'pending_payment'
                                      ? 'bg-sky-500/15 text-sky-300 border-sky-500/35 hover:bg-sky-500/25'
                                      : currentStatusValue === 'delivered'
                                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25'
                                      : 'bg-rose-500/15 text-rose-300 border-rose-500/35 hover:bg-rose-500/25'
                                  }`}
                                >
                                  <option value="pending_view" className="bg-[#0b162d] text-amber-300">
                                    {lang === 'ar' ? 'في انتظار المشاهدة' : 'Awaiting Review'}
                                  </option>
                                  <option value="pending_payment" className="bg-[#0b162d] text-sky-300">
                                    {lang === 'ar' ? 'في انتظار تأكيد الدفع' : 'Awaiting Payment'}
                                  </option>
                                  <option value="delivered" className="bg-[#0b162d] text-emerald-300">
                                    {lang === 'ar' ? 'تم التسليم' : 'Delivered'}
                                  </option>
                                  <option value="rejected" className="bg-[#0b162d] text-rose-300">
                                    {lang === 'ar' ? 'تم الرفض' : 'Rejected'}
                                  </option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 right-2 rtl:right-auto rtl:left-2 pointer-events-none opacity-70" />
                              </div>
                              {currentStatusValue === 'delivered' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeliveringOrder(o);
                                    setDeliveryUrlInput(o.deliveryUrl || o.items?.[0]?.svgaUrl || '');
                                  }}
                                  className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-1 font-semibold transition-colors cursor-pointer"
                                  title={lang === 'ar' ? 'تعديل أو إدخال رابط الموقع للتحميل' : 'Edit download URL'}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>
                                    {o.deliveryUrl
                                      ? (lang === 'ar' ? 'تعديل رابط التحميل' : 'Edit Link')
                                      : (lang === 'ar' ? 'إدخال رابط التحميل' : 'Add Link')}
                                  </span>
                                </button>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <a
                                  href={getWhatsAppUrl(
                                    branding.supportPhone,
                                    `السلام عليكم ${o.customerName}، بخصوص طلبك (${o.id?.slice(-6)}) في متجر FILEX STORE:`
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                  title={lang === 'ar' ? 'مراسلة العميل عبر واتساب' : 'WhatsApp Customer'}
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  onClick={() => o.id && handleDeleteSingleOrder(o.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                  title={lang === 'ar' ? 'حذف الطلب' : 'Delete Order'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: USERS */}
      {activeTab === 'users' && (
        <div key="tab-users" className="space-y-4 animate-page-transition">
          <div className="p-4 rounded-2xl bg-[#0c162e]/90 border border-blue-900/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md shadow-blue-950/20">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto text-slate-400" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder={lang === 'ar' ? 'البحث عن مستخدم بالاسم أو الإيميل...' : 'Search users by name or email...'}
                className="w-full bg-[#081224] border border-blue-800/40 rounded-xl py-2 px-9 text-xs text-white focus:outline-none focus:border-amber-400 placeholder-slate-400 shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="px-3 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold">
                {registeredUsers.filter((u) => {
                  const t = userSearchTerm.toLowerCase();
                  return (u.displayName && u.displayName.toLowerCase().includes(t)) || (u.email && u.email.toLowerCase().includes(t));
                }).length} {lang === 'ar' ? 'مستخدم مسجل' : 'Registered Users'}
              </span>
            </div>
          </div>

          {/* Toast Notification for Ban / Unban Actions */}
          {userActionToast && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">{userActionToast}</span>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="rounded-2xl border border-blue-900/40 bg-[#0c162e]/90 overflow-hidden shadow-lg shadow-blue-950/25">
            <div className="overflow-x-auto">
              <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
                <thead className="bg-[#091326] border-b border-blue-900/40 text-slate-300 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">{lang === 'ar' ? 'المستخدم' : 'User'}</th>
                    <th className="py-3 px-4">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                    <th className="py-3 px-4">{lang === 'ar' ? 'كلمة المرور (الباسورد)' : 'Password'}</th>
                    <th className="py-3 px-4">{lang === 'ar' ? 'نوع الحساب / الرتبة' : 'Role'}</th>
                    <th className="py-3 px-4">{lang === 'ar' ? 'تاريخ الانضمام' : 'Joined'}</th>
                    <th className="py-3 px-4">{lang === 'ar' ? 'آخر ظهور' : 'Last Seen'}</th>
                    <th className="py-3 px-4">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="py-3 px-4 text-center">{lang === 'ar' ? 'إجراءات الحظر' : 'Ban Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {registeredUsers
                    .filter((u) => {
                      const t = userSearchTerm.toLowerCase();
                      return (u.displayName && u.displayName.toLowerCase().includes(t)) || (u.email && u.email.toLowerCase().includes(t));
                    })
                    .map((u, idx) => {
                      const isPwdVisible = !!showPasswordMap[u.id || u.email];
                      const pwd = u.plainPassword || (u.role === 'admin' ? ADMIN_CREDENTIALS.password : '******');
                      const banStatus = checkUserBanStatus(u);
                      return (
                        <tr key={u.id || u.email} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-950 border border-blue-800/60 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                                {u.displayName ? u.displayName.slice(0, 1).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{u.displayName || 'مستخدم مسجل'}</span>
                                <span className="text-[10px] text-white font-mono block">
                                  ID: {u.id && /^\d{5,}$/.test(u.id) ? u.id : (u.email?.toLowerCase().includes('alex') ? '10001' : (u.email?.toLowerCase().includes('tolex666') ? '10002' : (u.role === 'admin' ? '10000' : u.id)))}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-200">
                            {u.email}
                          </td>
                          {/* Password Field - Hidden with standard password mask and eye toggle */}
                          <td className="py-3 px-4 font-mono text-slate-200 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="select-all">
                                {isPwdVisible ? pwd : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPasswordMap((prev) => ({
                                    ...prev,
                                    [u.id || u.email]: !prev[u.id || u.email],
                                  }));
                                }}
                                className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title={isPwdVisible ? (lang === 'ar' ? 'إخفاء كلمة المرور' : 'Hide Password') : (lang === 'ar' ? 'عرض كلمة المرور' : 'Show Password')}
                              >
                                {isPwdVisible ? (
                                  <EyeOff className="w-4 h-4 text-slate-400 hover:text-white" />
                                ) : (
                                  <Eye className="w-4 h-4 text-slate-400 hover:text-white" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {u.role === 'admin' || isMasterAdmin(u) ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                <span>مدير النظام</span>
                              </span>
                            ) : (u.role === 'moderator' || u.isModerator) ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                                <span>مشرف</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                                <span>مستخدم عادي</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                            {formatEnglishDate(u.createdAt)}
                          </td>
                          {/* Last Seen Field (آخر ظهور) */}
                          <td className="py-3 px-4 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{formatEnglishDateTime(u.lastSeen || u.createdAt)}</span>
                            </div>
                          </td>
                          {/* Status - Swaps from نشط to محظور instantly */}
                          <td className="py-3 px-4">
                            {banStatus.banned ? (
                              <span className="inline-flex items-center gap-1 text-red-400 text-[11px] font-bold">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>{lang === 'ar' ? 'محظور' : 'Banned'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>نشط</span>
                              </span>
                            )}
                          </td>
                          {/* Ban Actions - Icon Only Buttons */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {u.role === 'admin' ? (
                              <span className="text-slate-500 font-mono text-[11px]">—</span>
                            ) : banStatus.banned ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-200 border border-red-500/40 text-[10px] font-bold font-mono shadow-xs">
                                  <ShieldAlert className="w-3 h-3 text-red-400" />
                                  <span>
                                    {banStatus.permanent
                                      ? (lang === 'ar' ? 'حظر دائم' : 'Permanent')
                                      : (lang === 'ar' ? `متبقي ${banStatus.remainingDays} يوم` : `${banStatus.remainingDays}d left`)}
                                  </span>
                                </span>
                                {/* Unban button: ICON ONLY with no text */}
                                <button
                                  type="button"
                                  onClick={() => handleUnban(u)}
                                  className="p-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 hover:text-emerald-200 transition-all cursor-pointer shadow-xs flex items-center justify-center"
                                  title={lang === 'ar' ? 'فك الحظر عن هذا المستخدم' : 'Unban User'}
                                >
                                  <UserCheck className="w-4 h-4 text-emerald-400" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setBanTargetUser(u)}
                                className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-red-300 hover:text-red-200 transition-all cursor-pointer shadow-xs flex items-center justify-center mx-auto"
                                title={lang === 'ar' ? 'حظر وتقييد المستخدم' : 'Ban User'}
                              >
                                <UserX className="w-4 h-4 text-red-400" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BANNERS (البنرات) */}
      {activeTab === 'banners' && (
        <div key="tab-banners" className="space-y-6 animate-page-transition">
          {/* Toast Notification */}
          {bannerToast && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">{bannerToast}</span>
              </div>
              <span className="text-[10px] text-emerald-200">مباشر الآن في الواجهة</span>
            </div>
          )}

          {/* Section 1: Upload / Add New Banner */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0c162e]/90 border border-blue-900/40 shadow-lg shadow-blue-950/25 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'ar' ? 'إضافة ونشر بنر جديد' : 'Publish New Banner'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'ar'
                      ? 'ضع رابط الصورة لإضافتها إلى مستطيل البنرات الدوار بأعلى الصفحة الرئيسية.'
                      : 'Add banner image URL to display in top storefront carousel.'}
                  </p>
                </div>
              </div>

              {banners.length > 0 && onResetBanners && (
                <button
                  type="button"
                  onClick={onResetBanners}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  title={lang === 'ar' ? 'حذف جميع البنرات' : 'Delete all banners'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'حذف جميع البنرات' : 'Clear All'}</span>
                </button>
              )}
            </div>

            <form onSubmit={handleCreateBanner} className="space-y-5">
              {/* Dual Banners Grid: Arabic Banner (🇸🇦) & English Banner (🇬🇧) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. ARABIC BANNER BOX */}
                <div className="p-4 sm:p-5 rounded-xl bg-[#081224] border border-amber-500/30 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🇸🇦</span>
                      <h4 className="text-xs font-bold text-amber-300">
                        {lang === 'ar' ? 'بنر النسخة العربية *' : 'Arabic Banner Version *'}
                      </h4>
                    </div>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-semibold">
                      {lang === 'ar' ? 'يظهر عند اختيار العربية' : 'Shows when Arabic is selected'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                      <span>{lang === 'ar' ? 'صورة البنر العربي:' : 'Arabic Image URL / Upload:'}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        {lang === 'ar' ? 'رفع من الجهاز' : 'Upload Supported'}
                      </span>
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="file"
                        ref={bannerFileInputRefAr}
                        onChange={handleBannerImageFileAr}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => bannerFileInputRefAr.current?.click()}
                        disabled={isUploadingBannerImgAr}
                        className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {isUploadingBannerImgAr
                            ? (lang === 'ar' ? 'جاري الرفع...' : 'Uploading...')
                            : (lang === 'ar' ? 'رفع من جهازك' : 'Upload')}
                        </span>
                      </button>
                      <input
                        type="text"
                        value={bannerImageUrlAr}
                        onChange={(e) => setBannerImageUrlAr(e.target.value)}
                        placeholder="https://example.com/banner-ar.jpg"
                        className="flex-1 bg-[#050b17] border border-blue-800/40 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400 font-mono shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        {lang === 'ar' ? 'عنوان البنر العربي (اختياري):' : 'Arabic Title (Optional):'}
                      </label>
                      <input
                        type="text"
                        value={bannerTitleAr}
                        onChange={(e) => setBannerTitleAr(e.target.value)}
                        placeholder={lang === 'ar' ? 'عنوان يظهر على البنر العربي' : 'Arabic title on banner'}
                        className="w-full bg-[#050b17] border border-blue-800/40 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        {lang === 'ar' ? 'وصف البنر العربي (اختياري):' : 'Arabic Description (Optional):'}
                      </label>
                      <input
                        type="text"
                        value={bannerDescriptionAr}
                        onChange={(e) => setBannerDescriptionAr(e.target.value)}
                        placeholder={lang === 'ar' ? 'وصف أو تفاصيل للبنر العربي' : 'Arabic short description'}
                        className="w-full bg-[#050b17] border border-blue-800/40 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400 shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. ENGLISH BANNER BOX */}
                <div className="p-4 sm:p-5 rounded-xl bg-[#081224] border border-blue-500/30 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🇬🇧</span>
                      <h4 className="text-xs font-bold text-blue-300">
                        {lang === 'ar' ? 'بنر النسخة الإنجليزية' : 'English Banner Version'}
                      </h4>
                    </div>
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30 font-semibold">
                      {lang === 'ar' ? 'يظهر عند اختيار الإنجليزية' : 'Shows when English is selected'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                      <span>{lang === 'ar' ? 'صورة البنر الإنجليزي:' : 'English Image URL / Upload:'}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        {lang === 'ar' ? 'رفع من الجهاز' : 'Upload Supported'}
                      </span>
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="file"
                        ref={bannerFileInputRefEn}
                        onChange={handleBannerImageFileEn}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => bannerFileInputRefEn.current?.click()}
                        disabled={isUploadingBannerImgEn}
                        className="px-3 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {isUploadingBannerImgEn
                            ? (lang === 'ar' ? 'جاري الرفع...' : 'Uploading...')
                            : (lang === 'ar' ? 'رفع من جهازك' : 'Upload')}
                        </span>
                      </button>
                      <input
                        type="text"
                        value={bannerImageUrlEn}
                        onChange={(e) => setBannerImageUrlEn(e.target.value)}
                        placeholder="https://example.com/banner-en.jpg"
                        className="flex-1 bg-[#050b17] border border-blue-800/40 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-400 font-mono shadow-xs"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {lang === 'ar'
                        ? 'ملاحظة: إذا تركته فارغاً سيتم استخدام البنر العربي تلقائياً كبديل.'
                        : 'Note: If left empty, Arabic banner will be used as fallback.'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        {lang === 'ar' ? 'عنوان البنر الإنجليزي (اختياري):' : 'English Title (Optional):'}
                      </label>
                      <input
                        type="text"
                        value={bannerTitleEn}
                        onChange={(e) => setBannerTitleEn(e.target.value)}
                        placeholder="English banner headline"
                        className="w-full bg-[#050b17] border border-blue-800/40 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-400 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        {lang === 'ar' ? 'وصف البنر الإنجليزي (اختياري):' : 'English Description (Optional):'}
                      </label>
                      <input
                        type="text"
                        value={bannerDescriptionEn}
                        onChange={(e) => setBannerDescriptionEn(e.target.value)}
                        placeholder="English short description"
                        className="w-full bg-[#050b17] border border-blue-800/40 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-400 shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Live Preview Box with language switcher */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-300">
                    {lang === 'ar' ? 'معاينة مباشرة لشكل البنر في مستطيل البنرات:' : 'Live Banner Preview:'}
                  </span>
                  <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setBannerPreviewTab('ar')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        bannerPreviewTab === 'ar'
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>🇸🇦</span>
                      <span>{lang === 'ar' ? 'معاينة النسخة العربية' : 'Arabic Preview'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannerPreviewTab('en')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        bannerPreviewTab === 'en'
                          ? 'bg-blue-500/25 text-blue-300 border border-blue-400/50 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>🇬🇧</span>
                      <span>{lang === 'ar' ? 'معاينة النسخة الإنجليزية' : 'English Preview'}</span>
                    </button>
                  </div>
                </div>

                <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden border border-white/10 bg-black/60 flex items-center justify-center shadow-inner">
                  {(() => {
                    const previewImg =
                      bannerPreviewTab === 'ar'
                        ? (bannerImageUrlAr.trim() || bannerImageUrlEn.trim())
                        : (bannerImageUrlEn.trim() || bannerImageUrlAr.trim());

                    const previewTitle =
                      bannerPreviewTab === 'ar'
                        ? (bannerTitleAr.trim() || bannerTitleEn.trim())
                        : (bannerTitleEn.trim() || bannerTitleAr.trim());

                    const previewDesc =
                      bannerPreviewTab === 'ar'
                        ? (bannerDescriptionAr.trim() || bannerDescriptionEn.trim())
                        : (bannerDescriptionEn.trim() || bannerDescriptionAr.trim());

                    if (!previewImg) {
                      return (
                        <div className="text-center p-4 text-slate-500 text-xs space-y-1">
                          <ImageIcon className="w-8 h-8 mx-auto opacity-50 text-slate-400" />
                          <span>
                            {bannerPreviewTab === 'ar'
                              ? (lang === 'ar' ? 'أدخل رابط أو ارفع صورة البنر العربي لرؤية المعاينة هنا' : 'Upload or enter Arabic banner image to preview')
                              : (lang === 'ar' ? 'أدخل رابط أو ارفع صورة البنر الإنجليزي لرؤية المعاينة هنا' : 'Upload or enter English banner image to preview')}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <>
                        <img
                          src={previewImg}
                          alt="Banner Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-center"
                        />
                        {(previewTitle || previewDesc) && (
                          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r rtl:sm:bg-gradient-to-l from-black/75 via-black/35 to-transparent pointer-events-none" />
                        )}
                        {(previewTitle || previewDesc) && (
                          <div className="absolute inset-0 z-20 flex flex-col justify-center p-6 max-w-lg text-right rtl:text-right ltr:text-left space-y-1">
                            {previewTitle && (
                              <h4 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-md">
                                {previewTitle}
                              </h4>
                            )}
                            {previewDesc && (
                              <p className="text-xs text-slate-200 line-clamp-2 drop-shadow-md">
                                {previewDesc}
                              </p>
                            )}
                          </div>
                        )}
                        <span className="absolute top-2 right-2 rtl:right-2 rtl:left-auto ltr:left-2 ltr:right-auto px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[10px] text-amber-400 font-bold">
                          {bannerPreviewTab === 'ar' ? '🇸🇦 معاينة النسخة العربية' : '🇬🇧 معاينة النسخة الإنجليزية'}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-slate-400">
                  {lang === 'ar'
                    ? '💡 نصيحة: يمكنك وضع بنرين (عربي وإنجليزي)، وسيتم عرض البنر المناسب تلقائياً حسب لغة الزائر.'
                    : '💡 Tip: You can set both Arabic & English banners; visitors will see the banner matching their chosen language.'}
                </p>
                <button
                  type="submit"
                  disabled={!bannerImageUrlAr.trim() && !bannerImageUrlEn.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer shadow-xs backdrop-blur-xs shrink-0"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>
                    {lang === 'ar' ? 'نشر البنر (باللغتين)' : 'Publish Banner (Bilingual)'}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: List of Published Banners */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0c162e]/90 border border-blue-900/40 shadow-lg shadow-blue-950/25 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'ar' ? 'البنرات المنشورة حالياً' : 'Currently Published Banners'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'ar'
                      ? 'يمكنك معاينة النسختين (العربية والإنجليزية) أو حذف أي بنر منشور في أي وقت.'
                      : 'Preview both Arabic & English versions or delete any banner anytime.'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono">
                {banners.length} {lang === 'ar' ? 'بنرات' : 'Banners'}
              </span>
            </div>

            {banners.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <ImageIcon className="w-10 h-10 mx-auto opacity-40 text-amber-400" />
                <p className="text-xs">
                  {lang === 'ar'
                    ? 'لا توجد بنرات منشورة حالياً. أضف بنراً جديداً من النموذج أعلاه.'
                    : 'No published banners. Add one using the form above.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map((b, idx) => (
                  <PublishedBannerCard
                    key={b.id || idx}
                    banner={b}
                    index={idx}
                    onDelete={onDeleteBanner}
                    lang={lang}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: DESIGN & BRANDING (التصميم) */}
      {activeTab === 'design' && (
        <div key="tab-design" className="space-y-6 animate-page-transition">
          {/* Toast Notification */}
          {brandingSavedToast && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">
                  {lang === 'ar' ? 'تم حفظ وتطبيق إعدادات التصميم بنجاح على المتجر!' : 'Appearance settings updated successfully!'}
                </span>
              </div>
              <span className="text-[10px] text-emerald-200">مباشر الآن</span>
            </div>
          )}

          {/* Section 1: Website Background Image or Video */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0c162e]/90 border border-blue-900/40 shadow-lg shadow-blue-950/25 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'ar' ? 'خلفية الموقع العامة (صورة أو فيديو متحرك)' : 'Site Background (Image or Video)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'ar'
                      ? 'ضع رابط صورة ثابتة (JPG, PNG, GIF) أو فيديو متحرك (MP4 أو WebM) ليكون خلفية لكافة صفحات المتجر.'
                      : 'Set custom image or video (MP4/WebM) URL for the storefront background.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setBgInput(DEFAULT_BRANDING.backgroundImageUrl);
                    handleSaveBranding({ bg: DEFAULT_BRANDING.backgroundImageUrl });
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="استعادة خلفية المتجر الأصلية"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'الخلفية الافتراضية' : 'Reset'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveBranding({ bg: bgInput })}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs backdrop-blur-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'تطبيق الخلفية' : 'Apply'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>{lang === 'ar' ? 'رابط أو ملف صورة/فيديو الخلفية:' : 'Background (Image or Video):'}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      MP4 · WebM · GIF · YouTube · JPG
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      {lang === 'ar' ? 'متاح الرفع' : 'Upload'}
                    </span>
                  </div>
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="file"
                    ref={bgFileInputRef}
                    onChange={handleBgFile}
                    accept="image/*,video/mp4,video/webm"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => bgFileInputRef.current?.click()}
                    disabled={isUploadingBgImg}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingBgImg ? (lang === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (lang === 'ar' ? 'رفع من جهازك' : 'Upload File')}</span>
                  </button>
                  <input
                    type="text"
                    value={bgInput}
                    onChange={(e) => {
                      setBgInput(e.target.value);
                      handleSaveBranding({ bg: e.target.value });
                    }}
                    placeholder="رابط مباشر: https://.../video.mp4 أو رابط يوتيوب أو صورة"
                    className="flex-1 bg-[#081224] border border-blue-800/40 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400 font-mono shadow-xs"
                  />
                </div>

                {/* Detected format status badge */}
                <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                  {isYouTubeUrl(bgInput) ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تم التعرف على رابط يوتيوب متحرك (خلفية سينمائية تعمل تلقائياً بدون صوت)' : 'YouTube video detected (auto-plays as background)'}</span>
                    </span>
                  ) : isVideoUrl(bgInput) ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تم التعرف على ملف فيديو متحرك (MP4 / WebM)' : 'Video file detected (MP4/WebM)'}</span>
                    </span>
                  ) : bgInput.toLowerCase().includes('.gif') ? (
                    <span className="text-cyan-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تم التعرف على صورة GIF متحركة' : 'Animated GIF detected'}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">
                      <span>{lang === 'ar' ? 'صورة ثابتة (JPG / PNG / WebP)' : 'Static image background'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Live Preview Box */}
              <div>
                <span className="block text-[11px] font-bold text-slate-400 mb-1.5">
                  {lang === 'ar' ? 'معاينة مظهر الخلفية المباشر في المتجر:' : 'Live Background Preview:'}
                </span>
                <div className="relative h-44 sm:h-52 w-full rounded-xl overflow-hidden border border-blue-800/50 bg-[#081224] flex items-end p-4 shadow-inner">
                  {isYouTubeUrl(bgInput) ? (
                    <iframe
                      key={bgInput}
                      src={getYouTubeEmbedUrl(bgInput) || ''}
                      title="Background Preview"
                      className="absolute inset-0 w-full h-full pointer-events-none border-0 opacity-80"
                      allow="autoplay; encrypted-media"
                    />
                  ) : isVideoUrl(bgInput) ? (
                    <video
                      key={bgInput}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      src={bgInput}
                    />
                  ) : (
                    <div
                      className="absolute inset-0 w-full h-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url('${bgInput || DEFAULT_BRANDING.backgroundImageUrl}')`,
                      }}
                    />
                  )}
                  {/* Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Login Page Background Image or Video */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0c162e]/90 border border-blue-900/40 shadow-lg shadow-blue-950/25 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'ar' ? 'خلفية صفحة تسجيل الدخول (صورة أو فيديو متحرك)' : 'Login Page Background (Image or Video)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'ar'
                      ? 'ضع رابط صورة ثابتة أو فيديو متحرك (MP4 أو WebM) مخصص لصفحة تسجيل الدخول وبوابة المتجر.'
                      : 'Set custom static image or animated video for the login screen.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const fallback = DEFAULT_BRANDING.loginBackgroundImageUrl || DEFAULT_BRANDING.backgroundImageUrl;
                    setLoginBgInput(fallback);
                    handleSaveBranding(undefined, undefined, fallback);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="استعادة الخلفية الافتراضية لصفحة الدخول"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'الافتراضية' : 'Reset'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveBranding(undefined, undefined, loginBgInput)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs backdrop-blur-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'تطبيق خلفية الدخول' : 'Apply'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>{lang === 'ar' ? 'صورة أو فيديو خلفية تسجيل الدخول:' : 'Login Background:'}</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {lang === 'ar' ? 'متاح الرفع من جهازك' : 'Device upload supported'}
                  </span>
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="file"
                    ref={loginBgFileInputRef}
                    onChange={handleLoginBgFile}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => loginBgFileInputRef.current?.click()}
                    disabled={isUploadingLoginBgImg}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingLoginBgImg ? (lang === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (lang === 'ar' ? 'رفع من جهازك' : 'Upload File')}</span>
                  </button>
                  <input
                    type="text"
                    value={loginBgInput}
                    onChange={(e) => {
                      setLoginBgInput(e.target.value);
                      handleSaveBranding(undefined, undefined, e.target.value);
                    }}
                    placeholder="https://example.com/login-bg.mp4 أو .jpg"
                    className="flex-1 bg-[#081224] border border-blue-800/40 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400 font-mono shadow-xs"
                  />
                </div>
              </div>

              {/* Live Preview Box for Login Background */}
              <div>
                <span className="block text-[11px] font-bold text-slate-400 mb-1.5">
                  {lang === 'ar' ? 'معاينة مباشرة لخلفية صفحة تسجيل الدخول:' : 'Live Login Background Preview:'}
                </span>
                <div className="relative h-44 sm:h-52 w-full rounded-xl overflow-hidden border border-blue-800/50 bg-[#081224] flex items-center justify-center p-4 shadow-inner">
                  {isVideoUrl(loginBgInput) ? (
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      src={loginBgInput}
                    />
                  ) : (
                    <div
                      className="absolute inset-0 w-full h-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url('${loginBgInput || DEFAULT_BRANDING.loginBackgroundImageUrl}')`,
                      }}
                    />
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0a1226]/75 via-[#0b162e]/85 to-[#091124]/95 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Website Logo & Icon */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0c162e]/90 border border-blue-900/40 shadow-lg shadow-blue-950/25 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'ar' ? 'أيقونة وشعار المتجر' : 'Store Logo / Icon'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'ar'
                      ? 'ضع رابط صورة الشعار لتظهر مكان الأيقونة المجاورة لكلمة FILEX STORE في الشريط العلوي والسفلي.'
                      : 'Provide custom image URL to replace the icon beside FILEX STORE.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {logoInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoInput('');
                      handleSaveBranding(undefined, '', undefined);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'استعادة الأيقونة الافتراضية' : 'Default Icon'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSaveBranding(undefined, logoInput, undefined)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs backdrop-blur-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'حفظ الأيقونة' : 'Save Logo'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>{lang === 'ar' ? 'صورة الشعار / الأيقونة:' : 'Logo Image / Icon:'}</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {lang === 'ar' ? 'متاح الرفع من جهازك' : 'Device upload supported'}
                  </span>
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="file"
                    ref={logoFileInputRef}
                    onChange={handleLogoFile}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    disabled={isUploadingLogoImg}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingLogoImg ? (lang === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (lang === 'ar' ? 'رفع من جهازك' : 'Upload File')}</span>
                  </button>
                  <input
                    type="text"
                    value={logoInput}
                    onChange={(e) => {
                      setLogoInput(e.target.value);
                      handleSaveBranding(undefined, e.target.value);
                    }}
                    placeholder="https://example.com/your-logo.png"
                    className="flex-1 bg-[#081224] border border-blue-800/40 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400 font-mono shadow-xs"
                  />
                </div>
              </div>

              {/* Live Preview of Header & Footer Logo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Header Preview */}
                <div className="p-3.5 rounded-xl bg-[#091326] border border-blue-900/40 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 block">
                    {lang === 'ar' ? 'مظهر الشعار في الشريط العلوي (الهيدر):' : 'Header Logo Preview:'}
                  </span>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-black/40 border border-white/5">
                    {logoInput ? (
                      <div className="logo-shimmer-container w-8 h-8 rounded-lg shrink-0">
                        <img
                          src={logoInput}
                          alt="Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full aspect-square object-contain rounded-lg drop-shadow-md"
                        />
                      </div>
                    ) : (
                      <div className="logo-shimmer-container w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 shadow-xs flex items-center justify-center text-amber-300 shrink-0">
                        <span className="text-base font-black tracking-tighter text-amber-300 font-sans leading-none select-none">F</span>
                      </div>
                    )}
                    <span className="text-base font-black text-white whitespace-nowrap">FILEX STORE</span>
                  </div>
                </div>

                {/* Footer Preview */}
                <div className="p-3.5 rounded-xl bg-[#091326] border border-blue-900/40 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 block">
                    {lang === 'ar' ? 'مظهر الشعار في الشريط السفلي (الفوتر):' : 'Footer Logo Preview:'}
                  </span>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-black/40 border border-white/5">
                    {logoInput ? (
                      <div className="logo-shimmer-container w-7 h-7 rounded shrink-0">
                        <img
                          src={logoInput}
                          alt="Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full aspect-square object-contain rounded drop-shadow-md"
                        />
                      </div>
                    ) : (
                      <div className="logo-shimmer-container w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 shadow-xs flex items-center justify-center text-amber-300 shrink-0">
                        <span className="text-xs font-black tracking-tighter text-amber-300 font-sans leading-none select-none">F</span>
                      </div>
                    )}
                    <div>
                      <span className="text-white font-black text-xs block whitespace-nowrap">FILEX STORE</span>
                      <span className="text-[9px] text-slate-400 block">متجر إطارات ودخوليات 2026</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CONTACT SETTINGS (التواصل) */}
      {activeTab === 'contact' && canViewContact && (
        <div key="tab-contact" className="space-y-6 animate-page-transition">
          {/* Toast Notification */}
          {phoneSavedToast && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">
                  {lang === 'ar'
                    ? 'تم حفظ وتحديث رقم التواصل بنجاح! سيتم توجيه كافة أزرار الواتساب إلى الرقم الجديد فوراً.'
                    : 'Contact number updated successfully! All WhatsApp buttons now redirect to this new number.'}
                </span>
              </div>
              <span className="text-[10px] text-emerald-200">مباشر وفوري</span>
            </div>
          )}

          {/* Main Card: Direct WhatsApp Support Number */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0c162e]/90 border border-blue-900/40 shadow-lg shadow-blue-950/25 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{lang === 'ar' ? 'رقم التواصل الموحد (واتساب)' : 'Universal Support WhatsApp Number'}</span>
                    <span className="text-[10px] py-0.5 px-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono">
                      {formatWhatsAppPhone(branding.supportPhone || DEFAULT_SUPPORT_PHONE)}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === 'ar'
                      ? 'الرقم الذي يتم توجيه جميع العملاء والمستخدمين إليه تلقائياً عند الضغط على أي زر تواصل أو طلب في المتجر.'
                      : 'The phone number users will automatically be redirected to across all buttons and actions.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setPhoneInput(DEFAULT_SUPPORT_PHONE);
                    handleSaveBranding({ phone: DEFAULT_SUPPORT_PHONE });
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="استعادة الرقم الافتراضي"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'الرقم الافتراضي' : 'Reset'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveBranding({ phone: phoneInput })}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs backdrop-blur-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'حفظ وتطبيق الرقم' : 'Save & Apply'}</span>
                </button>
              </div>
            </div>

            {/* Input Form Field */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-2">
                  {lang === 'ar' ? 'أدخل رقم التواصل (واتساب):' : 'Enter WhatsApp Contact Number:'}
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto text-emerald-400" />
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="01027833873"
                      dir="ltr"
                      className="w-full bg-[#081224] border border-blue-800/40 rounded-xl py-2.5 px-9 text-sm text-white focus:outline-none focus:border-amber-400 font-mono tracking-wider shadow-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveBranding({ phone: phoneInput })}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'تحديث الرقم في كافة الأزرار' : 'Update Number Everywhere'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {lang === 'ar'
                    ? '💡 يمكنك كتابة الرقم بصيغة محلية مثل 01027833873 أو بصيغة دولية كاملة مثل 201027833873 أو +201027833873، وسيتم تحويله تلقائياً ليعمل مع كافة روابط الواتساب العالمية.'
                    : '💡 Enter local or international format. The system normalizes it automatically for WhatsApp.'}
                </p>
              </div>

              {/* Live Testing & Verification Card */}
              <div className="p-4 rounded-xl bg-[#081224] border border-blue-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === 'ar' ? 'معاينة واختبار فوري للرابط المباشر:' : 'Live WhatsApp Link Preview:'}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    wa.me/{formatWhatsAppPhone(phoneInput || DEFAULT_SUPPORT_PHONE)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg bg-black/40 border border-white/5">
                  <div className="text-xs text-slate-300 space-y-1">
                    <p className="font-semibold text-white">
                      {lang === 'ar' ? 'الرقم الفعال حالياً في المتجر:' : 'Current Active Store Number:'}
                    </p>
                    <p className="font-mono text-emerald-400 text-sm">
                      {branding.supportPhone || DEFAULT_SUPPORT_PHONE} ({formatWhatsAppPhone(branding.supportPhone || DEFAULT_SUPPORT_PHONE)})
                    </p>
                  </div>

                  <a
                    href={getWhatsAppUrl(
                      phoneInput || DEFAULT_SUPPORT_PHONE,
                      lang === 'ar'
                        ? 'تجربة رسالة التواصل عبر واتساب من لوحة التحكم'
                        : 'Test message from FILEX STORE dashboard'
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer select-none"
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                    <span>{lang === 'ar' ? 'تجربة فتح الواتساب الآن' : 'Test WhatsApp Link'}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                </div>

                {/* Scope Coverage List */}
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[11px] font-bold text-slate-400 block mb-2">
                    {lang === 'ar' ? 'الأزرار والوظائف المرتبطة بهذا الرقم تلقائياً:' : 'Buttons linked to this number:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-slate-300">
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{lang === 'ar' ? 'زر الواتساب في الفوتر (أسفل المتجر)' : 'Footer WhatsApp Support'}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{lang === 'ar' ? 'زر خدمة العملاء في واجهة البداية (Hero)' : 'Hero WhatsApp Support'}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{lang === 'ar' ? 'زر تأكيد الدفع في سلة المشتريات' : 'Cart Drawer Checkout'}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{lang === 'ar' ? 'أزرار متابعة الطلب في نافذة (طلباتي)' : 'My Orders Drawer Follow-Up'}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{lang === 'ar' ? 'زر التواصل عند تقييد أو حظر الحساب' : 'Account Ban Appeal Modal'}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{lang === 'ar' ? 'زر مراسلة العميل في لوحة التحكم' : 'Admin Order Row WhatsApp'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MODERATORS MANAGEMENT */}
      {activeTab === 'moderators' && canViewModerators && (
        <div key="tab-moderators" className="space-y-6 animate-page-transition">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#0c162e]/90 border border-blue-900/40 shadow-lg shadow-blue-950/25">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/35 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    {lang === 'ar' ? 'إدارة المشرفين وصلاحيات لوحة التحكم' : 'Moderator Accounts & Access Control'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {lang === 'ar'
                      ? 'إنشاء حسابات مشرفين ببريد إلكتروني وكلمة مرور، وتحديد الأزرار التي تظهر لكل مشرف، مع إمكانية سحب الصلاحيات فوراً.'
                      : 'Create moderator accounts with email & password, control buttons that appear for them, and revoke access anytime.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setModFormEmail('');
                  setModFormPassword('');
                  handleGenerateRandomPassword();
                  setModFormName('');
                  setModFormPermissions(['catalog', 'orders']);
                  setIsAddModOpen(true);
                }}
                className="px-4 py-2.5 text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs backdrop-blur-xs"
              >
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>{lang === 'ar' ? 'إنشاء حساب مشرف جديد' : 'New Moderator'}</span>
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#0c162e]/90 border border-blue-900/40 space-y-1 shadow-md shadow-blue-950/20">
              <span className="text-[11px] text-slate-300 block font-medium">
                {lang === 'ar' ? 'إجمالي حسابات المشرفين' : 'Total Moderators'}
              </span>
              <div className="text-2xl font-black text-white font-mono tabular-nums">
                {moderatorsList.length}
              </div>
              <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>{lang === 'ar' ? 'حسابات مسجلة ومتاحة للمتجر' : 'Staff accounts'}</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0c162e]/90 border border-blue-900/40 space-y-1 shadow-md shadow-blue-950/20">
              <span className="text-[11px] text-slate-300 block font-medium">
                {lang === 'ar' ? 'مشرفين بصلاحيات نشطة' : 'Active Moderators'}
              </span>
              <div className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
                {moderatorsList.filter((m) => !m.isModeratorRevoked).length}
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>{lang === 'ar' ? 'يمكنهم الدخول للوحة التحكم' : 'Can access control panel'}</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0c162e]/90 border border-blue-900/40 space-y-1 shadow-md shadow-blue-950/20">
              <span className="text-[11px] text-slate-300 block font-medium">
                {lang === 'ar' ? 'صلاحيات مسحوبة / معطلة' : 'Revoked Access'}
              </span>
              <div className="text-2xl font-black text-red-400 font-mono tabular-nums">
                {moderatorsList.filter((m) => m.isModeratorRevoked).length}
              </div>
              <span className="text-[10px] text-red-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>{lang === 'ar' ? 'محجوب عنهم الدخول للوحة' : 'Blocked from control panel'}</span>
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#081224]/80 border border-blue-900/40">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={modSearchTerm}
                onChange={(e) => setModSearchTerm(e.target.value)}
                placeholder={lang === 'ar' ? 'بحث باسم المشرف أو البريد...' : 'Search moderators...'}
                className="w-full bg-[#0b162d] border border-blue-950 rounded-xl py-2 px-9 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400/50"
              />
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {lang === 'ar' ? `عدد المشرفين: ${moderatorsList.length}` : `Moderators count: ${moderatorsList.length}`}
            </div>
          </div>

          {/* Moderators Cards List */}
          {moderatorsList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0c162e]/90 border border-blue-900/40 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">
                {lang === 'ar' ? 'لا يوجد حسابات مشرفين مسجلة حتى الآن' : 'No moderators created yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {lang === 'ar'
                  ? 'يمكنك إنشاء حساب جديد ببريد إلكتروني (جيميل) وكلمة مرور وتحديد عدد الأزرار المتاحة له في لوحة التحكم وتسليمه للشخص فوراً.'
                  : 'You can create a moderator with email, password, and specific permitted tabs.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setModFormEmail('');
                  setModFormPassword('');
                  handleGenerateRandomPassword();
                  setModFormName('');
                  setModFormPermissions(['catalog', 'orders']);
                  setIsAddModOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'ar' ? 'إنشاء أول حساب مشرف الآن' : 'Create First Moderator'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {moderatorsList
                .filter((m) => {
                  const t = modSearchTerm.toLowerCase();
                  return (
                    !modSearchTerm ||
                    (m.displayName && m.displayName.toLowerCase().includes(t)) ||
                    (m.email && m.email.toLowerCase().includes(t))
                  );
                })
                .map((mod) => {
                  const isRevokedMod = !!mod.isModeratorRevoked;
                  const perms = mod.moderatorPermissions || [];
                  const isPwdVisible = !!showPasswordMap[mod.id || mod.email];
                  const pwd = mod.plainPassword || '******';

                  return (
                    <div
                      key={mod.id || mod.email}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 shadow-lg ${
                        isRevokedMod
                          ? 'bg-[#120f1c]/90 border-red-900/40 shadow-red-950/20'
                          : 'bg-[#0c162e]/90 border-blue-900/40 shadow-blue-950/25'
                      }`}
                    >
                      {/* Top Row: User Avatar, Name, Email, Status */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-black text-sm shrink-0">
                              {mod.displayName?.charAt(0)?.toUpperCase() || 'M'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm block">
                                  {mod.displayName || 'مشرف'}
                                </span>
                                <span className="text-[10px] text-slate-300 font-mono bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                                  ID: {mod.id}
                                </span>
                              </div>
                              <span className="text-xs text-slate-400 font-mono block select-all">
                                {mod.email}
                              </span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0">
                            {isRevokedMod ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 text-[11px] font-bold shadow-xs">
                                <Lock className="w-3 h-3 text-red-400" />
                                <span>{lang === 'ar' ? 'صلاحيات مسحوبة (معطل)' : 'Revoked'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold shadow-xs">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                <span>{lang === 'ar' ? 'صلاحيات نشطة' : 'Active'}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Password display card with Copy and Eye button */}
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                              {lang === 'ar' ? 'كلمة المرور:' : 'Password:'}
                            </span>
                            <span className="font-mono text-white select-all font-bold tracking-wider truncate">
                              {isPwdVisible ? pwd : '••••••••'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setShowPasswordMap((prev) => ({
                                  ...prev,
                                  [mod.id || mod.email]: !prev[mod.id || mod.email],
                                }));
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                              title={isPwdVisible ? (lang === 'ar' ? 'إخفاء' : 'Hide') : (lang === 'ar' ? 'إظهار' : 'Show')}
                            >
                              {isPwdVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyModeratorCredentials(mod)}
                              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-medium"
                              title={lang === 'ar' ? 'نسخ بيانات الحساب لتسليمها' : 'Copy Credentials'}
                            >
                              <Copy className="w-3 h-3 text-amber-400" />
                              <span>{lang === 'ar' ? 'نسخ البيانات' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Enabled Buttons / Permissions summary */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-semibold text-slate-400 block">
                            {lang === 'ar'
                              ? `الأزرار الظاهرة في لوحة التحكم (${perms.length}):`
                              : `Permitted Buttons (${perms.length}):`}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {perms.length === 0 ? (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {lang === 'ar' ? 'لا توجد أزرار مفعلة (معطل)' : 'No buttons enabled'}
                              </span>
                            ) : (
                              perms.map((pKey) => {
                                const def = ALL_MODERATOR_PERMISSIONS.find((d) => d.id === pKey);
                                return (
                                  <span
                                    key={pKey}
                                    className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold"
                                  >
                                    {lang === 'ar' ? def?.labelAr || pKey : def?.labelEn || pKey}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
                        {/* Revoke / Restore button */}
                        <button
                          type="button"
                          onClick={() => handleToggleRevokeModerator(mod)}
                          disabled={revokingEmail === mod.email}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isRevokedMod
                              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35'
                              : 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/35'
                          }`}
                        >
                          {isRevokedMod ? (
                            <>
                              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{lang === 'ar' ? 'استعادة الصلاحيات' : 'Restore Access'}</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5 text-red-400" />
                              <span>{lang === 'ar' ? 'سحب الصلاحيات' : 'Revoke Access'}</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1.5">
                          {/* Edit Buttons / Permissions */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditPermissions(mod)}
                            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/15 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title={lang === 'ar' ? 'تعديل الأزرار التي تظهر له' : 'Edit Buttons'}
                          >
                            <Pencil className="w-3 h-3 text-cyan-400" />
                            <span>{lang === 'ar' ? 'تعديل الأزرار' : 'Buttons'}</span>
                          </button>

                          {/* Edit Password */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditPassword(mod)}
                            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/15 text-xs transition-colors cursor-pointer"
                            title={lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          {/* Delete Moderator */}
                          <button
                            type="button"
                            onClick={() => setDeletingModUser(mod)}
                            className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 text-xs transition-colors cursor-pointer"
                            title={lang === 'ar' ? 'حذف المشرف' : 'Delete Moderator'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-2xl bg-[#091326]/85 border border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#060c1a]/80">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                <span>
                  {editingProduct
                    ? (lang === 'ar' ? `تعديل تصميم: ${editingProduct.code}` : `Edit: ${editingProduct.code}`)
                    : (lang === 'ar' ? 'إضافة تصاميم جديده' : 'Add New Products')}
                </span>
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {lang === 'ar' ? 'اسم التصميم (بالعربية):' : 'Name (Arabic):'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: دخولية التنين الذهبي الملكي"
                    className="w-full bg-[#060c1a]/60 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {lang === 'ar' ? 'كود التصميم:' : 'Item Code:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="مثال: FX-1029"
                    className="w-full bg-[#060c1a]/60 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {lang === 'ar' ? 'الاسم بالإنجليزية:' : 'Name (English):'}
                  </label>
                  <input
                    type="text"
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    placeholder="e.g. Imperial Dragon SVGA"
                    className="w-full bg-[#060c1a]/60 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {lang === 'ar' ? 'تصنيف المنتج:' : 'Category:'}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Exclude<ProductCategory, 'all'>)}
                    className="w-full bg-[#060c1a]/60 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="avatar_frames">{lang === 'ar' ? 'الاطارات' : 'Avatar Frames'}</option>
                    <option value="entrance_effects">{lang === 'ar' ? 'دخوليات' : 'Entrance'}</option>
                    <option value="gifts">{lang === 'ar' ? 'هدايا' : 'Gifts'}</option>
                    <option value="medals">{lang === 'ar' ? 'ميداليات' : 'Medals'}</option>
                    <option value="mic_frames">{lang === 'ar' ? 'مؤثرات مايك' : 'Mic Waves'}</option>
                    <option value="chat_bubbles">{lang === 'ar' ? 'فقاعات الدردشه' : 'Chat Bubbles'}</option>
                    <option value="room_themes">{lang === 'ar' ? 'ثيمات الغرفه' : 'Room Themes'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {lang === 'ar' ? 'سعر البيع الحالي ($):' : 'Current Price ($):'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-[#060c1a]/60 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {lang === 'ar' ? 'السعر القديم قبل الخصم ($):' : 'Original Price ($):'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formOriginalPrice || ''}
                    onChange={(e) => setFormOriginalPrice(e.target.value ? Number(e.target.value) : 0)}
                    placeholder="مثال: 50.00"
                    className="w-full bg-[#060c1a]/60 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {lang === 'ar' ? 'نوع الصيغة:' : 'File Format:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formFileFormat}
                    onChange={(e) => setFormFileFormat(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: SVGA أو MP4 أو GIF' : 'e.g. SVGA, MP4, GIF'}
                    className="w-full bg-[#060c1a]/60 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              {/* Product Image Section: Device Upload + URL + Live Preview */}
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-900/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>{lang === 'ar' ? 'صورة المعاينة للتصميم (Preview Image):' : 'Preview Image:'}</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {lang === 'ar' ? 'متاح الرفع من جهازك مباشرة' : 'Device upload available'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="file"
                    ref={productFileInputRef}
                    onChange={handleProductImageFile}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => productFileInputRef.current?.click()}
                    disabled={isUploadingProductImg}
                    className="px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {isUploadingProductImg
                        ? (lang === 'ar' ? 'جاري المعالجة...' : 'Processing...')
                        : (lang === 'ar' ? 'رفع صورة من جهازك' : 'Upload from Device')}
                    </span>
                  </button>

                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      value={formPreviewImage}
                      onChange={(e) => setFormPreviewImage(e.target.value)}
                      placeholder={lang === 'ar' ? 'أو الصق رابط مباشر للصورة هنا...' : 'Or paste image URL...'}
                      className="w-full bg-[#060c1a]/70 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Live Preview Box */}
                {formPreviewImage.trim() && (
                  <div className="flex items-center gap-3 p-2 bg-[#060c1a]/80 rounded-lg border border-white/10 mt-1">
                    <div className="w-14 h-14 rounded bg-black/60 overflow-hidden flex-shrink-0 border border-amber-500/30 p-1 flex items-center justify-center relative">
                      <img
                        src={formPreviewImage}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const next = e.currentTarget.nextElementSibling;
                          if (next) (next as HTMLElement).style.display = 'flex';
                        }}
                      />
                      <div
                        style={{ display: 'none' }}
                        className="w-full h-full flex flex-col items-center justify-center bg-red-950/40 text-amber-400 text-[8px] font-bold text-center"
                      >
                        <AlertCircle className="w-4 h-4 text-amber-400 mb-0.5" />
                        <span>رابط تالف</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <span className="text-emerald-400 font-semibold block text-[11px]">
                        {formPreviewImage.startsWith('data:')
                          ? (lang === 'ar' ? '✓ تم حفظ الصورة وتشفيرها من جهازك (مخزنة في السيرفر ولن تنتهي صلاحيتها)' : '✓ Saved directly from your device')
                          : (lang === 'ar' ? '✓ رابط خارجي للصورة' : '✓ External image URL')}
                      </span>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                        {formPreviewImage.startsWith('data:') ? 'Data URI (Permanently stored)' : formPreviewImage}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormPreviewImage('')}
                      className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 cursor-pointer"
                    >
                      {lang === 'ar' ? 'حذف' : 'Remove'}
                    </button>
                  </div>
                )}
              </div>

              {/* Preview Video URL Section - Displayed in Right Half of Display Modal */}
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-900/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-amber-400" />
                    <span>{lang === 'ar' ? 'رابط فيديو معاينة (اختياري):' : 'Preview Video URL (Optional):'}</span>
                  </label>
                  <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    {lang === 'ar' ? 'يظهر مكان الصورة بمشغل المتصفح' : 'Plays in modal instead of image'}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="url"
                    value={formPreviewVideoUrl}
                    onChange={(e) => setFormPreviewVideoUrl(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: https://example.com/preview-video.mp4' : 'e.g. https://example.com/preview.mp4'}
                    className="w-full bg-[#060c1a]/70 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono text-xs"
                  />
                </div>

                {/* Live Video Player Preview in Admin Form */}
                {formPreviewVideoUrl.trim() && (
                  <div className="p-2.5 bg-[#060c1a]/80 rounded-xl border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-amber-400" />
                        <span>{lang === 'ar' ? 'معاينة مشغل الفيديو:' : 'Video Preview:'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormPreviewVideoUrl('')}
                        className="text-red-400 hover:text-red-300 text-[10px] px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 cursor-pointer"
                      >
                        {lang === 'ar' ? 'مسح الرابط' : 'Clear'}
                      </button>
                    </div>
                    <div className="relative aspect-video max-h-48 w-full rounded-lg overflow-hidden bg-black/90 border border-white/10 flex items-center justify-center">
                      <video
                        src={formPreviewVideoUrl}
                        controls
                        autoPlay
                        loop
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {lang === 'ar' ? 'الوصف:' : 'Description:'}
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب هنا' : 'Write here'}
                  className="w-full bg-[#060c1a]/60 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-amber-300 font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>{lang === 'ar' ? 'حفظ التصميم ونشره' : 'Save & Publish Item'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ADMIN BAN USER MODAL DIALOG - Styled exactly like BanModal */}
      {banTargetUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 backdrop-blur-xs flex items-center justify-center p-3.5 animate-backdrop-fade">
          {/* Glass window card identical to BanModal */}
          <div className="relative w-full max-w-[320px] sm:max-w-[340px] bg-[#091326]/75 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-4.5 shadow-2xl text-center space-y-3.5 animate-modal-pop">
            
            {/* Red Shield Icon at top */}
            <div className="relative mx-auto w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 shadow-xs">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>

            {/* Header Title */}
            <div className="space-y-0.5 relative z-10">
              <h2 className="text-base font-black text-white tracking-tight">
                {lang === 'ar' ? 'حظر وتقييد المستخدم' : 'Restrict & Ban User'}
              </h2>
              <p className="text-[11px] text-slate-300 leading-snug">
                {banTargetUser.displayName} <span className="font-mono text-slate-400">({banTargetUser.email})</span>
              </p>
            </div>

            {/* Duration Options Card (Same medium balanced glass style) */}
            <div className="p-2.5 rounded-xl bg-black/35 border border-white/10 text-right rtl:text-right ltr:text-left space-y-2 text-xs">
              <div className="text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>{lang === 'ar' ? 'حدد مدة الحظر والتقييد:' : 'Select Ban Duration:'}</span>
                <span className="text-[10px] text-red-400 font-mono">طرد فوري</span>
              </div>

              {/* The 4 main options: يوم، اسبوع، شهر، سنة */}
              <div className="grid grid-cols-2 gap-1.5">
                {/* يوم */}
                <button
                  type="button"
                  onClick={() => {
                    handleQuickBan(banTargetUser, '1_day');
                    setBanTargetUser(null);
                  }}
                  className="p-2 rounded-xl bg-white/[0.06] hover:bg-red-500/20 text-slate-200 hover:text-red-300 border border-white/10 hover:border-red-500/35 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'يوم' : '1 Day'}</span>
                  <span className="text-[10px] text-slate-400 font-mono">24h</span>
                </button>

                {/* اسبوع */}
                <button
                  type="button"
                  onClick={() => {
                    handleQuickBan(banTargetUser, '1_week');
                    setBanTargetUser(null);
                  }}
                  className="p-2 rounded-xl bg-white/[0.06] hover:bg-red-500/20 text-slate-200 hover:text-red-300 border border-white/10 hover:border-red-500/35 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'اسبوع' : '1 Week'}</span>
                  <span className="text-[10px] text-slate-400 font-mono">7d</span>
                </button>

                {/* شهر */}
                <button
                  type="button"
                  onClick={() => {
                    handleQuickBan(banTargetUser, '1_month');
                    setBanTargetUser(null);
                  }}
                  className="p-2 rounded-xl bg-white/[0.06] hover:bg-red-500/20 text-slate-200 hover:text-red-300 border border-white/10 hover:border-red-500/35 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'شهر' : '1 Month'}</span>
                  <span className="text-[10px] text-slate-400 font-mono">30d</span>
                </button>

                {/* سنة */}
                <button
                  type="button"
                  onClick={() => {
                    handleQuickBan(banTargetUser, '1_year');
                    setBanTargetUser(null);
                  }}
                  className="p-2 rounded-xl bg-white/[0.06] hover:bg-red-500/20 text-slate-200 hover:text-red-300 border border-white/10 hover:border-red-500/35 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'سنة' : '1 Year'}</span>
                  <span className="text-[10px] text-slate-400 font-mono">365d</span>
                </button>
              </div>

              {/* حظر دائم */}
              <button
                type="button"
                onClick={() => {
                  handleQuickBan(banTargetUser, 'permanent');
                  setBanTargetUser(null);
                }}
                className="w-full py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/35 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
              >
                <span>{lang === 'ar' ? 'حظر دائم' : 'Permanent Ban'}</span>
                <span className="text-[10px] text-red-400 font-mono">نهائي</span>
              </button>
            </div>

            {/* Cancel Button */}
            <div className="space-y-1.5 pt-0.5 relative z-10">
              <button
                type="button"
                onClick={() => setBanTargetUser(null)}
                className="w-full py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-slate-300 hover:text-white font-semibold text-xs transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE MODERATOR MODAL */}
      {isAddModOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-backdrop-fade">
          <div className="relative w-full max-w-lg bg-[#091326]/75 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[92vh] animate-modal-pop">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.04]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>{lang === 'ar' ? 'إنشاء حساب مشرف جديد وتحديد الصلاحيات' : 'Create New Moderator'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateModerator} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-300 text-[11px] leading-relaxed">
                {lang === 'ar'
                  ? 'قم بكتابة بريد المشرف (جيميل أو أي إيميل) وكلمة المرور، ثم حدد الأزرار التي ستظهر له عند تسجيل الدخول بهذا الحساب.'
                  : 'Enter email & password and choose the buttons that will appear in the control panel for this moderator.'}
              </div>

              {/* Email */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {lang === 'ar' ? 'البريد الإلكتروني (جيميل / إيميل):' : 'Email:'}
                </label>
                <input
                  type="email"
                  required
                  value={modFormEmail}
                  onChange={(e) => setModFormEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full bg-[#060c1a]/80 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono text-xs"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-bold">
                    {lang === 'ar' ? 'كلمة المرور:' : 'Password:'}
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1 font-bold"
                  >
                    <KeyRound className="w-3 h-3 text-amber-400" />
                    <span>{lang === 'ar' ? 'توليد كلمة مرور عشوائية' : 'Generate'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={modFormShowPassword ? 'text' : 'password'}
                    required
                    value={modFormPassword}
                    onChange={(e) => setModFormPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#060c1a]/80 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono text-xs pr-9 rtl:pr-9 ltr:pl-9"
                  />
                  <button
                    type="button"
                    onClick={() => setModFormShowPassword(!modFormShowPassword)}
                    className="absolute right-2.5 rtl:right-2.5 ltr:left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    {modFormShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {lang === 'ar' ? 'اسم المشرف أو اللقب (اختياري):' : 'Display Name (Optional):'}
                </label>
                <input
                  type="text"
                  value={modFormName}
                  onChange={(e) => setModFormName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: أحمد - مشرف الطلبات' : 'e.g. Orders Moderator'}
                  className="w-full bg-[#060c1a]/80 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              {/* Permissions Checkbox Grid */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-xs block">
                    {lang === 'ar' ? 'الأزرار والأقسام التي ستظهر له في لوحة التحكم:' : 'Permitted Control Panel Buttons:'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModFormPermissions(ALL_MODERATOR_PERMISSIONS.map((p) => p.id))}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                    >
                      {lang === 'ar' ? 'تحديد الكل' : 'Select All'}
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setModFormPermissions([])}
                      className="text-[10px] text-slate-400 hover:text-slate-300 font-medium cursor-pointer"
                    >
                      {lang === 'ar' ? 'إلغاء التحديد' : 'Clear All'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {ALL_MODERATOR_PERMISSIONS.map((perm) => {
                    const isChecked = modFormPermissions.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => {
                          if (isChecked) {
                            setModFormPermissions(modFormPermissions.filter((id) => id !== perm.id));
                          } else {
                            setModFormPermissions([...modFormPermissions, perm.id]);
                          }
                        }}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-amber-500/10 border-amber-500/40 text-white'
                            : 'bg-white/[0.03] border-white/5 text-slate-400 hover:bg-white/[0.06]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-white/20 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer pointer-events-none"
                        />
                        <div className="flex-1">
                          <span className={`font-bold block text-xs ${isChecked ? 'text-amber-300' : 'text-slate-300'}`}>
                            {lang === 'ar' ? perm.labelAr : perm.labelEn}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                            {perm.descriptionAr}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingMod}
                  className="px-5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition-all cursor-pointer shadow-none flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                  <span>
                    {isCreatingMod
                      ? (lang === 'ar' ? 'جارٍ الإنشاء...' : 'Creating...')
                      : (lang === 'ar' ? 'إنشاء الحساب وتفعيل الصلاحيات' : 'Create Moderator')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS MODERATOR CREATED DIALOG */}
      {createdModSuccess && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 backdrop-blur-xs flex items-center justify-center p-3.5 animate-backdrop-fade">
          <div className="relative w-full max-w-[360px] sm:max-w-[420px] bg-[#091326]/75 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl text-center space-y-4 animate-modal-pop">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">
                {lang === 'ar' ? 'تم إنشاء حساب المشرف بنجاح!' : 'Moderator Created!'}
              </h3>
              <p className="text-xs text-slate-300">
                {lang === 'ar'
                  ? 'يمكنك الآن نسخ بيانات الدخول وتسليمها للمشرف ليسجل دخوله مباشرة.'
                  : 'You can now copy credentials and hand them over to the moderator.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/35 border border-white/10 text-right rtl:text-right ltr:text-left space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-sans">{lang === 'ar' ? 'البريد:' : 'Email:'}</span>
                <span className="text-white font-bold select-all">{createdModSuccess.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-sans">{lang === 'ar' ? 'كلمة المرور:' : 'Password:'}</span>
                <span className="text-amber-400 font-bold select-all">{createdModSuccess.password}</span>
              </div>
              <div className="pt-1.5 border-t border-white/10">
                <span className="text-slate-400 text-[10px] block mb-1 font-sans">
                  {lang === 'ar' ? 'الأزرار المتاحة له في لوحة التحكم:' : 'Permitted Buttons:'}
                </span>
                <span className="text-slate-200 text-[11px] font-sans block leading-normal">
                  {createdModSuccess.permissions
                    .map((p) => ALL_MODERATOR_PERMISSIONS.find((d) => d.id === p)?.labelAr || p)
                    .join('، ') || (lang === 'ar' ? 'لا يوجد أزرار' : 'None')}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopyModeratorCredentials(createdModSuccess)}
                className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-none"
              >
                <Copy className="w-4 h-4 text-amber-400" />
                <span>
                  {copiedSuccess
                    ? (lang === 'ar' ? 'تم نسخ البيانات بنجاح!' : 'Copied!')
                    : (lang === 'ar' ? 'نسخ بيانات الدخول لتسليمها' : 'Copy Credentials')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCreatedModSuccess(null)}
                className="w-full py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-300 border border-white/10 font-bold text-xs transition-colors cursor-pointer shadow-none"
              >
                {lang === 'ar' ? 'تم / إغلاق' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODERATOR PERMISSIONS MODAL */}
      {editingModPermissionsUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-backdrop-fade">
          <div className="relative w-full max-w-lg bg-[#091326]/75 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] animate-modal-pop">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.04]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-cyan-400" />
                <span>
                  {lang === 'ar'
                    ? `تعديل أزرار المشرف: ${editingModPermissionsUser.displayName || editingModPermissionsUser.email}`
                    : `Edit Buttons: ${editingModPermissionsUser.displayName}`}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingModPermissionsUser(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-slate-300 text-[11px] leading-relaxed">
                {lang === 'ar'
                  ? 'اختر الأزرار التي تريد أن تظهر لهذا المشرف عندما يفتح لوحة التحكم. الأزرار غير المحددة ستختفي تماماً عنده.'
                  : 'Select buttons that should be visible to this moderator.'}
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-xs block">
                  {lang === 'ar' ? 'الأزرار المتاحة:' : 'Available Buttons:'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTempPermissionsSelection(ALL_MODERATOR_PERMISSIONS.map((p) => p.id))}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                  >
                    {lang === 'ar' ? 'تحديد الكل' : 'Select All'}
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={() => setTempPermissionsSelection([])}
                    className="text-[10px] text-slate-400 hover:text-slate-300 font-medium cursor-pointer"
                  >
                    {lang === 'ar' ? 'إلغاء التحديد' : 'Clear All'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {ALL_MODERATOR_PERMISSIONS.map((perm) => {
                  const isChecked = tempPermissionsSelection.includes(perm.id);
                  return (
                    <div
                      key={perm.id}
                      onClick={() => {
                        if (isChecked) {
                          setTempPermissionsSelection(tempPermissionsSelection.filter((id) => id !== perm.id));
                        } else {
                          setTempPermissionsSelection([...tempPermissionsSelection, perm.id]);
                        }
                      }}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-white'
                          : 'bg-white/[0.03] border-white/5 text-slate-400 hover:bg-white/[0.06]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-white/20 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer pointer-events-none"
                      />
                      <div className="flex-1">
                        <span className={`font-bold block text-xs ${isChecked ? 'text-cyan-300' : 'text-slate-300'}`}>
                          {lang === 'ar' ? perm.labelAr : perm.labelEn}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                          {perm.descriptionAr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingModPermissionsUser(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-300 border border-white/10 font-bold transition-colors cursor-pointer shadow-none"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveModeratorPermissions}
                  disabled={isSavingPerms}
                  className="px-5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold transition-all cursor-pointer shadow-none flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                  <span>
                    {isSavingPerms
                      ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...')
                      : (lang === 'ar' ? 'حفظ الصلاحيات' : 'Save Permissions')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODERATOR PASSWORD MODAL */}
      {editingModPasswordUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 backdrop-blur-xs flex items-center justify-center p-3.5 animate-backdrop-fade">
          <div className="relative w-full max-w-[340px] sm:max-w-[380px] bg-[#091326]/75 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 animate-modal-pop">
            
            <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {lang === 'ar' ? 'تغيير كلمة مرور المشرف' : 'Change Password'}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono block truncate max-w-[220px]">
                  {editingModPasswordUser.email}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-bold block">
                    {lang === 'ar' ? 'كلمة المرور الجديدة:' : 'New Password:'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$!';
                      let res = '';
                      for (let i = 0; i < 9; i++) {
                        res += chars.charAt(Math.floor(Math.random() * chars.length));
                      }
                      setNewModPasswordInput(res);
                    }}
                    className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1 font-bold"
                  >
                    <KeyRound className="w-3 h-3 text-amber-400" />
                    <span>{lang === 'ar' ? 'توليد' : 'Generate'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newModPasswordInput}
                  onChange={(e) => setNewModPasswordInput(e.target.value)}
                  placeholder="كلمة مرور جديدة"
                  className="w-full bg-[#060c1a]/80 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingModPasswordUser(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-300 border border-white/10 font-bold text-xs transition-colors cursor-pointer shadow-none"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveModeratorPassword}
                  disabled={isSavingPassword || !newModPasswordInput.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition-all cursor-pointer shadow-none flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
                  <span>
                    {isSavingPassword
                      ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...')
                      : (lang === 'ar' ? 'حفظ كلمة المرور' : 'Save')}
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DELETE MODERATOR CONFIRMATION MODAL */}
      {deletingModUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 backdrop-blur-xs flex items-center justify-center p-3.5 animate-backdrop-fade">
          <div className="relative w-full max-w-[340px] bg-[#091326]/75 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl text-center space-y-4 animate-modal-pop">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">
                {lang === 'ar' ? 'حذف رتبة المشرف؟' : 'Remove Moderator?'}
              </h3>
              <p className="text-xs text-slate-300">
                {lang === 'ar'
                  ? `هل أنت متأكد من سحب رتبة المشرف وإلغاء صلاحياته للحساب (${deletingModUser.email})؟ سيبقى كحساب مستخدم عادي.`
                  : `Are you sure you want to remove moderator role from ${deletingModUser.email}?`}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingModUser(null)}
                className="flex-1 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-300 border border-white/10 font-bold text-xs transition-colors cursor-pointer shadow-none"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDeleteModerator}
                disabled={isDeletingMod}
                className="flex-1 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-none"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>
                  {isDeletingMod
                    ? (lang === 'ar' ? 'جارٍ الحذف...' : 'Deleting...')
                    : (lang === 'ar' ? 'تأكيد الحذف' : 'Confirm')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
