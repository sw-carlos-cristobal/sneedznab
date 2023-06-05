import { ICache } from '#interfaces/index'
import { RedisClientType } from '@redis/client'
import { RedisFunctions, RedisModules, RedisScripts, createClient } from 'redis'

export class RedisCache implements ICache {
  readonly name: string
  private client: RedisClientType
  constructor(url: string, user?: string, pass?: string) {
    this.name = 'RedisCache'
    console.log(`Creating new Redis client with URL: ${url}`)
    this.client = createClient({
      url: url,
      username: user,
      password: pass
    })
    this.client.on('error', err => {
      // Consider a more robust error handling strategy here
      console.log('Redis error: ', err)
    })
    this.client.on('connect', () => {
      console.log('Redis connected')
    })
    this.client.on('ready', () => {
      console.log('Redis ready')
    })
  }

  public async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value)
  }

  public async get(key: string): Promise<string | null> {
    const value = await this.client.get(key)
    return value
  }
}
