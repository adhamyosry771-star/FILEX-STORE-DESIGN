import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [];

export const CATEGORY_LABELS: Record<string, { ar: string; en: string; icon: string }> = {
  all: { ar: 'كافة التصاميم', en: 'All Items', icon: 'LayoutGrid' },
  avatar_frames: { ar: 'اطارات', en: 'Frames', icon: 'CircleUser' },
  entrance_effects: { ar: 'دخوليات', en: 'Entrances', icon: 'Crown' },
  gifts: { ar: 'هدايا', en: 'Gifts', icon: 'Gift' },
  medals: { ar: 'ميداليات', en: 'Medals', icon: 'Medal' },
  mic_frames: { ar: 'مؤثرات مايك', en: 'Mic Waves', icon: 'Mic' },
  chat_bubbles: { ar: 'فقاعات الدردشه', en: 'Chat Bubbles', icon: 'MessageSquare' },
  room_themes: { ar: 'ثيمات الغرفه', en: 'Room Themes', icon: 'LayoutTemplate' },
};
