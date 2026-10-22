import { create } from "zustand";

export type QuickAction = "ticket" | "housecall" | "customer";

interface UiState {
  quickAction: QuickAction | null;
  openQuickAction: (a: QuickAction | null) => void;
}

/** Lets any page open the global create dialogs hosted by the app shell. */
export const useUi = create<UiState>((set) => ({
  quickAction: null,
  openQuickAction: (quickAction) => set({ quickAction }),
}));
