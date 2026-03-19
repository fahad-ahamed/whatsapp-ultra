import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  showNewChatModal: boolean;
  showNewGroupModal: boolean;
  showSettingsModal: boolean;
  showProfileModal: boolean;
  showStatusModal: boolean;
  showMediaViewer: boolean;
  mediaViewerUrl: string | null;
  searchQuery: string;
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setShowNewChatModal: (show: boolean) => void;
  setShowNewGroupModal: (show: boolean) => void;
  setShowSettingsModal: (show: boolean) => void;
  setShowProfileModal: (show: boolean) => void;
  setShowStatusModal: (show: boolean) => void;
  setShowMediaViewer: (show: boolean, url?: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  showNewChatModal: false,
  showNewGroupModal: false,
  showSettingsModal: false,
  showProfileModal: false,
  showStatusModal: false,
  showMediaViewer: false,
  mediaViewerUrl: null,
  searchQuery: '',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setShowNewChatModal: (showNewChatModal) => set({ showNewChatModal }),
  setShowNewGroupModal: (showNewGroupModal) => set({ showNewGroupModal }),
  setShowSettingsModal: (showSettingsModal) => set({ showSettingsModal }),
  setShowProfileModal: (showProfileModal) => set({ showProfileModal }),
  setShowStatusModal: (showStatusModal) => set({ showStatusModal }),
  setShowMediaViewer: (showMediaViewer, url) => set({ 
    showMediaViewer, 
    mediaViewerUrl: url || null 
  }),
  setSearchQuery: (searchQuery) => set({ searchQuery })
}));
