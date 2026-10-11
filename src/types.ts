export type ProductCategory = 
  | 'all'
  | 'avatar_frames'
  | 'entrance_effects'
  | 'gifts'
  | 'medals'
  | 'mic_frames'
  | 'chat_bubbles'
  | 'room_themes';

export type ProductTag = 'PREMIUM' | 'HOT' | 'NEW' | 'LIMITED' | 'ROYAL';

export interface Product {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  nameZh: string;
  category: Exclude<ProductCategory, 'all'>;
  price: number;
  originalPrice?: number;
  currency: 'USD' | 'COINS' | 'SAR';
  vipLevel: number; // 1 to 9
  tag?: ProductTag;
  previewImage: string;
  previewVideoUrl?: string;
  animationType: 'dragon' | 'supercar' | 'phoenix_frame' | 'wings_frame' | 'lotus_mic' | 'neon_mic' | 'bubble_jade' | 'bubble_rose' | 'theme_palace';
  svgaUrl: string;
  fileSize: string;
  fileFormat?: string;
  duration: string;
  compatibility: string[];
  downloadsCount: number;
  description: string;
  inStock: boolean;
  featured?: boolean;
  accentColor: string;
  soundEffect?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  userAppId?: string; // Optional user game ID (e.g., Yalla ID or YoHo ID)
  appName?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  totalAmount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod: 'whatsapp' | 'usdt' | 'card' | 'coins';
  createdAt: string;
  yallaId?: string;
}

export type ModeratorPermissionKey =
  | 'catalog'
  | 'add_product'
  | 'orders'
  | 'users'
  | 'banners'
  | 'design'
  | 'contact';

export interface ModeratorPermissionDef {
  id: ModeratorPermissionKey;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
}

export const ALL_MODERATOR_PERMISSIONS: ModeratorPermissionDef[] = [
  { id: 'catalog', labelAr: 'كتالوج المنتجات', labelEn: 'Catalog', descriptionAr: 'تصفح وتعديل وحذف التصاميم وملفات SVGA' },
  { id: 'add_product', labelAr: 'زر إضافة تصميم جديد', labelEn: 'Add Design Button', descriptionAr: 'إمكانية رفع وتنزيل تصاميم جديدة للمتجر' },
  { id: 'orders', labelAr: 'طلبات العملاء', labelEn: 'Orders', descriptionAr: 'سجل الطلبات، تحديث الحالات وتحديد روابط التحميل المباشر' },
  { id: 'users', labelAr: 'قائمة المستخدمين', labelEn: 'Users List', descriptionAr: 'عرض المستخدمين وفحص الحسابات وحظر المستخدمين' },
  { id: 'banners', labelAr: 'البنرات الإعلانية', labelEn: 'Banners', descriptionAr: 'إدارة سلايدر العرض والبنرات الترويجية' },
  { id: 'design', labelAr: 'مظهر وتصميم المتجر', labelEn: 'Appearance', descriptionAr: 'تخصيص الخلفيات والشعار والمظهر العام' },
  { id: 'contact', labelAr: 'إعدادات التواصل', labelEn: 'Contact Settings', descriptionAr: 'تحديث رقم واتساب للتواصل التلقائي في كافة أزرار المتجر' },
];

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user' | 'moderator';
  userAppId?: string;
  vipLevel?: number;
  avatarUrl?: string;
  createdAt: string;
  plainPassword?: string;
  lastSeen?: string;
  isBanned?: boolean;
  banDurationType?: '1_day' | '1_week' | '1_month' | '1_year' | 'permanent';
  bannedUntil?: string | null;
  banReason?: string;
  bannedAt?: string;
  // Moderator fields
  isModerator?: boolean;
  moderatorPermissions?: ModeratorPermissionKey[];
  isModeratorRevoked?: boolean;
}

export function canAccessAdmin(user?: Partial<AuthUser> | null): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'moderator' || user.isModerator) {
    if (user.isModeratorRevoked) return false;
    return !!(user.moderatorPermissions && user.moderatorPermissions.length > 0);
  }
  return false;
}

export function isMasterAdmin(user?: Partial<AuthUser> | null): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const lower = user.email?.toLowerCase() || '';
  return lower === 'admin@filex.store' || lower === 'tolex907@gmail.com' || user.id === '10000';
}

export interface BanStatus {
  banned: boolean;
  permanent: boolean;
  remainingDays?: number;
  remainingHours?: number;
  untilDate?: string | null;
  reason?: string;
}

