/**
 * Notification Service for Shopping Lists
 * Handles both in-app and push notifications with smart throttling
 */

import { getSupabaseClient, isSupabaseConfigured } from '@shared/api/supabaseClient';

// Debug flag - set to false to disable verbose logging
const DEBUG_NOTIFICATIONS = true;

const debugLog = (...args: any[]) => {
  if (DEBUG_NOTIFICATIONS) {
    console.log('[NOTIF]', ...args);
  }
};

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
    debugLog('❌ Notifications not supported in this browser');
    return false;
  }

  // Check platform
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  
  debugLog('📱 Requesting notification permission:', {
    isMobile,
    isIOS,
    isHTTPS,
    currentPermission: Notification.permission
  });
  
  if (!isHTTPS && isMobile) {
    console.warn('[NOTIF] ⚠️ Mobile notifications require HTTPS. Current protocol:', window.location.protocol);
    alert('Mobile notifications require HTTPS. Please access the app via HTTPS or install as PWA.');
    return false;
  }
  
  if (isIOS) {
    console.info('[NOTIF] 📱 iOS detected - notifications work best when app is installed as PWA');
  }

  try {
    const permission = await Notification.requestPermission();
    debugLog('📱 Permission result:', permission);
    
    if (permission === 'granted') {
      // Test notification
      try {
        const testNotif = new Notification('Notifications Enabled', {
          body: 'You will receive updates about shopping list changes.',
          icon: '/icons/192x192.png',
          badge: '/icons/192x192.png',
          tag: 'test-notification'
        });
        setTimeout(() => testNotif.close(), 3000);
        debugLog('✅ Test notification sent successfully');
      } catch (testError) {
        console.error('[NOTIF] ❌ Failed to send test notification:', testError);
      }
    }
    
    return permission === 'granted';
  } catch (error) {
    console.error('[NOTIF] ❌ Error requesting permission:', error);
    return false;
  }
};

/**
 * Check if push notifications are supported and permitted
 */
export const isPushNotificationSupported = (): boolean => {
  if (!('Notification' in window)) {
    debugLog('❌ Notifications not supported in this browser');
    return false;
  }
  
  const permission = Notification.permission;
  debugLog('📱 Notification permission status:', permission);
  
  // Check if we're on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  debugLog('📱 Platform detection:', {
    isMobile,
    isIOS,
    isAndroid,
    userAgent: navigator.userAgent.substring(0, 50)
  });
  
  // Check HTTPS requirement
  const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  debugLog('🔒 HTTPS check:', { isHTTPS, protocol: window.location.protocol, hostname: window.location.hostname });
  
  if (!isHTTPS && isMobile) {
    debugLog('⚠️ Mobile notifications require HTTPS (not available on HTTP)');
  }
  
  if (isIOS) {
    debugLog('📱 iOS detected - notifications may require PWA installation');
  }
  
  return permission === 'granted';
};

/**
 * Send a push notification (if enabled and permitted)
 */
export const sendPushNotification = (title: string, body: string): void => {
  const settings = getNotificationSettings();
  
  debugLog('📤 sendPushNotification called:', { title, body, enabled: settings.enabled, pushEnabled: settings.pushEnabled });
  
  if (!settings.enabled || !settings.pushEnabled) {
    debugLog('⏭️ Push notifications disabled in settings');
    return;
  }

  if (!isPushNotificationSupported()) {
    debugLog('⏭️ Push notifications not supported or permission not granted');
    return;
  }

  try {
    const notif = new Notification(title, {
      body,
      icon: '/icons/512x512.png',
      badge: '/icons/192x192.png',
      tag: 'shopping-list-update',
    });
    
    debugLog('✅ Push notification sent successfully');
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      notif.close();
    }, 5000);
  } catch (error) {
    console.error('[NOTIF] ❌ Failed to send push notification:', error);
    debugLog('❌ Error details:', error);
  }
};

/**
 * Check if notification should be sent (throttle check)
 */
export const shouldSendNotification = async (
  listId: string,
  eventType: 'items_added' | 'items_purchased'
): Promise<boolean> => {
  debugLog('Checking throttle for:', eventType, 'listId:', listId);
  
  if (!isSupabaseConfigured) {
    debugLog('❌ Supabase not configured - cannot check throttle');
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
      console.error('[NOTIF] ❌ Failed to check notification throttle:', error);
      return false;
    }

    debugLog(data ? '✅ Should send (no recent notification)' : '⏱️ Throttled (sent within 1 hour)');
    return data === true;
  } catch (error) {
    console.error('[NOTIF] ❌ Error checking notification status:', error);
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
  debugLog('🔔 notifyItemsAdded called:', { userName, count, listName });
  
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.types.itemsAdded) {
    debugLog('⏭️ Notifications disabled in settings');
    return;
  }

  // Check 1-hour throttle
  const shouldSend = await shouldSendNotification(listId, 'items_added');
  if (!shouldSend) {
    debugLog('⏱️ Skipping - already notified within 1 hour');
    return; // Already sent notification in past hour
  }

  const message = `${userName} added ${count} item${count > 1 ? 's' : ''} to ${listName}`;
  
  // Send live notification to all users
  await sendLiveNotification(listId, message, 'items_added', userName);
  
  // Record in history for throttling
  await recordNotificationSent(listId, 'items_added', count, userName);
  
  debugLog('✅ Items added notification complete');
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
  debugLog('🔔 notifyItemsPurchased called:', { userName, count, customMessage: !!customMessage });
  
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.types.itemsPurchased) {
    debugLog('⏭️ Notifications disabled in settings');
    return;
  }

  // Use custom message or default
  const message = customMessage || `${userName} checked off ${count} item${count > 1 ? 's' : ''} from ${listName}`;
  
  debugLog('📨 Sending:', message);
  
  // Send live notification to all users
  await sendLiveNotification(listId, message, 'items_purchased', userName);
  
  // Record in history
  await recordNotificationSent(listId, 'items_purchased', count, userName);
  
  debugLog('✅ Items purchased notification complete');
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
  debugLog('📤 Sending live notification:', {
    type: notificationType,
    message: message.substring(0, 50) + '...',
    triggeredBy,
    listId: listId.substring(0, 8) + '...'
  });
  
  if (!isSupabaseConfigured) {
    console.warn('[NOTIF] ⚠️ Supabase not configured - notification not sent');
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
      console.error('[NOTIF] ❌ Failed to send live notification:', error);
      throw error;
    }

    debugLog('✅ Live notification inserted into database');

    // Also send local browser notification if enabled
    sendPushNotification('Shopping List Update', message);
  } catch (error) {
    console.error('[NOTIF] ❌ Error sending live notification:', error);
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
