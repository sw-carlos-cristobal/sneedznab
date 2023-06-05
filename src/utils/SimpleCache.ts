import { ICache } from '../interfaces/cache.js';
import { LRUCache } from 'lru-cache';
import { promisify } from 'util';

export class SimpleCache implements ICache {
  readonly name: string;
  private cache: LRUCache<string, any>;
  constructor(private max: number, private ttl: number) {
    console.log(max, ttl);
    this.name = 'SimpleCache';
    this.max = max ?? 500;
    this.ttl = ttl ?? 1000 * 60 * 60; // 1 hour
    this.cache = new LRUCache({ max: this.max, ttl: this.ttl });
  }

  public async set(key: string, value: any): Promise<void> {
    return new Promise<void>((resolve) => {
      this.cache.set(key, value);
      resolve();
    });
  }
  
  public async get(key: string): Promise<any> {
    return new Promise<any>((resolve) => {
      resolve(this.cache.get(key));
    });
  }
  
}
