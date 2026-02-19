const QUEUE_STORAGE_KEY = "beatflow_queue";

let playQueue = [];

/* Load queue from storage */
function loadQueue() {
  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      playQueue = Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.warn("Failed to load queue", e);
    playQueue = [];
  }
}

/* Save queue to storage */
function saveQueue() {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(playQueue));
  } catch (e) {
    console.warn("Failed to save queue", e);
  }
}

/* Initialize on load */
loadQueue();

/* Add song to end of queue */
export function addToQueue(index) {
  playQueue.push(index);
  saveQueue();
}

/* Play next (highest priority) */
export function playNext(index) {
  playQueue.unshift(index);
  saveQueue();
}

/* Get next song index (or null) */
export function getNextFromQueue() {
  if (!playQueue.length) return null;
  const next = playQueue.shift();
  saveQueue();
  return next;
}

/* Clear queue */
export function clearQueue() {
  playQueue = [];
  saveQueue();
}

/* Get queue (for UI) */
export function getQueue() {
  return [...playQueue];
}

/* Remove from queue by index */
export function removeFromQueue(queueIndex) {
  if (queueIndex >= 0 && queueIndex < playQueue.length) {
    playQueue.splice(queueIndex, 1);
    saveQueue();
  }
}
