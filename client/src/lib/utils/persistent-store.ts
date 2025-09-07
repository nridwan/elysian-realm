import type { Subscriber, Unsubscriber } from "svelte/store";

// Encryption utilities using Web Crypto API
class EncryptionManager {
  private static instance: EncryptionManager;
  private key: CryptoKey | null = null;
  private keyName = "persistent_store_key";
  private encryptionDisabled = false; // Temporarily disable encryption

  private constructor() {}

  static getInstance(): EncryptionManager {
    if (!EncryptionManager.instance) {
      EncryptionManager.instance = new EncryptionManager();
    }
    return EncryptionManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.key) return;

    if (this.encryptionDisabled) {
      this.key = null;
      return;
    }

    try {
      // Try to get existing key from IndexedDB
      this.key = await this.getKeyFromIndexedDB();
      if (!this.key) {
        // Generate new key if none exists
        this.key = await this.generateKey();
        // Save key to IndexedDB
        await this.saveKeyToIndexedDB(this.key);
      }
    } catch (error) {
      console.warn("Failed to initialize encryption, falling back to unencrypted storage:", error);
      this.key = null;
    }
  }

  private async getKeyFromIndexedDB(): Promise<CryptoKey | null> {
    if (typeof indexedDB === "undefined" || this.encryptionDisabled) return null;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open("PersistentStore", 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("keys")) {
          db.createObjectStore("keys");
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("keys", "readonly");
        const store = transaction.objectStore("keys");
        
        const keyRequest = store.get(this.keyName);

        keyRequest.onsuccess = () => {
          const exportedKey = keyRequest.result;
          if (exportedKey) {
            crypto.subtle.importKey(
              "raw",
              exportedKey,
              "AES-GCM",
              true,
              ["encrypt", "decrypt"]
            ).then(resolve).catch(reject);
          } else {
            resolve(null);
          }
        };

        keyRequest.onerror = () => reject(keyRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async saveKeyToIndexedDB(key: CryptoKey): Promise<void> {
    if (typeof indexedDB === "undefined" || this.encryptionDisabled) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open("PersistentStore", 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("keys")) {
          db.createObjectStore("keys");
        }
      };

      request.onsuccess = async () => {
        const exportedKey = await crypto.subtle.exportKey("raw", key);

        const db = request.result;
        const transaction = db.transaction("keys", "readwrite");
        const store = transaction.objectStore("keys");
        
        // Export and save the key within the same transaction
        const saveRequest = store.put(exportedKey, this.keyName);
        saveRequest.onsuccess = () => resolve();
        saveRequest.onerror = () => reject(saveRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async generateKey(): Promise<CryptoKey> {
    if (this.encryptionDisabled) {
      // Return a resolved promise with null when encryption is disabled
      return Promise.reject(new Error("Encryption is disabled"));
    }
    
    return crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  async encrypt(data: string): Promise<string> {
    if (!this.key || this.encryptionDisabled) return data;

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate a random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        this.key,
        dataBuffer
      );
      
      // Combine IV and encrypted data
      const combinedBuffer = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combinedBuffer.set(iv, 0);
      combinedBuffer.set(new Uint8Array(encryptedBuffer), iv.length);
      
      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combinedBuffer));
    } catch (error) {
      console.warn("Encryption failed, storing unencrypted:", error);
      return data;
    }
  }

  async decrypt(data: string): Promise<string> {
    if (!this.key || !data || this.encryptionDisabled) return data;

    try {
      // Convert from base64
      const binaryString = atob(data);
      const combinedBuffer = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        combinedBuffer[i] = binaryString.charCodeAt(i);
      }
      
      // Extract IV and encrypted data
      const iv = combinedBuffer.slice(0, 12);
      const encryptedBuffer = combinedBuffer.slice(12);
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        this.key,
        encryptedBuffer
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.warn("Decryption failed, returning stored data:", error);
      return data;
    }
  }
}

/**
 * A Svelte 5 compatible persistent store that syncs with localStorage
 * and across tabs/windows with encryption support
 */
export class PersistentStore<T> {
  #key: string;
  #value: T;
  #subscribers: Set<Subscriber<T>> = new Set();
  #encryptionManager: EncryptionManager;
  #initialized: Promise<void>;

  constructor(key: string, initialValue: T) {
    this.#key = key;
    this.#encryptionManager = EncryptionManager.getInstance();
    this.#initialized = this.#encryptionManager.initialize();
    this.#value = initialValue; // Start with initial value
    this.#setupStorageListener();
    
    // Load actual value asynchronously
    this.#load(initialValue);
  }

  async #load(initialValue: T): Promise<void> {
    if (typeof localStorage === "undefined") {
      this.#value = initialValue;
      this.#notifySubscribers();
      return;
    }

    try {
      await this.#initialized;
      const stored = localStorage.getItem(this.#key);
      if (stored) {
        const decrypted = await this.#encryptionManager.decrypt(stored);
        this.#value = JSON.parse(decrypted);
      } else {
        this.#value = initialValue;
      }
      this.#notifySubscribers();
    } catch (error) {
      console.warn(`Failed to load persistent store ${this.#key}:`, error);
      this.#value = initialValue;
      this.#notifySubscribers();
    }
  }

  #setupStorageListener() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === this.#key && e.newValue !== null) {
        this.#encryptionManager.decrypt(e.newValue).then(decrypted => {
          try {
            const newValue = JSON.parse(decrypted);
            this.#value = newValue;
            this.#notifySubscribers();
          } catch (parseError) {
            console.warn(`Failed to parse stored value for ${this.#key}:`, parseError);
          }
        }).catch(decryptError => {
          console.warn(`Failed to decrypt stored value for ${this.#key}:`, decryptError);
        });
      } else if (e.key === this.#key && e.newValue === null) {
        // Item was removed from storage
        this.#load(undefined as any);
      }
    };

    window.addEventListener("storage", handleStorage);
  }

  #notifySubscribers() {
    for (const subscriber of this.#subscribers) {
      subscriber(this.#value);
    }
  }

  async #save() {
    if (typeof localStorage !== "undefined") {
      await this.#initialized;
      if (this.#value === null || (typeof this.#value === 'object' && Object.keys(this.#value).length === 0)) {
        localStorage.removeItem(this.#key);
      } else {
        try {
          const dataToStore = JSON.stringify(this.#value);
          const encrypted = await this.#encryptionManager.encrypt(dataToStore);
          localStorage.setItem(this.#key, encrypted);
        } catch (error) {
          console.warn(`Failed to save persistent store ${this.#key}:`, error);
        }
      }
    }
  }

  subscribe(subscriber: Subscriber<T>): Unsubscriber {
    this.#subscribers.add(subscriber);
    subscriber(this.#value);
    
    return () => {
      this.#subscribers.delete(subscriber);
    };
  }

  async set(value: T) {
    await this.#initialized;
    this.#value = value;
    await this.#save();
    this.#notifySubscribers();
  }

  async update(updater: (value: T) => T) {
    await this.#initialized;
    this.#value = updater(this.#value);
    await this.#save();
    this.#notifySubscribers();
  }

  get value() {
    return this.#value;
  }
}