import { ICache } from '../interfaces/cache.js';
import { RedisClientType } from '@redis/client';
import { createClient } from 'redis';

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
    this.client.set(key, value);
    return;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }
}
