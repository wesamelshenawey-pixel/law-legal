/**
 * Offline-First Caching & Background Synchronization Strategy for Legal Office System
 * Handles seamless offline operations, persistent mutation queues, and automatic cloud replay upon reconnection.
 */

import { 
  dbSaveUser, 
  dbSaveClient, 
  dbSaveOpponent, 
  dbSaveCase, 
  dbSaveSession, 
  dbSaveLicense, 
  dbSaveActivationRequest, 
  dbSaveLead, 
  dbSaveEmailNotification 
} from "./firebaseSync";

export interface QueuedSyncItem {
  id: string;
  entity: "user" | "client" | "opponent" | "case" | "session" | "license" | "activation_request" | "lead" | "email_notification" | "note";
  action: "create" | "update" | "delete";
  data: any;
  timestamp: string;
  retryCount: number;
}

const OFFLINE_QUEUE_KEY = "law_offline_sync_queue";
const LAST_SYNC_KEY = "law_last_cloud_sync_timestamp";

/**
 * Register Service Worker for offline shell caching
 */
export function registerServiceWorker(): void {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA Service Worker] Registered successfully with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA Service Worker] Registration skipped / failed:", err);
        });
    });
  }
}

/**
 * Get all queued offline items
 */
export function getOfflineSyncQueue(): QueuedSyncItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Add a pending operation to the offline sync queue
 */
export function enqueueOfflineSync(
  entity: QueuedSyncItem["entity"],
  action: QueuedSyncItem["action"],
  data: any
): void {
  try {
    const queue = getOfflineSyncQueue();
    const newItem: QueuedSyncItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entity,
      action,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };
    
    // Check if an item for the same entity and record ID already exists in queue to deduplicate
    const existingIndex = queue.findIndex(item => item.entity === entity && item.data?.id === data?.id);
    if (existingIndex >= 0) {
      queue[existingIndex] = newItem;
    } else {
      queue.push(newItem);
    }

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    console.log(`[Offline Sync Queue] Queued ${entity} ${action} for offline replay. Queue length: ${queue.length}`);
  } catch (err) {
    console.error("[Offline Sync Queue] Failed to enqueue item:", err);
  }
}

/**
 * Remove an item from the queue after successful sync
 */
export function dequeueOfflineSync(id: string): void {
  try {
    const queue = getOfflineSyncQueue().filter(item => item.id !== id);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("[Offline Sync Queue] Failed to dequeue item:", err);
  }
}

/**
 * Clear the entire sync queue
 */
export function clearOfflineSyncQueue(): void {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

/**
 * Process all items in the offline queue and sync them to Firestore
 */
export async function flushOfflineSyncQueue(
  onProgress?: (syncedCount: number, totalCount: number) => void
): Promise<{ success: boolean; syncedCount: number; remainingCount: number }> {
  const queue = getOfflineSyncQueue();
  if (queue.length === 0) {
    return { success: true, syncedCount: 0, remainingCount: 0 };
  }

  console.log(`[Offline Sync Queue] Replaying ${queue.length} pending updates to Cloud Firestore...`);
  let syncedCount = 0;
  const failedItems: QueuedSyncItem[] = [];

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    try {
      switch (item.entity) {
        case "case":
          await dbSaveCase(item.data);
          break;
        case "client":
          await dbSaveClient(item.data);
          break;
        case "session":
          await dbSaveSession(item.data);
          break;
        case "user":
          await dbSaveUser(item.data);
          break;
        case "opponent":
          await dbSaveOpponent(item.data);
          break;
        case "license":
          await dbSaveLicense(item.data);
          break;
        case "activation_request":
          await dbSaveActivationRequest(item.data);
          break;
        case "lead":
          await dbSaveLead(item.data);
          break;
        case "email_notification":
          await dbSaveEmailNotification(item.data);
          break;
        default:
          break;
      }
      syncedCount++;
      if (onProgress) onProgress(syncedCount, queue.length);
    } catch (err) {
      console.warn(`[Offline Sync Queue] Failed to sync item ${item.id}:`, err);
      item.retryCount = (item.retryCount || 0) + 1;
      if (item.retryCount < 5) {
        failedItems.push(item);
      }
    }
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedItems));
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

  console.log(`[Offline Sync Queue] Sync cycle complete: ${syncedCount} items synced, ${failedItems.length} remaining.`);
  return {
    success: failedItems.length === 0,
    syncedCount,
    remainingCount: failedItems.length
  };
}

/**
 * Hook or helper to monitor online status and trigger auto-sync
 */
export function setupNetworkSyncListener(onStatusChange?: (isOnline: boolean) => void, onSyncComplete?: (count: number) => void) {
  if (typeof window === "undefined") return () => {};

  const handleOnline = async () => {
    console.log("[Network State] Connection restored. Starting automatic offline sync...");
    if (onStatusChange) onStatusChange(true);
    const result = await flushOfflineSyncQueue();
    if (result.syncedCount > 0 && onSyncComplete) {
      onSyncComplete(result.syncedCount);
    }
  };

  const handleOffline = () => {
    console.warn("[Network State] Application is currently offline. Operating in local-first caching mode.");
    if (onStatusChange) onStatusChange(false);
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Initial check on load
  if (navigator.onLine && getOfflineSyncQueue().length > 0) {
    flushOfflineSyncQueue().then(res => {
      if (res.syncedCount > 0 && onSyncComplete) {
        onSyncComplete(res.syncedCount);
      }
    });
  }

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}
