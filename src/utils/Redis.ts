import { ICache } from '../interfaces/cache.js';
import { RedisClientType } from '@redis/client';
import { createClient } from 'redis';
import { promisify } from 'util';

export class RedisCache implements ICache {
  readonly name: string;
  private client: RedisClientType;
  constructor(url: string, user?: string, pass?: string) {
    this.name = 'RedisCache';
    console.log(`Creating new Redis client with URL: ${url}`);
    this.client = createClient({
      url: url,
      username: user,
      password: pass
    });
    this.client.on('error', (err) => {
      console.error('Redis error: ', err);
    });
  }

  async set(key: string, value: any): Promise<void> {
    const setAsync = promisify(this.client.set).bind(this.client);
    return setAsync(key, value);
  }

  async get(key: string): Promise<string | null> {
    const getAsync = promisify(this.client.get).bind(this.client);
    return getAsync(key);
  }
}
