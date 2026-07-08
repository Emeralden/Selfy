import { create } from 'zustand';

export interface ScenarioChoice {
  label: string;
  slug: string;
  icon?: string;
  variant?: 'primary' | 'danger' | 'muted';
}

interface PopupState {
  message: string | null;
  title: string;
  icon: string;
  choices: ScenarioChoice[];
  onChoice: ((slug: string) => void) | null;

  // Simple text popup (backward compat)
  showPopup: (msg: string, title?: string, icon?: string) => void;

  // Scenario card with choices
  showScenario: (
    title: string,
    msg: string,
    choices: ScenarioChoice[],
    onChoice: (slug: string) => void,
    icon?: string
  ) => void;

  clearPopup: () => void;
}

export const usePopupStore = create<PopupState>((set) => ({
  message: null,
  title: 'Popup',
  icon: 'notifications',
  choices: [],
  onChoice: null,

  showPopup: (msg, title = 'Popup', icon = 'notifications') =>
    set({ message: msg, title, icon, choices: [], onChoice: null }),

  showScenario: (title, msg, choices, onChoice, icon = 'auto_awesome') =>
    set({ message: msg, title, icon, choices, onChoice }),

  clearPopup: () =>
    set({ message: null, title: 'Popup', icon: 'notifications', choices: [], onChoice: null }),
}));