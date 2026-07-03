import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Condition, WatchlistItem } from '@/types';
import { persistStorage } from './storage';

// Saved models + target prices. Persisted so the watchlist survives restarts
// (an explicit acceptance criterion).

/** Stable identity for a watchlist entry: model + variant + condition. */
export function watchlistKey(
  modelId: string,
  storageGb: number | undefined,
  condition: Condition,
): string {
  return `${modelId}:${storageGb ?? 'any'}:${condition}`;
}

function itemKey(item: Pick<WatchlistItem, 'modelId' | 'storageGb' | 'condition'>): string {
  return watchlistKey(item.modelId, item.storageGb, item.condition);
}

type WatchlistState = {
  items: WatchlistItem[];
  add: (item: WatchlistItem) => void;
  remove: (key: string) => void;
  updateTarget: (key: string, targetPriceIdr: number) => void;
  has: (key: string) => boolean;
  get: (key: string) => WatchlistItem | undefined;
};

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const key = itemKey(item);
          const without = state.items.filter((i) => itemKey(i) !== key);
          return { items: [item, ...without] };
        }),
      remove: (key) =>
        set((state) => ({
          items: state.items.filter((i) => itemKey(i) !== key),
        })),
      updateTarget: (key, targetPriceIdr) =>
        set((state) => ({
          items: state.items.map((i) =>
            itemKey(i) === key ? { ...i, targetPriceIdr } : i,
          ),
        })),
      has: (key) => get().items.some((i) => itemKey(i) === key),
      get: (key) => get().items.find((i) => itemKey(i) === key),
    }),
    {
      name: 'hargaradar.watchlist',
      storage: persistStorage,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
