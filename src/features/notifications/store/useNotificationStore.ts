import { create } from 'zustand';
import { 
  getNotificationSettings, 
  saveNotificationSettings 
} from '../api';

interface NotificationStore {
  // State
  isEnabled: boolean;
  isPushEnabled: boolean;
  types: {
    itemsAdded: boolean;
    itemsPurchased: boolean;
    shoppingComplete: boolean;
  };

  // Actions
  loadSettings: () => void;
  setEnabled: (enabled: boolean) => void;
  setPushEnabled: (enabled: boolean) => void;
  updateTypes: (types: Partial<NotificationStore['types']>) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  // Initial state
  isEnabled: false,
  isPushEnabled: false,
  types: {
    itemsAdded: true,
    itemsPurchased: true,
    shoppingComplete: true,
  },

  // Load notification settings
  loadSettings: () => {
    const settings = getNotificationSettings();
    set({ 
      isEnabled: settings.enabled,
      isPushEnabled: settings.pushEnabled,
      types: settings.types
    });
  },

  // Toggle notifications on/off
  setEnabled: (enabled) => {
    const currentSettings = getNotificationSettings();
    saveNotificationSettings({ ...currentSettings, enabled });
    set({ isEnabled: enabled });
  },

  // Toggle push notifications on/off
  setPushEnabled: (enabled) => {
    const currentSettings = getNotificationSettings();
    saveNotificationSettings({ ...currentSettings, pushEnabled: enabled });
    set({ isPushEnabled: enabled });
  },

  // Update notification types
  updateTypes: (newTypes) => {
    set(state => {
      const updatedTypes = { ...state.types, ...newTypes };
      const currentSettings = getNotificationSettings();
      saveNotificationSettings({ ...currentSettings, types: updatedTypes });
      return { types: updatedTypes };
    });
  },
}));
