import React, { useState, useEffect } from 'react';
import { INITIAL_PRODUCTS, CATEGORY_LABELS } from './data/initialProducts';
import { Product, ProductCategory, CartItem, AuthUser, SiteBranding, DEFAULT_BRANDING, StoreBanner, DEFAULT_BANNERS, BanStatus, checkUserBanStatus, canAccessAdmin, isVideoUrl, isYouTubeUrl, getYouTubeEmbedUrl } from './types';
import { Navbar } from './components/Navbar';
import { ImageBannerSlider } from './components/ImageBannerSlider';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { OrdersDrawer } from './components/OrdersDrawer';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { AuthGateway } from './components/AuthGateway';
import { BanModal } from './components/BanModal';
import { SnowEffect } from './components/SnowEffect';
import { getCurrentUser, logoutUser, touchUserLastSeen } from './lib/authService';
import { 
  logStoreActivity,
  saveProductToFirestore,
  deleteProductFromFirestore,
  subscribeToProducts,
  saveBannerToFirestore,
  deleteBannerFromFirestore,
  subscribeToBanners,
  saveBrandingToFirestore,
  subscribeToBranding,
  subscribeToUserOrders,
  getUnseenOrdersCount,
  markOrdersAsSeen,
  OrderRecord
} from './lib/firebaseService';
import {
  Search,
  Package,
  PackageOpen,
  LayoutGrid,
  ShoppingBag,
  SlidersHorizontal,
  Layers,
  ClipboardList,
} from 'lucide-react';
import { 
  initAntiInspectionShield, 
  secureSetItem, 
  secureGetItem 
} from './lib/security';

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentUser());

  // Real-time persistence via Firestore with encrypted local storage fallback
  const [products, setProducts] = useState<Product[]>(() => {
    return secureGetItem<Product[]>('vipsvga_products_v1', []);
  });

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    return secureGetItem<CartItem[]>('vipsvga_cart_v1', []);
  });

  // Site Branding State (Background Image & Logo Icon)
  const [branding, setBranding] = useState<SiteBranding>(() => {
    return secureGetItem<SiteBranding>('filex_site_branding_v1', DEFAULT_BRANDING);
  });

  // 1. Subscribe to Firebase Firestore Products in Real-time
  useEffect(() => {
    const unsub = subscribeToProducts((firestoreProducts) => {
      if (firestoreProducts && firestoreProducts.length > 0) {
        setProducts(firestoreProducts);
        try {
          localStorage.setItem('vipsvga_products_v1', JSON.stringify(firestoreProducts));
        } catch {}
      } else {
        // If Firestore has no products yet but localStorage has cached products, push them to Firestore!
        try {
          const cached = localStorage.getItem('vipsvga_products_v1');
          if (cached) {
            const parsed: Product[] = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsed.forEach((p) => {
                saveProductToFirestore(p);
              });
            }
          }
        } catch {}
      }
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Firebase Firestore Banners in Real-time
  useEffect(() => {
    const unsub = subscribeToBanners((firestoreBanners) => {
      if (firestoreBanners && firestoreBanners.length > 0) {
        setBanners(firestoreBanners);
        try {
          localStorage.setItem('filex_store_banners_v1', JSON.stringify(firestoreBanners));
        } catch {}
      } else {
        try {
          const cached = localStorage.getItem('filex_store_banners_v1');
          if (cached) {
            const parsed: StoreBanner[] = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsed.forEach((b) => {
                saveBannerToFirestore(b);
              });
            }
          }
        } catch {}
      }
    });
    return () => unsub();
  }, []);

  // 3. Subscribe to Firebase Firestore Branding in Real-time
  useEffect(() => {
    const unsub = subscribeToBranding((firestoreBranding) => {
      if (firestoreBranding) {
        setBranding((prev) => ({ ...prev, ...firestoreBranding }));
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    secureSetItem('filex_site_branding_v1', branding);
  }, [branding]);

  // Apply background dynamically to document.body
  useEffect(() => {
    const bg = branding.backgroundImageUrl?.trim() || DEFAULT_BRANDING.backgroundImageUrl;
    if (isVideoUrl(bg) || isYouTubeUrl(bg)) {
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = '#07090e';
    } else {
      document.body.style.backgroundColor = '#07090e';
      document.body.style.backgroundImage = `linear-gradient(to bottom, rgba(7, 9, 14, 0.45), rgba(7, 9, 14, 0.58), rgba(7, 9, 14, 0.70)), url('${bg}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center top';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundRepeat = 'no-repeat';
    }
  }, [branding.backgroundImageUrl]);

  // Apply favicon dynamically
  useEffect(() => {
    if (branding.logoIconUrl?.trim()) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = branding.logoIconUrl.trim();
    }
  }, [branding.logoIconUrl]);

  // Global Content Protection: Prevent text copying, cutting, and unauthorized image saving/dragging
  useEffect(() => {
    const isFormInputElement = (el: EventTarget | null): boolean => {
      if (!el || !(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || el.isContentEditable;
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (!isFormInputElement(e.target)) {
        e.preventDefault();
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      if (!isFormInputElement(e.target)) {
        e.preventDefault();
      }
    };

    const handleSelectStart = (e: Event) => {
      if (!isFormInputElement(e.target)) {
        e.preventDefault();
      }
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLImageElement ||
        target?.tagName === 'IMG' ||
        target?.closest?.('.no-download-shield') ||
        target?.closest?.('.no-download')
      ) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+C / Cmd+C or Ctrl+U if not in input/textarea
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        if (!isFormInputElement(e.target)) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Initialize anti-inspection and DevTools protection
  useEffect(() => {
    const cleanup = initAntiInspectionShield();
    return () => cleanup();
  }, []);

  // Save to encrypted local storage
  useEffect(() => {
    secureSetItem('vipsvga_products_v1', products);
  }, [products]);

  useEffect(() => {
    secureSetItem('vipsvga_cart_v1', cartItems);
  }, [cartItems]);

  // Log initial visit to Firebase and update user lastSeen
  useEffect(() => {
    if (currentUser) {
      touchUserLastSeen(currentUser.id, currentUser.email);
    }
    logStoreActivity('visit_store', {
      screen: `${window.innerWidth}x${window.innerHeight}`,
      lang: navigator.language,
      platform: navigator.platform,
      userId: currentUser?.id,
      userRole: currentUser?.role
    });

    if (currentUser) {
      const interval = setInterval(() => {
        touchUserLastSeen(currentUser.id, currentUser.email);
      }, 120000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // UI State
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [userOrders, setUserOrders] = useState<OrderRecord[]>([]);
  const [unseenOrdersCount, setUnseenOrdersCount] = useState(0);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSnowing, setIsSnowing] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'featured' | 'price_asc' | 'price_desc' | 'vip'>('newest');
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [bannedModalInfo, setBannedModalInfo] = useState<BanStatus | null>(null);

  // Real-time track user's orders and unseen badge count
  useEffect(() => {
    const unsub = subscribeToUserOrders((orders) => {
      setUserOrders(orders);
      if (isOrdersOpen) {
        markOrdersAsSeen(orders);
        setUnseenOrdersCount(0);
      } else {
        setUnseenOrdersCount(getUnseenOrdersCount(orders));
      }
    }, currentUser?.userAppId);

    const handleSeenEvent = () => {
      setUnseenOrdersCount(0);
    };
    window.addEventListener('filex_orders_seen', handleSeenEvent);

    return () => {
      unsub();
      window.removeEventListener('filex_orders_seen', handleSeenEvent);
    };
  }, [currentUser?.userAppId, isOrdersOpen]);

  const handleOpenOrders = () => {
    setIsOrdersOpen(true);
    markOrdersAsSeen(userOrders);
    setUnseenOrdersCount(0);
  };

  // Real-time Ban Monitor: Kick out user immediately if banned while browsing
  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin') return;

    // 1. Initial check
    const initialStatus = checkUserBanStatus(currentUser);
    if (initialStatus.banned) {
      setBannedModalInfo(initialStatus);
      logoutUser();
      setCurrentUser(null);
      return;
    }

    // 2. Custom window event listener (immediate in same tab)
    const handleBanEvent = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (
        (detail.email && detail.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (detail.userId && detail.userId === currentUser.id)
      ) {
        const status = checkUserBanStatus(detail.banData || { isBanned: true });
        setBannedModalInfo(status);
        logoutUser();
        setCurrentUser(null);
      }
    };

    // 3. Storage event listener (across browser tabs)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'filex_active_ban_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (
            (parsed.email && parsed.email.toLowerCase() === currentUser.email.toLowerCase()) ||
            (parsed.userId && parsed.userId === currentUser.id)
          ) {
            const status = checkUserBanStatus(parsed.banData || { isBanned: true });
            setBannedModalInfo(status);
            logoutUser();
            setCurrentUser(null);
          }
        } catch {}
      }
    };

    window.addEventListener('filex_user_banned', handleBanEvent);
    window.addEventListener('storage', handleStorage);

    // 4. Firestore real-time listener if available
    let unsubFirestore = () => {};
    try {
      import('firebase/firestore').then(({ doc, onSnapshot }) => {
        import('./lib/firebase').then(({ db }) => {
          unsubFirestore = onSnapshot(doc(db, 'users', currentUser.id), (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              const status = checkUserBanStatus(data as any);
              if (status.banned) {
                setBannedModalInfo(status);
                logoutUser();
                setCurrentUser(null);
              }
            }
          }, () => {});
        });
      });
    } catch {}

    // 5. Periodic local heartbeat check (every 2.5 seconds)
    const heartbeat = setInterval(() => {
      try {
        const raw = localStorage.getItem('filex_registered_users_v1');
        if (raw) {
          const users = JSON.parse(raw);
          const me = users[currentUser.email.toLowerCase()];
          if (me) {
            const status = checkUserBanStatus(me);
            if (status.banned) {
              setBannedModalInfo(status);
              logoutUser();
              setCurrentUser(null);
            }
          }
        }
      } catch {}
    }, 2500);

    return () => {
      window.removeEventListener('filex_user_banned', handleBanEvent);
      window.removeEventListener('storage', handleStorage);
      unsubFirestore();
      clearInterval(heartbeat);
    };
  }, [currentUser]);

  // Banners state with localStorage persistence - ONLY banners added by admin
  const [banners, setBanners] = useState<StoreBanner[]>(() => {
    try {
      const saved = localStorage.getItem('filex_store_banners_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out any mock dummy banners
          return parsed.filter((b) => b.id !== 'banner-1' && b.id !== 'banner-2');
        }
      }
    } catch (e) {
      console.warn('Failed to load saved banners', e);
    }
    return [];
  });

  const handleAddBanner = async (newBanner: StoreBanner) => {
    const updated = [newBanner, ...banners];
    setBanners(updated);
    try {
      localStorage.setItem('filex_store_banners_v1', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save banners', e);
    }
    await saveBannerToFirestore(newBanner);
    logStoreActivity('add_banner', { bannerId: newBanner.id });
  };

  const handleDeleteBanner = async (bannerId: string) => {
    const updated = banners.filter((b) => b.id !== bannerId);
    setBanners(updated);
    try {
      localStorage.setItem('filex_store_banners_v1', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save banners', e);
    }
    await deleteBannerFromFirestore(bannerId);
    logStoreActivity('delete_banner', { bannerId });
  };

  const handleResetBanners = async () => {
    const bannerIds = banners.map((b) => b.id);
    setBanners([]);
    try {
      localStorage.setItem('filex_store_banners_v1', JSON.stringify([]));
    } catch (e) {
      console.warn('Failed to reset banners', e);
    }
    for (const bId of bannerIds) {
      await deleteBannerFromFirestore(bId);
    }
  };

  const handleUpdateBranding = async (newBranding: SiteBranding) => {
    setBranding(newBranding);
    try {
      localStorage.setItem('filex_site_branding_v1', JSON.stringify(newBranding));
    } catch {}
    await saveBrandingToFirestore(newBranding);
  };

  // Sync RTL / LTR document direction with language
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setIsAdminOpen(false);
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    logStoreActivity('add_to_cart', {
      productId: product.id,
      code: product.code,
      name: product.name,
      price: product.price,
      vipLevel: product.vipLevel,
      category: product.category
    });

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    setLastAddedId(product.id);
    setTimeout(() => {
      setLastAddedId(null);
    }, 2000);
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    logStoreActivity('remove_from_cart', { productId });
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    logStoreActivity('clear_cart', { previousCount: cartItems.length });
    setCartItems([]);
  };

  const handleCategoryChange = (category: ProductCategory) => {
    setActiveCategory(category);
    logStoreActivity('change_category', { category });
  };

  const handleProductSelect = (product: Product | null) => {
    setSelectedProduct(product);
    if (product) {
      logStoreActivity('view_product_details', {
        id: product.id,
        code: product.code,
        name: product.name,
        vipLevel: product.vipLevel,
        price: product.price
      });
    }
  };

  // Admin operations
  const handleAddProduct = async (newProduct: Omit<Product, 'id'>) => {
    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const productWithId: Product = { ...newProduct, id };
    setProducts((prev) => [productWithId, ...prev]);
    try {
      const updated = [productWithId, ...products];
      localStorage.setItem('vipsvga_products_v1', JSON.stringify(updated));
    } catch {}
    await saveProductToFirestore(productWithId);
  };

  const handleUpdateProduct = async (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    try {
      const list = products.map((p) => (p.id === updated.id ? updated : p));
      localStorage.setItem('vipsvga_products_v1', JSON.stringify(list));
    } catch {}
    await saveProductToFirestore(updated);
  };

  const handleDeleteProduct = async (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    try {
      const list = products.filter((p) => p.id !== productId);
      localStorage.setItem('vipsvga_products_v1', JSON.stringify(list));
    } catch {}
    await deleteProductFromFirestore(productId);
  };

  const handleResetDefaults = async () => {
    const ids = products.map((p) => p.id);
    setProducts([]);
    localStorage.removeItem('vipsvga_products_v1');
    for (const pId of ids) {
      await deleteProductFromFirestore(pId);
    }
  };

  const handleSelectProductById = (productId: string) => {
    const p = products.find((prod) => prod.id === productId || prod.code.includes(productId));
    if (p) {
      setSelectedProduct(p);
    }
  };

  // Filtering & Sorting
  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'newest') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      return (b.id || '').localeCompare(a.id || '');
    }
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'vip') return b.vipLevel - a.vipLevel;
    return (b.downloadsCount || 0) - (a.downloadsCount || 0);
  });

  const totalCartCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  // Authentication Gate: Require Login / Register before entering the store
  if (!currentUser) {
    return (
      <>
        <AuthGateway
          onLoginSuccess={(user) => {
            setCurrentUser(user);
          }}
          lang={lang}
          logoIconUrl={branding.logoIconUrl}
          backgroundImageUrl={branding.backgroundImageUrl}
        />
        <BanModal
          isOpen={!!bannedModalInfo}
          banStatus={bannedModalInfo}
          onClose={() => setBannedModalInfo(null)}
          lang={lang}
          supportPhone={branding.supportPhone}
        />
      </>
    );
  }

  const siteBg = branding.backgroundImageUrl?.trim() || DEFAULT_BRANDING.backgroundImageUrl;
  const isSiteBgVideo = isVideoUrl(siteBg);
  const isSiteBgYouTube = isYouTubeUrl(siteBg);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans pb-16 md:pb-0 relative overflow-x-hidden">
      {/* Dynamic Animated Storefront Background (Video / YouTube / Image) */}
      <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden pointer-events-none select-none">
        {isSiteBgYouTube ? (
          <iframe
            key={siteBg}
            src={getYouTubeEmbedUrl(siteBg) || ''}
            title="Background Video"
            className="absolute top-1/2 left-1/2 w-[180vw] min-w-full h-[60vw] min-h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none border-0 opacity-80"
            allow="autoplay; encrypted-media"
          />
        ) : isSiteBgVideo ? (
          <video
            key={siteBg}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            src={siteBg}
            ref={(el) => {
              if (el) {
                el.muted = true;
                el.play().catch(() => {});
              }
            }}
          />
        ) : (
          <div
            className="w-full h-full bg-cover bg-center bg-fixed bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(7, 9, 14, 0.45), rgba(7, 9, 14, 0.58), rgba(7, 9, 14, 0.70)), url('${siteBg}')`,
            }}
          />
        )}
        {/* Cinematic dark overlay to keep all text, products, and controls crisp & legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1226]/40 via-[#0b162e]/55 to-[#091124]/75 pointer-events-none" />
      </div>
      
      {/* Full-screen Falling Snow Effect */}
      <SnowEffect isActive={isSnowing} />

      {/* Top Bar Navigation */}
      <Navbar
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setIsAdminOpen(false);
          handleCategoryChange(cat);
        }}
        cartCount={totalCartCount}
        onOpenCart={() => {
          setIsCartOpen(true);
          logStoreActivity('click_open_cart');
        }}
        isSnowing={isSnowing}
        onToggleSnow={() => {
          setIsSnowing((prev) => !prev);
        }}
        onOpenNotifications={() => {
          setIsSnowing((prev) => !prev);
        }}
        onOpenOrders={handleOpenOrders}
        ordersCount={unseenOrdersCount}
        isAdminOpen={isAdminOpen}
        onToggleAdmin={() => {
          const next = !isAdminOpen;
          setIsAdminOpen(next);
          logStoreActivity(next ? 'admin_dashboard_opened' : 'admin_dashboard_closed');
        }}
        lang={lang}
        onToggleLang={() => {
          const next = lang === 'ar' ? 'en' : 'ar';
          setLang(next);
          logStoreActivity('change_language', { lang: next });
        }}
        user={currentUser}
        onLogout={handleLogout}
        logoIconUrl={branding.logoIconUrl}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isAdminOpen ? (
          /* Advanced Admin Dashboard Console */
          <div key="admin-dashboard-page" className="animate-page-transition">
            <AdminDashboard
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onResetDefaults={handleResetDefaults}
              onClose={() => setIsAdminOpen(false)}
              lang={lang}
              branding={branding}
              onUpdateBranding={handleUpdateBranding}
              banners={banners}
              onAddBanner={handleAddBanner}
              onDeleteBanner={handleDeleteBanner}
              onResetBanners={handleResetBanners}
              currentUser={currentUser}
            />
          </div>
        ) : (
          /* Standard Customer Storefront */
          <div key={`storefront-page-${activeCategory}`} className="animate-page-transition">
            {/* Top Image Slider Banner Carousel (مستطيل بنر عارض للصور) */}
            {activeCategory === 'all' && (
              <ImageBannerSlider
                banners={banners}
                onSelectProductById={handleSelectProductById}
                lang={lang}
              />
            )}

            {/* Catalog Section */}
            <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
              
              {/* Category Segmented Control & Header */}
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                      <span>
                        {activeCategory === 'all'
                          ? (lang === 'ar' ? 'كافة تصاميم ودخوليات الغرف الصوتية SVGA' : 'Voice Room SVGA Catalog')
                          : CATEGORY_LABELS[activeCategory]?.[lang] || activeCategory}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {lang === 'ar'
                        ? 'تصفح أرقى الدخوليات والإطارات ومؤثرات المايك وثيمات الغرف الصوتية.'
                        : 'Browse high-end entrances, avatar frames, mic waves, and themes.'}
                    </p>
                  </div>

                  {/* Search and Sort Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={lang === 'ar' ? 'بحث بالكود أو الاسم...' : 'Search items...'}
                        className="bg-[#0c1833]/90 border border-blue-900/50 rounded-xl py-2 px-8 text-xs text-white focus:outline-none focus:border-amber-400 placeholder-slate-400 w-44 sm:w-56 shadow-xs"
                      />
                    </div>

                    {/* Sort Selector */}
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value as typeof sortBy);
                        e.currentTarget.blur();
                      }}
                      className="bg-[#0c1833]/90 border border-blue-900/50 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-0 focus:border-blue-900/50 active:outline-none cursor-pointer shadow-xs"
                    >
                      <option value="newest" className="bg-[#0c1833] text-slate-200">{lang === 'ar' ? 'الأحدث' : 'Newest'}</option>
                      <option value="featured" className="bg-[#0c1833] text-slate-200">{lang === 'ar' ? 'الأكثر طلباً' : 'Popularity'}</option>
                      <option value="price_asc" className="bg-[#0c1833] text-slate-200">{lang === 'ar' ? 'السعر: الأقل أولاً' : 'Price: Low to High'}</option>
                      <option value="price_desc" className="bg-[#0c1833] text-slate-200">{lang === 'ar' ? 'السعر: الأعلى أولاً' : 'Price: High to Low'}</option>
                    </select>
                  </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-2 p-1.5 bg-[#0a152d]/85 rounded-2xl border border-blue-900/40 overflow-x-auto scrollbar-none shadow-md shadow-blue-950/20">
                  {(['all', 'avatar_frames', 'entrance_effects', 'gifts', 'medals', 'mic_frames', 'chat_bubbles', 'room_themes'] as ProductCategory[]).map(
                    (cat) => {
                      const count = cat === 'all' ? products.length : products.filter((p) => p.category === cat).length;
                      const isActive = activeCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => handleCategoryChange(cat)}
                          className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
                            isActive
                              ? 'bg-amber-500/15 text-white font-bold border border-amber-500/40 shadow-xs'
                              : 'text-slate-300 hover:text-white hover:bg-white/[0.08] border border-transparent'
                          }`}
                        >
                          <span className="whitespace-nowrap">{CATEGORY_LABELS[cat]?.[lang] || cat}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                              isActive ? 'bg-amber-500/20 text-white border border-amber-500/30' : 'bg-blue-950/80 text-blue-200 border border-blue-800/40'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Product Grid */}
              {sortedProducts.length === 0 ? (
                <div className="py-20 text-center rounded-2xl border border-dashed border-blue-900/50 bg-[#0c162e]/50 space-y-3 px-4">
                  <PackageOpen className="w-12 h-12 text-slate-400 mx-auto drop-shadow-md" strokeWidth={1.5} />
                  <p className="text-sm font-semibold text-slate-300">
                    {lang === 'ar' ? 'لا يوجد شي هنا في الوقت الحالي' : 'There is nothing here at the moment'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-4 sm:gap-5">
                  {sortedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={(p) => handleProductSelect(p)}
                      onAddToCart={(p) => handleAddToCart(p)}
                      isAdded={lastAddedId === product.id}
                      lang={lang}
                    />
                  ))}
                </div>
              )}

            </section>
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p) => {
          handleAddToCart(p);
        }}
        lang={lang}
      />

      {/* Shopping Cart Slide-over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        lang={lang}
        user={currentUser}
        supportPhone={branding.supportPhone}
      />

      {/* User Orders History Slide-over Drawer (سجل الطلبات) */}
      <OrdersDrawer
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        lang={lang}
        user={currentUser}
        onOpenCart={() => setIsCartOpen(true)}
        supportPhone={branding.supportPhone}
      />

      {/* Footer */}
      <Footer
        lang={lang}
        onOpenAdmin={() => setIsAdminOpen(true)}
        isAdmin={canAccessAdmin(currentUser)}
        logoIconUrl={branding.logoIconUrl}
        supportPhone={branding.supportPhone}
      />

      {/* Mobile Bottom Quick Navigation Bar in Royal Dark Blue */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#091326]/95 border-t border-blue-900/40 px-3 py-2 flex items-center justify-around text-[10px] text-slate-300 backdrop-blur-md">
        <button
          onClick={() => {
            setIsAdminOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            !isAdminOpen ? 'text-amber-400 font-bold' : 'hover:text-white'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>{lang === 'ar' ? 'المتجر' : 'Store'}</span>
        </button>

        <button
          onClick={() => {
            setIsAdminOpen(false);
            const el = document.getElementById('catalog-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-1 hover:text-amber-400 transition-colors"
        >
          <Layers className="w-4 h-4" />
          <span>{lang === 'ar' ? 'الأقسام' : 'Categories'}</span>
        </button>

        {/* My Orders button in mobile nav */}
        <button
          onClick={() => {
            setIsAdminOpen(false);
            handleOpenOrders();
          }}
          className="relative flex flex-col items-center gap-1 hover:text-amber-400 transition-colors"
        >
          <ClipboardList className="w-4 h-4 text-slate-200" />
          {unseenOrdersCount > 0 && (
            <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-amber-500 text-black font-extrabold text-[9px] rounded-full flex items-center justify-center shadow-xs">
              {unseenOrdersCount}
            </span>
          )}
          <span>{lang === 'ar' ? 'طلباتي' : 'Orders'}</span>
        </button>

        {/* Admin Dashboard: Strictly visible for Admin role or authorized Moderator */}
        {canAccessAdmin(currentUser) && (
          <button
            onClick={() => setIsAdminOpen(!isAdminOpen)}
            className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl border transition-all shrink-0 ${
              isAdminOpen
                ? 'bg-amber-500/20 text-amber-300 font-bold border-amber-400'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/40 hover:border-amber-400'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-semibold whitespace-nowrap">{lang === 'ar' ? 'لوحة التحكم' : 'Admin'}</span>
          </button>
        )}

        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center gap-1 hover:text-amber-400 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          {totalCartCount > 0 && (
            <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-amber-500 text-black font-extrabold text-[9px] rounded-full flex items-center justify-center">
              {totalCartCount}
            </span>
          )}
          <span>{lang === 'ar' ? 'السلة' : 'Cart'}</span>
        </button>
      </div>

    </div>
  );
}
