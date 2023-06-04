import { ICache } from '#interfaces/index'
import { RedisClientType, createClient } from 'redis'

export class RedisCache implements ICache {
  readonly name: string
  private client: RedisClientType
  constructor(url: string, user?: string, pass?: string) {
    this.name = 'RedisCache'
    this.client = createClient({
      url: url,
      username: user ?? 'default',
      password: pass ?? ''
    })
    this.client.on('error', err => {
      // Consider a more robust error handling strategy here
      console.log('Redis error: ', err)
    })
    this.client.connect()
  }

  public async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value)
  }

  public async get(key: string): Promise<string | null> {
    const value = await this.client.get(key)
    return value
  }
}
