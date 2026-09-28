import { StorageBase, StorageItemKey, StorageItemValue } from "./base";

class WebStorage extends StorageBase {
  async getItem<Fallback extends StorageItemValue>(
    key: StorageItemKey,
    fallback: Fallback,
  ): Promise<any> {
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
  }

  async setItem<Value extends StorageItemValue>(
    key: StorageItemKey,
    value: Value,
  ): Promise<boolean> {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    try {
      const payload = typeof value === "string" ? value : JSON.stringify(value);
      window.localStorage.setItem(key, payload);
      return true;
    } catch (e) {
      this.warn("setItem", key, e);
      return false;
    }
  }

  async removeItem(key: StorageItemKey): Promise<boolean> {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (e) {
      this.warn("removeItem", key, e);
      return false;
    }
  }

  async secureGet<Fallback extends StorageItemValue>(
    key: StorageItemKey,
    fallback: Fallback,
  ): Promise<any> {
    return this.getItem(key, fallback);
  }

  async secureSet<Value extends StorageItemValue>(
    key: StorageItemKey,
    value: Value,
  ): Promise<boolean> {
    return this.setItem(key, value);
  }

  async secureRemove(key: StorageItemKey): Promise<boolean> {
    return this.removeItem(key);
  }
}

export const storage = new WebStorage();
