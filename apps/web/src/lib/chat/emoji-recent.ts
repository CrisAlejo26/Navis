import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const RECENT_EMOJI_STORAGE_KEY = 'navis.chat.recentEmoji';

/** Como el "usados recientemente" de cualquier selector de sistema: los últimos, primero. */
const MAX_RECENT = 24;

interface RecentEmojiState {
  recent: string[];
  addRecent: (emoji: string) => void;
}

/**
 * Los últimos emoji usados al escribir un mensaje, mismo criterio de
 * persistencia que `usePropheciesViewStore`: preferencia de quien escribe,
 * no algo que viaje con el mensaje.
 */
export const useRecentEmojiStore = create<RecentEmojiState>()(
  persist(
    (set) => ({
      recent: [],
      addRecent: (emoji) => {
        set((state) => ({
          recent: [emoji, ...state.recent.filter((one) => one !== emoji)].slice(0, MAX_RECENT),
        }));
      },
    }),
    {
      name: RECENT_EMOJI_STORAGE_KEY,
      storage: createJSONStorage(() => globalThis.localStorage),
    },
  ),
);
