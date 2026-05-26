import EncryptedStorage from 'react-native-encrypted-storage';

const STORAGE_KEY = 'culpeos.viewport';
// Coalesce rapid region changes (pinch-zoom, fling pans) before writing.
const SAVE_DEBOUNCE_MS = 500;

export type Viewport = {
  center: [number, number];
  zoom: number;
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingViewport: Viewport | null = null;

function flushSave(): void {
  if (!pendingViewport) return;
  const toWrite = pendingViewport;
  pendingViewport = null;
  saveTimer = null;
  EncryptedStorage.setItem(STORAGE_KEY, JSON.stringify(toWrite)).catch(err => {
    console.warn('[viewport] failed to persist', err);
  });
}

export const viewportStore = {
  async load(): Promise<Viewport | null> {
    try {
      const raw = await EncryptedStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<Viewport>;
      if (
        Array.isArray(parsed.center) &&
        parsed.center.length === 2 &&
        typeof parsed.center[0] === 'number' &&
        typeof parsed.center[1] === 'number' &&
        typeof parsed.zoom === 'number'
      ) {
        return {
          center: [parsed.center[0], parsed.center[1]],
          zoom: parsed.zoom,
        };
      }
      return null;
    } catch (err) {
      console.warn('[viewport] failed to hydrate', err);
      return null;
    }
  },
  save(viewport: Viewport): void {
    pendingViewport = viewport;
    if (saveTimer) return;
    saveTimer = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
  },
};
