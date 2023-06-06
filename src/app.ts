import { Hono } from 'hono';
import { logger } from 'hono/logger';
import pkg from '../package.json' assert { type: 'json' };
import { ICache } from './interfaces/cache.js';
import { IProvider } from './interfaces/provider.js';
import { IRoute } from './interfaces/route.js';
import { ProviderRepository } from './providers/ProviderRepository.js';
import { Sneedex } from './utils/Sneedex.js';

export class App {
  public app: Hono;
  public sneedex: Sneedex;
  public providerRepository: ProviderRepository;
  constructor(
    public cache: ICache,
    public providers: IProvider[],
    public routes: IRoute[]
  ) {
    this.app = new Hono();
    this.cache = cache;
    this.providers = providers;
    this.routes = routes;
    this.sneedex = new Sneedex();
    this.providerRepository = new ProviderRepository(this.providers);

    this.initializeMiddlewares();
    this.initializeRoutes();

    if (cache.name === 'RedisCache') {
      this.cache.connect();
    }

    console.log(
      `Sneedznab v${pkg.version} started\nCache: ${
        this.cache.name
      }\nProviders: ${this.providers
        .map((provider) => provider.name)
        .join(', ')}\nRoutes: ${this.routes
        .map((route) => route.path)
        .join(', ')}`
    );
  }

  public getServer() {
    return this.app;
  }

  private initializeRoutes() {
    this.app.get('/', (c) => c.json({ message: 'ok' }));
    this.routes.forEach((route) => {
      this.app.route(route.path, route.getRouter());
    });
  }

  private initializeMiddlewares() {
    this.app.use('*', logger());
    this.app.onError((err, c) => {
      console.error(err);
      return c.json({ message: err.message }, 500);
    });
  }
}
