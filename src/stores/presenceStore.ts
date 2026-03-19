import { create } from 'zustand';

interface UserPresence {
  userId: string;
  status: 'online' | 'offline';
  lastSeen?: Date;
}

interface PresenceState {
  presences: Record<string, UserPresence>;
  
  setPresence: (userId: string, presence: UserPresence) => void;
  setPresences: (presences: UserPresence[]) => void;
  getPresence: (userId: string) => UserPresence | undefined;
  isOnline: (userId: string) => boolean;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  presences: {},

  setPresence: (userId, presence) => set((state) => ({
    presences: { ...state.presences, [userId]: presence }
  })),

  setPresences: (presences) => set((state) => {
    const newPresences = { ...state.presences };
    presences.forEach((p) => {
      newPresences[p.userId] = p;
    });
    return { presences: newPresences };
  }),

  getPresence: (userId) => get().presences[userId],

  isOnline: (userId) => get().presences[userId]?.status === 'online'
}));
