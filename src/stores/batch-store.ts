import { create } from "zustand";

interface BatchEntry {
  id: string;
  productName: string;
  direction: "in" | "out";
  quantity: number;
  balanceAfter: number;
  timestamp: string;
}

interface BatchStore {
  isActive: boolean;
  entries: BatchEntry[];
  categoryFilter: string | null;
  colorFilter: string | null;
  startBatch: () => void;
  endBatch: () => void;
  addEntry: (entry: BatchEntry) => void;
  setCategoryFilter: (categoryId: string | null) => void;
  setColorFilter: (colorId: string | null) => void;
  clearFilters: () => void;
}

export const useBatchStore = create<BatchStore>((set) => ({
  isActive: false,
  entries: [],
  categoryFilter: null,
  colorFilter: null,
  startBatch: () => set({ isActive: true, entries: [] }),
  endBatch: () =>
    set({
      isActive: false,
      entries: [],
      categoryFilter: null,
      colorFilter: null,
    }),
  addEntry: (entry) =>
    set((state) => ({ entries: [...state.entries, entry] })),
  setCategoryFilter: (categoryId) => set({ categoryFilter: categoryId }),
  setColorFilter: (colorId) => set({ colorFilter: colorId }),
  clearFilters: () => set({ categoryFilter: null, colorFilter: null }),
}));
