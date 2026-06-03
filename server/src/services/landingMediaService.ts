import { readSetting, writeSetting } from './settingStore.js';

export type LandingMediaType = 'image' | 'video' | 'audio' | 'gif' | 'meme' | 'link' | 'document' | 'embed' | 'ad' | 'anthem' | 'archive' | 'other';

export interface LandingMediaItem {
  id: string;
  type: LandingMediaType;
  title: string;
  url: string;
  section: string;
  description?: string;
  tags?: string[];
  fileName?: string;
  mimeType?: string;
  size?: number;
  featured?: boolean;
  order: number;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

const KEY = 'landing_media';

const defaults: LandingMediaItem[] = [
  {
    id: 'landing-media-campus-hero',
    type: 'image',
    title: 'Campus hero image',
    url: '/assets/default-images/ivan-aleksic-PDRFeeDniCk-unsplash.jpg',
    section: 'hero',
      description: 'Primary public landing image',
      tags: ['campus', 'hero'],
      featured: true,
      order: 0,
      createdAt: new Date().toISOString()
  }
];

export const landingMediaService = {
  async list() {
    return readSetting<LandingMediaItem[]>(KEY, defaults);
  },

  async create(payload: Partial<LandingMediaItem>, userId?: string) {
    const items = await this.list();
    const item: LandingMediaItem = {
      id: `landing-media-${Date.now()}`,
      type: payload.type || 'image',
      title: String(payload.title || 'Landing media').trim(),
      url: String(payload.url || '').trim(),
      section: payload.section || 'gallery',
      description: payload.description?.trim(),
      tags: Array.isArray(payload.tags) ? payload.tags.map(String).filter(Boolean).slice(0, 12) : [],
      fileName: payload.fileName ? String(payload.fileName) : undefined,
      mimeType: payload.mimeType ? String(payload.mimeType) : undefined,
      size: Number.isFinite(payload.size) ? Number(payload.size) : undefined,
      featured: Boolean(payload.featured),
      order: Number.isFinite(payload.order) ? Number(payload.order) : items.length,
      createdBy: userId,
      createdAt: new Date().toISOString()
    };

    if (!item.url) {
      throw new Error('url is required');
    }

    const next = [...items, item].sort((a, b) => a.order - b.order);
    await writeSetting(KEY, 'landing-content', next);
    return item;
  },

  async update(id: string, payload: Partial<LandingMediaItem>, userId?: string) {
    const items = await this.list();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return undefined;

    const current = items[index];
    const nextItem: LandingMediaItem = {
      ...current,
      ...payload,
      id: current.id,
      title: payload.title !== undefined ? String(payload.title).trim() : current.title,
      url: payload.url !== undefined ? String(payload.url).trim() : current.url,
      description: payload.description !== undefined ? payload.description?.trim() : current.description,
      tags: Array.isArray(payload.tags) ? payload.tags.map(String).filter(Boolean).slice(0, 12) : current.tags,
      updatedAt: new Date().toISOString(),
      createdBy: current.createdBy || userId
    };

    if (!nextItem.url) {
      throw new Error('url is required');
    }

    const next = [...items];
    next[index] = nextItem;
    await writeSetting(KEY, 'landing-content', next.sort((a, b) => a.order - b.order));
    return nextItem;
  },

  async reorder(orderedIds: string[]) {
    const items = await this.list();
    const order = new Map(orderedIds.map((id, index) => [id, index]));
    const next = items
      .map((item) => ({ ...item, order: order.has(item.id) ? order.get(item.id)! : item.order }))
      .sort((a, b) => a.order - b.order);
    await writeSetting(KEY, 'landing-content', next);
    return next;
  },

  async remove(id: string) {
    const items = await this.list();
    const next = items.filter((item) => item.id !== id);
    await writeSetting(KEY, 'landing-content', next);
    return next.length !== items.length;
  }
};
