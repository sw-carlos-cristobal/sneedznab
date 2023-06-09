import { serve } from '@hono/node-server';
import { Env } from 'hono';
import { ExecutionContext } from 'hono/dist/types/context.js';
import { App } from './app.js';
import { AnimeBytes } from './providers/AnimeBytes.js';
import { AnimeTosho } from './providers/AnimeTosho.js';
import { Nyaa } from './providers/Nyaa.js';
import { Rutracker } from './providers/Rutracker.js';
import { ApiRoute } from './routes/api.js';
import { RedisCache } from './utils/Redis.js';
import { SimpleCache } from './utils/SimpleCache.js';

export const app = new App(
  process.env.REDIS_ENABLED.toLowerCase() === 'true'
    ? new RedisCache(
        process.env.REDIS_URL,
        +process.env.CACHE_TTL,
        process.env.REDIS_USERNAME,
        process.env.REDIS_PASSWORD
      )
    : new SimpleCache(+process.env.MAX_ENTRIES, +process.env.CACHE_TTL),
  [
    process.env.NYAA_ENABLED.toLowerCase() === 'true' ? new Nyaa() : null,
    // AnimeTosho can be used instead of scraping Nyaa, but it's far less reliable
    // it's only useful if you want NZBs
    process.env.ANIMETOSHO_ENABLED.toLowerCase() === 'true'
      ? new AnimeTosho()
      : null,
    // Only enable AnimeBytes if you have an account
    process.env.ANIMEBYTES_ENABLED.toLowerCase() === 'true'
      ? new AnimeBytes(
          process.env.ANIMEBYTES_PASSKEY,
          process.env.ANIMEBYTES_USERNAME
        )
      : null,
    process.env.RUTRACKER_ENABLED.toLowerCase() === 'true'
      ? new Rutracker()
      : null
  ].filter((provider) => provider !== null),
  [new ApiRoute()]
);

export default {
  port: process.env.port || 3000,
  //fetch: app.getServer().fetch
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.getServer().fetch(request, env, ctx);
  }
};

serve(app.getServer());
