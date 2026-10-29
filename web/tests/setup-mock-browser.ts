// Mock minimal browser globals for Node.js test environment
export class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

export function setupMockBrowserEnvironment() {
  const localStorage = new MockStorage();
  const sessionStorage = new MockStorage();
  const eventListeners = new Map<string, Set<(e: Event) => void>>();

  const mockDocument = {
    documentElement: {
      attributes: new Map<string, string>(),
      style: { colorScheme: "" },
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      getAttribute(name: string) {
        return this.attributes.get(name) ?? null;
      },
    },
  };

  const mockWindow = {
    crypto: globalThis.crypto,
    localStorage,
    sessionStorage,
    document: mockDocument,
    matchMedia(query: string) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      };
    },
    addEventListener(event: string, handler: (e: Event) => void) {
      if (!eventListeners.has(event)) eventListeners.set(event, new Set());
      eventListeners.get(event)!.add(handler);
    },
    removeEventListener(event: string, handler: (e: Event) => void) {
      eventListeners.get(event)?.delete(handler);
    },
    dispatchEvent(event: Event) {
      const type = event.type;
      eventListeners.get(type)?.forEach((h) => h(event));
      return true;
    },
  };

  const g = globalThis as unknown as {
    window: typeof mockWindow;
    document: typeof mockDocument;
    localStorage: Storage;
    sessionStorage: Storage;
  };
  g.window = mockWindow;
  g.document = mockDocument;
  g.localStorage = localStorage;
  g.sessionStorage = sessionStorage;
  g.sessionStorage = sessionStorage;

  return {
    localStorage,
    sessionStorage,
    reset() {
      localStorage.clear();
      sessionStorage.clear();
      eventListeners.clear();
    },
  };
}
