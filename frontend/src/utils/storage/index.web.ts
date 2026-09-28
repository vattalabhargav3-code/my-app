export const storage = {
  async getItem(key: string, fallback: any = null): Promise<any> {
    if (typeof window === "undefined" || !window.localStorage) {
      return fallback;
    }
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;

    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  },

  async setItem(key: string, value: any): Promise<boolean> {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    try {
      const payload = typeof value === "string" ? value : JSON.stringify(value);
      window.localStorage.setItem(key, payload);
      return true;
    } catch (e) {
      console.warn(`[storage] setItem(${key}) failed`, e);
      return false;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[storage] removeItem(${key}) failed`, e);
      return false;
    }
  },

  async secureGet(key: string, fallback: any = null): Promise<any> {
    return this.getItem(key, fallback);
  },

  async secureSet(key: string, value: any): Promise<boolean> {
    return this.setItem(key, value);
  },

  async secureRemove(key: string): Promise<boolean> {
    return this.removeItem(key);
  },
};
