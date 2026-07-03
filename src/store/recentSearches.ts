import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from './storage';

// Recent search queries, most-recent first, deduped and capped.

const MAX_RECENT = 8;

type RecentSearchesState = {
  recent: string[];
  addSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clear: () => void;
};

export const useRecentSearchesStore = create<RecentSearchesState>()(
  persist(
    (set) => ({
      recent: [],
      addSearch: (query) => {
        const trimmed = query.trim();
        if (trimmed.length === 0) return;
        set((state) => {
          const withoutDupe = state.recent.filter(
            (q) => q.toLowerCase() !== trimmed.toLowerCase(),
          );
          return { recent: [trimmed, ...withoutDupe].slice(0, MAX_RECENT) };
        });
      },
      removeSearch: (query) =>
        set((state) => ({
          recent: state.recent.filter((q) => q !== query),
        })),
      clear: () => set({ recent: [] }),
    }),
    {
      name: 'hargaradar.recentSearches',
      storage: persistStorage,
    },
  ),
);
