import GifSearch from './GifSearch.js'

/**
 * Basic GiphySearch API access
 */
class GiphySearch extends GifSearch {


  constructor(config) {
    super(config, "https://api.giphy.com/v1/gifs/search?")
    this.searchParameters.set("api_key", config.giphy_apiKey);
  }


  async query(query, limit = 25, offset = 0, rating = this.config.giphy_rating, lang = "en") {

    this.searchParameters.set("q", query);
    this.searchParameters.set("limit", limit);
    this.searchParameters.set("offset", offset);
    this.searchParameters.set("rating", rating);
    this.searchParameters.set("lang", lang);

    const data = await this.queryAPI();
    return this.processResponse(data);
  }


  processResponse(response){

    if(response == null) return null;
    if(response.meta == null) return null;
    if(response.data == null) return null;

    if (!(response.meta.status == 200 || response.meta.msg == "OK")) {
      console.warn("Error fetching from Giphy API", response);
      return null;
    }

    const items = [];
    response.data.forEach(v => {
      items.push({
        url   : this.parseGiphyGifURL(v.images.original.url),
        width : v.images.original.width,
        height: v.images.original.height,
      });
    });

    if(this.config.debug){
      log(`Processed ${items.length} gif items.`, items);
    }

    return items;
  }


  parseGiphyGifURL(url){
    let assetId = url.substr(0, url.indexOf("/giphy.gif?"));
    assetId = assetId.substring(assetId.lastIndexOf("/") + 1);
    return `https://i.giphy.com/media/${assetId}/giphy.gif`;
  }
}


export default GiphySearch;

