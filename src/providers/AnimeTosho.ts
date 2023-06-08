import { toshoUrl } from '../constants.js';
import { app } from '../index.js';
import { IToshoData } from '../interfaces/animeTosho.js';
import { IProvider } from '../interfaces/provider.js';
import { ITorrentRelease, IUsenetRelease } from '../interfaces/releases.js';
import { ISneedexRelease } from '../interfaces/sneedex.js';
import { Utils } from '../utils/Utils.js';

export class AnimeTosho implements IProvider {
  readonly name: string;
  constructor() {
    this.name = 'AnimeTosho';
  }

  // provider specific fetch function to retrieve raw data
  private async fetch(query: string): Promise<IToshoData[]> {
    Utils.debugLog(this.name, 'cache', `${this.name}_${query}`);
    const cachedData: IToshoData[] = await app.cache.get(
      `${this.name}_${query}`
    );
    if (cachedData) {
      Utils.debugLog(
        this.name,
        'cache',
        `Cache hit with key: [${this.name}_${query}]`
      );
      cachedData.forEach((data: IToshoData) => {
        Utils.debugLog(this.name, 'title-result', `${data.title}`);
      });
      return cachedData;
    }
    Utils.debugLog(
      this.name,
      'cache',
      `Cache miss with key: [${this.name}_${query}]`
    );

    const searchURL = `${toshoUrl}?t=search&extended=1&limit=100&offset=0&q=${encodeURIComponent(
      query
    )}`;

    Utils.debugLog(this.name, 'fetch', query);
    Utils.debugLog(this.name, 'fetch', `Fetching data from ${searchURL}`);

    const data = await fetch(searchURL).then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });

    Utils.debugLog(
      this.name,
      'fetch',
      `Fetched data, caching ${this.name}_${query}`
    );
    await app.cache.set(`${this.name}_${query}`, data);

    return data as IToshoData[];
  }

  // get function to standardize the returned data to make things easier to work with and plug-and-play
  public async get(
    anime: { title: string; alias: string },
    sneedexData: ISneedexRelease
  ): Promise<(ITorrentRelease | IUsenetRelease)[]> {
    // strip out (WEB) from the best and alt titles
    sneedexData.best = sneedexData.best.replace(/ \(WEB\)/gi, '');
    sneedexData.alt = sneedexData.alt.replace(/ \(WEB\)/gi, '');

    // shrimply fetch the data and then map it to the appropriate values
    let data = await this.fetch(
      `${sneedexData.best ? sneedexData.best : sneedexData.alt} ${anime.title}`
    );

    const bestReleaseLinks = sneedexData.best_links.length
      ? sneedexData.best_links.split(' ')
      : sneedexData.alt_links.split(' ');

    // check if one of the returned releases is on Nyaa for Usenet cope
    const nyaaLink = bestReleaseLinks.find((url: string) =>
      url.includes('nyaa.si/view/')
    );
    const nyaaID = nyaaLink ? nyaaLink.match(/nyaa.si\/view\/(\d+)/)[1] : null;

    // if the data is empty, try again with the alias
    if (!data.length) {
      if (!anime.alias.length) return null;

      data = await this.fetch(
        `${sneedexData.best ? sneedexData.best : sneedexData.alt} ${
          anime.alias
        }`
      );
    }

    const matchedRelease = data.find((data: IToshoData) =>
      nyaaID
        ? data.nyaa_id === +nyaaID
        : data.title.includes(
            sneedexData.best ? sneedexData.best : sneedexData.alt
          )
    );

    // if no valid release was found, reutrn null
    if (!matchedRelease) return null;

    // convert matchedRelease.timestamp to the format YYYY-MM-DD HH:MM:SS
    const formattedDate = Utils.formatDate(matchedRelease.timestamp * 1000);

    // return both the torrent and usenet release
    const releases = [];

    if (matchedRelease.nzb_url) {
      releases.push({
        title: matchedRelease.title,
        link: matchedRelease.link,
        url: matchedRelease.nzb_url,
        size: matchedRelease.total_size,
        files: matchedRelease.num_files,
        timestamp: formattedDate,
        grabs: null,
        type: 'usenet'
      });
    }

    releases.push({
      title: matchedRelease.title,
      link: matchedRelease.link,
      url: matchedRelease.torrent_url,
      seeders: matchedRelease.seeders,
      leechers: matchedRelease.leechers,
      infohash: matchedRelease.info_hash,
      size: matchedRelease.total_size,
      files: matchedRelease.num_files,
      timestamp: formattedDate,
      grabs: null,
      type: 'torrent'
    });

    return releases;
  }
}
