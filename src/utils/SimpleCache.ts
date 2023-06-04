import { ICache } from '#interfaces/index'
import * as LRU from 'lru-cache'

export class SimpleCache implements ICache {
  readonly name: string
  private cache: LRU<string, any>
  constructor(private max: number, private ttl: number) {
    this.name = 'SimpleCache'
    this.cache = new LRU({ max: (this.max = 500), ttl: this.ttl })
  }

  public async set(key: string, value: any): Promise<void> {
    this.cache.set(key, value)
    return
  }

  public async get(key: string): Promise<any> {
    return this.cache.get(key)
  }
}
