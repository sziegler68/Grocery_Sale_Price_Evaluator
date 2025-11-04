/**
 * Notification Service for Shopping Lists
 * Handles both in-app and push notifications with smart throttling
 */

import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

// Storage keys
const NOTIF_ENABLED_KEY = 'shopping-list-notifications-enabled';
const PUSH_ENABLED_KEY = 'shopping-list-push-enabled';
const NOTIF_TYPES_KEY = 'shopping-list-notification-types';

export interface NotificationSettings {
  enabled: boolean;
  pushEnabled: boolean;
  types: {
    itemsAdded: boolean;
    itemsPurchased: boolean;
    shoppingComplete: boolean;
  };
}

export const getNotificationSettings = (): NotificationSettings => {
  try {
    return {
      enabled: localStorage.getItem(NOTIF_ENABLED_KEY) !== 'false',
      pushEnabled: localStorage.getItem(PUSH_ENABLED_KEY) === 'true',
      types: {
        itemsAdded: localStorage.getItem(NOTIF_TYPES_KEY + '-added') !== 'false',
        itemsPurchased: localStorage.getItem(NOTIF_TYPES_KEY + '-purchased') !== 'false',
        shoppingComplete: localStorage.getItem(NOTIF_TYPES_KEY + '-complete') !== 'false',
      },
    };
  } catch {
    return {
      enabled: true,
      pushEnabled: false,
      types: { itemsAdded: true, itemsPurchased: true, shoppingComplete: true },
    };
  }
};

export const saveNotificationSettings = (settings: NotificationSettings): void => {
  try {
    localStorage.setItem(NOTIF_ENABLED_KEY, String(settings.enabled));
    localStorage.setItem(PUSH_ENABLED_KEY, String(settings.pushEnabled));
    localStorage.setItem(NOTIF_TYPES_KEY + '-added', String(settings.types.itemsAdded));
    localStorage.setItem(NOTIF_TYPES_KEY + '-purchased', String(settings.types.itemsPurchased));
    localStorage.setItem(NOTIF_TYPES_KEY + '-complete', String(settings.types.shoppingComplete));
  } catch (error) {
    console.error('Failed to save notification settings:', error);
  }
};

/**
 * Request push notification permission
 */
export const requestPushPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

/**
 * Check if push notifications are supported and permitted
 */
export const isPushNotificationSupported = (): boolean => {
  return 'Notification' in window && Notification.permission === 'granted';
};

/**
 * Send a push notification (if enabled and permitted)
 */
export const sendPushNotification = (title: string, body: string): void => {
  const settings = getNotificationSettings();
  
  if (!settings.enabled || !settings.pushEnabled) {
    return;
  }

  if (!isPushNotificationSupported()) {
    return;
  }

  new Notification(title, {
    body,
    icon: '/icons/512x512.png',
    badge: '/icons/192x192.png',
    tag: 'shopping-list-update',
  });
};

/**
 * Check if notification should be sent (throttle check)
 */
export const shouldSendNotification = async (
  listId: string,
  eventType: 'items_added' | 'items_purchased'
): Promise<boolean> => {
  if (!isSupabaseConfigured) {
    return false;
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc('should_send_notification', {
      p_list_id: listId,
      p_event_type: eventType,
      p_throttle_minutes: 60,
    });

    if (error) {
      console.error('Failed to check notification throttle:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error checking notification status:', error);
    return false;
  }
};

/**
 * Record that a notification was sent
 */
export const recordNotificationSent = async (
  listId: string,
  eventType: string,
  itemCount: number,
  triggeredBy: string
): Promise<void> => {
  if (!isSupabaseConfigured) {
    return;
  }

  try {
    const client = getSupabaseClient();
    await client.rpc('record_notification', {
      p_list_id: listId,
      p_event_type: eventType,
      p_item_count: itemCount,
      p_triggered_by: triggeredBy,
    });
  } catch (error) {
    console.error('Failed to record notification:', error);
  }
};

/**
 * Send notification for items added (throttled to 1 hour)
 */
export const notifyItemsAdded = async (
  listId: string,
  listName: string,
  count: number,
  userName: string
): Promise<void> => {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.types.itemsAdded) {
    return;
  }

  // Check 1-hour throttle
  const shouldSend = await shouldSendNotification(listId, 'items_added');
  if (!shouldSend) {
    return; // Already sent notification in past hour
  }

  const message = `${userName} added ${count} item${count > 1 ? 's' : ''} to ${listName}`;
  
  // Send live notification to all users
  await sendLiveNotification(listId, message, 'items_added', userName);
  
  // Record in history for throttling
  await recordNotificationSent(listId, 'items_added', count, userName);
};

/**
 * Send notification for items purchased
 */
export const notifyItemsPurchased = async (
  listId: string,
  listName: string,
  count: number,
  userName: string,
  customMessage?: string
): Promise<void> => {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.types.itemsPurchased) {
    return;
  }

  // Use custom message or default
  const message = customMessage || `${userName} checked off ${count} item${count > 1 ? 's' : ''} from ${listName}`;
  
  // Send live notification to all users
  await sendLiveNotification(listId, message, 'items_purchased', userName);
  
  // Record in history
  await recordNotificationSent(listId, 'items_purchased', count, userName);
};

/**
 * Send a live notification to all users viewing the list
 */
export const sendLiveNotification = async (
  listId: string,
  message: string,
  notificationType: string,
  triggeredBy: string
): Promise<void> => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - notification not sent');
    return;
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('live_notifications')
      .insert({
        list_id: listId,
        message: message,
        notification_type: notificationType,
        triggered_by: triggeredBy
      });

    if (error) {
      console.error('Failed to send live notification:', error);
      throw error;
    }

    // Also send local browser notification if enabled
    sendPushNotification('Shopping List Update', message);
  } catch (error) {
    console.error('Error sending live notification:', error);
    throw error;
  }
};

/**
 * Send notification for shopping complete
 */
export const notifyShoppingComplete = async (
  listId: string,
  listName: string,
  userName: string,
  allItemsPurchased: boolean
): Promise<void> => {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.types.shoppingComplete) {
    return;
  }

  const message = allItemsPurchased
    ? `${userName} finished shopping! ✓ All items purchased from ${listName}`
    : `${userName} finished shopping at ${listName}`;
    
  // Send live notification to all users
  await sendLiveNotification(listId, message, 'shopping_complete', userName);
  
  // Record in history for throttling
  await recordNotificationSent(listId, 'shopping_complete', 0, userName);
};

/**
 * Send notification for missing items
 */
export const notifyMissingItems = async (
  listId: string,
  listName: string,
  userName: string,
  missingCount: number
): Promise<void> => {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.types.shoppingComplete) {
    return;
  }

  const message = `${userName} finished shopping. ${missingCount} item${missingCount > 1 ? 's' : ''} still needed in ${listName}`;
  
  // Send live notification to all users
  await sendLiveNotification(listId, message, 'missing_items', userName);
  
  // Record in history
  await recordNotificationSent(listId, 'missing_items', missingCount, userName);
};
