import { ICache } from '#interfaces/index'
import LRU from 'lru-cache'

export class SimpleCache implements ICache {
  readonly name: string
  private cache: LRU<string, any>
  constructor(private max: number, private ttl: number) {
    this.name = 'SimpleCache'
    this.max = max ?? 500
    this.ttl = ttl ?? 300
    this.cache = new LRU({ max: this.max, ttl: this.ttl })
  }

  public async set(key: string, value: any): Promise<void> {
    this.cache.set(key, value)
    return
  }

  public async get(key: string): Promise<any> {
    return this.cache.get(key)
  }
}
