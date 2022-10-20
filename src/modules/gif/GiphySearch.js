import GifSearch from './GifSearch.js'
import log from '../log.js';

/**
 * Basic GiphySearch API access
 */
class GiphySearch extends GifSearch {

  constructor(config) {
    super(config, "https://api.giphy.com/v1/gifs/search?")
    this.searchParameters.set("api_key", this.providerConfig.apiKey);
  }

  /**
   * 
   * @param {*} query 
   * @param {*} limit 
   * @param {*} offset 
   * @param {*} rating 
   * @param {*} lang 
   * @returns 
   */
  async query(query, limit = 25, offset = 0, rating = this.providerConfig.rating, lang = "en") {

    this.searchParameters.set("q", query);
    this.searchParameters.set("limit", limit);
    this.searchParameters.set("offset", offset);
    this.searchParameters.set("rating", rating);
    this.searchParameters.set("lang", lang);

    const data = await this.queryAPI();
    return this.processResponse(data);
  }

  /**
   * 
   * @param {*} response 
   * @returns 
   */
  processResponse(response) {

    if (response == null) return null;
    if (response.meta == null) return null;
    if (response.data == null) return null;

    if (!(response.meta.status == 200 || response.meta.msg == "OK")) {
      console.warn("Error fetching from Giphy API", response);
      return null;
    }

    const items = [];
    response.data.forEach(v => {

      let ignore = false;

      const title = v.title.toLowerCase().trim();
      // filter returned item title for ignored terms
      this.ignoreTerms.every(
        (t) => {
          let match = title.indexOf(t.toLowerCase().trim()) > -1;
          if (match) ignore = true;
          return !match;
        }
      );

      if (!ignore) {
        items.push({
          url: this.parseGiphyGifURL(v.images.original.url),
          width: v.images.original.width,
          height: v.images.original.height,
        });
      }
    });

    log(`Processed ${items.length} gif items.`, items);

    this.items = items;

    return items;
  }

  /**
   * 
   * @param {*} url 
   * @returns 
   */
  parseGiphyGifURL(url) {
    let assetId = url.substr(0, url.indexOf("/giphy.gif?"));
    assetId = assetId.substring(assetId.lastIndexOf("/") + 1);
    return `https://i.giphy.com/media/${assetId}/giphy.gif`;
  }
}


export default GiphySearch;

