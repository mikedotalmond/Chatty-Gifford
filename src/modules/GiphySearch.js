import log from './log.js'

const searchEndpoint = "https://api.giphy.com/v1/gifs/search";

/**
 * Basic GiphySearch API access
 */
class GiphySearch {

  constructor(config) {
    this.config = config;
  }

  async query(query, limit = 25, offset = 0, rating = "g", lang = "en") {
    const c = this.config;

    if(c.debug) console.log("querying giphy for:", query);

    const request = `?api_key=${c.giphy_apiKey}&q=${query}&limit=${limit}&offset=${offset}&rating=${rating}&lang=${lang}`;
    const result = await fetch(`${searchEndpoint}${request}`);

    if(!result) return null;
    const data = await result.json();

    if(!data || !data.meta) return null;
    if (data.meta.status == 200 || data.meta.msg == "OK") {
      if(c.debug) log("data ok");
      return data.data;
    }

    console.warn("Error fetching from Giphy API", data);
    return null;
  }
}

export default GiphySearch;

