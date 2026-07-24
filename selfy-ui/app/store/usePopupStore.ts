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

  queue: any[];
  enqueueScenarios: (scenarios: any[]) => void;

  clearPopup: () => void;
}

export const usePopupStore = create<PopupState>((set, get) => ({
  message: null,
  title: 'Popup',
  icon: 'notifications',
  choices: [],
  onChoice: null,
  queue: [],

  showPopup: (msg, title = 'Popup', icon = 'notifications') =>
    set({ message: msg, title, icon, choices: [], onChoice: null }),

  showScenario: (title, msg, choices, onChoice, icon = 'auto_awesome') =>
    set({ message: msg, title, icon, choices, onChoice }),

  enqueueScenarios: (scenarios) => {
    if (!scenarios || scenarios.length === 0) return;
    const currentMessage = get().message;
    if (!currentMessage) {
      const [first, ...rest] = scenarios;
      set({
        title: first.title || 'Event',
        message: first.text_base,
        choices: first.choices || [],
        icon: first.icon || 'auto_awesome',
        queue: rest,
        onChoice: null,
      });
    } else {
      set((state) => ({ queue: [...state.queue, ...scenarios] }));
    }
  },

  clearPopup: () => {
    const state = get();
    if (state.queue.length > 0) {
      const [first, ...rest] = state.queue;
      set({
        title: first.title || 'Event',
        message: first.text_base,
        choices: first.choices || [],
        icon: first.icon || 'auto_awesome',
        queue: rest,
        onChoice: null,
      });
    } else {
      set({ message: null, title: 'Popup', icon: 'notifications', choices: [], onChoice: null, queue: [] });
    }
  },
}));