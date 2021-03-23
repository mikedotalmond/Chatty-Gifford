import log from '../log.js'

/**
 * Base
 */
class GifSearch {

  constructor(config, searchEndpoint) {
    this.config = config;
    this.searchEndpoint = searchEndpoint
    this.searchParameters = new URLSearchParams();
  }
  

  async query(query, limit, offset, contentfilter, locale) {
    throw "MissingImplementation";
  }


  processResponse(data){
    throw "MissingImplementation";
  }


  async fetchJSON(requestURI){
     
    if(this.config.debug) log(`fetchJSON for ${requestURI}`);

    const result = await fetch(requestURI);

    if(!result) return null;
    const data = await result.json();

    if(this.config.debug) log(data);

    return data;
  }


  async queryAPI(){
      
    const data = await this.fetchJSON(`${this.searchEndpoint}${this.searchParameters.toString()}`);

    if(!data){
      console.warn("Error fetching data from JSON API", this.searchEndpoint, this.searchParameters.toString());
    }

    return data;
  }
}

export default GifSearch;
