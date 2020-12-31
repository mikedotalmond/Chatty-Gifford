
import log from './log.js'
import config from '../config.js'

/**
 * Basic GiphySearch API access
 */
class GiphySearch {

  constructor() {

  }

  async query(query, limit = 25, offset = 0, rating = "g", lang = "en") {
    if(config.debug) console.log("querying giphy for:", query);

    const request = `?api_key=${config.giphy.apiKey}&q=${query}&limit=${limit}&offset=${offset}&rating=${rating}&lang=${lang}`;
    const result = await fetch(`${config.giphy.searchEndpoint}${request}`);

    if(!result) return null;
    const data = await result.json();

    if(!data || !data.meta) return null;
    if (data.meta.status == 200 || data.meta.msg == "OK") {
      if(config.debug) log("data ok");
      return data.data;
    }

    console.warn("Error fetching from Giphy API", data);
    return null;
  }
}

// export a single instance of GiphySearch
export const giphySearch = new GiphySearch();

