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

    this.client.on('connect', () => {
      console.log('Redis client connected');
    });
    
    this.client.on('ready', () => {
      console.log('Redis client ready');
    });
    
    this.client.on('error', (err) => {
      console.error('Redis error: ', err);
    });
    
    this.client.on('end', () => {
      console.log('Redis client connection ended');
    });

    this.client.on('reconnecting', () => {
      console.log('Redis client reconnecting');
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
