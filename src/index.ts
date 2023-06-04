import { App } from '#/app'
import { ApiRoute } from '#routes/api'
import { AnimeBytes, AnimeTosho, Nyaa, Rutracker } from '#providers/index'
import { RedisCache } from '#utils/Redis'
import { SimpleCache } from '#utils/SimpleCache'

export const app = new App(
  process.env.REDIS_ENABLED.toLowerCase() === 'true'
    ? new RedisCache(
        process.env.REDIS_URL,
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
  ].filter(provider => provider !== null),
  [new ApiRoute()]
)

export default {
  port: process.env.port || 3000,
  fetch: app.getServer().fetch
}
