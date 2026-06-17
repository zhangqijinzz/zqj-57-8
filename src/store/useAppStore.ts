import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { NightShiftStage, RecentGame } from '@/types';

const FAVORITES_KEY = 'game_favorites';
const RECENT_KEY = 'game_recent';
const MAX_RECENT = 10;

interface AppState {
  currentStage: NightShiftStage;
  stageLabels: Record<NightShiftStage, string>;
  workStartTime: string;
  workEndTime: string;
  favoriteGameIds: string[];
  recentGames: RecentGame[];
  setCurrentStage: (stage: NightShiftStage) => void;
  setWorkTime: (start: string, end: string) => void;
  toggleFavorite: (gameId: string) => void;
  isFavorite: (gameId: string) => boolean;
  addRecentGame: (gameId: string) => void;
  initGameData: () => void;
}

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = Taro.getStorageSync(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T) => {
  try {
    Taro.setStorageSync(key, JSON.stringify(value));
  } catch (e) {
    console.error('[Store] 存储失败:', e);
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  currentStage: 'mid',
  stageLabels: {
    early: '夜班初期',
    mid: '夜班中期',
    late: '夜班后期',
    pre_sleep: '睡前',
  },
  workStartTime: '22:00',
  workEndTime: '08:00',
  favoriteGameIds: [],
  recentGames: [],

  setCurrentStage: (stage) => set({ currentStage: stage }),
  setWorkTime: (start, end) => set({ workStartTime: start, workEndTime: end }),

  initGameData: () => {
    const favorites = loadFromStorage<string[]>(FAVORITES_KEY, []);
    const recent = loadFromStorage<RecentGame[]>(RECENT_KEY, []);
    set({ favoriteGameIds: favorites, recentGames: recent });
  },

  toggleFavorite: (gameId: string) => {
    set((state) => {
      const isFav = state.favoriteGameIds.includes(gameId);
      const newFavorites = isFav
        ? state.favoriteGameIds.filter((id) => id !== gameId)
        : [...state.favoriteGameIds, gameId];
      saveToStorage(FAVORITES_KEY, newFavorites);
      return { favoriteGameIds: newFavorites };
    });
  },

  isFavorite: (gameId: string) => {
    return get().favoriteGameIds.includes(gameId);
  },

  addRecentGame: (gameId: string) => {
    set((state) => {
      const filtered = state.recentGames.filter((g) => g.gameId !== gameId);
      const newRecent: RecentGame = {
        gameId,
        lastPlayedAt: Date.now(),
      };
      const newRecentGames = [newRecent, ...filtered].slice(0, MAX_RECENT);
      saveToStorage(RECENT_KEY, newRecentGames);
      return { recentGames: newRecentGames };
    });
  },
}));
