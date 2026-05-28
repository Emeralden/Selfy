import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CharacterState {
  charId: string | null;
  justBorn: boolean;
  setCharId: (id: string) => void;
  clearJustBorn: () => void;
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set) => ({
      charId: null,
      justBorn: false,
      setCharId: (id: string) => set({ charId: id, justBorn: true }),
      clearJustBorn: () => set({ justBorn: false }),
    }),
    {
      name: 'selfy-character',
    }
  )
);