export function checkUserBanStatus(user?: Partial<AuthUser> | null): BanStatus {
  if (!user || !user.isBanned) return { banned: false, permanent: false };
  // If bannedUntil is null or empty, it's a permanent ban
  if (!user.bannedUntil) {
    return {
      banned: true,
      permanent: true,
      reason: user.banReason || 'مخالفة شروط وسياسات الاستخدام'
    };
  }
  const until = new Date(user.bannedUntil).getTime();
  const now = Date.now();
  if (now < until) {
    const diffMs = until - now;
    const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const remainingHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return {
      banned: true,
      permanent: false,
      remainingDays: Math.max(1, remainingDays),
      remainingHours: Math.max(1, remainingHours),
      untilDate: user.bannedUntil,
      reason: user.banReason || 'مخالفة شروط وسياسات الاستخدام'
    };
  }
  return { banned: false, permanent: false };
}

export interface SiteBranding {
  backgroundImageUrl: string;
  loginBackgroundImageUrl?: string;
  logoIconUrl: string;
  supportPhone?: string; // Default & dynamic customer support WhatsApp phone number
}

export const DEFAULT_SUPPORT_PHONE = '01027833873';

/**
 * Normalizes phone numbers to standard international WhatsApp format without '+' or spaces.
 * e.g., '01027833873' -> '201027833873' (Egypt default for 010/011/012/015)
 * or if already with country code (e.g. 2010..., 9665...), keeps it intact.
 */
export function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return '201027833873';
  // Remove non-digit characters
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '201027833873';
  
  // Egyptian standard mobile prefixes: 010, 011, 012, 015
  if (digits.startsWith('010') || digits.startsWith('011') || digits.startsWith('012') || digits.startsWith('015')) {
    return '2' + digits; // 01027833873 -> 201027833873
  }
  // If user entered +20... or already has country code
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  return digits;
}

export function getWhatsAppUrl(phone?: string, text?: string): string {
  const cleanNumber = formatWhatsAppPhone(phone || DEFAULT_SUPPORT_PHONE);
  const baseUrl = `https://wa.me/${cleanNumber}`;
  if (text) {
    return `${baseUrl}?text=${encodeURIComponent(text)}`;
  }
  return baseUrl;
}

export const DEFAULT_BRANDING: SiteBranding = {
  backgroundImageUrl: 'https://files.catbox.moe/i9b55z.jpg',
  loginBackgroundImageUrl: 'https://files.catbox.moe/i9b55z.jpg',
  logoIconUrl: '',
  supportPhone: DEFAULT_SUPPORT_PHONE,
};

export const getYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null;
  const clean = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = clean.match(regExp);
  return match && match[1] ? match[1] : null;
};

export const isYouTubeUrl = (url?: string): boolean => {
  return Boolean(getYouTubeVideoId(url));
};

export const getYouTubeEmbedUrl = (url?: string): string | null => {
  const id = getYouTubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1`;
};

export const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  const clean = url.trim().toLowerCase();

  // Strip query string and fragment to check pure extension
  const pathPart = clean.split('?')[0].split('#')[0];
  if (
    pathPart.endsWith('.mp4') ||
    pathPart.endsWith('.webm') ||
    pathPart.endsWith('.ogg') ||
    pathPart.endsWith('.mov') ||
    pathPart.endsWith('.m4v') ||
    pathPart.endsWith('.mkv')
  ) {
    return true;
  }

  // Data URLs, Blobs, MIME markers, or CDN query param formats
  return (
    clean.startsWith('data:video/') ||
    clean.startsWith('blob:') ||
    clean.includes('video/mp4') ||
    clean.includes('video/webm') ||
    clean.includes('.mp4?') ||
    clean.includes('.webm?') ||
    clean.includes('.mov?') ||
    clean.includes('.ogg?') ||
    clean.includes('.m4v?') ||
    clean.includes('.mp4&') ||
    clean.includes('.webm&')
  );
};

export interface StoreBanner {
  id: string;
  imageUrl: string; // Base / fallback image URL
  imageUrlAr?: string; // Arabic banner image
  imageUrlEn?: string; // English banner image
  title?: string;
  titleAr?: string;
  titleEn?: string;
  description?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  linkProductId?: string; // Optional linked product ID
  createdAt?: string;
}

export const DEFAULT_BANNERS: StoreBanner[] = [];

