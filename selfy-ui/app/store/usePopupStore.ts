import { create } from 'zustand';

interface PopupState {
  message: string | null;
  title: string;
  icon: string;
  showPopup: (msg: string, title?: string, icon?: string) => void;
  clearPopup: () => void;
}

export const usePopupStore = create<PopupState>((set) => ({
  message: null,
  title: "Popup",
  icon: "notifications",
  showPopup: (msg, title = "Popup", icon = "notifications") => 
    set({ message: msg, title, icon }),
  clearPopup: () => 
    set({ message: null, title: "Popup", icon: "notifications" }),
}));