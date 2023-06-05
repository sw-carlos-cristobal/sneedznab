import { Context, Hono, HonoRequest } from 'hono';
import { IRoute } from '../interfaces/route.js';
import { rssBuilder } from '../utils/rss.js';
import { Utils } from '../utils/Utils.js';
import { app } from '../index.js';
import { IUsenetRelease } from '../interfaces/releases.js';
import { ITorrentRelease } from '../interfaces/releases.js';

export const apiHono = new Hono();
export class ApiRoute implements IRoute {
  public path = '/api';
  public router: Hono;
  constructor() {
    this.router = new Hono();
    this.initializeRoutes();
  }

  public getRouter(): Hono {
    return this.router;
  }

  private initializeRoutes() {
    this.router.get('/', async (c: Context) => {
      const receivedRequest: HonoRequest = c.req;
      const makeResponseBody = c.body;
      const makeResponseJson = c.json;
      if (receivedRequest.query('t') === 'caps') {
        return makeResponseBody(
          `<?xml version="1.0" encoding="UTF-8"?>
      <caps>
        <server version="1.0" title="Sneedex" strapline="Anime releases with the best video+subs" url="https://sneedex.moe/"/>
        <limits max="9999" default="100"/>
        <retention days="9999"/>
        <registration available="no" open="yes"/>
        <searching>
          <search available="yes" supportedParams="q"/>
          <tv-search available="no" supportedParams="q"/>
          <movie-search available="no" supportedParams="q"/>
        </searching>
        <categories>
          <category id="5070" name="Anime" description="Anime"/>
        </categories>
      </caps>`,
          200,
          { 'content-type': 'text/xml' }
        );
      } else if (receivedRequest.query('t') === 'search') {
        const returnType = receivedRequest.query('response');
        let query = receivedRequest.query('q');
        // if query is unspecified, e.g when Prowlarr is testing it, set it to Akira to test it
        // Akira because it's also on usenet
        if (!query) query = 'Akira';
        query = query.trim();

        // Sonarr requests in the format Attack on Titan : S04E28 (87)
        // TODO: somehow make this work for titles like RE:Zero since it has a colon in it
        const sonarrQuery = query.split(' : ')[0].replace(/ \(\d{4}\)/gi, '');

        // check cache first
        Utils.debugLog('API', 'cache', `api_${query}`);
        const cachedData = await app.cache.get(`api_${sonarrQuery}`);

        if (cachedData) {
          Utils.debugLog('API', 'cache', `Cache hit: api_${query}`);
          if (returnType === 'json') return makeResponseJson(cachedData);

          return makeResponseBody(
            rssBuilder(cachedData.usenetReleases, cachedData.torrentReleases),
            200,
            {
              application: 'rss+xml'
            }
          );
        }
        Utils.debugLog('API', 'cache', `Cache miss: api_${query}`);

        Utils.debugLog('API', 'fetch', sonarrQuery);
        const sneedexData = await app.sneedex.fetch(sonarrQuery);

        const usenetReleases: IUsenetRelease[] = [];
        const torrentReleases: ITorrentRelease[] = [];

        // Return empty if no results
        if (!sneedexData) {
          Utils.debugLog(
            'API',
            'fetch',
            `No results found, caching api_${query}`
          );
          await app.cache.set(`api_${sonarrQuery}`, {
            usenetReleases,
            torrentReleases
          });

          if (returnType === 'json') {
            return makeResponseJson({ usenetReleases, torrentReleases }, 404);
          } else {
            return makeResponseBody(
              `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="1.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:newznab="http://www.newznab.com/DTD/2010/feeds/attributes/" xmlns:torznab="http://torznab.com/schemas/2015/feed">
    <channel>
        <newznab:response offset="0" total="0"/>
    </channel>
    </rss>`,
              200,
              { application: 'rss+xml' }
            );
          }
        }

        // Releases are typically just each individual season
        for (const release of sneedexData.releases) {
          const sneedQuery = {
            title: sneedexData.title.replace(/ \(\d{4}\)/gi, ''),
            alias: sneedexData.alias.replace(/ \(\d{4}\)/gi, '')
          };

          const results = await app.providerRepository.getResults(
            sneedQuery,
            release
          );

          // push each result to either usenetReleases or torrentReleases
          for (const result of results) {
            if (!result) continue;
            result.type === 'usenet'
              ? usenetReleases.push(result)
              : torrentReleases.push(result);
          }
        }

        Utils.debugLog(
          'API',
          'fetch',
          `Fetched data, caching api_${sonarrQuery}`
        );
        await app.cache.set(`api_${sonarrQuery}`, {
          usenetReleases,
          torrentReleases
        });

        if (returnType === 'json') {
          return makeResponseJson(
            { usenetReleases, torrentReleases },
            usenetReleases.length + torrentReleases.length ? 200 : 404
          );
        }

        // if there are no releases, return a 200 with the proper torznab response
        if (!usenetReleases.length && !torrentReleases.length) {
          return makeResponseBody(
            `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="1.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:newznab="http://www.newznab.com/DTD/2010/feeds/attributes/" xmlns:torznab="http://torznab.com/schemas/2015/feed">
    <channel>
        <newznab:response offset="0" total="0"/>
    </channel>
    </rss>`,
            200,
            { application: 'rss+xml' }
          );
        }

        // for each release, add an item to the rss feed
        const rss = rssBuilder(usenetReleases, torrentReleases);

        return makeResponseBody(rss, 200, {
          application: 'rss+xml'
        });
      }
    });
  }
}
