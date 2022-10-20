import log from '../log.js';
import { randomSort } from '../Utils.js';
import GifSearch from './GifSearch.js'


/**
 * Basic TenorSearch API access
 */
class TenorSearch extends GifSearch {

  constructor(config) {
    super(config, "https://tenor.googleapis.com/v2/search?");
    this.searchParameters.set("key", this.providerConfig.apiKey);
    // this.searchParameters.set("media_filter", "minimal");
    this.searchParameters.set("media_filter", "gif");
  }


  async query(query, limit = 25, pos = 0, contentfilter = this.providerConfig.contentfilter, locale = "en_GB", country = "GB") {

    this.searchParameters.set("q", query);
    this.searchParameters.set("contentfilter", contentfilter);
    this.searchParameters.set("limit", limit);
    this.searchParameters.set("pos", pos);
    this.searchParameters.set("locale", locale);
    this.searchParameters.set("country", country);

    const data = await this.queryAPI();
    return this.processResponse(data);
  }


  processResponse(data) {
    //
    if (data == null) return null;
    if (data.results == null || data.results.length == 0) return null;

    const items = [];
    const content_descriptions = [];

    data.results.forEach((v, i) => {

      let ignore = false;

      const tags = v.tags.join(" ").toLowerCase().trim();
      const desc = v.content_description.toLowerCase().trim();

      const itemTexts = tags + desc;
      // filter returned item tags and content_description for ignored terms
      this.ignoreTerms.every(
        (t) => {
          let match = itemTexts.indexOf(t.toLowerCase().trim()) > -1;
          if (match) ignore = true;
          return !match;
        }
      );

      // lots of tenor gif results have identical content_description fields and are very visually similar
      // filter to only keep unique content_description results
      if (content_descriptions.indexOf(desc) == -1) {
        content_descriptions.push(desc);
        if (!ignore) {
          items.push({
            url: v.media_formats.gif.url,
            width: v.media_formats.gif.dims[0],
            height: v.media_formats.gif.dims[1],
          });
        }
      }
    });

    // randomise result order
    items.sort(randomSort);

    log(`Processed ${items.length} gif items.`, items);
    this.items = items;

    return items;
  }
}


export default TenorSearch;

