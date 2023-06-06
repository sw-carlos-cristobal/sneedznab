import { createClient, RedisClientType } from 'redis';
import { ICache } from '../interfaces/cache.js';

export class RedisCache implements ICache {
  readonly name: string;
  private client: RedisClientType;
  constructor(url: string, user?: string, pass?: string) {
    this.name = 'RedisCache';
    console.log(`Creating new Redis client with URL: ${url}`);
    this.client = createClient({
      url: url,
      username: user,
      password: pass,
      socket: {
        port: 6379
      }
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

  public async connect(): Promise<void> {
    return await this.client.connect();
  }

  public async set(key: string, value: any): Promise<void> {
    await this.client.set(key, value);
    return;
  }

  public async get(key: string): Promise<any> {
    return await this.client.get(key);
  }
}
