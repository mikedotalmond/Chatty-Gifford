import log from '../log.js';
import GifSearch from './GifSearch.js'


/**
 * Basic TenorSearch API access
 */
class TenorSearch extends GifSearch {

  constructor(config) {
    super(config, "https://g.tenor.com/v1/search?");
    this.searchParameters.set("key", config.tenor_apiKey);
    this.searchParameters.set("media_filter", "minimal");
  }


  async query(query, limit = 25, pos = 0, contentfilter = this.config.tenor_contentfilter, locale = "en_GB") {

    this.searchParameters.set("q", query);
    this.searchParameters.set("contentfilter", contentfilter);
    this.searchParameters.set("limit", limit);
    this.searchParameters.set("pos", pos);
    this.searchParameters.set("locale", locale);
    
    const data = await this.queryAPI();
    return this.processResponse(data);
  }
  

  processResponse(data){

    if(data == null) return null;
    if(data.results == null || data.results.length == 0) return null;

    const count = data.results.length;

    const items = [];
    data.results.forEach((v,i)=>{
      items.push({
        url   : v.media[0].gif.url,
        width : v.media[0].gif.dims[0],
        height: v.media[0].gif.dims[1],
      });
    });

    if(this.config.debug){
      log(`Processed ${items.length} gif items.`, items);
    }

    return items;
  }
}


export default TenorSearch;

